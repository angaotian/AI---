<template>
  <div class="hr-page">
    <div class="hr-header">
      <div class="hr-header-left">
        <h1 class="hr-title">健康风险预测</h1>
        <p class="hr-desc">基于 AI 的健康风险分析与预警</p>
      </div>
      <div class="hr-header-right">
        <div class="overall-risk" :class="overallRiskClass">
          <span class="risk-label">综合风险等级</span>
          <span class="risk-level">{{ overallRisk.level }}</span>
          <span class="risk-score">{{ overallRisk.score }}</span>
        </div>
        <div class="last-update">最近评估：{{ lastAssess }}</div>
      </div>
    </div>
    <div class="hr-body">
      <div class="hr-left">
        <div class="section-title">风险维度分析</div>
        <div class="risk-grid">
          <div v-for="r in riskDimensions" :key="r.key"
            class="risk-card" :class="r.level"
            :data-active="selectedDim && selectedDim.key === r.key"
            @click="selectDimension(r)">
            <div class="rc-top">
              <span class="rc-name">{{ r.name }}</span>
              <span class="rc-badge" :class="r.level">{{ r.levelLabel }}</span>
            </div>
            <div class="rc-score-row">
              <span class="rc-score">{{ r.score }}</span><span class="rc-unit">/100</span>
              <span class="rc-trend" :class="r.trend > 0 ? 'up' : r.trend < 0 ? 'down' : 'flat'">
                {{ r.trend > 0 ? '↑' : r.trend < 0 ? '↓' : '-' }} {{ Math.abs(r.trend) }}
              </span>
            </div>
            <div class="rc-bar-bg"><div class="rc-bar-fill" :style="{ width: r.score + '%', background: r.color }"></div></div>
            <div class="rc-desc">{{ r.desc }}</div>
          </div>
        </div>
        <div class="section-title" style="margin-top:20px">预警提醒</div>
        <div class="alert-list">
          <div v-for="a in alerts" :key="a.id" class="alert-item" :class="a.severity">
            <span class="alert-dot"></span>
            <div class="alert-body">
              <div class="alert-title">{{ a.title }}</div>
              <div class="alert-msg">{{ a.msg }}</div>
            </div>
            <span class="alert-time">{{ a.time }}</span>
          </div>
        </div>
      </div>
      <div class="hr-right">
        <div class="section-title">预测趋势图
          <div class="chart-tabs">
            <span v-for="t in chartTabs" :key="t.key"
              class="chart-tab" :class="{ active: activeTab === t.key }"
              @click="switchTab(t.key)">{{ t.label }}</span>
          </div>
        </div>
        <div class="chart-wrap">
          <canvas ref="trendCanvasRef" class="trend-canvas"></canvas>
          <div class="chart-legend">
            <span v-for="s in activeSeries" :key="s.key" class="cl-item">
              <span class="cl-dot" :style="{ background: s.color }"></span>{{ s.name }}
            </span>
          </div>
        </div>
        <div class="section-title" style="margin-top:18px">风险雷达图</div>
        <div class="radar-wrap">
          <canvas ref="radarCanvasRef" class="radar-canvas"></canvas>
          <div class="radar-info">
            <div v-for="r in riskDimensions" :key="r.key" class="radar-row">
              <span class="radar-dot" :style="{ background: r.color }"></span>
              <span class="radar-name">{{ r.name }}</span>
              <span class="radar-val" :class="r.level">{{ r.score }}</span>
            </div>
          </div>
        </div>
        <div class="section-title" style="margin-top:18px">AI 干预建议</div>
        <div class="suggest-list">
          <div v-for="s in suggestions" :key="s.id" class="suggest-item">
            <div class="suggest-head">
              <span class="suggest-tag" :class="s.priority">{{ s.priorityLabel }}</span>
              <span class="suggest-title">{{ s.title }}</span>
            </div>
            <div class="suggest-body">{{ s.body }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const lastAssess = ref('2026-03-11 09:32')
const overallRisk = ref({ level: '中等风险', score: '62', raw: 62 })
const overallRiskClass = computed(() => {
  const s = overallRisk.value.raw
  if (s >= 75) return 'risk-high'
  if (s >= 45) return 'risk-mid'
  return 'risk-low'
})

const riskDimensions = ref([
  { key:'cardio',    name:'心血管',   score:72, trend:3,  level:'high', levelLabel:'高风险', color:'#ef4444', desc:'血压偏高，心率变异性下降，需关注' },
  { key:'metabolic', name:'代谢',     score:58, trend:-2, level:'mid',  levelLabel:'中风险', color:'#f97316', desc:'血糖波动明显，胰岛素敏感性降低' },
  { key:'neuro',     name:'神经系统', score:41, trend:1,  level:'mid',  levelLabel:'中风险', color:'#eab308', desc:'睡眠质量一般，压力指数偏高' },
  { key:'immune',    name:'免疫',     score:33, trend:-5, level:'low',  levelLabel:'低风险', color:'#22c55e', desc:'免疫指标正常，近期无异常' },
  { key:'respir',    name:'呼吸系统', score:28, trend:0,  level:'low',  levelLabel:'低风险', color:'#06b6d4', desc:'肺功能正常，峰值流量达标' },
  { key:'musculo',   name:'肌肉骨骼', score:45, trend:2,  level:'mid',  levelLabel:'中风险', color:'#8b5cf6', desc:'骨密度轻微下降，建议补充钙质' },
])

const selectedDim = ref(null)
function selectDimension(r) {
  selectedDim.value = selectedDim.value && selectedDim.value.key === r.key ? null : r
}

const alerts = ref([
  { id:1, severity:'critical', title:'收缩压超标预警',  msg:'过去3天收缩压平均145mmHg，超出正常上限',         time:'今天 08:15' },
  { id:2, severity:'warning',  title:'空腹血糖偏高',    msg:'连续5天空腹血糖6.8-7.2mmol/L，接近糖尿病阈值',   time:'今天 07:40' },
  { id:3, severity:'warning',  title:'睡眠不足提醒',    msg:'本周平均睡眠5.8小时，低于推荐值7小时',           time:'昨天 23:00' },
  { id:4, severity:'info',     title:'运动量达标',      msg:'本周有氧运动累计168分钟，达成目标',              time:'昨天 18:30' },
  { id:5, severity:'info',     title:'用药提醒',        msg:'氨氯地平5mg 今日剂量已记录',                     time:'今天 07:00' },
])

const chartTabs = [
  { key:'month', label:'近30天' },
  { key:'week',  label:'近7天'  },
  { key:'year',  label:'近6月'  },
]
const activeTab = ref('month')

function genSeries(base, noise, len) {
  const arr = []; let v = base
  for (let i = 0; i < len; i++) {
    v = Math.max(10, Math.min(95, v + (Math.random() - 0.5) * noise))
    arr.push(Math.round(v))
  }
  return arr
}

const chartData = {
  month: { labels: Array.from({length:30},(_,i)=>`${i+1}日`),
    series: [
      { key:'cardio',    name:'心血管风险', color:'#ef4444', values: genSeries(70,8,30) },
      { key:'metabolic', name:'代谢风险',   color:'#f97316', values: genSeries(55,6,30) },
      { key:'overall',   name:'综合风险',   color:'#3b82f6', values: genSeries(62,5,30) },
    ]},
  week: { labels: ['周一','周二','周三','周四','周五','周六','周日'],
    series: [
      { key:'cardio',    name:'心血管风险', color:'#ef4444', values: genSeries(70,10,7) },
      { key:'metabolic', name:'代谢风险',   color:'#f97316', values: genSeries(55,8,7)  },
      { key:'overall',   name:'综合风险',   color:'#3b82f6', values: genSeries(62,6,7)  },
    ]},
  year: { labels: ['10月','11月','12月','1月','2月','3月'],
    series: [
      { key:'cardio',    name:'心血管风险', color:'#ef4444', values: genSeries(68,12,6) },
      { key:'metabolic', name:'代谢风险',   color:'#f97316', values: genSeries(52,10,6) },
      { key:'overall',   name:'综合风险',   color:'#3b82f6', values: genSeries(60,8,6)  },
    ]},
}

const activeSeries = computed(() => chartData[activeTab.value].series)

const suggestions = ref([
  { id:1, priority:'urgent', priorityLabel:'紧急', title:'控制血压', body:'建议立即监测血压，若持续超过145/95mmHg请就医。同时减少钠盐摄入，每日食盐小于5g。' },
  { id:2, priority:'high',   priorityLabel:'重要', title:'血糖管理', body:'建议餐后30分钟进行15分钟步行，监测餐后2h血糖，目标小于7.8mmol/L。' },
  { id:3, priority:'medium', priorityLabel:'建议', title:'改善睡眠', body:'建议22:30前就寝，睡前1小时避免使用电子设备，可尝试冥想放松训练。' },
  { id:4, priority:'low',    priorityLabel:'提示', title:'补充钙质', body:'建议每日补充钙600mg加维生素D 800IU，增加户外活动时间。' },
])

const trendCanvasRef = ref(null)
const radarCanvasRef = ref(null)
let trendAnimFrame = null, radarAnimFrame = null

function drawTrendChart(progress) {
  if (progress === undefined) progress = 1
  const canvas = trendCanvasRef.value; if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  const pad = { top:28, right:20, bottom:44, left:48 }
  const cw = W - pad.left - pad.right
  const ch = H - pad.top - pad.bottom
  ctx.clearRect(0, 0, W, H)
  const { labels, series } = chartData[activeTab.value]
  const n = labels.length
  ctx.save()
  ctx.font = '10px sans-serif'; ctx.fillStyle = '#475569'; ctx.textAlign = 'right'
  for (const t of [0,25,50,75,100]) {
    const y = pad.top + ch - (t/100)*ch
    ctx.beginPath(); ctx.strokeStyle='rgba(148,163,184,0.1)'; ctx.lineWidth=1
    ctx.moveTo(pad.left,y); ctx.lineTo(pad.left+cw,y); ctx.stroke()
    ctx.fillText(t, pad.left-6, y+3)
  }
  ctx.textAlign = 'center'
  const step = Math.max(1, Math.floor(n/8))
  for (let i = 0; i < n; i += step) {
    ctx.fillText(labels[i], pad.left + (i/(n-1))*cw, H-10)
  }
  ctx.restore()
  const drawCount = Math.max(1, Math.round(progress*(n-1)))
  for (const s of series) {
    const pts = s.values.slice(0, drawCount+1)
    ctx.save()
    ctx.beginPath()
    pts.forEach((v,i) => {
      const x = pad.left+(i/(n-1))*cw, y = pad.top+ch-(v/100)*ch
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y)
    })
    ctx.lineTo(pad.left+((pts.length-1)/(n-1))*cw, pad.top+ch)
    ctx.lineTo(pad.left, pad.top+ch)
    ctx.closePath()
    const grad = ctx.createLinearGradient(0,pad.top,0,pad.top+ch)
    grad.addColorStop(0, s.color+'33'); grad.addColorStop(1, s.color+'00')
    ctx.fillStyle=grad; ctx.fill()
    ctx.beginPath()
    pts.forEach((v,i) => {
      const x = pad.left+(i/(n-1))*cw, y = pad.top+ch-(v/100)*ch
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y)
    })
    ctx.strokeStyle=s.color; ctx.lineWidth=2; ctx.lineJoin='round'; ctx.stroke()
    const lx = pad.left+((pts.length-1)/(n-1))*cw
    const ly = pad.top+ch-(pts[pts.length-1]/100)*ch
    ctx.beginPath(); ctx.arc(lx,ly,4,0,Math.PI*2); ctx.fillStyle=s.color; ctx.fill()
    ctx.restore()
  }
  ctx.save()
  
  ctx.fillStyle='rgba(239,68,68,0.04)'
  ctx.fillRect(pad.left, pad.top, cw, ch*0.25)
  ctx.fillStyle='rgba(234,179,8,0.04)'
  ctx.fillRect(pad.left, pad.top+ch*0.25, cw, ch*0.30)
  ctx.restore()
}

function animateTrend() {
  let start = null; const dur = 900
  function frame(ts) {
    if (!start) start = ts
    const p = Math.min((ts-start)/dur, 1)
    drawTrendChart(p)
    if (p < 1) trendAnimFrame = requestAnimationFrame(frame)
  }
  if (trendAnimFrame) cancelAnimationFrame(trendAnimFrame)
  trendAnimFrame = requestAnimationFrame(frame)
}

function switchTab(key) { activeTab.value = key; animateTrend() }

function drawRadar(progress) {
  if (progress === undefined) progress = 1
  const canvas = radarCanvasRef.value; if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  const cx = W/2, cy = H/2, R = Math.min(W,H)/2 - 36
  const dims = riskDimensions.value, n = dims.length
  ctx.clearRect(0,0,W,H)
  for (let ring = 1; ring <= 4; ring++) {
    const r = (ring/4)*R
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const a = (2*Math.PI*i)/n - Math.PI/2
      i===0 ? ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)) : ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a))
    }
    ctx.closePath(); ctx.strokeStyle='rgba(148,163,184,0.12)'; ctx.lineWidth=1; ctx.stroke()
  }
  ctx.font='11px sans-serif'
  for (let i = 0; i < n; i++) {
    const a = (2*Math.PI*i)/n - Math.PI/2
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a))
    ctx.strokeStyle='rgba(148,163,184,0.15)'; ctx.lineWidth=1; ctx.stroke()
    ctx.fillStyle='#94a3b8'; ctx.textAlign='center'; ctx.textBaseline='middle'
    ctx.fillText(dims[i].name, cx+(R+20)*Math.cos(a), cy+(R+20)*Math.sin(a))
  }
  ctx.save(); ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const a = (2*Math.PI*i)/n - Math.PI/2, r = (dims[i].score/100)*R*progress
    i===0 ? ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)) : ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a))
  }
  ctx.closePath()
  const g = ctx.createRadialGradient(cx,cy,0,cx,cy,R)
  g.addColorStop(0,'rgba(59,130,246,0.35)'); g.addColorStop(1,'rgba(239,68,68,0.15)')
  ctx.fillStyle=g; ctx.fill(); ctx.strokeStyle='#3b82f6'; ctx.lineWidth=2; ctx.stroke()
  for (let i = 0; i < n; i++) {
    const a = (2*Math.PI*i)/n - Math.PI/2, r = (dims[i].score/100)*R*progress
    ctx.beginPath(); ctx.arc(cx+r*Math.cos(a),cy+r*Math.sin(a),4,0,Math.PI*2)
    ctx.fillStyle=dims[i].color; ctx.fill()
  }
  ctx.restore()
}

function animateRadar() {
  let start = null; const dur = 800
  function frame(ts) {
    if (!start) start = ts
    const p = Math.min((ts-start)/dur, 1)
    drawRadar(1 - Math.pow(1-p, 3))
    if (p < 1) radarAnimFrame = requestAnimationFrame(frame)
  }
  if (radarAnimFrame) cancelAnimationFrame(radarAnimFrame)
  radarAnimFrame = requestAnimationFrame(frame)
}

function resizeCanvases() {
  const tc = trendCanvasRef.value, rc = radarCanvasRef.value
  if (tc) { tc.width = tc.parentElement.clientWidth; tc.height = 220 }
  if (rc) { rc.width = 260; rc.height = 260 }
}

onMounted(() => {
  resizeCanvases(); animateTrend(); animateRadar()
  window.addEventListener('resize', () => { resizeCanvases(); drawTrendChart(); drawRadar() })
})
onUnmounted(() => {
  if (trendAnimFrame) cancelAnimationFrame(trendAnimFrame)
  if (radarAnimFrame) cancelAnimationFrame(radarAnimFrame)
  window.removeEventListener('resize', () => {})
})
</script>

<style scoped>
* { box-sizing: border-box; }
.hr-page { display:flex; flex-direction:column; height:100%; min-height:calc(100vh - 48px); padding:0; }
.hr-header { display:flex; align-items:center; justify-content:space-between; padding:18px 24px 14px; border-bottom:1px solid rgba(59,130,246,0.15); flex-shrink:0; }
.hr-title { color:#f8fafc; font-size:22px; font-weight:700; margin:0 0 4px; }
.hr-desc  { color:#64748b; font-size:13px; margin:0; }
.hr-header-right { display:flex; align-items:center; gap:16px; }
.overall-risk { display:flex; align-items:center; gap:10px; padding:10px 18px; border-radius:12px; border:1px solid; }
.overall-risk.risk-high { border-color:rgba(239,68,68,0.4); background:rgba(239,68,68,0.08); }
.overall-risk.risk-mid  { border-color:rgba(234,179,8,0.4);  background:rgba(234,179,8,0.08); }
.overall-risk.risk-low  { border-color:rgba(34,197,94,0.4);  background:rgba(34,197,94,0.08); }
.risk-label { color:#94a3b8; font-size:11px; }
.risk-level { color:#f8fafc; font-size:13px; font-weight:700; }
.risk-score { color:#f8fafc; font-size:22px; font-weight:800; }
.last-update { color:#475569; font-size:11px; }
.hr-body { display:flex; flex:1; overflow:hidden; }
.hr-left { width:340px; min-width:280px; display:flex; flex-direction:column; overflow-y:auto; padding:16px 14px; border-right:1px solid rgba(59,130,246,0.12); }
.hr-left::-webkit-scrollbar { width:4px; }
.hr-left::-webkit-scrollbar-thumb { background:rgba(59,130,246,0.2); border-radius:4px; }
.hr-right { flex:1; display:flex; flex-direction:column; overflow-y:auto; padding:16px 18px; }
.hr-right::-webkit-scrollbar { width:4px; }
.hr-right::-webkit-scrollbar-thumb { background:rgba(59,130,246,0.2); border-radius:4px; }
.section-title { color:#94a3b8; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between; }
.risk-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.risk-card { background:rgba(15,23,41,0.8); border:1px solid rgba(59,130,246,0.15); border-radius:12px; padding:12px; cursor:pointer; transition:all 0.2s; }
.risk-card:hover { border-color:rgba(59,130,246,0.4); transform:translateY(-1px); }
.risk-card[data-active=true] { border-color:#3b82f6; background:rgba(59,130,246,0.1); }
.risk-card.high { border-left:3px solid #ef4444; }
.risk-card.mid  { border-left:3px solid #f97316; }
.risk-card.low  { border-left:3px solid #22c55e; }
.rc-top { display:flex; align-items:center; gap:6px; margin-bottom:8px; }
.rc-name { color:#cbd5e1; font-size:12px; font-weight:600; flex:1; }
.rc-badge { font-size:10px; font-weight:700; padding:1px 6px; border-radius:6px; }
.rc-badge.high { background:rgba(239,68,68,0.2); color:#ef4444; }
.rc-badge.mid  { background:rgba(249,115,22,0.2); color:#f97316; }
.rc-badge.low  { background:rgba(34,197,94,0.2);  color:#22c55e; }
.rc-score-row { display:flex; align-items:baseline; gap:4px; margin-bottom:6px; }
.rc-score { color:#f8fafc; font-size:22px; font-weight:800; line-height:1; }
.rc-unit  { color:#475569; font-size:11px; flex:1; }
.rc-trend { font-size:11px; font-weight:700; }
.rc-trend.up   { color:#ef4444; }
.rc-trend.down { color:#22c55e; }
.rc-trend.flat { color:#64748b; }
.rc-bar-bg { height:4px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; margin-bottom:8px; }
.rc-bar-fill { height:100%; border-radius:3px; transition:width 0.6s; }
.rc-desc { color:#64748b; font-size:10px; line-height:1.4; }
.alert-list { display:flex; flex-direction:column; gap:8px; }
.alert-item { display:flex; align-items:flex-start; gap:10px; padding:10px 12px; border-radius:10px; border:1px solid; }
.alert-item.critical { border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.07); }
.alert-item.warning  { border-color:rgba(234,179,8,0.3);  background:rgba(234,179,8,0.06); }
.alert-item.info     { border-color:rgba(59,130,246,0.2);  background:rgba(59,130,246,0.05); }
.alert-dot { width:8px; height:8px; border-radius:50%; margin-top:4px; flex-shrink:0; }
.alert-item.critical .alert-dot { background:#ef4444; box-shadow:0 0 6px #ef4444; }
.alert-item.warning  .alert-dot { background:#eab308; box-shadow:0 0 6px #eab308; }
.alert-item.info     .alert-dot { background:#3b82f6; }
.alert-body { flex:1; min-width:0; }
.alert-title { color:#f8fafc; font-size:12px; font-weight:600; margin-bottom:2px; }
.alert-msg   { color:#94a3b8; font-size:11px; line-height:1.4; }
.alert-time  { color:#475569; font-size:10px; white-space:nowrap; flex-shrink:0; }
.chart-tabs { display:flex; gap:4px; }
.chart-tab { padding:3px 10px; border-radius:6px; font-size:11px; color:#64748b; cursor:pointer; transition:all 0.15s; }
.chart-tab.active { background:rgba(59,130,246,0.2); color:#3b82f6; font-weight:700; }
.chart-tab:hover:not(.active) { color:#94a3b8; }
.chart-wrap { background:rgba(13,27,42,0.6); border:1px solid rgba(59,130,246,0.12); border-radius:12px; padding:12px 12px 8px; }
.trend-canvas { display:block; width:100%; }
.chart-legend { display:flex; gap:14px; padding:8px 4px 0; }
.cl-item { display:flex; align-items:center; gap:5px; color:#94a3b8; font-size:11px; }
.cl-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.radar-wrap { display:flex; align-items:center; gap:16px; background:rgba(13,27,42,0.6); border:1px solid rgba(59,130,246,0.12); border-radius:12px; padding:14px; }
.radar-canvas { flex-shrink:0; }
.radar-info { flex:1; display:flex; flex-direction:column; gap:8px; }
.radar-row { display:flex; align-items:center; gap:8px; }
.radar-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.radar-name { color:#94a3b8; font-size:12px; flex:1; }
.radar-val { font-size:13px; font-weight:700; }
.radar-val.high { color:#ef4444; }
.radar-val.mid  { color:#f97316; }
.radar-val.low  { color:#22c55e; }
.suggest-list { display:flex; flex-direction:column; gap:10px; padding-bottom:20px; }
.suggest-item { background:rgba(15,23,41,0.8); border:1px solid rgba(59,130,246,0.15); border-radius:12px; padding:12px 14px; }
.suggest-head { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.suggest-tag { font-size:10px; font-weight:700; padding:2px 8px; border-radius:6px; }
.suggest-tag.urgent { background:rgba(239,68,68,0.2);   color:#ef4444; }
.suggest-tag.high   { background:rgba(249,115,22,0.2);  color:#f97316; }
.suggest-tag.medium { background:rgba(59,130,246,0.2);  color:#3b82f6; }
.suggest-tag.low    { background:rgba(100,116,139,0.2); color:#64748b; }
.suggest-title { color:#f8fafc; font-size:13px; font-weight:600; }
.suggest-body  { color:#94a3b8; font-size:12px; line-height:1.6; }

/* ===== 移动端 ===== */
@media(max-width:768px){
  .hr-page{min-height:auto;overflow:auto}
  .hr-header{flex-direction:column;align-items:flex-start;gap:10px;padding:12px 14px 10px}
  .hr-title{font-size:18px}
  .hr-header-right{flex-direction:row;gap:10px;align-items:center;flex-wrap:wrap}
  .overall-risk{padding:8px 12px;font-size:12px}
  .risk-score{font-size:18px}
  .hr-body{flex-direction:column;overflow:visible}
  .hr-left{width:100%;min-width:unset;border-right:none;border-bottom:1px solid rgba(59,130,246,0.12);padding:14px 12px;overflow:visible}
  .hr-right{padding:14px 12px;overflow:visible}
  .risk-grid{grid-template-columns:1fr 1fr;gap:8px}
  .rc-score{font-size:18px}
  .radar-wrap{flex-direction:column;align-items:center}
  .radar-canvas{width:220px!important;height:220px!important}
}
@media(max-width:400px){
  .risk-grid{grid-template-columns:1fr}
}
</style>
