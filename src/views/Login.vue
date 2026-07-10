<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="app-logo">🏥</div>
          <h1 class="app-title">健康管理系统</h1>
          <p class="app-subtitle">您的个人健康管家</p>
        </div>

        <div class="login-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: isLogin }"
            @click="isLogin = true"
          >
            登录
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: !isLogin }"
            @click="isLogin = false"
          >
            注册
          </button>
        </div>

        <form class="login-form" @submit.prevent="handleSubmit">
          <div class="form-group" v-if="!isLogin">
            <label>用户名</label>
            <input 
              type="text" 
              v-model="formData.username"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div class="form-group" v-if="!isLogin">
            <label>邮箱</label>
            <input 
              type="email" 
              v-model="formData.email"
              placeholder="请输入邮箱"
              required
            />
          </div>

          <div class="form-group" v-if="isLogin">
            <label>用户名/邮箱</label>
            <input 
              type="text" 
              v-model="formData.username"
              placeholder="请输入用户名或邮箱"
              required
            />
          </div>

          <div class="form-group">
            <label>密码</label>
            <input 
              type="password" 
              v-model="formData.password"
              placeholder="请输入密码"
              required
            />
          </div>

          <div class="form-group" v-if="!isLogin">
            <label>姓名</label>
            <input 
              type="text" 
              v-model="formData.name"
              placeholder="请输入姓名（可选）"
            />
          </div>

          <div class="form-group" v-if="!isLogin">
            <label>手机号</label>
            <input 
              type="tel" 
              v-model="formData.phone"
              placeholder="请输入手机号（可选）"
            />
          </div>

          <div class="error-message" v-if="errorMessage">
            {{ errorMessage }}
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? '处理中...' : (isLogin ? '登录' : '注册') }}
          </button>
        </form>

        <div class="demo-info">
          <p>演示账号：username: <strong>demo</strong> / password: <strong>123456</strong></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../services/api'

const router = useRouter()
const isLogin = ref(true)
const loading = ref(false)
const errorMessage = ref('')

const formData = reactive({
  username: '',
  email: '',
  password: '',
  name: '',
  phone: ''
})

const handleSubmit = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    if (isLogin.value) {
      // 登录
      const { data } = await authAPI.login({
        username: formData.username,
        password: formData.password
      })

      // 保存 token 和用户信息
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // 跳转到首页
      router.push('/health-report')
    } else {
      // 注册
      const { data } = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone
      })

      // 保存 token 和用户信息
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // 跳转到首页
      router.push('/health-report')
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.error || '操作失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f1729 0%, #1e293b 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 420px;
}

.login-card {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.app-logo {
  font-size: 64px;
  margin-bottom: 10px;
}

.app-title {
  font-size: 28px;
  font-weight: bold;
  color: #f8fafc;
  margin-bottom: 8px;
}

.app-subtitle {
  font-size: 14px;
  color: #94a3b8;
}

.login-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  background: rgba(51, 65, 85, 0.5);
  border: none;
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
  color: #fff;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: #cbd5e1;
  font-weight: 500;
}

.form-group input {
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #f8fafc;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input::placeholder {
  color: #64748b;
}

.error-message {
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #f87171;
  font-size: 14px;
  text-align: center;
}

.submit-btn {
  padding: 14px;
  background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.demo-info {
  margin-top: 20px;
  padding: 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  text-align: center;
  color: #93c5fd;
  font-size: 13px;
}

.demo-info strong {
  color: #60a5fa;
}
</style>
