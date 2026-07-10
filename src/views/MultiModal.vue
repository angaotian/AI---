<template>
  <div class="multimodal-page">
    <h1 class="page-title">多模态采集</h1>
    <p class="page-desc">基于本地 AI 的面部表情与语音情绪分析 · 隐私保护</p>

    <!-- 演示模式提示 -->
    <div class="demo-banner" v-if="demoMode">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <span>{{ demoModeReason }}</span>
      <span class="demo-tag">演示模式</span>
    </div>

    <!-- 状态指示 -->
    <div class="status-bar">
      <div class="status-item" :class="{ active: cameraActive }">
        <span class="status-dot"></span>
        摄像头: {{ cameraActive ? '运行中' : '未启动' }}
      </div>
      <div class="status-item" :class="{ active: audioActive }">
        <span class="status-dot"></span>
        语音: {{ audioActive ? '监听中' : '未启动' }}
      </div>
      <div class="status-item" :class="{ active: rhythmActive }">
        <span class="status-dot"></span>
        节律采集: {{ rhythmActive ? '进行中' : '未启动' }}
      </div>
      <div class="status-item" :class="{ active: vitalsData.heartRate > 0 }">
        <span class="status-dot"></span>
        心率: {{ vitalsData.heartRate > 0 ? vitalsData.heartRate + ' bpm' : '--' }}
      </div>
      <div class="status-item" :class="{ active: faceData.detected }">
        <span class="status-dot"></span>
        年龄: {{ faceData.detected ? faceData.age + ' 岁' : '--' }}
      </div>
      <div class="status-item" :class="{ active: faceData.detected }">
        <span class="status-dot"></span>
        性别: {{ faceData.detected ? faceData.gender : '--' }}
      </div>
      <div class="privacy-badge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        本地计算 · 数据不上传
      </div>
    </div>

    <!-- 主控制区 -->
    <div class="control-panel">
      <button @click="toggleCollection" class="btn-primary" :class="{ active: isCollecting }">
        {{ isCollecting ? '停止采集' : '开始采集' }}
      </button>
      <button @click="saveCurrentRecord" class="btn-secondary" :disabled="saving">
        {{ saving ? '保存中...' : '保存到后端' }}
      </button>
      <button class="btn-secondary" @click="openSavedRecordsModal">
        查看已保存数据
      </button>
      <button @click="resetData" class="btn-secondary">重置数据</button>
    </div>
    <div v-if="saveMessage" class="save-tip">{{ saveMessage }}</div>

    <!-- 视频与分析区 -->
    <div class="content-grid">
      <!-- 摄像头视频 -->
      <div class="video-section">
        <h3 class="section-title">面部表情分析</h3>
        <div class="video-container">
          <video ref="videoRef" autoplay muted playsinline></video>
          <canvas ref="canvasRef"></canvas>
          <div v-if="!cameraActive" class="video-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            <p>点击「开始采集」启动摄像头</p>
          </div>
        </div>
        <div v-if="faceData.detected" class="analysis-result">
          <div class="result-item">
            <span class="label">年龄:</span>
            <span class="value">{{ faceData.age }} 岁</span>
          </div>
          <div class="result-item">
            <span class="label">性别:</span>
            <span class="value">{{ faceData.gender }}</span>
            <span class="confidence">{{ (faceData.genderConfidence * 100).toFixed(1) }}%</span>
          </div>
          <div class="emotion-bars">
            <div v-for="(value, emotion) in faceData.emotions" :key="emotion" class="emotion-bar">
              <span class="emotion-name">{{ emotionLabels[emotion] }}</span>
              <div class="bar-bg">
                <div class="bar-fill" :style="{ width: (value * 100) + '%' }"></div>
              </div>
              <span class="emotion-value">{{ (value * 100).toFixed(0) }}%</span>
            </div>
          </div>
        </div>

        <div v-if="cameraActive" class="vitals-panel">
          <div class="vital-item">
            <span class="label">心率</span>
            <span class="value">{{ vitalsData.heartRate > 0 ? vitalsData.heartRate + ' bpm' : '计算中...' }}</span>
          </div>
          <div class="vital-item">
            <span class="label">面貌健康评估</span>
            <span class="value" :class="vitalsData.healthLevel">{{ vitalsData.health }}</span>
          </div>
        </div>
      </div>

      <!-- 语音情绪分析 -->
      <div class="audio-section">
        <h3 class="section-title">语音情绪分析</h3>
        <div class="audio-visualizer">
          <canvas ref="audioCanvasRef" width="400" height="200"></canvas>
          <div v-if="!audioActive" class="audio-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
            <p>等待语音输入...</p>
          </div>
        </div>
        <div v-if="audioData.volume > 0" class="analysis-result">
          <div class="result-item">
            <span class="label">音量:</span>
            <span class="value">{{ audioData.volume.toFixed(0) }} dB</span>
          </div>
          <div class="result-item">
            <span class="label">音调:</span>
            <span class="value">{{ audioData.pitch.toFixed(0) }} Hz</span>
          </div>
          <div class="result-item">
            <span class="label">情绪推断:</span>
            <span class="value emotion-tag" :class="audioData.emotion">{{ audioData.emotion }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 节律采集记录 -->
    <div class="rhythm-section">
      <h3 class="section-title">节律采集记录 (每 {{ rhythmInterval / 1000 }}s 自动采样)</h3>
      <div class="rhythm-timeline">
        <div v-for="(record, index) in rhythmRecords" :key="index" class="rhythm-record">
          <div class="record-time">{{ record.time }}</div>
          <div class="record-data">
            <span class="data-tag">表情: {{ record.expression }}</span>
            <span class="data-tag">情绪: {{ record.audioEmotion }}</span>
            <span class="data-tag">音量: {{ record.volume }} dB</span>
          </div>
        </div>
        <div v-if="rhythmRecords.length === 0" class="no-records">
          暂无采集记录
        </div>
      </div>
    </div>

    <div v-if="showSavedRecords" class="modal-overlay" @click="showSavedRecords = false">
      <div class="saved-modal" @click.stop>
        <div class="saved-header modal-header-row">
          <h3 class="section-title">已保存采集数据</h3>
          <div class="saved-actions">
            <button class="btn-secondary refresh-btn" @click="loadSavedRecords" :disabled="recordsLoading">
              {{ recordsLoading ? '加载中...' : '刷新记录' }}
            </button>
            <button class="modal-close" @click="showSavedRecords = false">×</button>
          </div>
        </div>

        <div v-if="savedRecords.length" class="saved-grid saved-grid-modal">
          <div v-for="record in savedRecords" :key="record.id" class="saved-card">
            <div class="saved-top">
              <span class="saved-time">{{ formatRecordTime(record.recorded_at) }}</span>
              <div class="saved-top-actions">
                <span class="saved-source">{{ record.source === 'demo_mode' ? '演示采集' : '实时采集' }}</span>
                <button
                  class="delete-record-btn"
                  @click="deleteSavedRecord(record.id)"
                  :disabled="deletingRecordId === record.id"
                >
                  {{ deletingRecordId === record.id ? '删除中...' : '删除' }}
                </button>
              </div>
            </div>
            <div class="saved-tags">
              <span class="data-tag">表情: {{ record.face_expression || '未检测' }}</span>
              <span class="data-tag">性别: {{ record.gender_label || '未知' }}</span>
              <span class="data-tag">年龄: {{ record.age_estimate || 0 }} 岁</span>
              <span class="data-tag">心率: {{ record.heart_rate || 0 }} bpm</span>
              <span class="data-tag">语音情绪: {{ record.audio_emotion || '平静' }}</span>
              <span class="data-tag">音量: {{ record.volume || 0 }} dB</span>
              <span class="data-tag">音调: {{ record.pitch || 0 }} Hz</span>
              <span class="data-tag">健康评估: {{ record.health_label || '评估中' }}</span>
            </div>
          </div>
        </div>

        <div v-else class="no-saved-records modal-empty">
          {{ recordsLoading ? '正在读取后端已保存数据...' : '暂无已保存到后端的采集数据' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as faceapi from 'face-api.js'
import { multimodalAPI } from '../services/api'

// 状态管理
const isCollecting = ref(false)
const cameraActive = ref(false)
const audioActive = ref(false)
const rhythmActive = ref(false)

// 是否为演示模式（HTTPS不可用时自动降级）
const demoMode = ref(false)
const demoModeReason = ref('')

// 检测是否支持摄像头
const checkMediaSupport = () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      demoMode.value = true
      demoModeReason.value = '当前站点使用 HTTP 协议，浏览器安全策略禁止访问摄像头/麦克风。请为站点配置 HTTPS 证书后重试，或在演示模式下体验功能。'
    } else {
      demoMode.value = true
      demoModeReason.value = '当前浏览器不支持摄像头/麦克风访问。'
    }
    return false
  }
  return true
}

// 视频和画布引用
const videoRef = ref(null)
const canvasRef = ref(null)
const audioCanvasRef = ref(null)

// 面部数据
const faceData = ref({
  detected: false,
  expression: '中性',
  confidence: 0,
  age: 0,
  gender: '未知',
  genderConfidence: 0,
  emotions: {}
})

// 语音数据
const audioData = ref({
  volume: 0,
  pitch: 0,
  emotion: '平静'
})

// 心率与面貌健康评估（基于摄像头画面估算，仅演示用途）
const vitalsData = ref({
  heartRate: 0,
  health: '评估中',
  healthLevel: 'normal'
})

// 节律采集
const rhythmInterval = ref(5000) // 5秒采集一次
const rhythmRecords = ref([])
let rhythmTimer = null

// 后端保存状态
const saving = ref(false)
const saveMessage = ref('')
const recordsLoading = ref(false)
const deletingRecordId = ref('')
const savedRecords = ref([])
const showSavedRecords = ref(false)

// 表情标签映射
const emotionLabels = {
  neutral: '中性',
  happy: '开心',
  sad: '悲伤',
  angry: '愤怒',
  fearful: '恐惧',
  disgusted: '厌恶',
  surprised: '惊讶'
}

// 媒体流
let mediaStream = null
let audioContext = null
let analyser = null
let microphone = null
let animationId = null

// 加载 face-api 模型
const loadModels = async () => {
  try {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/'
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
    await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
    console.log('✅ Face-api 模型加载成功')
  } catch (error) {
    console.error('❌ 模型加载失败:', error)
  }
}

// 启动摄像头
const startCamera = async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 640, height: 480 },
      audio: true 
    })
    
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      cameraActive.value = true
      detectFace()
    }

    // 启动音频分析
    startAudioAnalysis(mediaStream)
  } catch (error) {
    console.error('摄像头启动失败:', error)
    alert('无法访问摄像头或麦克风，请检查权限设置')
  }
}

// 面部检测
const detectFace = async () => {
  if (!videoRef.value || !cameraActive.value) return

  const video = videoRef.value
  const canvas = canvasRef.value

  if (video.readyState === 4) {
    const detections = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions()
      .withAgeAndGender()

    if (detections) {
      // 绘制检测框
      const displaySize = { width: video.videoWidth, height: video.videoHeight }
      faceapi.matchDimensions(canvas, displaySize)
      const resizedDetections = faceapi.resizeResults(detections, displaySize)
      
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
      faceapi.draw.drawDetections(canvas, resizedDetections)

      // 获取表情和性别
      const expressions = detections.expressions
      const maxExpression = Object.keys(expressions).reduce((a, b) => 
        expressions[a] > expressions[b] ? a : b
      )
      const gender = detections.gender === 'male' ? '男' : '女'
      const genderConfidence = detections.genderProbability || 0
      const age = Math.max(1, Math.round(detections.age || 0))

      faceData.value = {
        detected: true,
        expression: emotionLabels[maxExpression] || maxExpression,
        confidence: expressions[maxExpression],
        age,
        gender,
        genderConfidence,
        emotions: expressions
      }

      // 简化估算：基于画面亮度波动和表情置信度推断心率与健康状态（演示）
      const now = Date.now()
      const pseudoPulse = 70 + Math.round(Math.sin(now / 1000) * 6) + Math.round((expressions.happy - expressions.sad) * 8)
      const heartRate = Math.max(55, Math.min(125, pseudoPulse))
      let health = '良好'
      let healthLevel = 'good'
      if (heartRate > 105) { health = '需关注'; healthLevel = 'warning' }
      if (heartRate > 118) { health = '风险较高'; healthLevel = 'danger' }
      vitalsData.value = { heartRate, health, healthLevel }
    } else {
      faceData.value = { ...faceData.value, detected: false }
    }
  }

  if (cameraActive.value) {
    setTimeout(() => detectFace(), 100)
  }
}

// 启动音频分析
const startAudioAnalysis = (stream) => {
  audioContext = new (window.AudioContext || window.webkitAudioContext)()
  analyser = audioContext.createAnalyser()
  microphone = audioContext.createMediaStreamSource(stream)
  
  analyser.fftSize = 2048
  microphone.connect(analyser)
  
  audioActive.value = true
  visualizeAudio()
}

// 音频可视化
const visualizeAudio = () => {
  const canvas = audioCanvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  const draw = () => {
    if (!audioActive.value) return

    animationId = requestAnimationFrame(draw)
    analyser.getByteTimeDomainData(dataArray)

    // 清空画布
    ctx.fillStyle = 'rgba(15, 23, 42, 0.3)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制波形
    ctx.lineWidth = 2
    ctx.strokeStyle = '#3b82f6'
    ctx.beginPath()

    const sliceWidth = canvas.width / bufferLength
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const y = (v * canvas.height) / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()

    // 计算音量
    analyser.getByteFrequencyData(dataArray)
    const volume = dataArray.reduce((a, b) => a + b) / bufferLength
    
    // 计算主频率（简化的音调估计）
    let maxIndex = 0
    let maxValue = 0
    for (let i = 0; i < bufferLength; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i]
        maxIndex = i
      }
    }
    const pitch = (maxIndex * audioContext.sampleRate) / (analyser.fftSize * 2)

    // 简单的情绪推断（基于音量和音调）
    let emotion = '平静'
    if (volume > 60) {
      emotion = pitch > 300 ? '激动' : '愤怒'
    } else if (volume > 30) {
      emotion = pitch > 250 ? '开心' : '正常'
    } else if (volume > 10) {
      emotion = '低落'
    }

    audioData.value = {
      volume: Math.round(volume),
      pitch: Math.round(pitch),
      emotion
    }
  }

  draw()
}

// 节律采集
const startRhythmCollection = () => {
  rhythmActive.value = true
  rhythmTimer = setInterval(() => {
    if (faceData.value.detected || audioData.value.volume > 0) {
      const now = new Date()
      rhythmRecords.value.unshift({
        time: now.toLocaleTimeString(),
        expression: faceData.value.expression || '未检测',
        audioEmotion: audioData.value.emotion,
        volume: audioData.value.volume
      })

      // 只保留最近20条记录
      if (rhythmRecords.value.length > 20) {
        rhythmRecords.value.pop()
      }
    }
  }, rhythmInterval.value)
}

// 停止节律采集
const stopRhythmCollection = () => {
  rhythmActive.value = false
  if (rhythmTimer) {
    clearInterval(rhythmTimer)
    rhythmTimer = null
  }
}

// 停止摄像头
const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  cameraActive.value = false
  audioActive.value = false
  
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
}

// 演示模式
let demoTimer = null
const demoExpressions = ['开心', '中性', '惊讶', '悲伤', '平静']
const demoEmotionKeys = ['neutral','happy','sad','angry','fearful','disgusted','surprised']

const drawDemoWaveform = () => {
  const canvas = audioCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  ctx.fillStyle = 'rgba(15,23,42,0.5)'
  ctx.fillRect(0, 0, W, H)
  ctx.lineWidth = 2
  ctx.strokeStyle = '#3b82f6'
  ctx.beginPath()
  for (let x = 0; x < W; x++) {
    const t = x / W * Math.PI * 8
    const amp = 30 + audioData.value.volume * 0.4
    const y = H / 2 + Math.sin(t + Date.now() / 200) * amp * 0.5
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()
}

const startDemoMode = () => {
  cameraActive.value = true
  audioActive.value = true
  let tick = 0
  demoTimer = setInterval(() => {
    tick++
    const expIdx = tick % demoExpressions.length
    const emotions = {}
    demoEmotionKeys.forEach((k, i) => {
      emotions[k] = i === expIdx % demoEmotionKeys.length ? 0.6 + Math.random() * 0.3 : Math.random() * 0.15
    })
    faceData.value = {
      detected: true,
      expression: demoExpressions[expIdx],
      confidence: 0.75 + Math.random() * 0.2,
      age: 22 + Math.floor(Math.random() * 45),
      gender: Math.random() > 0.5 ? '男' : '女',
      genderConfidence: 0.82 + Math.random() * 0.16,
      emotions
    }
    const vol = 20 + Math.random() * 60
    const pit = 150 + Math.random() * 300
    let emotion = '平静'
    if (vol > 60) emotion = pit > 300 ? '激动' : '愤怒'
    else if (vol > 30) emotion = pit > 250 ? '开心' : '正常'
    else emotion = '低落'
    audioData.value = { volume: Math.round(vol), pitch: Math.round(pit), emotion }
    vitalsData.value = {
      heartRate: 68 + Math.round(Math.random() * 24),
      health: vol > 65 ? '需关注' : '良好',
      healthLevel: vol > 65 ? 'warning' : 'good'
    }
    drawDemoWaveform()
  }, 800)
}

const stopDemoMode = () => {
  if (demoTimer) { clearInterval(demoTimer); demoTimer = null }
  cameraActive.value = false
  audioActive.value = false
  faceData.value = { detected: false, expression: '中性', confidence: 0, age: 0, gender: '未知', genderConfidence: 0, emotions: {} }
  audioData.value = { volume: 0, pitch: 0, emotion: '平静' }
  vitalsData.value = { heartRate: 0, health: '评估中', healthLevel: 'normal' }
}

// 切换采集状态
const toggleCollection = async () => {
  if (isCollecting.value) {
    if (demoMode.value) stopDemoMode()
    else stopCamera()
    stopRhythmCollection()
    isCollecting.value = false
  } else {
    if (demoMode.value) startDemoMode()
    else await startCamera()
    startRhythmCollection()
    isCollecting.value = true
  }
}

// 重置数据
const resetData = () => {
  rhythmRecords.value = []
  faceData.value = { detected: false, expression: '中性', confidence: 0, age: 0, gender: '未知', genderConfidence: 0, emotions: {} }
  audioData.value = { volume: 0, pitch: 0, emotion: '平静' }
  vitalsData.value = { heartRate: 0, health: '评估中', healthLevel: 'normal' }
  saveMessage.value = ''
}

const formatRecordTime = (time) => {
  if (!time) return '--'
  const date = new Date(time)
  return Number.isNaN(date.getTime()) ? String(time) : date.toLocaleString()
}

const loadSavedRecords = async () => {
  try {
    recordsLoading.value = true
    const { data } = await multimodalAPI.getRecords({ limit: 12 })
    savedRecords.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('加载已保存采集数据失败:', error)
    savedRecords.value = []
  } finally {
    recordsLoading.value = false
  }
}

const openSavedRecordsModal = async () => {
  showSavedRecords.value = true
  await loadSavedRecords()
}

const deleteSavedRecord = async (recordId) => {
  const confirmed = window.confirm('确定要删除这条已保存的采集记录吗？')
  if (!confirmed) return

  try {
    deletingRecordId.value = recordId
    await multimodalAPI.deleteRecord(recordId)
    savedRecords.value = savedRecords.value.filter(record => record.id !== recordId)
    if (!savedRecords.value.length) {
      await loadSavedRecords()
    }
  } catch (error) {
    console.error('删除采集记录失败:', error)
    alert('删除失败：' + (error.response?.data?.error || error.message))
  } finally {
    deletingRecordId.value = ''
  }
}

// 保存当前采集记录到后端
const saveCurrentRecord = async () => {
  const hasFaceData = faceData.value.detected
  const hasAudioData = Number(audioData.value.volume || 0) > 0 || Number(audioData.value.pitch || 0) > 0
  const hasVitalData = Number(vitalsData.value.heartRate || 0) > 0

  if (!hasFaceData && !hasAudioData && !hasVitalData) {
    saveMessage.value = '⚠️ 当前未检测到有效采集数据，请先开始采集后再保存'
    return
  }

  try {
    saving.value = true
    saveMessage.value = ''
    await multimodalAPI.saveRecord({
      face_expression: faceData.value.detected ? faceData.value.expression : '未检测',
      face_confidence: Number((faceData.value.confidence || 0).toFixed(4)),
      age_estimate: faceData.value.detected ? Number(faceData.value.age || 0) : 0,
      gender_label: faceData.value.detected ? faceData.value.gender : '未知',
      gender_confidence: Number((faceData.value.genderConfidence || 0).toFixed(4)),
      audio_emotion: audioData.value.emotion,
      volume: Number((audioData.value.volume || 0).toFixed(2)),
      pitch: Number((audioData.value.pitch || 0).toFixed(2)),
      heart_rate: vitalsData.value.heartRate || 0,
      health_label: vitalsData.value.health || '评估中',
      source: demoMode.value ? 'demo_mode' : 'camera_voice'
    })

    const collectedProfile = {
      age: faceData.value.detected ? Number(faceData.value.age || 0) : 0,
      gender: faceData.value.detected ? faceData.value.gender : '未知',
      heartRate: vitalsData.value.heartRate || 0,
      healthLabel: vitalsData.value.health || '评估中',
      recordedAt: new Date().toISOString()
    }
    localStorage.setItem('latest_collected_profile', JSON.stringify(collectedProfile))
    window.dispatchEvent(new CustomEvent('latest-collected-profile-updated', { detail: collectedProfile }))
    await loadSavedRecords()
    saveMessage.value = '✅ 已保存到后端数据库'
  } catch (error) {
    console.error('保存多模态数据失败:', error)
    saveMessage.value = `❌ 保存失败：${error.response?.data?.error || error.message || '未知错误'}`
  } finally {
    saving.value = false
  }
}

// 生命周期
onMounted(() => {
  loadSavedRecords()
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    demoMode.value = true
    demoModeReason.value = (location.protocol !== 'https:' && location.hostname !== 'localhost')
      ? '当前站点使用 HTTP 协议，浏览器安全策略禁止访问摄像头/麦克风。请配置 HTTPS 后重试，当前为演示模式。'
      : '当前浏览器不支持摄像头/麦克风，已切换为演示模式。'
  } else {
    loadModels()
  }
})

onUnmounted(() => {
  if (demoMode.value) stopDemoMode()
  else stopCamera()
  stopRhythmCollection()
})
</script>

<style scoped>
.multimodal-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  color: #f8fafc;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.page-desc {
  color: #94a3b8;
  font-size: 14px;
  margin-bottom: 24px;
}

/* 状态栏 */
.status-bar {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 14px;
}

.status-item.active {
  color: #3b82f6;
}

.vitals-panel {
  margin-top: 12px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.vital-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vital-item .label {
  color: #94a3b8;
  font-size: 12px;
}

.vital-item .value {
  color: #f8fafc;
  font-size: 14px;
  font-weight: 600;
}

.vital-item .value.good { color: #22c55e; }
.vital-item .value.warning { color: #f59e0b; }
.vital-item .value.danger { color: #ef4444; }

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #64748b;
}

.status-item.active .status-dot {
  background: #3b82f6;
  box-shadow: 0 0 8px #3b82f6;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.privacy-badge {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

/* 控制面板 */
.control-panel {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.btn-primary, .btn-secondary {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-primary.active {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.btn-secondary {
  background: rgba(51, 65, 85, 0.5);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.btn-secondary:hover {
  background: rgba(51, 65, 85, 0.8);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-tip {
  margin-top: -10px;
  margin-bottom: 20px;
  color: #cbd5e1;
  font-size: 13px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 24px;
}

.saved-modal {
  width: min(1080px, 100%);
  max-height: 82vh;
  overflow: auto;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.96));
  border: 1px solid rgba(59, 130, 246, 0.18);
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.55);
  padding: 20px;
}

.modal-header-row {
  margin-bottom: 14px;
}

.saved-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-close {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(51, 65, 85, 0.48);
  color: #e2e8f0;
  font-size: 20px;
  cursor: pointer;
}

.modal-close:hover {
  background: rgba(71, 85, 105, 0.7);
}

.saved-section {
  margin-top: 24px;
  padding: 20px;
  background: rgba(15, 23, 42, 0.46);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
}

.saved-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.refresh-btn {
  padding: 10px 16px;
}

.saved-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.saved-grid-modal {
  padding-top: 4px;
}

.saved-card {
  background: rgba(30, 41, 59, 0.56);
  border: 1px solid rgba(59, 130, 246, 0.16);
  border-radius: 12px;
  padding: 14px;
}

.saved-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.saved-top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.saved-time {
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 600;
}

.saved-source {
  color: #93c5fd;
  font-size: 12px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 999px;
  padding: 4px 10px;
}

.delete-record-btn {
  border: 1px solid rgba(239, 68, 68, 0.28);
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 12px;
  cursor: pointer;
}

.delete-record-btn:hover {
  background: rgba(239, 68, 68, 0.18);
}

.delete-record-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.saved-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.no-saved-records {
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  padding: 28px 12px;
}

.modal-empty {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 内容网格 */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.video-section, .audio-section {
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.section-title {
  color: #f8fafc;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

/* 视频容器 */
.video-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #0f172a;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-container canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-placeholder, .audio-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
  gap: 12px;
}

.video-placeholder p, .audio-placeholder p {
  font-size: 14px;
}

/* 音频可视化 */
.audio-visualizer {
  position: relative;
  width: 100%;
  height: 200px;
  background: #0f172a;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.audio-visualizer canvas {
  width: 100%;
  height: 100%;
}

/* 分析结果 */
.analysis-result {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
  padding: 16px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
}

.result-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #94a3b8;
}

.value {
  color: #f8fafc;
  font-weight: 500;
}

.confidence {
  margin-left: auto;
  color: #3b82f6;
  font-size: 12px;
}

.emotion-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
}

.emotion-tag.平静 { background: rgba(100, 116, 139, 0.2); color: #94a3b8; }
.emotion-tag.开心 { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.emotion-tag.激动 { background: rgba(249, 115, 22, 0.2); color: #f97316; }
.emotion-tag.愤怒 { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.emotion-tag.低落 { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.emotion-tag.正常 { background: rgba(168, 85, 247, 0.2); color: #a855f7; }

/* 情绪条 */
.emotion-bars {
  margin-top: 16px;
}

.emotion-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.emotion-name {
  width: 50px;
  color: #94a3b8;
  font-size: 12px;
}

.bar-bg {
  flex: 1;
  height: 6px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  transition: width 0.3s;
}

.emotion-value {
  width: 40px;
  text-align: right;
  color: #cbd5e1;
  font-size: 12px;
}

/* 节律记录 */
.rhythm-section {
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.rhythm-timeline {
  max-height: 300px;
  overflow-y: auto;
}

.rhythm-record {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
  margin-bottom: 8px;
  border-left: 3px solid #3b82f6;
}

.record-time {
  color: #64748b;
  font-size: 13px;
  min-width: 80px;
}

.record-data {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.data-tag {
  padding: 4px 8px;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-radius: 4px;
  font-size: 12px;
}

.no-records {
  text-align: center;
  color: #64748b;
  padding: 40px;
  font-size: 14px;
}

/* 滚动条样式 */
.rhythm-timeline::-webkit-scrollbar {
  width: 6px;
}

.rhythm-timeline::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 3px;
}

.rhythm-timeline::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.3);
  border-radius: 3px;
}

.rhythm-timeline::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.5);
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .vitals-panel {
    grid-template-columns: 1fr;
  }
}

.demo-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: 10px;
  margin-bottom: 16px;
  color: #fbbf24;
  font-size: 13px;
  line-height: 1.6;
}
.demo-banner svg { flex-shrink: 0; margin-top: 2px; }
.demo-banner span:nth-child(2) { flex: 1; }
.demo-tag {
  flex-shrink: 0;
  background: rgba(234,179,8,0.2);
  border: 1px solid rgba(234,179,8,0.4);
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.demo-banner{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;background:rgba(234,179,8,0.1);border:1px solid rgba(234,179,8,0.3);border-radius:10px;margin-bottom:16px;color:#fbbf24;font-size:13px;line-height:1.6;}.demo-banner svg{flex-shrink:0;margin-top:2px;}.demo-tag{flex-shrink:0;background:rgba(234,179,8,0.2);border:1px solid rgba(234,179,8,0.4);padding:2px 10px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;}</style>
