<template>
  <div class="page">
    <h1 class="page-title">系统设置</h1>
    <p class="page-desc">应用偏好与账户配置</p>
    
    <div class="settings-container">
      <div class="settings-sidebar">
        <div 
          class="nav-item" 
          v-for="item in navItems" 
          :key="item.id"
          :class="{ active: activeNav === item.id }"
          @click="activeNav = item.id"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </div>
      </div>
      
      <div class="settings-content">
        <div class="settings-section" v-if="activeNav === 'account'">
          <h2 class="section-title">账户信息</h2>
          
          <div class="profile-card">
            <div class="profile-avatar">
              {{ userProfile.name.charAt(0) }}
            </div>
            <div class="profile-info">
              <h3 class="profile-name">{{ userProfile.name }}</h3>
              <p class="profile-email">{{ userProfile.email }}</p>
              <p class="profile-member">会员 since {{ userProfile.memberSince }}</p>
            </div>
            <button class="edit-btn">编辑资料</button>
          </div>
          
          <div class="form-section">
            <div class="form-group">
              <label>用户名</label>
              <input type="text" v-model="userProfile.name" />
            </div>
            <div class="form-group">
              <label>邮箱</label>
              <input type="email" v-model="userProfile.email" />
            </div>
            <div class="form-group">
              <label>手机</label>
              <input type="tel" v-model="userProfile.phone" />
            </div>
            <button class="save-btn">保存修改</button>
          </div>
          
          <div class="security-section">
            <h3 class="subsection-title">安全设置</h3>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">登录密码</div>
                <div class="setting-desc">定期修改密码可提高账户安全性</div>
              </div>
              <button class="action-btn">修改</button>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">双重验证</div>
                <div class="setting-desc">启用后登录需要手机验证码</div>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="settings.twoFactor" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="settings-section" v-if="activeNav === 'notifications'">
          <h2 class="section-title">通知设置</h2>
          
          <div class="setting-group">
            <h3 class="group-title">健康提醒</h3>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">心率异常提醒</div>
                <div class="setting-desc">当检测到心率异常时发送通知</div>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="settings.heartRateAlert" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">用药提醒</div>
                <div class="setting-desc">按时提醒服用药物</div>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="settings.medicationAlert" checked />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">睡眠提醒</div>
                <div class="setting-desc">提醒按时就寝和起床</div>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="settings.sleepAlert" checked />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div class="setting-group">
            <h3 class="group-title">系统通知</h3>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">系统更新通知</div>
                <div class="setting-desc">接收系统更新和功能升级通知</div>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="settings.systemUpdate" checked />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">健康报告推送</div>
                <div class="setting-desc">每日/每周健康报告生成后推送</div>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="settings.healthReport" checked />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="settings-section" v-if="activeNav === 'privacy'">
          <h2 class="section-title">隐私设置</h2>
          
          <div class="setting-group">
            <h3 class="group-title">数据共享</h3>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">健康数据同步</div>
                <div class="setting-desc">自动同步健康数据到云端</div>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="settings.dataSync" checked />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">匿名数据分析</div>
                <div class="setting-desc">允许使用匿名数据改进服务</div>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="settings.analytics" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div class="setting-group">
            <h3 class="group-title">可见性</h3>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">健康数据对家人可见</div>
                <div class="setting-desc">允许家庭成员查看您的健康状况</div>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="settings.familyVisible" checked />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div class="danger-zone">
            <h3 class="danger-title">危险操作</h3>
            <p class="danger-desc">以下操作不可逆，请谨慎操作</p>
            <button class="danger-btn" @click="clearAllData">清除所有数据</button>
            <button class="danger-btn" @click="deleteAccount">注销账户</button>
          </div>
        </div>
        
        <div class="settings-section" v-if="activeNav === 'appearance'">
          <h2 class="section-title">外观设置</h2>
          
          <div class="setting-group">
            <h3 class="group-title">主题</h3>
            <div class="theme-options">
              <div 
                class="theme-option" 
                :class="{ active: settings.theme === 'dark' }"
                @click="settings.theme = 'dark'"
              >
                <div class="theme-preview dark"></div>
                <span>夜间模式</span>
              </div>
              <div 
                class="theme-option" 
                :class="{ active: settings.theme === 'light' }"
                @click="settings.theme = 'light'"
              >
                <div class="theme-preview light"></div>
                <span>日间模式</span>
              </div>
              <div 
                class="theme-option" 
                :class="{ active: settings.theme === 'auto' }"
                @click="settings.theme = 'auto'"
              >
                <div class="theme-preview auto"></div>
                <span>跟随系统</span>
              </div>
            </div>
          </div>
          
          <div class="setting-group">
            <h3 class="group-title">字体大小</h3>

            <!-- 预设档位 -->
            <div class="font-presets">
              <button
                v-for="preset in fontPresets"
                :key="preset.size"
                class="font-preset-btn"
                :class="{ active: settings.fontSize === preset.size }"
                @click="setFontSize(preset.size)"
              >
                <span class="preset-label">{{ preset.label }}</span>
                <span class="preset-size">{{ preset.size }}px</span>
              </button>
            </div>

            <!-- 滑块 -->
            <div class="font-size-control">
              <span class="font-size-min">A</span>
              <div class="slider-wrap">
                <input
                  type="range"
                  min="12"
                  max="20"
                  step="1"
                  v-model.number="settings.fontSize"
                  class="font-slider"
                />
                <div class="slider-ticks">
                  <span v-for="n in [12,13,14,15,16,17,18,19,20]" :key="n" class="tick" :class="{ active: settings.fontSize === n }">{{ n }}</span>
                </div>
              </div>
              <span class="font-size-max">A</span>
              <span class="font-value">{{ settings.fontSize }}px</span>
            </div>

            <!-- 预览区域 -->
            <div class="font-preview">
              <div class="preview-label">预览效果</div>
              <p class="preview-text" :style="{ fontSize: settings.fontSize + 'px' }">健康管理系统 · 字体大小 {{ settings.fontSize }}px</p>
              <p class="preview-text preview-small" :style="{ fontSize: (settings.fontSize - 2) + 'px' }">辅助说明文字 · 心率 72 bpm · 血压 120/80 mmHg</p>
            </div>

            <!-- 操作按钮 -->
            <div class="font-actions">
              <button class="save-font-btn" @click="saveFontSize">💾 保存设置</button>
              <button class="reset-font-btn" @click="resetFontSize">🔄 重置默认 (14px)</button>
              <span class="font-tip" v-if="fontSaved" style="color: #10b981">✓ 已保存</span>
              <span class="font-tip" v-else>调整后实时预览，点击保存全局生效</span>
            </div>
          </div>
        </div>
        
        <div class="settings-section" v-if="activeNav === 'about'">
          <h2 class="section-title">关于</h2>
          
          <div class="about-card">
            <div class="app-logo">🏥</div>
            <h3 class="app-name">健康管理系统</h3>
            <p class="app-version">版本 v2.3.0</p>
            <p class="app-desc">您的个人健康管家</p>
          </div>
          
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">开发团队</span>
              <span class="info-value">Health Tech Lab</span>
            </div>
            <div class="info-item">
              <span class="info-label">技术支持</span>
              <span class="info-value">support@health.com</span>
            </div>
            <div class="info-item">
              <span class="info-label">官方网站</span>
              <span class="info-value">www.health.com</span>
            </div>
            <div class="info-item">
              <span class="info-label">更新日期</span>
              <span class="info-value">2024-01-15</span>
            </div>
          </div>
          
          <div class="action-list">
            <button class="list-btn">
              <span>检查更新</span>
              <span class="arrow">→</span>
            </button>
            <button class="list-btn">
              <span>使用帮助</span>
              <span class="arrow">→</span>
            </button>
            <button class="list-btn">
              <span>隐私政策</span>
              <span class="arrow">→</span>
            </button>
            <button class="list-btn">
              <span>服务条款</span>
              <span class="arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { applyTheme, getTheme } from '../utils/theme'

const activeNav = ref('account')

const navItems = [
  { id: 'account', label: '账户信息', icon: '👤' },
  { id: 'notifications', label: '通知设置', icon: '🔔' },
  { id: 'privacy', label: '隐私设置', icon: '🔒' },
  { id: 'appearance', label: '外观设置', icon: '🎨' },
  { id: 'about', label: '关于', icon: 'ℹ️' }
]

const userProfile = ref({
  name: '张三',
  email: 'zhangsan@example.com',
  phone: '138****8888',
  memberSince: '2023'
})

// 字体预设档位
const fontPresets = [
  { label: '小', size: 12 },
  { label: '默认', size: 14 },
  { label: '大', size: 16 },
  { label: '超大', size: 18 }
]

const fontSaved = ref(false)

// 设置字体大小（仅预览，不保存）
function setFontSize(size) {
  settings.value.fontSize = size
  previewFontSize(size)
}

// 仅预览字体大小（不写 localStorage）
function previewFontSize(size) {
  document.documentElement.style.setProperty('--app-font-size', size + 'px')
  document.documentElement.style.fontSize = size + 'px'
  document.body.style.fontSize = size + 'px'
  let styleEl = document.getElementById('app-font-override')
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'app-font-override'
    document.head.appendChild(styleEl)
  }
  const scale = size / 14
  styleEl.textContent = `
    #app * { font-size: unset !important; }
    #app { font-size: ${size}px !important; }
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
  fontSaved.value = false
}

// 保存字体大小
function saveFontSize() {
  applyFontSize(settings.value.fontSize)
  fontSaved.value = true
  setTimeout(() => { fontSaved.value = false }, 2000)
}

const settings = ref({
  twoFactor: false,
  heartRateAlert: true,
  medicationAlert: true,
  sleepAlert: true,
  systemUpdate: true,
  healthReport: true,
  dataSync: true,
  analytics: false,
  familyVisible: true,
  theme: getTheme(),
  fontSize: parseInt(localStorage.getItem('app_font_size') || '14')
})

// 监听主题变化
watch(() => settings.value.theme, (newTheme) => {
  applyTheme(newTheme)
})

// 监听字体大小变化（仅预览）
watch(() => settings.value.fontSize, (newSize) => {
  previewFontSize(newSize)
})

// 应用字体大小
function applyFontSize(size) {
  // 同时设置 CSS 变量和直接修改 html font-size，确保覆盖 scoped 样式
  document.documentElement.style.setProperty('--app-font-size', size + 'px')
  document.documentElement.style.fontSize = size + 'px'
  document.body.style.fontSize = size + 'px'
  // 动态注入全局样式覆盖 scoped 固定 px 值
  let styleEl = document.getElementById('app-font-override')
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'app-font-override'
    document.head.appendChild(styleEl)
  }
  const scale = size / 14
  styleEl.textContent = `
    #app * {
      font-size: unset !important;
    }
    #app {
      font-size: ${size}px !important;
    }
    #app .page-title { font-size: ${Math.round(24 * scale)}px !important; }
    #app .page-desc { font-size: ${Math.round(14 * scale)}px !important; }
    #app .section-title { font-size: ${Math.round(18 * scale)}px !important; }
    #app .member-name { font-size: ${Math.round(16 * scale)}px !important; }
    #app .stat-value, #app .health-value { font-size: ${Math.round(14 * scale)}px !important; }
    #app .stat-label, #app .health-label, #app .setting-desc, #app .member-relation { font-size: ${Math.round(12 * scale)}px !important; }
    #app .btn-primary, #app .btn-secondary, #app .btn-danger { font-size: ${Math.round(14 * scale)}px !important; }
    #app label, #app input, #app select, #app button { font-size: ${Math.round(14 * scale)}px !important; }
    #app .nav-label { font-size: ${Math.round(14 * scale)}px !important; }
    #app .setting-label { font-size: ${Math.round(14 * scale)}px !important; }
  `
  localStorage.setItem('app_font_size', size.toString())
}

// 重置字体大小
function resetFontSize() {
  settings.value.fontSize = 14
  applyFontSize(14)
}

// 初始化时应用字体大小
onMounted(() => {
  applyFontSize(settings.value.fontSize)
})

const clearAllData = () => {
  if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
    alert('数据清除功能演示')
  }
}

const deleteAccount = () => {
  if (confirm('确定要注销账户吗？此操作不可恢复！')) {
    alert('账户注销功能演示')
  }
}
</script>

<style scoped>
.page {
  padding: 20px;
  background: var(--bg-primary);
  min-height: 100vh;
}

.page-title {
  color: var(--text-primary);
  font-size: 24px;
  margin-bottom: 8px;
}

.page-desc {
  color: var(--text-tertiary);
  font-size: 14px;
  margin-bottom: 24px;
}

.settings-container {
  display: flex;
  gap: 24px;
  height: calc(100vh - 180px);
}

.settings-sidebar {
  width: 220px;
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: var(--text-tertiary);
  font-size: 14px;
}

.nav-item:hover {
  background: rgba(59, 130, 246, 0.1);
  color: var(--text-primary);
}

.nav-item.active {
  background: linear-gradient(90deg, var(--accent-hover) 0%, var(--accent-color) 100%);
  color: #fff;
}

.nav-icon {
  font-size: 18px;
}

.settings-content {
  flex: 1;
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--border-color);
  overflow-y: auto;
}

.section-title {
  color: var(--text-primary);
  font-size: 20px;
  margin: 0 0 24px 0;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: bold;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
}

.profile-name {
  color: var(--text-primary);
  font-size: 20px;
  margin: 0 0 6px 0;
}

.profile-email {
  color: var(--text-tertiary);
  font-size: 14px;
  margin: 0 0 4px 0;
}

.profile-member {
  color: var(--text-secondary);
  font-size: 12px;
  margin: 0;
}

.edit-btn {
  background: rgba(59, 130, 246, 0.2);
  color: var(--accent-color);
  border: 1px solid var(--border-color);
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.edit-btn:hover {
  background: rgba(59, 130, 246, 0.3);
  color: var(--accent-hover);
}

.form-section {
  max-width: 500px;
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: var(--text-tertiary);
  font-size: 13px;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.save-btn {
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.security-section,
.setting-group {
  margin-bottom: 32px;
}

.subsection-title,
.group-title {
  color: var(--text-primary);
  font-size: 16px;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-label {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.setting-desc {
  color: var(--text-tertiary);
  font-size: 12px;
}

.action-btn {
  background: rgba(59, 130, 246, 0.2);
  color: var(--accent-color);
  border: 1px solid var(--border-color);
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  background: rgba(59, 130, 246, 0.3);
  color: var(--accent-hover);
}

.toggle {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color);
  transition: 0.3s;
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle input:checked + .toggle-slider {
  background-color: var(--accent-color);
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.danger-zone {
  margin-top: 40px;
  padding: 24px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.danger-title {
  color: var(--danger);
  font-size: 16px;
  margin: 0 0 8px 0;
}

.danger-desc {
  color: var(--text-tertiary);
  font-size: 13px;
  margin: 0 0 20px 0;
}

.danger-btn {
  background: rgba(239, 68, 68, 0.2);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  margin-right: 12px;
}

.danger-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  color: var(--text-tertiary);
  font-size: 14px;
}

.theme-option:hover {
  border-color: var(--accent-color);
}

.theme-option.active {
  border-color: var(--accent-color);
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-color);
}

.theme-preview {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.theme-preview.dark {
  background: #1e293b;
  border: 2px solid #3b82f6;
}

.theme-preview.dark::after {
  content: '🌙';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
}

.theme-preview.light {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
}

.theme-preview.light::after {
  content: '☀️';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
}

.theme-preview.auto {
  background: linear-gradient(135deg, #1e293b 50%, #f8fafc 50%);
  border: 2px solid #3b82f6;
}

.theme-preview.auto::after {
  content: '🔄';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  padding: 2px;
}

.font-size-control {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}

.font-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--bg-tertiary);
  outline: none;
  -webkit-appearance: none;
}

.font-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-color);
  cursor: pointer;
  transition: transform 0.2s;
}

.font-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.font-value {
  color: var(--accent-color);
  font-size: 14px;
  font-weight: 600;
  min-width: 50px;
  text-align: right;
}

.font-preview {
  margin-top: 16px;
  padding: 16px;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px dashed var(--border-color);
}

.preview-text {
  color: var(--text-primary);
  transition: font-size 0.3s ease;
}

/* 字体预设档位 */
.font-presets {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.font-preset-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s;
  color: var(--text-tertiary);
}

.font-preset-btn:hover {
  border-color: var(--accent-color);
  color: var(--text-primary);
  transform: translateY(-2px);
}

.font-preset-btn.active {
  border-color: var(--accent-color);
  background: rgba(59, 130, 246, 0.15);
  color: var(--accent-color);
}

.preset-label {
  font-size: 15px;
  font-weight: 600;
}

.preset-size {
  font-size: 11px;
  opacity: 0.7;
}

/* 滑块区域 */
.font-size-control {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0 8px;
}

.font-size-min {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 600;
  min-width: 14px;
}

.font-size-max {
  font-size: 20px;
  color: var(--text-tertiary);
  font-weight: 600;
  min-width: 20px;
}

.slider-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slider-ticks {
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
}

.tick {
  font-size: 10px;
  color: var(--text-tertiary);
  opacity: 0.5;
  transition: all 0.2s;
  min-width: 14px;
  text-align: center;
}

.tick.active {
  color: var(--accent-color);
  opacity: 1;
  font-weight: 700;
}

.font-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--bg-tertiary);
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.font-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent-color);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.font-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.15);
}

.font-value {
  color: var(--accent-color);
  font-size: 14px;
  font-weight: 700;
  min-width: 48px;
  text-align: right;
  background: rgba(59, 130, 246, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

/* 预览区域 */
.font-preview {
  margin-top: 16px;
  padding: 16px 20px;
  background: var(--bg-tertiary);
  border-radius: 10px;
  border: 1px dashed var(--border-color);
}

.preview-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.preview-text {
  color: var(--text-primary);
  transition: font-size 0.3s ease;
  margin: 0 0 6px 0;
  line-height: 1.6;
}

.preview-small {
  color: var(--text-tertiary);
  margin: 0;
}

/* 操作按钮 */
.font-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.save-font-btn {
  padding: 9px 20px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s;
  font-weight: 600;
}

.save-font-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.reset-font-btn {
  padding: 9px 18px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  color: var(--accent-color);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s;
  white-space: nowrap;
}

.reset-font-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  transform: translateY(-1px);
}

.font-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  transition: color 0.3s;
}

.about-card {
  text-align: center;
  padding: 40px 20px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  margin-bottom: 32px;
  border: 1px solid var(--border-color);
}

.app-logo {
  font-size: 64px;
  margin-bottom: 16px;
}

.app-name {
  color: var(--text-primary);
  font-size: 24px;
  margin: 0 0 8px 0;
}

.app-version {
  color: var(--accent-color);
  font-size: 14px;
  margin: 0 0 8px 0;
}

.app-desc {
  color: var(--text-tertiary);
  font-size: 14px;
  margin: 0;
}

.info-list {
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: var(--text-tertiary);
  font-size: 14px;
}

.info-value {
  color: var(--text-primary);
  font-size: 14px;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 16px 20px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
}

.list-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: var(--accent-color);
}

.arrow {
  color: var(--text-tertiary);
  font-size: 18px;
}

/* ===== 移动端 ===== */
@media (max-width: 768px) {
  .page {
    padding: 12px;
    padding-bottom: 72px;
  }
  .page-title { font-size: 18px; }
  .page-desc { font-size: 12px; margin-bottom: 14px; }

  .settings-container {
    flex-direction: column;
    height: auto;
    gap: 12px;
  }

  /* 侧边导航变横向标签 */
  .settings-sidebar {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    padding: 10px 8px;
    gap: 6px;
    scrollbar-width: none;
  }
  .settings-sidebar::-webkit-scrollbar { display: none; }
  .nav-item {
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
    white-space: nowrap;
    flex-shrink: 0;
    font-size: 12px;
    border-radius: 8px;
  }
  .nav-icon { font-size: 20px; }
  .nav-label { font-size: 11px; }

  .settings-content {
    padding: 16px 14px;
    border-radius: 12px;
  }

  .section-title { font-size: 16px; margin-bottom: 16px; }

  /* 账户页 */
  .profile-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
    gap: 12px;
  }
  .profile-avatar { width: 60px; height: 60px; font-size: 24px; }
  .profile-name { font-size: 16px; }
  .edit-btn { width: 100%; text-align: center; }

  /* 外观页 */
  .theme-options { grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .theme-option { padding: 12px 6px; font-size: 12px; }
  .theme-preview { width: 44px; height: 44px; }
  .font-presets { gap: 6px; }
  .font-preset-btn { padding: 10px 4px; }
  .font-actions { gap: 8px; }
  .save-font-btn, .reset-font-btn { font-size: 12px; padding: 8px 14px; }

  /* 危险区域 */
  .danger-zone { padding: 16px; }
  .danger-btn { margin-right: 0; margin-bottom: 8px; display: block; width: 100%; }
}

@media (max-width: 400px) {
  .theme-options { grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
  .theme-option { font-size: 11px; padding: 10px 4px; }
}
</style>
