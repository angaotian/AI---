<template>
  <div class="page">
    <h1 class="page-title">后台运维</h1>
    <p class="page-desc">系统运维管理功能</p>
    
    <div class="ops-dashboard">
      <div class="status-cards">
        <div class="status-card">
          <div class="status-icon system">🖥️</div>
          <div class="status-info">
            <div class="status-label">系统状态</div>
            <div class="status-value online">运行中</div>
          </div>
          <div class="status-uptime">运行时间：99.9%</div>
        </div>
        
        <div class="status-card">
          <div class="status-icon users">👥</div>
          <div class="status-info">
            <div class="status-label">在线用户</div>
            <div class="status-value">1,234</div>
          </div>
          <div class="status-trend positive">↑ 12%</div>
        </div>
        
        <div class="status-card">
          <div class="status-icon data">💾</div>
          <div class="status-info">
            <div class="status-label">数据总量</div>
            <div class="status-value">2.5 TB</div>
          </div>
          <div class="status-trend positive">↑ 5.2%</div>
        </div>
        
        <div class="status-card">
          <div class="status-icon alerts">⚠️</div>
          <div class="status-info">
            <div class="status-label">待处理告警</div>
            <div class="status-value warning">3</div>
          </div>
          <div class="status-trend negative">↓ 2</div>
        </div>
      </div>
      
      <div class="ops-content">
        <div class="ops-panel">
          <div class="panel-header">
            <h3 class="panel-title">系统资源监控</h3>
            <button class="refresh-btn" @click="refreshStats">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              刷新
            </button>
          </div>
          
          <div class="resource-list">
            <div class="resource-item">
              <div class="resource-info">
                <span class="resource-name">CPU 使用率</span>
                <span class="resource-value">{{ resources.cpu }}%</span>
              </div>
              <div class="resource-bar">
                <div class="resource-fill cpu" :style="{ width: resources.cpu + '%' }"></div>
              </div>
            </div>
            
            <div class="resource-item">
              <div class="resource-info">
                <span class="resource-name">内存使用</span>
                <span class="resource-value">{{ resources.memory }}%</span>
              </div>
              <div class="resource-bar">
                <div class="resource-fill memory" :style="{ width: resources.memory + '%' }"></div>
              </div>
            </div>
            
            <div class="resource-item">
              <div class="resource-info">
                <span class="resource-name">磁盘空间</span>
                <span class="resource-value">{{ resources.disk }}%</span>
              </div>
              <div class="resource-bar">
                <div class="resource-fill disk" :style="{ width: resources.disk + '%' }"></div>
              </div>
            </div>
            
            <div class="resource-item">
              <div class="resource-info">
                <span class="resource-name">网络带宽</span>
                <span class="resource-value">{{ resources.network }}%</span>
              </div>
              <div class="resource-bar">
                <div class="resource-fill network" :style="{ width: resources.network + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="ops-panel">
          <div class="panel-header">
            <h3 class="panel-title">服务管理</h3>
            <button class="add-btn" @click="addService">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              添加服务
            </button>
          </div>
          
          <div class="service-table">
            <table>
              <thead>
                <tr>
                  <th>服务名称</th>
                  <th>状态</th>
                  <th>端口</th>
                  <th>CPU</th>
                  <th>内存</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="service in services" :key="service.name">
                  <td>
                    <div class="service-name">{{ service.name }}</div>
                    <div class="service-version">{{ service.version }}</div>
                  </td>
                  <td>
                    <span class="service-status" :class="service.status">
                      <span class="status-dot"></span>
                      {{ service.statusText }}
                    </span>
                  </td>
                  <td>{{ service.port }}</td>
                  <td>{{ service.cpu }}%</td>
                  <td>{{ service.memory }} MB</td>
                  <td>
                    <div class="service-actions">
                      <button 
                        class="action-icon" 
                        :class="service.status"
                        @click="toggleService(service)"
                        :title="service.status === 'running' ? '停止' : '启动'"
                      >
                        {{ service.status === 'running' ? '⏹️' : '▶️' }}
                      </button>
                      <button class="action-icon" @click="restartService(service)" title="重启">
                        🔄
                      </button>
                      <button class="action-icon" @click="viewServiceLogs(service)" title="日志">
                        📋
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="ops-panel">
          <div class="panel-header">
            <h3 class="panel-title">系统日志</h3>
            <div class="log-filters">
              <select v-model="logFilter">
                <option value="all">全部</option>
                <option value="info">信息</option>
                <option value="warning">警告</option>
                <option value="error">错误</option>
              </select>
              <button class="export-btn" @click="exportLogs">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                导出
              </button>
            </div>
          </div>
          
          <div class="log-list">
            <div 
              class="log-item" 
              v-for="log in filteredLogs" 
              :key="log.id"
              :class="log.level"
            >
              <div class="log-time">{{ log.time }}</div>
              <div class="log-level">{{ log.level }}</div>
              <div class="log-message">{{ log.message }}</div>
              <div class="log-source">{{ log.source }}</div>
            </div>
          </div>
        </div>
        
        <div class="ops-panel">
          <div class="panel-header">
            <h3 class="panel-title">数据库状态</h3>
          </div>
          
          <div class="database-stats">
            <div class="db-item">
              <div class="db-label">连接数</div>
              <div class="db-value">45 / 100</div>
              <div class="db-bar">
                <div class="db-fill" style="width: 45%"></div>
              </div>
            </div>
            <div class="db-item">
              <div class="db-label">查询速率</div>
              <div class="db-value">1,234 QPS</div>
              <div class="db-trend positive">↑ 8.5%</div>
            </div>
            <div class="db-item">
              <div class="db-label">慢查询</div>
              <div class="db-value warning">12</div>
              <div class="db-trend negative">↑ 3</div>
            </div>
            <div class="db-item">
              <div class="db-label">存储使用</div>
              <div class="db-value">856 GB</div>
              <div class="db-sub">总容量：1 TB</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const resources = ref({
  cpu: 45,
  memory: 68,
  disk: 72,
  network: 23
})

const services = ref([
  {
    name: 'API Gateway',
    version: 'v2.3.0',
    status: 'running',
    statusText: '运行中',
    port: 8080,
    cpu: 12,
    memory: 256
  },
  {
    name: 'User Service',
    version: 'v1.8.5',
    status: 'running',
    statusText: '运行中',
    port: 8081,
    cpu: 8,
    memory: 512
  },
  {
    name: 'Data Analytics',
    version: 'v3.1.2',
    status: 'running',
    statusText: '运行中',
    port: 8082,
    cpu: 35,
    memory: 1024
  },
  {
    name: 'Notification',
    version: 'v1.2.0',
    status: 'stopped',
    statusText: '已停止',
    port: 8083,
    cpu: 0,
    memory: 0
  },
  {
    name: 'Report Generator',
    version: 'v2.0.1',
    status: 'warning',
    statusText: '异常',
    port: 8084,
    cpu: 95,
    memory: 2048
  }
])

const logs = ref([
  { id: 1, time: '2024-01-15 10:23:45', level: 'info', message: '系统启动完成', source: 'System' },
  { id: 2, time: '2024-01-15 10:25:12', level: 'info', message: '用户登录成功：user123', source: 'Auth' },
  { id: 3, time: '2024-01-15 10:30:00', level: 'warning', message: 'CPU 使用率超过阈值 (85%)', source: 'Monitor' },
  { id: 4, time: '2024-01-15 10:35:22', level: 'error', message: '数据库连接超时', source: 'Database' },
  { id: 5, time: '2024-01-15 10:40:15', level: 'info', message: '数据备份完成', source: 'Backup' },
  { id: 6, time: '2024-01-15 10:45:30', level: 'warning', message: '内存使用率偏高 (78%)', source: 'Monitor' },
  { id: 7, time: '2024-01-15 10:50:00', level: 'info', message: '健康报告生成成功', source: 'Report' },
  { id: 8, time: '2024-01-15 10:55:18', level: 'error', message: '第三方 API 调用失败', source: 'Integration' }
])

const logFilter = ref('all')

const filteredLogs = computed(() => {
  if (logFilter.value === 'all') return logs.value
  return logs.value.filter(log => log.level === logFilter.value)
})

const refreshStats = () => {
  resources.value = {
    cpu: Math.floor(Math.random() * 60) + 20,
    memory: Math.floor(Math.random() * 40) + 40,
    disk: Math.floor(Math.random() * 20) + 60,
    network: Math.floor(Math.random() * 50) + 10
  }
  alert('统计数据已更新')
}

const addService = () => {
  alert('添加服务功能演示')
}

const toggleService = (service) => {
  if (service.status === 'running') {
    service.status = 'stopped'
    service.statusText = '已停止'
    service.cpu = 0
    service.memory = 0
  } else {
    service.status = 'running'
    service.statusText = '运行中'
    service.cpu = Math.floor(Math.random() * 30) + 5
    service.memory = Math.floor(Math.random() * 500) + 200
  }
}

const restartService = (service) => {
  alert(`重启服务：${service.name}`)
}

const viewServiceLogs = (service) => {
  alert(`查看日志：${service.name}`)
}

const exportLogs = () => {
  alert('导出日志功能演示')
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

.ops-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.status-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.status-icon {
  font-size: 32px;
}

.status-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-label {
  color: #94a3b8;
  font-size: 13px;
}

.status-value {
  color: #f8fafc;
  font-size: 24px;
  font-weight: 600;
}

.status-value.online { color: #10b981; }
.status-value.warning { color: #f59e0b; }

.status-uptime,
.status-trend {
  font-size: 12px;
  color: #64748b;
}

.status-trend.positive { color: #10b981; }
.status-trend.negative { color: #ef4444; }

.ops-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ops-panel {
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-title {
  color: #f8fafc;
  font-size: 16px;
  margin: 0;
}

.refresh-btn,
.add-btn,
.export-btn {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}

.refresh-btn:hover,
.add-btn:hover,
.export-btn:hover {
  background: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resource-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-info {
  display: flex;
  justify-content: space-between;
}

.resource-name {
  color: #94a3b8;
  font-size: 13px;
}

.resource-value {
  color: #f8fafc;
  font-size: 13px;
  font-weight: 600;
}

.resource-bar {
  height: 8px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 4px;
  overflow: hidden;
}

.resource-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.resource-fill.cpu { background: linear-gradient(90deg, #3b82f6, #2563eb); }
.resource-fill.memory { background: linear-gradient(90deg, #10b981, #059669); }
.resource-fill.disk { background: linear-gradient(90deg, #f59e0b, #d97706); }
.resource-fill.network { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }

.service-table {
  overflow-x: auto;
}

.service-table table {
  width: 100%;
  border-collapse: collapse;
}

.service-table th {
  text-align: left;
  padding: 12px 16px;
  color: #94a3b8;
  font-size: 12px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
}

.service-table td {
  padding: 16px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
}

.service-name {
  color: #f8fafc;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.service-version {
  color: #64748b;
  font-size: 12px;
}

.service-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 12px;
}

.service-status.running {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.service-status.stopped {
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
}

.service-status.warning {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.service-actions {
  display: flex;
  gap: 8px;
}

.action-icon {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(59, 130, 246, 0.2);
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.action-icon:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.4);
}

.log-filters {
  display: flex;
  gap: 12px;
}

.log-filters select {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  padding: 6px 12px;
  color: #f8fafc;
  font-size: 13px;
  cursor: pointer;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  display: grid;
  grid-template-columns: 160px 80px 1fr 120px;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
  font-size: 13px;
}

.log-time {
  color: #64748b;
  font-size: 12px;
}

.log-level {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.log-level.info {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.log-level.warning {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.log-level.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.log-message {
  color: #cbd5e1;
}

.log-source {
  color: #94a3b8;
  font-size: 12px;
  text-align: right;
}

.database-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.db-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
}

.db-label {
  color: #94a3b8;
  font-size: 12px;
}

.db-value {
  color: #f8fafc;
  font-size: 20px;
  font-weight: 600;
}

.db-value.warning {
  color: #f59e0b;
}

.db-bar {
  height: 6px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 3px;
  overflow: hidden;
}

.db-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 3px;
}

.db-trend,
.db-sub {
  font-size: 12px;
  color: #64748b;
}

.db-trend.positive { color: #10b981; }
.db-trend.negative { color: #ef4444; }
</style>
