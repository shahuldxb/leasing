const sql = require('mssql');
const config = { server: '203.101.44.46', database: 'leasing', user: 'shahul', password: 'Apple123!@#', options: { trustServerCertificate: true, encrypt: false } };
async function main() {
  const pool = await sql.connect(config);
  const sps = await pool.request().query(`SELECT name FROM sys.procedures WHERE name LIKE '%SubAsset%' OR name LIKE '%sub_asset%' OR name LIKE '%Asset%' ORDER BY name`);
  console.log('Asset SPs:', JSON.stringify(sps.recordset.map(r => r.name)));
  const tables = await pool.request().query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%sub_asset%' OR TABLE_NAME LIKE '%asset%' ORDER BY TABLE_NAME`);
  console.log('Asset tables:', JSON.stringify(tables.recordset.map(r => r.TABLE_NAME)));
  await pool.close();
}
main().catch(e => console.error('ERR:', e.message));
