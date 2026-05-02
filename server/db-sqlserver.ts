/**
 * VodaLease Enterprise — SQL Server Connection Pool & SPP Executor
 * ALL database access goes through this module via stored procedures.
 * No raw SQL queries are permitted in application code.
 *
 * Resilience features:
 *  - Auto-reconnect on socket hang up / connection lost
 *  - Exponential backoff retry (up to 3 attempts)
 *  - Pool keep-alive ping every 4 minutes to prevent idle disconnects
 *  - Graceful pool replacement on fatal errors
 */
import sql from 'mssql';

const config: sql.config = {
  server: process.env.MSSQL_HOST || process.env.SQLSERVER_HOST || '',
  port: parseInt(process.env.MSSQL_PORT || '1433', 10),
  database: process.env.MSSQL_DATABASE || process.env.SQLSERVER_DB || 'leasing',
  user: process.env.MSSQL_USER || process.env.SQLSERVER_USER || '',
  password: process.env.MSSQL_PASSWORD || process.env.SQLSERVER_PASSWORD || '',
  options: {
    trustServerCertificate: true,
    encrypt: false,
    connectTimeout: 30000,
    requestTimeout: 120000,
  },
  pool: {
    max: 20,
    min: 2,
    idleTimeoutMillis: 60000,          // keep idle connections for 60s
    acquireTimeoutMillis: 30000,       // wait up to 30s to acquire from pool
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
};

let _pool: sql.ConnectionPool | null = null;
let _connecting = false;
let _keepAliveTimer: ReturnType<typeof setInterval> | null = null;

async function createPool(): Promise<sql.ConnectionPool> {
  const pool = new sql.ConnectionPool(config);

  pool.on('error', (err: Error) => {
    console.error('[SQLServer] Pool error:', err.message);
    // Mark pool as dead so next request recreates it
    _pool = null;
    if (_keepAliveTimer) {
      clearInterval(_keepAliveTimer);
      _keepAliveTimer = null;
    }
  });

  await pool.connect();
  console.log('[SQLServer] Connection pool established');

  // Keep-alive: ping every 4 minutes to prevent idle socket drops
  _keepAliveTimer = setInterval(async () => {
    try {
      if (_pool && _pool.connected) {
        await _pool.request().query('SELECT 1 AS ping');
      }
    } catch {
      // Pool will be recreated on next request
      _pool = null;
      if (_keepAliveTimer) {
        clearInterval(_keepAliveTimer);
        _keepAliveTimer = null;
      }
    }
  }, 4 * 60 * 1000);

  return pool;
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (_pool && _pool.connected) return _pool;

  // Prevent concurrent reconnect storms
  if (_connecting) {
    // Wait up to 10s for the other caller to finish connecting
    for (let i = 0; i < 100; i++) {
      await new Promise(r => setTimeout(r, 100));
      if (_pool && _pool.connected) return _pool;
    }
  }

  _connecting = true;
  try {
    _pool = await createPool();
    return _pool;
  } finally {
    _connecting = false;
  }
}

/** Sleep helper for retry backoff */
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

/** Determine if an error is a transient connection error worth retrying */
function isTransient(err: Error): boolean {
  const msg = err.message.toLowerCase();
  return (
    msg.includes('socket hang up') ||
    msg.includes('connection lost') ||
    msg.includes('connection reset') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('connection closed') ||
    msg.includes('pool is draining') ||
    msg.includes('failed to connect')
  );
}

export type SPPParam = {
  name: string;
  type: sql.ISqlTypeFactoryWithNoParams | sql.ISqlTypeFactoryWithLength | sql.ISqlTypeFactoryWithPrecisionScale | sql.ISqlTypeWithNoParams | string | any;
  value: any;
};

/**
 * Resolve a string type name (e.g. "Int", "NVarChar") to the correct mssql type object.
 */
function resolveType(type: any): any {
  if (typeof type !== 'string') return type;
  const map: Record<string, any> = {
    Int:        sql.Int,
    BigInt:     sql.BigInt,
    SmallInt:   sql.SmallInt,
    TinyInt:    sql.TinyInt,
    Bit:        sql.Bit,
    Float:      sql.Float,
    Real:       sql.Real,
    Decimal:    sql.Decimal,
    Numeric:    sql.Numeric,
    Money:      sql.Money,
    SmallMoney: sql.SmallMoney,
    VarChar:    sql.VarChar,
    NVarChar:   sql.NVarChar,
    Char:       sql.Char,
    NChar:      sql.NChar,
    Text:       sql.Text,
    NText:      sql.NText,
    DateTime:   sql.DateTime,
    DateTime2:  sql.DateTime2,
    Date:       sql.Date,
    Time:       sql.Time,
    UniqueIdentifier: sql.UniqueIdentifier,
    Xml:        sql.Xml,
    Binary:     sql.Binary,
    VarBinary:  sql.VarBinary,
  };
  return map[type] ?? sql.NVarChar;
}

function buildRequest(pool: sql.ConnectionPool, params: SPPParam[]): sql.Request {
  const request = pool.request();
  for (const param of params) {
    const resolvedType = resolveType(param.type);
    request.input(param.name, resolvedType, param.value ?? null);
  }
  return request;
}

/**
 * Execute a stored procedure with automatic retry on transient connection errors.
 */
async function execWithRetry<T>(
  fn: (pool: sql.ConnectionPool) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastErr: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const pool = await getPool();
      return await fn(pool);
    } catch (err: any) {
      lastErr = err;
      if (isTransient(err)) {
        // Force pool recreation
        _pool = null;
        if (_keepAliveTimer) { clearInterval(_keepAliveTimer); _keepAliveTimer = null; }
        const backoff = attempt * 500;
        console.warn(`[SQLServer] Transient error (attempt ${attempt}/${maxRetries}), retrying in ${backoff}ms: ${err.message}`);
        await sleep(backoff);
      } else {
        throw err; // Non-transient — don't retry
      }
    }
  }
  throw lastErr;
}

/**
 * Execute a stored procedure and return the first recordset.
 * This is the ONLY way to access the database in VodaLease Enterprise.
 */
export async function execSPP<T = Record<string, any>>(
  procedureName: string,
  params: SPPParam[] = []
): Promise<T[]> {
  return execWithRetry(async (pool) => {
    const request = buildRequest(pool, params);
    const result = await request.execute(procedureName);
    return (result.recordset || []) as T[];
  });
}

/**
 * Execute a stored procedure and return ALL recordsets (for multi-result SPs).
 */
export async function execSPPMulti(
  procedureName: string,
  params: SPPParam[] = []
): Promise<sql.IRecordSet<Record<string, any>>[]> {
  return execWithRetry(async (pool) => {
    const request = buildRequest(pool, params);
    const result = await request.execute(procedureName);
    return (Array.isArray(result.recordsets) ? result.recordsets : Object.values(result.recordsets)) as sql.IRecordSet<Record<string, any>>[];
  });
}

/**
 * Execute a stored procedure and return the first row of the first recordset.
 */
export async function execSPPOne<T = Record<string, any>>(
  procedureName: string,
  params: SPPParam[] = []
): Promise<T | null> {
  const rows = await execSPP<T>(procedureName, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute raw SQL (DDL / batch statements). Use ONLY for migrations and setup.
 * Application logic MUST use stored procedures via execSPP.
 */
export async function execRaw(sql_text: string): Promise<void> {
  return execWithRetry(async (pool) => {
    await pool.request().batch(sql_text);
  });
}

// Re-export sql types for convenience
export { sql };
