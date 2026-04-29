/**
 * VodaLease Enterprise — SQL Server Connection Pool & SPP Executor
 * ALL database access goes through this module via stored procedures.
 * No raw SQL queries are permitted in application code.
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
  type: sql.ISqlTypeFactoryWithNoParams | sql.ISqlTypeFactoryWithLength | sql.ISqlTypeFactoryWithPrecisionScale | sql.ISqlTypeWithNoParams | string | any;
  value: any;
};

/**
 * Resolve a string type name (e.g. "Int", "NVarChar") to the correct mssql type object.
 * Accepts both string names and already-resolved sql.* type objects.
 */
function resolveType(type: any): any {
  if (typeof type !== 'string') return type; // already a sql.* type object
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
    const resolvedType = resolveType(param.type);
    if (param.value === undefined || param.value === null) {
      request.input(param.name, resolvedType, null);
    } else {
      request.input(param.name, resolvedType, param.value);
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
    request.input(param.name, resolveType(param.type), param.value ?? null);
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

/**
 * Execute raw SQL (DDL / batch statements). Use ONLY for migrations and setup.
 * Application logic MUST use stored procedures via execSPP.
 */
export async function execRaw(sql_text: string): Promise<void> {
  const pool = await getPool();
  await pool.request().batch(sql_text);
}

// Re-export sql types for convenience
export { sql };
