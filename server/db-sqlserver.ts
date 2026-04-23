/**
 * VodaLease Enterprise — SQL Server Connection Pool & SPP Executor
 * ALL database access goes through this module via stored procedures.
 * No raw SQL queries are permitted in application code.
 */
import sql from 'mssql';

const config: sql.config = {
  server: process.env.SQLSERVER_HOST || '203.101.44.46',
  database: process.env.SQLSERVER_DB || 'leasing',
  user: process.env.SQLSERVER_USER || 'shahul',
  password: process.env.SQLSERVER_PASSWORD || 'Apple123!@#',
  options: {
    trustServerCertificate: true,
    encrypt: false,
    connectTimeout: 30000,
    requestTimeout: 120000,
  },
  pool: {
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000,
  },
};

let _pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!_pool || !_pool.connected) {
    _pool = await sql.connect(config);
    console.log('[SQLServer] Connection pool established');
  }
  return _pool;
}

export type SPPParam = {
  name: string;
  type: sql.ISqlTypeFactoryWithNoParams | sql.ISqlTypeFactoryWithLength | sql.ISqlTypeFactoryWithPrecisionScale | sql.ISqlTypeWithNoParams | any;
  value: any;
};

/**
 * Execute a stored procedure and return the first recordset.
 * This is the ONLY way to access the database in VodaLease Enterprise.
 */
export async function execSPP<T = Record<string, any>>(
  procedureName: string,
  params: SPPParam[] = []
): Promise<T[]> {
  const pool = await getPool();
  const request = pool.request();

  for (const param of params) {
    if (param.value === undefined || param.value === null) {
      request.input(param.name, param.type, null);
    } else {
      request.input(param.name, param.type, param.value);
    }
  }

  const result = await request.execute(procedureName);
  return (result.recordset || []) as T[];
}

/**
 * Execute a stored procedure and return ALL recordsets (for multi-result SPs).
 */
export async function execSPPMulti(
  procedureName: string,
  params: SPPParam[] = []
): Promise<sql.IRecordSet<Record<string, any>>[]> {
  const pool = await getPool();
  const request = pool.request();

  for (const param of params) {
    request.input(param.name, param.type, param.value ?? null);
  }

  const result = await request.execute(procedureName);
  return (Array.isArray(result.recordsets) ? result.recordsets : Object.values(result.recordsets)) as sql.IRecordSet<Record<string, any>>[];
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

// Re-export sql types for convenience
export { sql };
