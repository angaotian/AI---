<template>
  <aside class="sidebar">
    <nav class="nav-menu">
      <div v-for="group in menuGroups" :key="group.key" class="nav-group">
        <div class="nav-group-title">{{ group.title }}</div>
        <router-link
          v-for="item in group.items"
          :key="item.path"
          :to="'/' + item.path"
          class="nav-item"
          :class="{ active: $route.path === '/' + item.path }"
        >
          <span class="nav-icon" :class="item.iconClass">
            <NavIcon :name="item.icon" />
          </span>
          <span class="nav-text">{{ item.title }}</span>
        </router-link>
      </div>
    </nav>
    
    <div class="sidebar-footer">
      <div class="user-info" v-if="userInfo">
        <div class="user-avatar">{{ userInfo.name?.charAt(0) || userInfo.username?.charAt(0) || 'U' }}</div>
        <div class="user-details">
          <div class="user-name">{{ userInfo.name || userInfo.username }}</div>
          <div class="user-email">{{ userInfo.email }}</div>
        </div>
      </div>
      <button class="logout-btn" @click="handleLogout">
        <span class="logout-icon">🚪</span>
        <span class="logout-text">退出登录</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NavIcon from './NavIcon.vue'

const router = useRouter()
const userInfo = ref(null)

const menuGroups = [
  {
    key: 'personal',
    title: '个人健康',
    items: [
      { path: 'health-dashboard', title: '健康大盘', icon: 'home', iconClass: 'icon-home' },
      { path: 'lqi-details', title: 'LQI 详情', icon: 'chart', iconClass: 'icon-chart' },
      { path: 'digital-twin', title: '3D 数字孪生', icon: 'person', iconClass: 'icon-person' },
      { path: 'health-risk', title: '健康风险预测', icon: 'trend', iconClass: 'icon-trend' },
      { path: 'health-report', title: '健康报告', icon: 'report', iconClass: 'icon-report' },
    ]
  },
  {
    key: 'analysis',
    title: '智能分析',
    items: [
      { path: 'knowledge-graph', title: '知识图谱推理', icon: 'graph', iconClass: 'icon-graph' },
      { path: 'multi-modal', title: '多模态采集', icon: 'grid', iconClass: 'icon-grid' },
    ]
  },
  {
    key: 'family',
    title: '家庭与消息',
    items: [
      { path: 'family-guardian', title: '家庭守护', icon: 'family', iconClass: 'icon-family' },
      { path: 'message-center', title: '消息中心', icon: 'message', iconClass: 'icon-message' },
      { path: 'system-settings', title: '系统设置', icon: 'settings', iconClass: 'icon-settings' },
    ]
  },
  {
    key: 'ops',
    title: '系统运维',
    items: [
      { path: 'backend-ops', title: '后台运维 (原型)', icon: 'wrench', iconClass: 'icon-wrench' },
    ]
  },
]

// 加载用户信息
onMounted(() => {
  const user = localStorage.getItem('user')
  if (user) {
    userInfo.value = JSON.parse(user)
  }
})

// 退出登录
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // 跳转到登录页
    router.push('/login')
  }
}
</script>

<style scoped>
.sidebar {
  width: 220px;
  min-width: 220px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  padding: 20px 0;
  position: relative;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
}

.nav-menu {
  flex: 1;
  overflow-y: auto;
}

.nav-group {
  margin-bottom: 24px;
}

.nav-group-title {
  font-size: 12px;
  color: var(--text-tertiary);
  padding: 0 20px 12px;
  letter-spacing: 0.5px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
  border-radius: 0 8px 8px 0;
}

.nav-item:hover {
  color: var(--text-primary);
  background: rgba(59, 130, 246, 0.1);
}

.nav-item.active {
  background: linear-gradient(90deg, var(--accent-hover) 0%, var(--accent-color) 100%);
  color: #fff;
}

.nav-icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.icon-home { color: #22c55e; }
.icon-chart { color: #8b5cf6; }
.icon-person { color: #f97316; }
.icon-trend { color: #3b82f6; }
.icon-report { color: #06b6d4; }
.icon-graph { color: #94a3b8; }
.icon-grid { color: #22c55e; }
.icon-family { color: #f97316; }
.icon-message { color: #3b82f6; }
.icon-settings { color: #64748b; }
.icon-wrench { color: #94a3b8; }

.nav-item.active .nav-icon {
  color: #fff !important;
}

.nav-text {
  font-size: 14px;
  white-space: nowrap;
}

.sidebar-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid var(--border-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 12px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  flex-shrink: 0;
}

.user-name {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
}

.user-email {
  color: var(--text-tertiary);
  font-size: 12px;
  margin-top: 2px;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  color: #fca5a5;
}

.logout-icon {
  font-size: 16px;
}

.logout-text {
  font-weight: 500;
}

/* ===== 移动端：底部导航栏 ===== */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    min-width: unset;
    height: 60px;
    min-height: 60px;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: unset;
    padding: 0;
    border-right: none;
    border-top: 1px solid var(--border-color);
    flex-direction: row;
    z-index: 100;
  }

  .nav-menu {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    overflow-x: auto;
    overflow-y: hidden;
    flex: 1;
    scrollbar-width: none;
  }

  .nav-menu::-webkit-scrollbar {
    display: none;
  }

  .nav-group {
    display: contents;
    margin-bottom: 0;
  }

  .nav-group-title {
    display: none;
  }

  .nav-item {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6px 10px;
    border-radius: 0;
    min-width: 60px;
    gap: 2px;
    flex-shrink: 0;
  }

  .nav-icon {
    margin-right: 0;
    width: 20px;
    height: 20px;
  }

  .nav-text {
    font-size: 10px;
    white-space: nowrap;
  }

  .sidebar-footer {
    position: static;
    padding: 0;
    background: none;
    border-top: none;
    display: flex;
    align-items: center;
    border-left: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .user-info {
    display: none;
  }

  .logout-btn {
    width: 52px;
    height: 60px;
    border-radius: 0;
    border: none;
    background: none;
    flex-direction: column;
    gap: 2px;
    padding: 6px;
  }

  .logout-icon {
    font-size: 18px;
  }

  .logout-text {
    font-size: 10px;
    font-weight: 400;
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.1);
  }
}
</style>
