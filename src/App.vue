<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { initTheme } from './utils/theme'

// 初始化主题
onMounted(() => {
  initTheme()
})
</script>

<style>
/* CSS 变量 - 默认深色主题 */
:root {
  --bg-primary: #0f1729;
  --bg-secondary: #1e293b;
  --bg-tertiary: #0d1b2a;
  --bg-card: rgba(30, 41, 59, 0.5);
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
  --border-color: rgba(59, 130, 246, 0.2);
  --accent-color: #3b82f6;
  --accent-hover: #2563eb;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --app-font-size: 14px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
  font-size: var(--app-font-size);
}

#app {
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}
</style>
