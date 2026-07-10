<template>
  <div class="page">
    <h1 class="page-title">家庭守护</h1>
    <p class="page-desc">家庭成员健康管理与关爱</p>
    
    <div class="action-bar">
      <button class="btn-primary" @click="openAddModal">
        <span class="icon">+</span> 添加成员
      </button>
    </div>
    
    <div v-if="loading" class="loading-state">加载中...</div>
    
    <div v-else-if="!familyMembers || familyMembers.length === 0" class="empty-state">
      <div class="empty-icon">👨‍👩‍👧‍👦</div>
      <div class="empty-text">暂无家庭成员</div>
      <div class="empty-hint">点击右上角"添加成员"按钮添加家庭成员</div>
    </div>
    
    <div class="family-grid" v-else>
      <div class="member-card" v-for="member in familyMembers" :key="member.id">
        <div class="member-header">
          <div class="avatar" :style="{ backgroundColor: member.avatarColor || '#3b82f6' }">
            {{ (member.name || '?').charAt(0) }}
          </div>
          <div class="member-basic">
            <h3 class="member-name">{{ member.name || '未知' }}</h3>
            <div class="member-relation">{{ member.relation || '-' }}</div>
          </div>
          <div class="member-actions">
            <button class="icon-btn" @click="viewMember(member)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="icon-btn" @click="editMember(member)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="icon-btn delete-btn" @click="confirmDelete(member)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="member-body">
          <div class="health-overview">
            <div class="health-item">
              <div class="health-label">健康评分</div>
              <div class="health-value" :class="getHealthLevel(member.healthScore)">
                {{ member.healthScore || 100 }}
              </div>
            </div>
            <div class="health-item">
              <div class="health-label">最近监测</div>
              <div class="health-value">{{ member.lastCheckIn || '刚刚' }}</div>
            </div>
            <div class="health-item">
              <div class="health-label">风险等级</div>
              <div class="health-value" :class="getRiskLevelClass(member.riskLevel)">
                {{ member.riskLevel || '低' }}
              </div>
            </div>
          </div>
          
          <div class="quick-stats">
            <div class="stat-item">
              <div class="stat-icon">❤️</div>
              <div class="stat-info">
                <div class="stat-label">心率</div>
                <div class="stat-value">{{ member.vitals?.heartRate || 72 }} bpm</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">🩸</div>
              <div class="stat-info">
                <div class="stat-label">血压</div>
                <div class="stat-value">{{ member.vitals?.bloodPressure || '120/80' }}</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">👣</div>
              <div class="stat-info">
                <div class="stat-label">步数</div>
                <div class="stat-value">{{ (member.vitals?.steps || 0).toLocaleString() }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="member-footer">
          <div class="alert-item" v-if="member.alerts && member.alerts.length > 0">
            <span class="alert-icon">⚠️</span>
            <span class="alert-text">{{ member.alerts[0] }}</span>
          </div>
          <div class="status-badge" v-else>
            <span class="status-dot"></span>
            状态正常
          </div>
        </div>
      </div>
    </div>
    
    <div class="care-suggestions">
      <h2 class="section-title">健康建议</h2>
      <div class="suggestion-list">
        <div class="suggestion-card" v-for="suggestion in suggestions" :key="suggestion.id">
          <div class="suggestion-icon">{{ suggestion.icon }}</div>
          <div class="suggestion-content">
            <div class="suggestion-title">{{ suggestion.title }}</div>
            <div class="suggestion-desc">{{ suggestion.description }}</div>
          </div>
          <button class="suggestion-action" @click="acceptSuggestion(suggestion)">
            采纳
          </button>
        </div>
      </div>
    </div>
    
    <div class="modal-overlay" v-if="showAddModal" @click="showAddModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditing ? '编辑家庭成员' : '添加家庭成员' }}</h3>
          <button class="close-btn" @click="closeMemberModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-section">
            <div class="section-head">
              <h4 class="section-subtitle">基本信息</h4>
              <button type="button" class="text-action" @click="openCollectedDataModal">
                使用采集数据
              </button>
            </div>

            <div class="form-group">
              <label>姓名 <span class="required">*</span></label>
              <input 
                type="text" 
                v-model="newMember.name" 
                placeholder="请输入姓名"
                :class="{ error: formErrors.name }"
              />
              <span class="error-msg" v-if="formErrors.name">{{ formErrors.name }}</span>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>关系 <span class="required">*</span></label>
                <select v-model="newMember.relation" :class="{ error: formErrors.relation }">
                  <option value="">请选择关系</option>
                  <option value="父亲">父亲</option>
                  <option value="母亲">母亲</option>
                  <option value="配偶">配偶</option>
                  <option value="子女">子女</option>
                  <option value="兄弟姐妹">兄弟姐妹</option>
                  <option value="其他">其他</option>
                </select>
                <span class="error-msg" v-if="formErrors.relation">{{ formErrors.relation }}</span>
              </div>
              
              <div class="form-group">
                <label>性别 <span class="required">*</span></label>
                <select v-model="newMember.gender" :class="{ error: formErrors.gender }">
                  <option value="">请选择性别</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
                <span class="error-msg" v-if="formErrors.gender">{{ formErrors.gender }}</span>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>年龄</label>
                <input 
                  type="number" 
                  v-model="newMember.age" 
                  placeholder="请输入年龄"
                  min="0"
                  max="150"
                  :class="{ error: formErrors.age }"
                />
                <span class="error-msg" v-if="formErrors.age">{{ formErrors.age }}</span>
              </div>
              
              <div class="form-group">
                <label>头像颜色</label>
                <div class="color-picker">
                  <div 
                    v-for="color in avatarColors" 
                    :key="color"
                    class="color-option"
                    :class="{ active: newMember.avatarColor === color }"
                    :style="{ backgroundColor: color }"
                    @click="newMember.avatarColor = color"
                  >
                    <span v-if="newMember.avatarColor === color">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-section">
            <div class="section-head">
              <h4 class="section-subtitle">健康信息（可选）</h4>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>健康评分</label>
                <input 
                  type="number" 
                  v-model="newMember.healthScore" 
                  placeholder="0-100"
                  min="0"
                  max="100"
                />
              </div>
              
              <div class="form-group">
                <label>风险等级</label>
                <select v-model="newMember.riskLevel">
                  <option value="低">低</option>
                  <option value="中">中</option>
                  <option value="高">高</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>心率</label>
                <input
                  type="number"
                  v-model="newMember.heartRate"
                  placeholder="请输入心率 bpm"
                  min="0"
                  max="220"
                  :class="{ error: formErrors.heartRate }"
                />
                <span class="error-msg" v-if="formErrors.heartRate">{{ formErrors.heartRate }}</span>
              </div>

              <div class="form-group">
                <label>血压</label>
                <input
                  type="text"
                  v-model="newMember.bloodPressure"
                  placeholder="例如 120/80"
                  :class="{ error: formErrors.bloodPressure }"
                />
                <span class="error-msg" v-if="formErrors.bloodPressure">{{ formErrors.bloodPressure }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeMemberModal">取消</button>
          <button class="btn-primary" @click="submitMember">{{ isEditing ? '保存修改' : '确定添加' }}</button>
        </div>
      </div>
    </div>

    <div class="drawer-overlay" v-if="showCollectedDataModal" @click="closeCollectedDataModal">
      <div class="collected-drawer" @click.stop>
        <div class="drawer-header">
          <div>
            <h3>选择已保存采集数据</h3>
            <p class="drawer-desc">从右侧列表中选择一条采集记录，自动带入年龄、性别、心率和健康信息。</p>
          </div>
          <button class="close-btn" @click="closeCollectedDataModal">×</button>
        </div>
        <div class="drawer-toolbar">
          <button class="btn-secondary" @click="loadSavedCollectedRecords" :disabled="recordsLoading">
            {{ recordsLoading ? '加载中...' : '刷新记录' }}
          </button>
        </div>

        <div class="drawer-body">
          <div v-if="savedCollectedRecords.length" class="record-list drawer-record-list">
            <button
              v-for="record in savedCollectedRecords"
              :key="record.id"
              type="button"
              class="record-option"
              :class="{ active: newMember.selectedRecordId === record.id }"
              @click="selectCollectedRecord(record)"
            >
              <div class="record-option-top">
                <span>{{ formatCollectedRecordTime(record.recorded_at) }}</span>
                <span class="record-source-tag">{{ record.source === 'demo_mode' ? '演示采集' : '实时采集' }}</span>
              </div>
              <div class="record-option-tags">
                <span class="data-tag">性别: {{ record.gender_label || '未知' }}</span>
                <span class="data-tag">年龄: {{ record.age_estimate || 0 }} 岁</span>
                <span class="data-tag">心率: {{ record.heart_rate || 0 }} bpm</span>
                <span class="data-tag">表情: {{ record.face_expression || '未检测' }}</span>
                <span class="data-tag">健康评估: {{ record.health_label || '评估中' }}</span>
              </div>
            </button>
          </div>
          <div v-else class="no-records-text">
            {{ recordsLoading ? '正在读取已保存采集数据...' : '暂无可选的采集数据，请先在多模态采集页面保存' }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 删除确认对话框 -->
    <div class="modal-overlay" v-if="showDeleteConfirm" @click="cancelDelete">
      <div class="modal delete-modal" @click.stop>
        <div class="modal-header">
          <h3>确认删除</h3>
          <button class="close-btn" @click="cancelDelete">×</button>
        </div>
        <div class="modal-body">
          <p>确定要删除家庭成员 <strong>{{ memberToDelete?.name }}</strong> 吗？</p>
          <p class="delete-hint">此操作不可恢复，该成员的所有健康数据也将被删除。</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="cancelDelete">取消</button>
          <button class="btn-danger" @click="executeDelete" :disabled="deleting">
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { familyAPI, multimodalAPI } from '../services/api'

const createMemberForm = () => ({
  name: '',
  relation: '',
  age: '',
  gender: '',
  avatarColor: '#3b82f6',
  healthScore: '',
  riskLevel: '低',
  heartRate: '',
  bloodPressure: '',
  selectedRecordId: ''
})

const showAddModal = ref(false)
const showCollectedDataModal = ref(false)
const showDeleteConfirm = ref(false)
const memberToDelete = ref(null)
const deleting = ref(false)
const loading = ref(false)
const recordsLoading = ref(false)
const isEditing = ref(false)
const editingMemberId = ref('')
const formErrors = ref({})
const avatarColors = [
  '#3b82f6', '#8b5cf6', '#f97316', '#22c55e', 
  '#ef4444', '#ec4899', '#14b8a6', '#6366f1'
]

const newMember = ref(createMemberForm())

const familyMembers = ref([])
const savedCollectedRecords = ref([])
const suggestions = ref([
  {
    id: '1',
    icon: '🥗',
    title: '饮食建议',
    description: '建议低盐饮食，多吃蔬菜水果'
  },
  {
    id: '2',
    icon: '🏃',
    title: '运动建议',
    description: '每天散步 30 分钟，保持适度运动'
  },
  {
    id: '3',
    icon: '💊',
    title: '用药提醒',
    description: '按时服用药物，每日两次'
  }
])

const formatCollectedRecordTime = (time) => {
  if (!time) return '未知时间'
  const date = new Date(time)
  return Number.isNaN(date.getTime()) ? String(time) : date.toLocaleString()
}

const loadSavedCollectedRecords = async () => {
  try {
    recordsLoading.value = true
    const { data } = await multimodalAPI.getRecords({ limit: 20 })
    savedCollectedRecords.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('加载已保存采集记录失败:', error)
    savedCollectedRecords.value = []
  } finally {
    recordsLoading.value = false
  }
}

const applySelectedRecordToForm = (recordId) => {
  const record = savedCollectedRecords.value.find(item => item.id === recordId)
  if (!record) return

  newMember.value.selectedRecordId = record.id
  newMember.value.gender = record.gender_label && record.gender_label !== '未知' ? record.gender_label : newMember.value.gender
  newMember.value.age = Number(record.age_estimate || 0) > 0 ? String(record.age_estimate) : newMember.value.age
  newMember.value.heartRate = Number(record.heart_rate || 0) > 0 ? String(record.heart_rate) : newMember.value.heartRate
  newMember.value.bloodPressure = newMember.value.bloodPressure || '120/80'

  const suggestedScore = Number(record.heart_rate || 0) > 105 ? 72 : Number(record.heart_rate || 0) > 0 ? 88 : 80
  const suggestedRisk = record.health_label === '风险较高' ? '高' : record.health_label === '需关注' ? '中' : '低'
  newMember.value.healthScore = String(suggestedScore)
  newMember.value.riskLevel = suggestedRisk
}

const selectCollectedRecord = (record) => {
  if (!record) return
  applySelectedRecordToForm(record.id)
  showCollectedDataModal.value = false
}

const openCollectedDataModal = async () => {
  showCollectedDataModal.value = true
  if (!savedCollectedRecords.value.length) {
    await loadSavedCollectedRecords()
  }
}

const closeCollectedDataModal = () => {
  showCollectedDataModal.value = false
}

const resetMemberForm = () => {
  newMember.value = createMemberForm()
  formErrors.value = {}
  isEditing.value = false
  editingMemberId.value = ''
}

const closeMemberModal = () => {
  showAddModal.value = false
  resetMemberForm()
}

const openAddModal = () => {
  resetMemberForm()
  showAddModal.value = true
}

// 加载家庭成员数据
const loadFamilyMembers = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    console.log('=== 开始加载家庭成员 ===')
    console.log('当前 Token:', token ? token.substring(0, 30) + '...' : '无')
    console.log('当前用户:', user)
    console.log('用户 ID:', user.id)
    
    const { data } = await familyAPI.getMembers()
    console.log('=== API 返回数据 ===')
    console.log('家庭成员数量:', data.length)
    console.log('家庭成员数据:', data)
    
    familyMembers.value = data.map(member => ({
      id: member.id,
      name: member.name,
      relation: member.relation,
      age: member.age,
      gender: member.gender,
      avatarColor: member.avatar_color || '#3b82f6',
      healthScore: member.health_score || 100,
      riskLevel: member.risk_level || '低',
      lastCheckIn: member.last_check_in || '暂无数据',
      vitals: {
        heartRate: member.vitals?.heart_rate || 0,
        bloodPressure: member.vitals?.blood_pressure || '0/0',
        steps: member.vitals?.steps || 0
      },
      alerts: []
    }))
    console.log('=== 处理后的数据 ===')
    console.log('处理后的家庭成员:', familyMembers.value)
    console.log('========================')
  } catch (error) {
    console.error('=== 加载家庭成员失败 ===')
    console.error('错误详情:', error)
    console.error('错误响应:', error.response)
    console.error('错误数据:', error.response?.data)
    alert('加载家庭成员失败：' + (error.response?.data?.error || error.message))
  } finally {
    loading.value = false
  }
}

const getHealthLevel = (score) => {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 60) return 'medium'
  return 'poor'
}

const getRiskLevelClass = (level) => {
  return level === '低' ? 'low' : level === '中' ? 'medium' : 'high'
}

// 验证表单
const validateForm = () => {
  const errors = {}
  
  if (!newMember.value.name || newMember.value.name.trim() === '') {
    errors.name = '请输入姓名'
  } else if (newMember.value.name.length < 2) {
    errors.name = '姓名至少 2 个字符'
  }
  
  if (!newMember.value.relation) {
    errors.relation = '请选择关系'
  }
  
  if (!newMember.value.gender) {
    errors.gender = '请选择性别'
  }
  
  if (newMember.value.age) {
    const age = parseInt(newMember.value.age)
    if (isNaN(age) || age < 0 || age > 150) {
      errors.age = '请输入有效的年龄 (0-150)'
    }
  }

  if (newMember.value.heartRate) {
    const heartRate = parseInt(newMember.value.heartRate)
    if (isNaN(heartRate) || heartRate < 0 || heartRate > 220) {
      errors.heartRate = '请输入有效的心率 (0-220)'
    }
  }

  if (newMember.value.bloodPressure) {
    const bloodPressure = newMember.value.bloodPressure.trim()
    if (!/^\d{2,3}\/\d{2,3}$/.test(bloodPressure)) {
      errors.bloodPressure = '请输入有效的血压格式，如 120/80'
    }
  }
  
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const buildMemberPayload = () => ({
  name: newMember.value.name.trim(),
  relation: newMember.value.relation,
  age: parseInt(newMember.value.age) || 0,
  gender: newMember.value.gender,
  avatar_color: newMember.value.avatarColor,
  health_score: parseInt(newMember.value.healthScore) || 100,
  risk_level: newMember.value.riskLevel,
  heart_rate: parseInt(newMember.value.heartRate) || 0,
  blood_pressure: newMember.value.bloodPressure?.trim() || '120/80',
  multimodal_record_id: newMember.value.selectedRecordId || null
})

const addMember = async () => {
  if (!validateForm()) {
    return
  }

  try {
    const memberData = buildMemberPayload()
    
    console.log('添加成员数据:', memberData)
    const response = await familyAPI.addMember(memberData)
    
    console.log('添加成员响应:', response.data)
    showAddModal.value = false
    resetMemberForm()
    await loadFamilyMembers()
    alert('添加成功！')
  } catch (error) {
    console.error('添加成员失败:', error)
    alert('添加失败：' + (error.response?.data?.error || error.message))
  }
}

const updateMember = async () => {
  if (!validateForm() || !editingMemberId.value) {
    return
  }

  try {
    const memberData = buildMemberPayload()
    await familyAPI.updateMember(editingMemberId.value, memberData)
    showAddModal.value = false
    resetMemberForm()
    await loadFamilyMembers()
    alert('修改成功！')
  } catch (error) {
    console.error('修改成员失败:', error)
    alert('修改失败：' + (error.response?.data?.error || error.message))
  }
}

const submitMember = async () => {
  if (isEditing.value) {
    await updateMember()
    return
  }

  await addMember()
}

const viewMember = (member) => {
  console.log('查看成员:', member)
}

const editMember = (member) => {
  isEditing.value = true
  editingMemberId.value = member.id
  newMember.value = {
    name: member.name || '',
    relation: member.relation || '',
    age: member.age ? String(member.age) : '',
    gender: member.gender || '',
    avatarColor: member.avatarColor || '#3b82f6',
    healthScore: member.healthScore ? String(member.healthScore) : '',
    riskLevel: member.riskLevel || '低',
    heartRate: member.vitals?.heartRate ? String(member.vitals.heartRate) : '',
    bloodPressure: member.vitals?.bloodPressure && member.vitals.bloodPressure !== '0/0' ? member.vitals.bloodPressure : '',
    selectedRecordId: ''
  }
  formErrors.value = {}
  showAddModal.value = true
}

// 确认删除成员
const confirmDelete = (member) => {
  memberToDelete.value = member
  showDeleteConfirm.value = true
}

// 取消删除
const cancelDelete = () => {
  memberToDelete.value = null
  showDeleteConfirm.value = false
}

// 执行删除
const executeDelete = async () => {
  if (!memberToDelete.value) return
  
  deleting.value = true
  try {
    await familyAPI.deleteMember(memberToDelete.value.id)
    await loadFamilyMembers()
    showDeleteConfirm.value = false
    memberToDelete.value = null
    alert('删除成功！')
  } catch (error) {
    console.error('删除成员失败:', error)
    alert('删除失败：' + (error.response?.data?.error || error.message))
  } finally {
    deleting.value = false
  }
}

const acceptSuggestion = (suggestion) => {
  console.log('采纳建议:', suggestion)
}

onMounted(async () => {
  await Promise.all([loadFamilyMembers(), loadSavedCollectedRecords()])
})
</script>

<style scoped>
.page {
  padding: 20px;
  background: var(--bg-primary);
  min-height: 100vh;
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.text-action {
  background: transparent;
  border: none;
  color: #60a5fa;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
}

.text-action:hover {
  color: #93c5fd;
}

.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.42);
  z-index: 1200;
}

.collected-drawer {
  position: absolute;
  top: 0;
  right: 0;
  width: min(520px, 92vw);
  height: 100vh;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-left: 1px solid rgba(59, 130, 246, 0.18);
  box-shadow: -20px 0 40px rgba(2, 6, 23, 0.45);
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 22px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.drawer-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
}

.drawer-desc {
  margin: 8px 0 0;
  color: var(--text-tertiary);
  font-size: 13px;
  line-height: 1.6;
}

.drawer-toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 14px 22px 12px;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 22px 22px;
  scrollbar-width: thin;
  scrollbar-color: rgba(96, 165, 250, 0.7) rgba(15, 23, 42, 0.6);
}

.drawer-body::-webkit-scrollbar {
  width: 10px;
}

.drawer-body::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.55);
  border-radius: 999px;
}

.drawer-body::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(96, 165, 250, 0.9), rgba(59, 130, 246, 0.55));
  border-radius: 999px;
  border: 2px solid rgba(15, 23, 42, 0.65);
}

.modal-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.record-list {
  display: grid;
  gap: 12px;
}

.drawer-record-list {
  padding-right: 4px;
}

.record-option {
  width: 100%;
  text-align: left;
  background: rgba(15, 23, 42, 0.46);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.record-option:hover,
.record-option.active {
  border-color: rgba(59, 130, 246, 0.55);
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.record-option-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.record-option-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.record-source-tag {
  color: #93c5fd;
  font-size: 12px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.24);
  border-radius: 999px;
  padding: 4px 10px;
}

.no-records-text {
  text-align: center;
  color: var(--text-tertiary);
  padding: 24px 10px;
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

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-tertiary);
  font-size: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px dashed var(--border-color);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  color: var(--text-primary);
  font-size: 18px;
  margin-bottom: 8px;
}

.empty-hint {
  color: var(--text-tertiary);
  font-size: 14px;
}

.action-bar {
  margin-bottom: 24px;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.icon {
  font-size: 18px;
  font-weight: bold;
}

.family-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.member-card {
  background: var(--bg-card);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  transition: all 0.3s;
}

.member-card:hover {
  border-color: rgba(59, 130, 246, 0.4);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.member-header {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
  border-bottom: 1px solid var(--border-color);
}

.member-basic {
  flex: 1;
}

.member-name {
  color: var(--text-primary);
  font-size: 16px;
  margin: 0 0 4px 0;
}

.member-relation {
  color: var(--text-tertiary);
  font-size: 12px;
}

.member-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid var(--border-color);
  color: var(--text-tertiary);
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.icon-btn:hover {
  color: var(--accent-color);
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(59, 130, 246, 0.1);
}

.icon-btn.delete-btn:hover {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.1);
}

.member-body {
  padding: 16px;
}

.health-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.health-item {
  text-align: center;
  padding: 12px 8px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
}

.health-label {
  color: #94a3b8;
  font-size: 11px;
  margin-bottom: 6px;
}

.health-value {
  color: #f8fafc;
  font-size: 18px;
  font-weight: 600;
}

.health-value.excellent { color: #10b981; }
.health-value.good { color: #3b82f6; }
.health-value.fair { color: #f59e0b; }
.health-value.poor { color: #ef4444; }

.health-value.low { color: #10b981; }
.health-value.medium { color: #f59e0b; }
.health-value.high { color: #ef4444; }

.quick-stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
}

.stat-icon {
  font-size: 20px;
}

.stat-info {
  flex: 1;
}

.stat-label {
  color: #94a3b8;
  font-size: 11px;
  margin-bottom: 2px;
}

.stat-value {
  color: #f8fafc;
  font-size: 13px;
  font-weight: 600;
}

.member-footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f59e0b;
  font-size: 13px;
}

.alert-icon {
  font-size: 16px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #10b981;
  font-size: 13px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.care-suggestions {
  margin-top: 32px;
}

.section-title {
  color: #f8fafc;
  font-size: 18px;
  margin-bottom: 16px;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.suggestion-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  color: #f8fafc;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.suggestion-desc {
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.5;
}

.suggestion-action {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}

.suggestion-action:hover {
  background: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #1e293b;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
}

.modal-header h3 {
  color: #f8fafc;
  font-size: 18px;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #f8fafc;
}

.modal-body {
  padding: 20px;
}

.form-section {
  margin-bottom: 24px;
}

.section-subtitle {
  color: #3b82f6;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  color: #94a3b8;
  font-size: 13px;
  margin-bottom: 8px;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  color: #f8fafc;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-group input.error,
.form-group select.error {
  border-color: #ef4444;
}

.error-msg {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
  transition: all 0.3s;
  font-size: 18px;
  color: white;
  font-weight: bold;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: white;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid rgba(59, 130, 246, 0.2);
}

.btn-secondary {
  background: rgba(15, 23, 42, 0.8);
  color: #94a3b8;
  border: 1px solid rgba(59, 130, 246, 0.2);
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary:hover {
  border-color: rgba(59, 130, 246, 0.4);
  color: #f8fafc;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: 1px solid rgba(239, 68, 68, 0.5);
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  border-color: rgba(220, 38, 38, 0.5);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-modal {
  max-width: 450px;
}

.delete-warning {
  padding: 20px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  margin-bottom: 20px;
}

.delete-warning p {
  margin: 0;
  color: #f8fafc;
  font-size: 14px;
  line-height: 1.6;
}

.delete-warning strong {
  color: #ef4444;
}

.delete-hint {
  color: #94a3b8;
  font-size: 13px;
  margin-top: 16px;
  padding: 0 20px;
}

/* ===== 移动端 ===== */
@media(max-width:768px){
  .page{padding:12px;padding-bottom:72px}
  .page-title{font-size:18px}
  .family-grid{grid-template-columns:1fr;gap:14px}
  .member-card:hover{transform:none}
  .quick-stats{flex-direction:column;gap:8px}
  .stat-item{flex-direction:row}
  .health-overview{gap:8px}
  .health-value{font-size:15px}
  .suggestion-card{flex-wrap:wrap;gap:10px}
  .suggestion-action{width:100%}
  .modal{width:95%;max-width:unset}
  .form-row{grid-template-columns:1fr}
}
</style>
