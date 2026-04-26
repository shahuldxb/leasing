import mssql from 'mssql';
const cfg = {
  server: process.env.MSSQL_HOST,
  port: Number(process.env.MSSQL_PORT),
  database: process.env.MSSQL_DATABASE,
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: true }
};
const pool = await mssql.connect(cfg);
const r2 = await pool.request().query(`
  SELECT ROUTINE_DEFINITION FROM INFORMATION_SCHEMA.ROUTINES 
  WHERE ROUTINE_SCHEMA='lease' AND ROUTINE_NAME='sp_GetAmortisationScheduleAll'
`);
const def = r2.recordset[0]?.ROUTINE_DEFINITION ?? '';
console.log('Has lifecycle_status:', def.includes('lifecycle_status'));
console.log('SP length:', def.length);
if (!def.includes('lifecycle_status')) {
  console.log('First 800 chars:', def.substring(0, 800));
}
await pool.close();
