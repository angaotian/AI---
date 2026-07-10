const fs = require('fs');
const path = require('path');
const mysql = require('./server/node_modules/mysql2/promise');

async function main() {
  const sqlPath = path.join(__dirname, 'localhost.sql');
  let sql = fs.readFileSync(sqlPath, 'utf8');

  sql = sql.replace(/`wordpress`/g, '`health_management`');
  sql = sql.replace(/utf8mb4_unicode_520_ci/g, 'utf8mb4_general_ci');

  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '123456',
    multipleStatements: true
  });

  await connection.query('DROP DATABASE IF EXISTS `health_management`; CREATE DATABASE `health_management` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;');
  await connection.query(sql);
  await connection.end();

  console.log('SQL import completed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
