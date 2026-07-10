<template>
  <div class="page">
    <h1 class="page-title">3D 数字孪生</h1>
    <p class="page-desc">人体健康状态三维可视化模型</p>

    <div class="twin-container">
      <!-- 3D 模型区域 -->
      <div class="canvas-wrapper" ref="canvasWrapper">
        <div class="model-controls">
          <button class="ctrl-btn" @click="resetCamera" title="重置视角">⟳</button>
          <button class="ctrl-btn" @click="toggleRotate" :class="{ active: autoRotate }" title="自动旋转">↻</button>
          <button class="ctrl-btn" @click="toggleWireframe" :class="{ active: wireframe }" title="线框模式">⬡</button>
        </div>
        <div class="loading-overlay" v-if="modelLoading">
          <div class="loading-spinner"></div>
          <div class="loading-text">加载人体模型中... {{ loadProgress }}%</div>
        </div>
        <div class="load-error" v-if="modelError">
          <div class="error-text">{{ modelError }}</div>
        </div>
        <canvas ref="threeCanvas"></canvas>
        <div
          v-for="marker in visibleMarkers"
          :key="marker.name"
          class="organ-marker"
          :style="{ left: marker.screenX + 'px', top: marker.screenY + 'px' }"
          :class="{ active: selectedOrgan && selectedOrgan.name === marker.name, [marker.healthLevel]: true }"
          @click="selectOrganByName(marker.name)"
        >
          <div class="marker-dot"></div>
          <div class="marker-label">{{ marker.name }}</div>
        </div>
      </div>

      <!-- 右侧信息面板 -->
      <div class="info-panel">
        <div class="panel-section list-section">
          <h3 class="panel-title">器官健康状态</h3>
          <div class="organ-list">
            <div
              v-for="organ in organs"
              :key="organ.name"
              class="organ-item"
              :class="{ active: selectedOrgan && selectedOrgan.name === organ.name }"
              @click="selectOrgan(organ)"
            >
              <div class="organ-icon" :style="{ backgroundColor: organ.color }">{{ organ.icon }}</div>
              <div class="organ-info">
                <div class="organ-name">{{ organ.name }}</div>
                <div class="organ-status">
                  <span class="status-indicator" :class="organ.healthLevel"></span>
                  {{ organ.healthStatus }}
                </div>
              </div>
              <div class="organ-value" :class="organ.healthLevel">{{ organ.health }}%</div>
            </div>
          </div>
        </div>

        <div class="panel-section detail-section">
          <h3 class="panel-title">📋 详细信息</h3>
          <div class="detail-card" v-if="selectedOrgan">
            <div class="detail-header">
              <span class="detail-icon">{{ selectedOrgan.icon }}</span>
              <span class="detail-name">{{ selectedOrgan.name }}</span>
              <span class="detail-score" :class="selectedOrgan.healthLevel">{{ selectedOrgan.health }}%</span>
            </div>
            <div class="detail-body">
              <div class="detail-row">
                <span class="label">状态</span>
                <span class="value">{{ selectedOrgan.description }}</span>
              </div>
              <div class="detail-row">
                <span class="label">建议</span>
                <span class="value suggestion">{{ selectedOrgan.suggestion }}</span>
              </div>
            </div>
            <div class="health-bar-wrap">
              <div class="health-bar-bg">
                <div class="health-bar-fill" :class="selectedOrgan.healthLevel" :style="{ width: selectedOrgan.health + '%' }"></div>
              </div>
            </div>
          </div>
          <div class="detail-empty" v-else>
            请选择左侧器官，查看详细健康状态与建议
          </div>
        </div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">整体健康指数</div>
        <div class="metric-value large">{{ overallHealth }}</div>
        <div class="metric-bar"><div class="metric-fill" :style="{ width: overallHealth + '%' }"></div></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">生理年龄</div>
        <div class="metric-value">{{ biologicalAge }}<span class="unit">岁</span></div>
        <div class="metric-sub">实际年龄：{{ chronologicalAge }}岁 · {{ twinGender }}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">健康趋势</div>
        <div class="metric-value trend positive">+2.3%</div>
        <div class="metric-sub">较上月提升</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">风险等级</div>
        <div class="metric-value low-risk">低</div>
        <div class="metric-sub">综合评估结果</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const threeCanvas = ref(null)
const canvasWrapper = ref(null)
const modelLoading = ref(true)
const modelError = ref('')
const loadProgress = ref(0)
const autoRotate = ref(true)
const wireframe = ref(false)
const visibleMarkers = ref([])
const selectedOrgan = ref(null)

const chronologicalAge = ref(35)
const biologicalAge = ref(32)
const twinGender = ref('男')
const activeModelPath = ref('/1.glb')

let scene, camera, renderer, controls, model, animationId
let modelLoadVersion = 0
let dashboardSyncTimer = null

const organs = ref([
  { name: '心脏', icon: '❤️', health: 92, color: '#ef4444', healthLevel: 'excellent', healthStatus: '优秀', position: new THREE.Vector3(0.03, 0.95, 0.05), description: '心率变异性良好，泵血功能正常', suggestion: '保持适量有氧运动，注意情绪管理' },
  { name: '肺部', icon: '🫁', health: 88, color: '#3b82f6', healthLevel: 'good', healthStatus: '良好', position: new THREE.Vector3(-0.05, 0.94, 0.03), description: '肺活量正常，气体交换效率高', suggestion: '继续保持良好的呼吸习惯，避免污染环境' },
  { name: '肝脏', icon: '🟤', health: 85, color: '#8b5cf6', healthLevel: 'good', healthStatus: '良好', position: new THREE.Vector3(-0.04, 0.87, 0.05), description: '代谢功能正常，解毒能力良好', suggestion: '减少酒精摄入，保持规律作息' },
  { name: '肾脏', icon: '🫘', health: 90, color: '#06b6d4', healthLevel: 'excellent', healthStatus: '优秀', position: new THREE.Vector3(-0.04, 0.78, 0.0), description: '过滤功能正常，电解质平衡', suggestion: '保持充足水分摄入，控制盐分' },
  { name: '大脑', icon: '🧠', health: 87, color: '#ec4899', healthLevel: 'good', healthStatus: '良好', position: new THREE.Vector3(0, 1.154, -0.004), description: '认知功能良好，神经反应敏捷', suggestion: '保证充足睡眠，适当进行脑力训练' },
  { name: '胃部', icon: '🟠', health: 78, color: '#f97316', healthLevel: 'fair', healthStatus: '一般', position: new THREE.Vector3(0.05, 0.87, 0.06), description: '消化功能基本正常，略有胃酸过多', suggestion: '规律饮食，避免辛辣刺激食物' }
])

// 统一把器官标注点往下微调一点（局部坐标系）。你觉得还不够/太多时，这个值可继续调整。
const organLocalYOffset = -0.08

const overallHealth = computed(() => {
  const sum = organs.value.reduce((acc, o) => acc + o.health, 0)
  return Math.round(sum / organs.value.length)
})

const selectOrgan = (organ) => { selectedOrgan.value = organ }
const selectOrganByName = (name) => {
  const organ = organs.value.find(o => o.name === name)
  if (organ) selectedOrgan.value = organ
}

const initThree = () => {
  const wrapper = canvasWrapper.value
  const w = wrapper.clientWidth
  const h = Math.max(wrapper.clientHeight, 480)

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0d1b2a)
  scene.fog = new THREE.FogExp2(0x0d1b2a, 0.06)

  camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100)
  camera.position.set(0, 1.5, 3.5)

  renderer = new THREE.WebGLRenderer({ canvas: threeCanvas.value, antialias: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2

  scene.add(new THREE.AmbientLight(0x8ab4f8, 0.8))
  const dir = new THREE.DirectionalLight(0xffffff, 1.5)
  dir.position.set(2, 4, 3)
  dir.castShadow = true
  scene.add(dir)
  const rim = new THREE.DirectionalLight(0x3b82f6, 1.0)
  rim.position.set(-3, 2, -2)
  scene.add(rim)
  const fill = new THREE.PointLight(0xec4899, 0.5, 10)
  fill.position.set(0, 3, -2)
  scene.add(fill)

  const grid = new THREE.GridHelper(6, 20, 0x1e3a5f, 0x1e3a5f)
  scene.add(grid)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 1
  controls.maxDistance = 8
  controls.target.set(0, 1.2, 0)
  controls.autoRotate = true
  controls.autoRotateSpeed = 1.5
  controls.update()

  loadModel()

  const loop = () => {
    animationId = requestAnimationFrame(loop)
    controls.update()
    updateMarkers()
    renderer.render(scene, camera)
  }
  loop()
}

const loadModel = (modelPath = activeModelPath.value) => {
  const currentVersion = ++modelLoadVersion
  modelLoading.value = true
  modelError.value = ''
  loadProgress.value = 0
  if (model) {
    scene.remove(model)
    model.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose?.()
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose?.())
        else child.material?.dispose?.()
      }
    })
    model = null
  }
  const loader = new GLTFLoader()
  loader.load(
    modelPath,
    (gltf) => {
      if (currentVersion !== modelLoadVersion) return
      model = gltf.scene
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const scale = 2.8 / Math.max(size.x, size.y, size.z)
      model.scale.setScalar(scale)
      model.position.sub(center.multiplyScalar(scale))
      model.position.y += 1.4
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      scene.add(model)
      modelLoading.value = false
      camera.position.set(0, 1.6, 3.5)
      controls.target.set(0, 1.4, 0)
      controls.update()
    },
    (xhr) => {
      if (currentVersion !== modelLoadVersion) return
      if (xhr.total > 0) loadProgress.value = Math.round(xhr.loaded / xhr.total * 100)
    },
    (err) => {
      if (currentVersion !== modelLoadVersion) return
      console.error('GLB 加载失败:', err)
      modelError.value = '3D模型加载失败，已切换为备用渲染'
      modelLoading.value = false
      createFallback()
    }
  )
}

const createFallback = () => {
  const mat = new THREE.MeshPhongMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
  const parts = [
    [new THREE.SphereGeometry(0.18, 32, 32), [0, 1.78, 0]],
    [new THREE.CylinderGeometry(0.28, 0.22, 0.8, 32), [0, 1.3, 0]],
    [new THREE.CylinderGeometry(0.22, 0.18, 0.3, 32), [0, 0.85, 0]],
    [new THREE.CylinderGeometry(0.08, 0.07, 0.7, 16), [-0.12, 0.35, 0]],
    [new THREE.CylinderGeometry(0.08, 0.07, 0.7, 16), [0.12, 0.35, 0]],
  ]
  parts.forEach(([geo, pos]) => {
    const mesh = new THREE.Mesh(geo, mat.clone())
    mesh.position.set(...pos)
    scene.add(mesh)
  })
}

const updateMarkers = () => {
  if (!camera || !canvasWrapper.value) return
  const w = canvasWrapper.value.clientWidth
  const h = canvasWrapper.value.clientHeight
  const markers = []
  if (model) model.updateMatrixWorld(true)
  organs.value.forEach(organ => {
    // organ.position 为“模型局部坐标”，需要跟随模型缩放/平移后再投影到屏幕坐标
    const pos = organ.position.clone()
    pos.y += organLocalYOffset
    if (model) pos.applyMatrix4(model.matrixWorld)
    const projected = pos.project(camera)
    const x = (projected.x * 0.5 + 0.5) * w
    const y = (-projected.y * 0.5 + 0.5) * h
    // Three.js NDC 的 z 理论范围是 [-1, 1]
    if (projected.z >= -1 && projected.z <= 1 && x > 0 && x < w && y > 0 && y < h) {
      markers.push({ name: organ.name, healthLevel: organ.healthLevel, screenX: x, screenY: y })
    }
  })
  visibleMarkers.value = markers
}

const resetCamera = () => {
  camera.position.set(0, 1.5, 3.5)
  controls.target.set(0, 1.2, 0)
  controls.update()
}

const toggleRotate = () => {
  autoRotate.value = !autoRotate.value
  controls.autoRotate = autoRotate.value
}

const toggleWireframe = () => {
  wireframe.value = !wireframe.value
  if (model) {
    model.traverse(child => {
      if (child.isMesh && child.material) {
        child.material.wireframe = wireframe.value
      }
    })
  }
}

const syncTwinFromDashboardProfile = () => {
  const genderCache = localStorage.getItem('dashboard_gender')
  const ageCache = Number(localStorage.getItem('dashboard_age') || 0)

  const nextGender = genderCache === '女' ? '女' : '男'
  twinGender.value = nextGender
  if (ageCache > 0) {
    chronologicalAge.value = ageCache
    biologicalAge.value = Math.max(1, ageCache - 2)
  }

  const nextModel = nextGender === '女' ? '/2.glb' : '/1.glb'
  if (nextModel !== activeModelPath.value) {
    activeModelPath.value = nextModel
    loadModel(nextModel)
  }
}

const onDashboardProfileUpdated = (event) => {
  const detail = event?.detail || {}
  const nextGender = detail.gender === '女' ? '女' : '男'
  const nextAge = Number(detail.age || 0)

  localStorage.setItem('dashboard_gender', nextGender)
  if (nextAge > 0) localStorage.setItem('dashboard_age', String(nextAge))

  syncTwinFromDashboardProfile()
}

const onResize = () => {
  if (!canvasWrapper.value || !renderer) return
  const w = canvasWrapper.value.clientWidth
  const h = canvasWrapper.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

onMounted(() => {
  initThree()
  syncTwinFromDashboardProfile()
  dashboardSyncTimer = setInterval(syncTwinFromDashboardProfile, 5000)
  window.addEventListener('dashboard-profile-updated', onDashboardProfileUpdated)
  window.addEventListener('storage', syncTwinFromDashboardProfile)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  if (dashboardSyncTimer) clearInterval(dashboardSyncTimer)
  window.removeEventListener('dashboard-profile-updated', onDashboardProfileUpdated)
  window.removeEventListener('storage', syncTwinFromDashboardProfile)
  window.removeEventListener('resize', onResize)
  renderer && renderer.dispose()
})
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

.twin-container {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  height: 520px;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  background: #0d1b2a;
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.25);
  overflow: hidden;
}

canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

.model-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}

.ctrl-btn {
  width: 36px;
  height: 36px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  backdrop-filter: blur(8px);
}

.ctrl-btn:hover, .ctrl-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.6);
  color: #3b82f6;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(13, 27, 42, 0.85);
  z-index: 20;
  gap: 16px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.loading-text {
  color: #94a3b8;
  font-size: 14px;
}

.load-error {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  z-index: 10;
}

.error-text {
  color: #fca5a5;
  font-size: 12px;
}

/* 器官标注 */
.organ-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 15;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  pointer-events: auto;
}

.marker-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
  background: #94a3b8;
  transition: all 0.2s;
  animation: markerPulse 2s infinite;
}

.organ-marker.excellent .marker-dot { background: #10b981; box-shadow: 0 0 8px #10b981; }
.organ-marker.good .marker-dot { background: #3b82f6; box-shadow: 0 0 8px #3b82f6; }
.organ-marker.fair .marker-dot { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
.organ-marker.poor .marker-dot { background: #ef4444; box-shadow: 0 0 8px #ef4444; }

.organ-marker.active .marker-dot {
  transform: scale(1.6);
}

@keyframes markerPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.marker-label {
  background: rgba(13, 27, 42, 0.9);
  color: #f8fafc;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  border: 1px solid rgba(59, 130, 246, 0.3);
  backdrop-filter: blur(4px);
  pointer-events: none;
}

/* 右侧面板 */
.info-panel {
  width: 320px;
  height: 100%;
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 16px;
  overflow: hidden;
}

.list-section,
.detail-section {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.panel-section {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.panel-title {
  color: var(--text-primary);
  font-size: 15px;
  margin: 0 0 12px 0;
  font-weight: 600;
}

.organ-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  min-height: 0;
  padding-right: 4px;
}

.organ-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s;
  border: 1px solid transparent;
}

.organ-item:hover { background: rgba(59, 130, 246, 0.08); border-color: rgba(59, 130, 246, 0.2); }
.organ-item.active { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.4); }

.organ-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.organ-info { flex: 1; }

.organ-name {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 3px;
}

.organ-status {
  color: var(--text-tertiary);
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator.excellent { background: #10b981; }
.status-indicator.good { background: #3b82f6; }
.status-indicator.fair { background: #f59e0b; }
.status-indicator.poor { background: #ef4444; }

.organ-value { font-size: 15px; font-weight: 700; }
.organ-value.excellent { color: #10b981; }
.organ-value.good { color: #3b82f6; }
.organ-value.fair { color: #f59e0b; }
.organ-value.poor { color: #ef4444; }

/* 详情卡片 */
.detail-card {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 10px;
  overflow: hidden;
}

.detail-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
  background: rgba(15, 23, 42, 0.35);
  border: 1px dashed rgba(59, 130, 246, 0.25);
  border-radius: 10px;
  padding: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(59, 130, 246, 0.1);
  border-bottom: 1px solid rgba(59, 130, 246, 0.15);
}

.detail-icon { font-size: 20px; }
.detail-name { flex: 1; color: var(--text-primary); font-size: 15px; font-weight: 600; }
.detail-score { font-size: 18px; font-weight: 700; }
.detail-score.excellent { color: #10b981; }
.detail-score.good { color: #3b82f6; }
.detail-score.fair { color: #f59e0b; }
.detail-score.poor { color: #ef4444; }

.detail-body { padding: 12px; display: flex; flex-direction: column; gap: 10px; }

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-row .label {
  color: var(--text-tertiary);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-row .value {
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.5;
}

.detail-row .value.suggestion { color: var(--text-secondary); }

.health-bar-wrap { padding: 0 12px 12px; }

.health-bar-bg {
  height: 6px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 3px;
  overflow: hidden;
}

.health-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.health-bar-fill.excellent { background: linear-gradient(90deg, #10b981, #34d399); }
.health-bar-fill.good { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.health-bar-fill.fair { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.health-bar-fill.poor { background: linear-gradient(90deg, #ef4444, #f87171); }

/* 底部指标 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.metric-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.metric-label { color: var(--text-tertiary); font-size: 12px; margin-bottom: 8px; }

.metric-value {
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.metric-value.large { font-size: 36px; }
.metric-value.trend.positive { color: #10b981; }
.metric-value.low-risk { color: #10b981; }
.unit { font-size: 14px; font-weight: 400; margin-left: 2px; }
.metric-sub { color: #64748b; font-size: 11px; }

.metric-bar {
  height: 6px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
}

.metric-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* ===== 移动端响应式 ===== */
@media (max-width: 768px) {
  .page {
    padding: 12px;
  }

  .page-title {
    font-size: 18px;
    margin-bottom: 4px;
  }

  .page-desc {
    font-size: 12px;
    margin-bottom: 14px;
  }

  .twin-container {
    flex-direction: column;
    height: auto;
    gap: 12px;
  }

  .canvas-wrapper {
    height: 320px;
    flex: none;
  }

  .info-panel {
    width: 100%;
    max-height: none;
    grid-template-rows: auto auto;
    gap: 12px;
    overflow: visible;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .metric-card {
    padding: 12px;
  }

  .metric-value {
    font-size: 20px;
  }

  .metric-value.large {
    font-size: 28px;
  }

  .organ-item {
    padding: 8px;
  }

  .organ-icon {
    width: 30px;
    height: 30px;
    font-size: 15px;
  }

  .panel-section {
    padding: 12px;
  }

  .organ-list {
    max-height: 200px;
  }
}

@media (max-width: 400px) {
  .canvas-wrapper {
    height: 260px;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .metric-value.large {
    font-size: 24px;
  }
}
</style>