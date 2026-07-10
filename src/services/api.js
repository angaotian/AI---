import axios from 'axios'

const API_PORT = 3002
const API_HOST = window.location.hostname || 'localhost'
const DEFAULT_API_BASE_URL = `http://${API_HOST}:${API_PORT}/api`
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加 JWT Token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token 过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 认证相关 API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData)
}

// 健康数据 API
export const healthAPI = {
  getMetrics: (params) => api.get('/health/metrics', { params }),
  addMetric: (metricData) => api.post('/health/metrics', metricData)
}

// 家庭成员 API
export const familyAPI = {
  getMembers: () => api.get('/family/members'),
  addMember: (memberData) => api.post('/family/members', memberData),
  updateMember: (id, memberData) => api.put(`/family/members/${id}`, memberData),
  deleteMember: (id) => api.delete(`/family/members/${id}`)
}

// 消息 API
export const messageAPI = {
  getMessages: (params) => api.get('/messages', { params }),
  markAsRead: (id) => api.put(`/messages/${id}/read`),
  markAllAsRead: () => api.put('/messages/read-all'),
  deleteMessage: (id) => api.delete(`/messages/${id}`)
}

// 系统设置 API
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settingsData) => api.put('/settings', settingsData)
}

// 用户信息 API
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (profileData) => api.put('/user/profile', profileData)
}

// 多模态采集 API
export const multimodalAPI = {
  saveRecord: (recordData) => api.post('/multimodal/records', recordData),
  getRecords: (params) => api.get('/multimodal/records', { params }),
  deleteRecord: (id) => api.delete(`/multimodal/records/${id}`)
}

// AI 医生问答 API
export const doctorAPI = {
  consult: (payload) => api.post('/doctor/consult', payload)
}

export default api
