<template>
  <div class="main-layout">
    <Sidebar />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <div class="ai-doctor-wrap" :style="wrapStyle">
      <transition name="ai-pop">
        <div v-if="panelOpen" class="ai-doctor-panel" :style="panelStyle">
          <div class="panel-header">
            <span>AI 医生</span>
            <div class="panel-actions">
              <button class="panel-link" @click="goKnowledgeGraph">知识图谱</button>
              <button class="panel-close" @click="panelOpen = false">×</button>
            </div>
          </div>

          <div class="panel-body">
            <div
              v-for="(m, idx) in messages"
              :key="idx"
              class="panel-msg"
              :class="m.role"
            >
              <div class="msg-text">{{ m.text }}</div>
              <div v-if="m.knowledge && m.knowledge.length" class="msg-knowledge">
                图谱命中：{{ m.knowledge.join(' · ') }}
              </div>
            </div>
          </div>

          <div class="panel-footer">
            <input
              v-model="question"
              class="panel-input"
              placeholder="请输入症状/疾病问题..."
              @keydown.enter="askDoctor"
            />
            <button class="panel-send" @click="askDoctor" :disabled="sending">{{ sending ? '发送中...' : '发送' }}</button>
          </div>
        </div>
      </transition>

      <button
        class="ai-doctor-ball"
        @mousedown="startDrag"
        @touchstart.prevent="startDrag"
        @click="togglePanel"
        title="AI医生"
      >
        <span class="pulse"></span>
        <span class="medical-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 7V17" />
            <path d="M7 12H17" />
          </svg>
        </span>
        <span v-if="unreadCount > 0" class="ball-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'
import { doctorAPI } from '../services/api'

const router = useRouter()
const panelOpen = ref(false)
const question = ref('')
const messages = ref([
  {
    role: 'bot',
    text: '您好，我是AI医生',
    knowledge: ['高血压', '糖尿病', '脑卒中']
  }
])
const unreadCount = ref(1)
const sending = ref(false)

const pos = ref({ x: null, y: null })
const dragState = ref({
  active: false,
  moved: false,
  startClientX: 0,
  startClientY: 0,
  baseX: 0,
  baseY: 0
})

const wrapStyle = computed(() => {
  if (pos.value.x === null || pos.value.y === null) return {}
  return {
    left: `${pos.value.x}px`,
    top: `${pos.value.y}px`,
    right: 'auto',
    bottom: 'auto'
  }
})

const panelStyle = computed(() => {
  if (pos.value.x === null || pos.value.y === null) return {}

  const ballSize = 58
  const panelWidth = 336
  const panelHeight = 330
  const gap = 5
  const margin = 8

  const rightRoom = window.innerWidth - (pos.value.x + ballSize)
  const leftRoom = pos.value.x
  const downRoom = window.innerHeight - (pos.value.y + ballSize)
  const upRoom = pos.value.y

  const openToLeft = rightRoom < panelWidth && leftRoom > rightRoom
  const openDown = upRoom < panelHeight && downRoom > upRoom

  let left = openToLeft ? -(panelWidth - ballSize) : 0
  let top = openDown ? (ballSize + gap) : -(panelHeight + gap)

  // 只做轻量纠偏，尽量保持贴近浮球
  const minLeft = margin - pos.value.x
  const maxLeft = window.innerWidth - margin - panelWidth - pos.value.x
  left = Math.min(maxLeft, Math.max(minLeft, left))

  const minTop = margin - pos.value.y
  const maxTop = window.innerHeight - margin - panelHeight - pos.value.y
  top = Math.min(maxTop, Math.max(minTop, top))

  return {
    left: `${left}px`,
    top: `${top}px`,
    right: 'auto',
    bottom: 'auto',
    marginBottom: '0'
  }
})

function clampPosition(x, y) {
  const ballSize = 58
  const margin = 8
  const maxX = Math.max(margin, window.innerWidth - ballSize - margin)
  const maxY = Math.max(margin, window.innerHeight - ballSize - margin)
  return {
    x: Math.min(maxX, Math.max(margin, x)),
    y: Math.min(maxY, Math.max(margin, y))
  }
}

function startDrag(e) {
  const p = e.touches?.[0] || e
  const currentX = pos.value.x ?? (window.innerWidth - 22 - 58)
  const currentY = pos.value.y ?? (window.innerHeight - 24 - 58)

  dragState.value = {
    active: true,
    moved: false,
    startClientX: p.clientX,
    startClientY: p.clientY,
    baseX: currentX,
    baseY: currentY
  }
}

function onDragMove(e) {
  if (!dragState.value.active) return
  e.preventDefault?.()
  const p = e.touches?.[0] || e
  const offsetX = p.clientX - dragState.value.startClientX
  const offsetY = p.clientY - dragState.value.startClientY
  const next = clampPosition(dragState.value.baseX + offsetX, dragState.value.baseY + offsetY)
  pos.value = next
  if (!dragState.value.moved) {
    dragState.value.moved = Math.abs(offsetX) > 4 || Math.abs(offsetY) > 4
  }
}

function endDrag() {
  if (!dragState.value.active) return
  dragState.value.active = false
  setTimeout(() => {
    dragState.value.moved = false
  }, 0)
}

function togglePanel() {
  if (dragState.value.moved) return
  panelOpen.value = !panelOpen.value
  if (panelOpen.value) unreadCount.value = 0
}

function goKnowledgeGraph() {
  router.push('/knowledge-graph')
  panelOpen.value = false
}

function fallbackReply(q) {
  if (q.includes('头晕') || q.includes('血压')) {
    return '建议先监测血压并记录波动；若伴随胸痛、言语不清或肢体无力，请立即就医。'
  }
  if (q.includes('血糖') || q.includes('糖尿病')) {
    return '建议关注空腹/餐后血糖和HbA1c，饮食与运动联合管理，并按医嘱复诊。'
  }
  if (q.includes('胸闷') || q.includes('胸痛')) {
    return '胸闷胸痛需优先排除心血管急症，如持续超过10分钟或伴出汗恶心，请立即急诊。'
  }
  return '已收到。建议结合病史、用药和近期检查综合判断；如症状持续或加重，请线下就医评估。'
}

async function askDoctor() {
  const q = question.value.trim()
  if (!q || sending.value) return

  messages.value.push({ role: 'user', text: q })
  question.value = ''
  sending.value = true

  try {
    const { data } = await doctorAPI.consult({ question: q })
    const finalAnswer = data?.mita?.answer || data?.answer || fallbackReply(q)
    messages.value.push({
      role: 'bot',
      text: finalAnswer,
      knowledge: data?.knowledgeHits || []
    })
  } catch (error) {
    messages.value.push({
      role: 'bot',
      text: fallbackReply(q)
    })
  } finally {
    sending.value = false
    if (!panelOpen.value) unreadCount.value += 1
  }
}

onMounted(() => {
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', endDrag)
  window.addEventListener('touchmove', onDragMove, { passive: false })
  window.addEventListener('touchend', endDrag)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', endDrag)
  window.removeEventListener('touchmove', onDragMove)
  window.removeEventListener('touchend', endDrag)
})
</script>

<style scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
  transition: background-color 0.3s ease;
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow: auto;
  background: var(--bg-primary);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.ai-doctor-wrap {
  position: fixed;
  right: 22px;
  bottom: 24px;
  z-index: 1000;
}

.ai-doctor-ball {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: 1px solid rgba(16, 185, 129, 0.8);
  background: radial-gradient(circle at 34% 28%, #99f6e4 0%, #10b981 45%, #047857 100%);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 14px 34px rgba(4, 120, 87, 0.45);
  position: relative;
}

.medical-icon {
  width: 28px;
  height: 28px;
  z-index: 1;
}

.medical-icon svg {
  width: 100%;
  height: 100%;
  stroke: #ecfdf5;
  stroke-width: 1.8;
}

.ball-badge {
  position: absolute;
  right: -2px;
  top: -2px;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #dc2626;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  padding: 0 5px;
  border: 2px solid #022c22;
  text-align: center;
  z-index: 2;
}

.pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid rgba(52, 211, 153, 0.7);
  animation: pulse 1.8s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.85; }
  100% { transform: scale(1.5); opacity: 0; }
}

.ai-doctor-panel {
  position: absolute;
  width: 336px;
  margin-bottom: 14px;
  border-radius: 14px;
  border: 1px solid rgba(16, 185, 129, 0.35);
  background: rgba(2, 44, 34, 0.94);
  backdrop-filter: blur(8px);
  overflow: hidden;
  box-shadow: 0 16px 36px rgba(2, 44, 34, 0.52);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  color: #d1fae5;
  font-size: 13px;
  font-weight: 700;
  border-bottom: 1px solid rgba(16, 185, 129, 0.28);
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-link {
  border: 1px solid rgba(110, 231, 183, 0.4);
  background: rgba(16, 185, 129, 0.18);
  color: #d1fae5;
  border-radius: 999px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 11px;
}

.panel-close {
  border: none;
  background: transparent;
  color: #6ee7b7;
  cursor: pointer;
  font-size: 18px;
}

.panel-body {
  padding: 12px;
  max-height: 240px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-msg {
  font-size: 12px;
  line-height: 1.5;
  border-radius: 10px;
  padding: 8px 10px;
}

.panel-msg.bot {
  color: #ecfdf5;
  background: rgba(6, 95, 70, 0.45);
}

.panel-msg.user {
  color: #ecfeff;
  background: rgba(15, 118, 110, 0.55);
  align-self: flex-end;
}

.msg-knowledge {
  margin-top: 6px;
  color: #a7f3d0;
  font-size: 11px;
}

.panel-footer {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid rgba(16, 185, 129, 0.25);
}

.panel-input {
  flex: 1;
  border-radius: 8px;
  border: 1px solid rgba(110, 231, 183, 0.4);
  background: rgba(2, 44, 34, 0.82);
  color: #f0fdfa;
  padding: 8px 10px;
  font-size: 12px;
  outline: none;
}

.panel-send {
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #059669, #10b981);
  color: #ecfdf5;
  font-size: 12px;
  padding: 0 12px;
  cursor: pointer;
}
.panel-send:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ai-pop-enter-active,
.ai-pop-leave-active {
  transition: all 0.18s ease;
}
.ai-pop-enter-from,
.ai-pop-leave-to {
  transform: translateY(8px);
  opacity: 0;
}

@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
  }

  .main-content {
    padding: 12px;
    padding-bottom: 72px;
  }

  .ai-doctor-wrap {
    right: 14px;
    bottom: 78px;
  }

  .ai-doctor-panel {
    width: min(90vw, 336px);
  }
}
</style>
