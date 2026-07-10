// 主题管理工具
const THEME_KEY = 'app_theme'

// 主题配置
export const themes = {
  dark: {
    name: '夜间模式',
    colors: {
      '--bg-primary': '#0f1729',
      '--bg-secondary': '#1e293b',
      '--bg-tertiary': '#0d1b2a',
      '--bg-card': 'rgba(30, 41, 59, 0.5)',
      '--text-primary': '#f8fafc',
      '--text-secondary': '#cbd5e1',
      '--text-tertiary': '#94a3b8',
      '--border-color': 'rgba(59, 130, 246, 0.2)',
      '--accent-color': '#3b82f6',
      '--accent-hover': '#2563eb',
      '--success': '#10b981',
      '--warning': '#f59e0b',
      '--danger': '#ef4444'
    }
  },
  light: {
    name: '日间模式',
    colors: {
      '--bg-primary': '#f8fafc',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#f1f5f9',
      '--bg-card': 'rgba(255, 255, 255, 0.8)',
      '--text-primary': '#1e293b',
      '--text-secondary': '#475569',
      '--text-tertiary': '#64748b',
      '--border-color': 'rgba(203, 213, 225, 0.5)',
      '--accent-color': '#3b82f6',
      '--accent-hover': '#2563eb',
      '--success': '#10b981',
      '--warning': '#f59e0b',
      '--danger': '#ef4444'
    }
  }
}

// 获取当前主题
export function getTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved && themes[saved]) {
    return saved
  }
  // 默认使用深色模式
  return 'dark'
}

// 应用主题
export function applyTheme(themeName) {
  const theme = themes[themeName]
  if (!theme) {
    console.error('Theme not found:', themeName)
    return
  }

  // 移除所有主题类
  document.body.classList.remove('theme-dark', 'theme-light')
  
  // 添加当前主题类
  document.body.classList.add(`theme-${themeName}`)
  
  // 设置 CSS 变量
  const root = document.documentElement
  Object.entries(theme.colors).forEach(([property, value]) => {
    root.style.setProperty(property, value)
  })
  
  // 保存到 localStorage
  localStorage.setItem(THEME_KEY, themeName)
  
  console.log('Theme applied:', themeName)
}

// 初始化主题
export function initTheme() {
  const theme = getTheme()
  applyTheme(theme)
}

// 切换主题
export function toggleTheme() {
  const current = getTheme()
  const next = current === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}
