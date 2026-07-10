const mysql = require('mysql2/promise');
const config = require('./database/config');

async function testFamilyData() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(config);
    console.log('✅ 数据库连接成功');
    
    // 查询用户
    console.log('\n📋 查询所有用户:');
    const [users] = await connection.query('SELECT id, username, email, name FROM users');
    console.log('用户列表:', users);
    
    // 查询家庭成员
    console.log('\n👨‍👩‍👧‍👦 查询所有家庭成员:');
    const [members] = await connection.query('SELECT * FROM family_members ORDER BY created_at DESC');
    console.log('家庭成员数量:', members.length);
    if (members.length > 0) {
      members.forEach((m, i) => {
        console.log(`${i+1}. ${m.name} - 关系：${m.relation}, 用户 ID: ${m.user_id}`);
      });
    } else {
      console.log('❌ 没有找到家庭成员数据');
    }
    
    // 检查每个用户的家庭成员
    if (users.length > 0) {
      for (const user of users) {
        console.log(`\n🔍 查询用户 "${user.username}" (${user.id}) 的家庭成员:`);
        const [userMembers] = await connection.query(
          'SELECT * FROM family_members WHERE user_id = ? ORDER BY created_at DESC',
          [user.id]
        );
        console.log(`  家庭成员数量：${userMembers.length}`);
        if (userMembers.length > 0) {
          userMembers.forEach((m, i) => {
            console.log(`  ${i+1}. ${m.name} - 关系：${m.relation}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

testFamilyData();
