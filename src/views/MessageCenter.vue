<template>
  <div class="page">
    <h1 class="page-title">消息中心</h1>
    <p class="page-desc">系统通知与健康提醒消息</p>
    
    <div class="message-layout">
      <div class="sidebar">
        <div class="filter-section">
          <button 
            class="filter-btn" 
            :class="{ active: currentFilter === 'all' }"
            @click="currentFilter = 'all'"
          >
            全部消息
            <span class="badge" v-if="totalCount > 0">{{ totalCount }}</span>
          </button>
          <button 
            class="filter-btn" 
            :class="{ active: currentFilter === 'unread' }"
            @click="currentFilter = 'unread'"
          >
            未读
            <span class="badge unread" v-if="unreadCount > 0">{{ unreadCount }}</span>
          </button>
          <button 
            class="filter-btn" 
            :class="{ active: currentFilter === 'health' }"
            @click="currentFilter = 'health'"
          >
            健康提醒
          </button>
          <button 
            class="filter-btn" 
            :class="{ active: currentFilter === 'system' }"
            @click="currentFilter = 'system'"
          >
            系统通知
          </button>
        </div>
        
        <div class="actions">
          <button class="action-btn" @click="markAllAsRead">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            全部已读
          </button>
          <button class="action-btn danger" @click="clearAll">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            清空全部
          </button>
        </div>
      </div>
      
      <div class="message-list">
        <div class="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="搜索消息..."
          />
        </div>
        
        <div class="messages">
          <div 
            v-for="message in filteredMessages" 
            :key="message.id"
            class="message-item"
            :class="{ unread: !message.read, selected: selectedMessage?.id === message.id }"
            @click="selectMessage(message)"
          >
            <div class="message-icon" :class="message.type">
              {{ message.type === 'health' ? '🏥' : '⚙️' }}
            </div>
            <div class="message-content">
              <div class="message-header">
                <h4 class="message-title">{{ message.title }}</h4>
                <span class="message-time">{{ message.time }}</span>
              </div>
              <p class="message-preview">{{ message.content }}</p>
              <div class="message-meta">
                <span class="message-tag" :class="message.type">
                  {{ message.type === 'health' ? '健康提醒' : '系统通知' }}
                </span>
                <span class="message-priority" v-if="message.priority === 'high'">紧急</span>
              </div>
            </div>
            <div class="message-actions" v-if="!message.read">
              <span class="unread-dot"></span>
            </div>
          </div>
          
          <div class="empty-state" v-if="filteredMessages.length === 0">
            <div class="empty-icon">📭</div>
            <div class="empty-text">暂无消息</div>
          </div>
        </div>
      </div>
      
      <div class="message-detail" v-if="selectedMessage">
        <div class="detail-header">
          <button class="back-btn" @click="selectedMessage = null">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div class="detail-title-section">
            <h3 class="detail-title">{{ selectedMessage.title }}</h3>
            <div class="detail-meta">
              <span class="detail-time">{{ selectedMessage.time }}</span>
              <span class="detail-tag" :class="selectedMessage.type">
                {{ selectedMessage.type === 'health' ? '健康提醒' : '系统通知' }}
              </span>
            </div>
          </div>
          <div class="detail-actions">
            <button class="icon-btn" @click="markAsRead(selectedMessage)" v-if="!selectedMessage.read">
              标记已读
            </button>
            <button class="icon-btn" @click="deleteMessage(selectedMessage)">
              删除
            </button>
          </div>
        </div>
        
        <div class="detail-body">
          <div class="detail-content" v-html="selectedMessage.fullContent"></div>
          
          <div class="detail-actions-section" v-if="selectedMessage.actions">
            <button 
              class="action-btn-primary"
              v-for="(action, index) in selectedMessage.actions"
              :key="index"
              @click="handleAction(action)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const currentFilter = ref('all')
const searchQuery = ref('')
const selectedMessage = ref(null)

const messages = ref([
  {
    id: 1,
    type: 'health',
    title: '心率异常提醒',
    content: '检测到您的静息心率持续偏高，建议适当休息...',
    fullContent: `
      <p>尊敬的用户，您好！</p>
      <p>根据最近 7 天的监测数据，我们发现您的静息心率持续偏高（平均 85bpm），正常范围为 60-100bpm。</p>
      <p><strong>可能原因：</strong></p>
      <ul>
        <li>压力过大或焦虑</li>
        <li>睡眠质量不佳</li>
        <li>咖啡因摄入过多</li>
        <li>缺乏运动</li>
      </ul>
      <p><strong>建议措施：</strong></p>
      <ul>
        <li>保证每天 7-8 小时充足睡眠</li>
        <li>减少咖啡因和酒精摄入</li>
        <li>进行适度的有氧运动</li>
        <li>学习放松技巧，如深呼吸、冥想</li>
      </ul>
      <p>如情况持续，请咨询医生。</p>
    `,
    time: '5 分钟前',
    read: false,
    priority: 'high',
    actions: [
      { label: '查看详细报告', type: 'report' },
      { label: '预约医生', type: 'appointment' }
    ]
  },
  {
    id: 2,
    type: 'health',
    title: '每日健康报告已生成',
    content: '您昨日的健康数据已汇总完成，点击查看详细分析...',
    fullContent: `
      <p>您的每日健康报告已准备就绪！</p>
      <p><strong>昨日概览：</strong></p>
      <ul>
        <li>步数：12,580 步 ✓</li>
        <li>睡眠：7 小时 20 分钟 ✓</li>
        <li>卡路里消耗：2,450 kcal ✓</li>
        <li>心率：平均 72 bpm ✓</li>
      </ul>
      <p>整体健康状况良好，继续保持！</p>
    `,
    time: '1 小时前',
    read: false,
    priority: 'normal',
    actions: [
      { label: '查看完整报告', type: 'report' }
    ]
  },
  {
    id: 3,
    type: 'system',
    title: '系统更新通知',
    content: '健康管理系统已升级至 v2.3.0，新增多项功能...',
    fullContent: `
      <p>系统已更新至 v2.3.0 版本</p>
      <p><strong>新增功能：</strong></p>
      <ul>
        <li>3D 数字孪生可视化</li>
        <li>家庭成员健康管理</li>
        <li>AI 健康风险评估</li>
        <li>多模态情绪分析</li>
      </ul>
      <p><strong>优化改进：</strong></p>
      <ul>
        <li>提升数据同步速度</li>
        <li>优化界面响应性能</li>
        <li>修复已知问题</li>
      </ul>
    `,
    time: '2 小时前',
    read: false,
    priority: 'normal',
    actions: [
      { label: '查看更新日志', type: 'changelog' }
    ]
  },
  {
    id: 4,
    type: 'health',
    title: '用药提醒',
    content: '记得按时服用维生素 D，每日一次...',
    fullContent: `
      <p>温馨提醒：该服药了！</p>
      <p><strong>药品：</strong>维生素 D3</p>
      <p><strong>剂量：</strong>1000 IU</p>
      <p><strong>服用时间：</strong>早餐后</p>
      <p>请按时服药以保持最佳健康状态。</p>
    `,
    time: '今天上午 8:00',
    read: true,
    priority: 'normal',
    actions: [
      { label: '我已服用', type: 'confirm' },
      { label: '稍后提醒', type: 'snooze' }
    ]
  },
  {
    id: 5,
    type: 'health',
    title: '睡眠质量分析',
    content: '昨晚睡眠深度不足，建议调整作息时间...',
    fullContent: `
      <p>昨晚睡眠质量分析报告</p>
      <p><strong>睡眠数据：</strong></p>
      <ul>
        <li>入睡时间：23:45</li>
        <li>起床时间：07:15</li>
        <li>总时长：7 小时 30 分钟</li>
        <li>深度睡眠：1 小时 20 分钟（偏低）</li>
        <li>REM 睡眠：2 小时 10 分钟（正常）</li>
        <li>清醒次数：2 次</li>
      </ul>
      <p><strong>改善建议：</strong></p>
      <ul>
        <li>睡前 1 小时避免使用电子设备</li>
        <li>保持卧室温度适宜（18-22°C）</li>
        <li>尝试睡前冥想或深呼吸</li>
      </ul>
    `,
    time: '今天早上 7:30',
    read: true,
    priority: 'normal',
    actions: []
  },
  {
    id: 6,
    type: 'system',
    title: '数据安全备份完成',
    content: '您的健康数据已成功备份至云端...',
    fullContent: `
      <p>数据备份已完成</p>
      <p><strong>备份详情：</strong></p>
      <ul>
        <li>备份时间：2024-01-15 03:00</li>
        <li>数据量：15.6 MB</li>
        <li>备份位置：云端存储</li>
        <li>加密方式：AES-256</li>
      </ul>
      <p>您的数据安全有保障！</p>
    `,
    time: '昨天 03:15',
    read: true,
    priority: 'low',
    actions: []
  }
])

const totalCount = computed(() => messages.value.length)

const unreadCount = computed(() => {
  return messages.value.filter(m => !m.read).length
})

const filteredMessages = computed(() => {
  let filtered = messages.value
  
  if (currentFilter.value === 'unread') {
    filtered = filtered.filter(m => !m.read)
  } else if (currentFilter.value === 'health') {
    filtered = filtered.filter(m => m.type === 'health')
  } else if (currentFilter.value === 'system') {
    filtered = filtered.filter(m => m.type === 'system')
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(m => 
      m.title.toLowerCase().includes(query) ||
      m.content.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

const selectMessage = (message) => {
  selectedMessage.value = message
  if (!message.read) {
    message.read = true
  }
}

const markAsRead = (message) => {
  message.read = true
}

const markAllAsRead = () => {
  messages.value.forEach(m => m.read = true)
}

const deleteMessage = (message) => {
  const index = messages.value.findIndex(m => m.id === message.id)
  if (index > -1) {
    messages.value.splice(index, 1)
    if (selectedMessage.value?.id === message.id) {
      selectedMessage.value = null
    }
  }
}

const clearAll = () => {
  if (confirm('确定要清空所有消息吗？此操作不可恢复。')) {
    messages.value = []
    selectedMessage.value = null
  }
}

const handleAction = (action) => {
  console.log('执行操作:', action)
  alert(`执行操作：${action.label}`)
}
</script>

<style scoped>
.page {
  padding: 20px;
}

.page-title {
  color: #f8fafc;
  font-size: 24px;
  margin-bottom: 8px;
}

.page-desc {
  color: #94a3b8;
  font-size: 14px;
  margin-bottom: 24px;
}

.message-layout {
  display: flex;
  gap: 16px;
  height: calc(100vh - 180px);
}

.sidebar {
  width: 220px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(30, 41, 59, 0.5);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.filter-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
}

.filter-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #f8fafc;
}

.filter-btn.active {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.badge {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.badge.unread {
  background: #ef4444;
  color: white;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #94a3b8;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  transition: all 0.3s;
}

.action-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #f8fafc;
  border-color: rgba(59, 130, 246, 0.3);
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.message-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  overflow: hidden;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
}

.search-box svg {
  color: #64748b;
  flex-shrink: 0;
}

.search-box input {
  flex: 1;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 6px;
  padding: 8px 12px;
  color: #f8fafc;
  font-size: 14px;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.message-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 8px;
  border: 1px solid transparent;
}

.message-item:hover {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.2);
}

.message-item.unread {
  background: rgba(59, 130, 246, 0.08);
}

.message-item.selected {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
}

.message-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.message-icon.health {
  background: rgba(239, 68, 68, 0.15);
}

.message-icon.system {
  background: rgba(59, 130, 246, 0.15);
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.message-title {
  color: #f8fafc;
  font-size: 14px;
  margin: 0;
  font-weight: 600;
}

.message-time {
  color: #64748b;
  font-size: 12px;
  flex-shrink: 0;
  margin-left: 8px;
}

.message-preview {
  color: #94a3b8;
  font-size: 13px;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.message-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.message-tag.health {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.message-tag.system {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.message-priority {
  background: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.message-actions {
  display: flex;
  align-items: center;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
}

.message-detail {
  width: 500px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
}

.back-btn {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #94a3b8;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.back-btn:hover {
  color: #f8fafc;
  border-color: rgba(59, 130, 246, 0.4);
}

.detail-title-section {
  flex: 1;
}

.detail-title {
  color: #f8fafc;
  font-size: 16px;
  margin: 0 0 6px 0;
}

.detail-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.detail-time {
  color: #64748b;
  font-size: 12px;
}

.detail-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.detail-tag.health {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.detail-tag.system {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #94a3b8;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.icon-btn:hover {
  color: #f8fafc;
  border-color: rgba(59, 130, 246, 0.4);
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.detail-content {
  color: #cbd5e1;
  font-size: 14px;
  line-height: 1.7;
}

.detail-content p {
  margin-bottom: 12px;
}

.detail-content ul {
  margin: 12px 0;
  padding-left: 20px;
}

.detail-content li {
  margin-bottom: 6px;
}

.detail-content strong {
  color: #f8fafc;
}

.detail-actions-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* ===== 移动端 ===== */
@media (max-width: 768px) {
  .page {
    padding: 12px;
    padding-bottom: 72px;
  }
  .page-title { font-size: 18px; }
  .page-desc { font-size: 12px; margin-bottom: 14px; }

  .message-layout {
    flex-direction: column;
    height: auto;
    gap: 10px;
  }

  .sidebar {
    width: 100%;
    gap: 8px;
  }
  .filter-section {
    flex-direction: row;
    overflow-x: auto;
    gap: 6px;
    padding: 8px 10px;
    scrollbar-width: none;
  }
  .filter-section::-webkit-scrollbar { display: none; }
  .filter-btn {
    white-space: nowrap;
    padding: 7px 12px;
    font-size: 13px;
    flex-shrink: 0;
  }
  .actions {
    flex-direction: row;
    gap: 8px;
  }
  .action-btn { flex: 1; font-size: 12px; padding: 8px 10px; }

  .message-list {
    max-height: 420px;
  }

  .message-detail {
    width: 100%;
    max-height: 520px;
    border-radius: 12px;
  }

  .message-title { font-size: 13px; }
  .message-preview { font-size: 12px; }
  .message-icon { width: 34px; height: 34px; font-size: 16px; }
  .detail-header { flex-wrap: wrap; gap: 8px; }
  .detail-actions { flex-wrap: wrap; }
}
</style>
