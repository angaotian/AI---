import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/health-report',
    children: [
      // 个人健康
      { path: 'health-dashboard', name: 'HealthDashboard', component: () => import('../views/HealthDashboard.vue'), meta: { group: 'personal', title: '健康大盘' } },
      { path: 'lqi-details', name: 'LQIDetails', component: () => import('../views/LQIDetails.vue'), meta: { group: 'personal', title: 'LQI 详情' } },
      { path: 'digital-twin', name: 'DigitalTwin', component: () => import('../views/DigitalTwin.vue'), meta: { group: 'personal', title: '3D 数字孪生' } },
      { path: 'health-risk', name: 'HealthRisk', component: () => import('../views/HealthRisk.vue'), meta: { group: 'personal', title: '健康风险预测' } },
      { path: 'health-report', name: 'HealthReport', component: () => import('../views/HealthReport.vue'), meta: { group: 'personal', title: '健康报告' } },
      // 智能分析
      { path: 'knowledge-graph', name: 'KnowledgeGraph', component: () => import('../views/KnowledgeGraph.vue'), meta: { group: 'analysis', title: '知识图谱推理' } },
      { path: 'multi-modal', name: 'MultiModal', component: () => import('../views/MultiModal.vue'), meta: { group: 'analysis', title: '多模态采集' } },
      // 家庭与消息
      { path: 'family-guardian', name: 'FamilyGuardian', component: () => import('../views/FamilyGuardian.vue'), meta: { group: 'family', title: '家庭守护' } },
      { path: 'message-center', name: 'MessageCenter', component: () => import('../views/MessageCenter.vue'), meta: { group: 'family', title: '消息中心' } },
      { path: 'system-settings', name: 'SystemSettings', component: () => import('../views/SystemSettings.vue'), meta: { group: 'family', title: '系统设置' } },
      // 系统运维
      { path: 'backend-ops', name: 'BackendOps', component: () => import('../views/BackendOps.vue'), meta: { group: 'ops', title: '后台运维' } },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 认证检查
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const requiresAuth = to.meta.requiresAuth !== false // 默认需要认证，除非明确设置为 false

  if (requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/health-report')
  } else {
    next()
  }
})

export default router
