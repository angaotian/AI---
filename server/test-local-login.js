const axios = require('axios');

async function testLogin() {
  try {
    console.log('测试本地后端登录 API...');
    const response = await axios.post('http://localhost:3002/api/auth/login', {
      username: 'demo',
      password: '123456'
    });
    
    console.log('登录成功！');
    console.log('响应:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('登录失败:', error.response?.data || error.message);
    if (error.code) {
      console.error('错误代码:', error.code);
    }
  }
}

testLogin();
