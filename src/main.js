import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './index.css'
import { initTheme } from './utils/theme'

// 初始化主题
initTheme()

// 初始化字体大小
const savedFontSize = parseInt(localStorage.getItem('app_font_size') || '14')
document.documentElement.style.setProperty('--app-font-size', savedFontSize + 'px')
document.documentElement.style.fontSize = savedFontSize + 'px'
document.body.style.fontSize = savedFontSize + 'px'

// 注入字体覆盖样式
const scale = savedFontSize / 14
const styleEl = document.createElement('style')
styleEl.id = 'app-font-override'
styleEl.textContent = `
  #app * { font-size: unset !important; }
  #app { font-size: ${savedFontSize}px !important; }
  #app .page-title { font-size: ${Math.round(24 * scale)}px !important; }
  #app .page-desc { font-size: ${Math.round(14 * scale)}px !important; }
  #app .section-title { font-size: ${Math.round(18 * scale)}px !important; }
  #app .member-name { font-size: ${Math.round(16 * scale)}px !important; }
  #app .stat-value, #app .health-value { font-size: ${Math.round(14 * scale)}px !important; }
  #app .stat-label, #app .health-label, #app .setting-desc, #app .member-relation { font-size: ${Math.round(12 * scale)}px !important; }
  #app .btn-primary, #app .btn-secondary, #app .btn-danger { font-size: ${Math.round(14 * scale)}px !important; }
  #app label, #app input, #app select, #app button { font-size: ${Math.round(14 * scale)}px !important; }
  #app .nav-label, #app .setting-label { font-size: ${Math.round(14 * scale)}px !important; }
`
document.head.appendChild(styleEl)

createApp(App).use(router).mount('#app')
