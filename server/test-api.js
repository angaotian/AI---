const axios = require('axios');

async function testAPI() {
  try {
    console.log('正在测试家庭成员 API...\n');
    
    // 先登录获取 token
    console.log('1️⃣ 登录...');
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      username: 'demo',
      password: '123456'
    });
    
    console.log('✅ 登录成功');
    console.log('Token:', loginResponse.data.token.substring(0, 50) + '...');
    console.log('用户 ID:', loginResponse.data.user.id);
    
    const token = loginResponse.data.token;
    
    // 获取家庭成员列表
    console.log('\n2️⃣ 获取家庭成员列表...');
    const membersResponse = await axios.get('http://localhost:3002/api/family/members', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 获取成功');
    console.log('家庭成员数量:', membersResponse.data.length);
    
    if (membersResponse.data.length > 0) {
      membersResponse.data.forEach((member, index) => {
        console.log(`\n成员 ${index + 1}:`);
        console.log(`  ID: ${member.id}`);
        console.log(`  姓名：${member.name}`);
        console.log(`  关系：${member.relation}`);
        console.log(`  年龄：${member.age}`);
        console.log(`  性别：${member.gender}`);
        console.log(`  健康评分：${member.health_score}`);
        console.log(`  风险等级：${member.risk_level}`);
        console.log(`  生命体征:`, member.vitals);
      });
    } else {
      console.log('❌ 没有家庭成员数据返回');
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testAPI();
