const mysql = require('mysql2/promise');

async function test() {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '123456',
      database: 'health_management'
    });
    
    const [users] = await pool.execute('SELECT id, username, email, name FROM users');
    console.log('所有用户:', JSON.stringify(users, null, 2));
    
    const [demoUsers] = await pool.execute('SELECT * FROM users WHERE username = ?', ['demo']);
    console.log('Demo 用户:', JSON.stringify(demoUsers, null, 2));
    
    pool.end();
  } catch (error) {
    console.error('错误:', error.message);
  }
}

test();
