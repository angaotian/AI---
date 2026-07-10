<template>
  <div class="hd-page">
    <div class="hd-header">
      <div><h1 class="hd-title">健康大盘</h1><p class="hd-desc">个人健康数据总览与可视化展示</p></div>
      <div class="hd-header-right">
        <div class="lqi-ring">
          <canvas ref="lqiCanvasRef" width="90" height="90"></canvas>
          <div class="lqi-center"><span class="lqi-val">{{ lqi }}</span><span class="lqi-label">LQI</span></div>
        </div>
        <div class="header-meta">
          <div class="meta-name">{{ headerUserName }}</div>
          <div class="meta-row"><span class="meta-tag">{{ headerGender }} · {{ headerAge }}岁</span><span class="meta-tag">A型血</span></div>
          <div class="meta-update">数据更新：{{ lastUpdate }}</div>
        </div>
      </div>
    </div>
    <div class="kpi-row">
      <div v-for="k in kpis" :key="k.key" class="kpi-card">
        <div class="kpi-top"><span class="kpi-label">{{ k.label }}</span><span class="kpi-status" :class="k.status">{{ k.statusLabel }}</span></div>
        <div class="kpi-val-row"><span class="kpi-val">{{ k.value }}</span><span class="kpi-unit">{{ k.unit }}</span></div>
        <div class="kpi-trend" :class="k.trendDir">{{ k.trendDir==='up'?'↑':k.trendDir==='down'?'↓':'—' }} {{ k.trendVal }} vs 昨日</div>
        <div class="kpi-bar-bg"><div class="kpi-bar-fill" :style="{width:k.pct+'%',background:k.color}"></div></div>
      </div>
    </div>
    <div class="main-grid">
      <div class="grid-card chart-card">
        <div class="card-header"><span class="card-title">生命体征趋势</span>
          <div class="chart-tabs"><span v-for="t in vitalTabs" :key="t.key" class="chart-tab" :class="{active:activeVitalTab===t.key}" @click="switchVitalTab(t.key)">{{ t.label }}</span></div>
        </div>
        <canvas ref="vitalCanvasRef" class="chart-canvas"></canvas>
        <div class="chart-legend"><span v-for="s in activeVitalSeries" :key="s.key" class="cl-item"><span class="cl-dot" :style="{background:s.color}"></span>{{ s.name }}</span></div>
      </div>
      <div class="grid-card ring-card">
        <div class="card-header"><span class="card-title">今日活动</span></div>
        <div class="ring-wrap">
          <canvas ref="activityCanvasRef" width="160" height="160"></canvas>
          <div class="ring-center"><span class="ring-steps">{{ steps.toLocaleString() }}</span><span class="ring-label">步</span></div>
        </div>
        <div class="activity-stats">
          <div v-for="a in activityStats" :key="a.key" class="act-row">
            <span class="act-dot" :style="{background:a.color}"></span><span class="act-label">{{ a.label }}</span><span class="act-val">{{ a.value }}</span>
          </div>
        </div>
      </div>
      <div class="grid-card sleep-card">
        <div class="card-header"><span class="card-title">睡眠分析</span><span class="card-sub">近7天</span></div>
        <canvas ref="sleepCanvasRef" class="chart-canvas"></canvas>
        <div class="sleep-stats"><div v-for="s in sleepStats" :key="s.key" class="sleep-stat"><div class="ss-val">{{ s.value }}</div><div class="ss-label">{{ s.label }}</div></div></div>
      </div>
      <div class="grid-card events-card">
        <div class="card-header"><span class="card-title">健康事件</span></div>
        <div class="events-list">
          <div v-for="e in healthEvents" :key="e.id" class="event-item">
            <span class="event-dot" :class="e.type"></span>
            <div class="event-body"><div class="event-title">{{ e.title }}</div><div class="event-desc">{{ e.desc }}</div></div>
            <span class="event-time">{{ e.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { multimodalAPI, userAPI } from '../services/api'
const lastUpdate = ref('2026-03-11 09:32')
const lqi = ref(78)
const headerUserName = ref('张三')
const headerGender = ref('男')
const headerAge = ref(42)
const kpis = ref([
  { key:'bp',    label:'血压',  value:'122/81', unit:'mmHg',   status:'normal', statusLabel:'正常', trendDir:'down', trendVal:'3',   pct:61, color:'#3b82f6' },
  { key:'hr',    label:'心率',  value:'72',     unit:'bpm',    status:'normal', statusLabel:'正常', trendDir:'flat', trendVal:'0',   pct:72, color:'#22c55e' },
  { key:'spo2',  label:'血氧',  value:'98',     unit:'%',      status:'good',   statusLabel:'优良', trendDir:'up',   trendVal:'1',   pct:98, color:'#06b6d4' },
  { key:'temp',  label:'体温',  value:'36.5',   unit:'°C',     status:'normal', statusLabel:'正常', trendDir:'flat', trendVal:'0',   pct:73, color:'#8b5cf6' },
  { key:'sugar', label:'血糖',  value:'5.8',    unit:'mmol/L', status:'normal', statusLabel:'正常', trendDir:'up',   trendVal:'0.3', pct:58, color:'#f97316' },
  { key:'weight',label:'体重',  value:'72.4',   unit:'kg',     status:'normal', statusLabel:'正常', trendDir:'down', trendVal:'0.2', pct:60, color:'#eab308' },
])
const steps = ref(8432)
const activityStats = ref([
  { key:'steps',    label:'步数',     value:'8,432 步', color:'#3b82f6' },
  { key:'calories', label:'卡路里',   value:'412 kcal', color:'#ef4444' },
  { key:'distance', label:'距离',     value:'6.2 km',   color:'#22c55e' },
  { key:'active',   label:'活动时长', value:'48 分钟',  color:'#f97316' },
])
const sleepStats = ref([
  { key:'total', label:'总时长',   value:'6.8h' },
  { key:'deep',  label:'深睡',     value:'1.9h' },
  { key:'score', label:'睡眠评分', value:'82'   },
])
const healthEvents = ref([
  { id:1, type:'warning', title:'血压偏高提醒',  desc:'收缩压135mmHg，建议休息',         time:'09:15' },
  { id:2, type:'good',    title:'运动目标达成',  desc:'今日步数超过8000步目标',          time:'08:42' },
  { id:3, type:'info',    title:'用药提醒',      desc:'氨氯地平5mg 已按时服药',          time:'08:00' },
  { id:4, type:'warning', title:'睡眠不足',      desc:'昨晚睡眠6.2小时，低于目标7小时', time:'07:30' },
  { id:5, type:'good',    title:'血氧正常',      desc:'夜间血氧均值98%，状态良好',       time:'06:00' },
  { id:6, type:'info',    title:'体重记录',      desc:'今日体重72.4kg，较昨日降0.2kg',  time:'07:10' },
])
const vitalTabs=[{key:'day',label:'今日'},{key:'week',label:'近7天'},{key:'month',label:'近30天'}]
const activeVitalTab=ref('week')
function genArr(base,noise,len){const a=[];let v=base;for(let i=0;i<len;i++){v=Math.max(base*0.7,Math.min(base*1.3,v+(Math.random()-0.5)*noise));a.push(Math.round(v*10)/10);}return a}
const vitalData={
  day:{labels:['0:00','3:00','6:00','9:00','12:00','15:00','18:00','21:00'],series:[{key:'sbp',name:'收缩压',color:'#3b82f6',values:genArr(125,12,8)},{key:'dbp',name:'舒张压',color:'#8b5cf6',values:genArr(80,8,8)},{key:'hr',name:'心率',color:'#22c55e',values:genArr(72,10,8)}]},
  week:{labels:['周一','周二','周三','周四','周五','周六','周日'],series:[{key:'sbp',name:'收缩压',color:'#3b82f6',values:genArr(125,10,7)},{key:'dbp',name:'舒张压',color:'#8b5cf6',values:genArr(80,6,7)},{key:'hr',name:'心率',color:'#22c55e',values:genArr(72,8,7)}]},
  month:{labels:Array.from({length:30},(_,i)=>`${i+1}日`),series:[{key:'sbp',name:'收缩压',color:'#3b82f6',values:genArr(125,14,30)},{key:'dbp',name:'舒张压',color:'#8b5cf6',values:genArr(80,8,30)},{key:'hr',name:'心率',color:'#22c55e',values:genArr(72,10,30)}]},
}
const activeVitalSeries=computed(()=>vitalData[activeVitalTab.value].series)

const refreshDashboardFromLatestMultimodal = async () => {
  try {
    const [profileResp, mmResp] = await Promise.all([
      userAPI.getProfile(),
      multimodalAPI.getRecords({ limit: 1 })
    ])

    const profile = profileResp?.data || {}
    if (profile.name) headerUserName.value = profile.name

    const latest = Array.isArray(mmResp?.data) ? mmResp.data[0] : null
    if (latest) {
      if (latest.gender_label) headerGender.value = latest.gender_label
      if (Number(latest.age_estimate) > 0) headerAge.value = Number(latest.age_estimate)

      const hrKpi = kpis.value.find(k => k.key === 'hr')
      if (hrKpi && Number(latest.heart_rate) > 0) {
        const hr = Number(latest.heart_rate)
        hrKpi.value = String(hr)
        hrKpi.pct = Math.max(40, Math.min(100, hr))
        hrKpi.status = hr > 105 ? 'warning' : 'normal'
        hrKpi.statusLabel = hr > 105 ? '偏高' : '正常'
      }

      const dt = new Date(latest.recorded_at || Date.now())
      const pad = n => String(n).padStart(2, '0')
      lastUpdate.value = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
    }

    localStorage.setItem('dashboard_gender', headerGender.value)
    localStorage.setItem('dashboard_age', String(headerAge.value))
    window.dispatchEvent(new CustomEvent('dashboard-profile-updated', {
      detail: { gender: headerGender.value, age: headerAge.value }
    }))
  } catch (error) {
    console.error('健康大盘同步多模态数据失败:', error)
  }
}
const sleepData={labels:['周一','周二','周三','周四','周五','周六','周日'],deep:[1.8,2.1,1.6,2.3,1.9,2.5,1.9],light:[3.2,2.8,3.5,2.9,3.1,2.8,2.9],rem:[1.0,1.2,0.8,1.1,1.0,1.3,1.0]}
const lqiCanvasRef=ref(null),vitalCanvasRef=ref(null),activityCanvasRef=ref(null),sleepCanvasRef=ref(null)
let vitalAnimFrame=null
let dashboardRefreshTimer=null

function drawLQI(p){
  if(p===undefined)p=1
  const c=lqiCanvasRef.value;if(!c)return
  const ctx=c.getContext('2d'),W=c.width,H=c.height,cx=W/2,cy=H/2,R=36
  ctx.clearRect(0,0,W,H)
  ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2)
  ctx.strokeStyle='rgba(59,130,246,0.15)';ctx.lineWidth=7;ctx.stroke()
  const end=-Math.PI/2+(lqi.value/100)*Math.PI*2*p
  const g=ctx.createLinearGradient(cx-R,cy,cx+R,cy)
  g.addColorStop(0,'#22c55e');g.addColorStop(1,'#3b82f6')
  ctx.beginPath();ctx.arc(cx,cy,R,-Math.PI/2,end)
  ctx.strokeStyle=g;ctx.lineWidth=7;ctx.lineCap='round';ctx.stroke()
}
function drawActivity(p){
  if(p===undefined)p=1
  const c=activityCanvasRef.value;if(!c)return
  const ctx=c.getContext('2d'),W=c.width,H=c.height,cx=W/2,cy=H/2
  ctx.clearRect(0,0,W,H)
  const rings=[{pct:steps.value/10000,color:'#3b82f6',r:68},{pct:0.82,color:'#ef4444',r:54},{pct:0.80,color:'#22c55e',r:40}]
  for(const ring of rings){
    ctx.beginPath();ctx.arc(cx,cy,ring.r,0,Math.PI*2)
    ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=8;ctx.stroke()
    ctx.beginPath();ctx.arc(cx,cy,ring.r,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(ring.pct,1)*p)
    ctx.strokeStyle=ring.color;ctx.lineWidth=8;ctx.lineCap='round';ctx.stroke()
  }
}
function drawVital(progress){
  if(progress===undefined)progress=1
  const canvas=vitalCanvasRef.value;if(!canvas)return
  const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height
  const pad={top:24,right:16,bottom:36,left:44},cw=W-pad.left-pad.right,ch=H-pad.top-pad.bottom
  ctx.clearRect(0,0,W,H)
  const {labels,series}=vitalData[activeVitalTab.value],n=labels.length
  const allVals=series.flatMap(s=>s.values)
  const minV=Math.floor(Math.min(...allVals)/10)*10,maxV=Math.ceil(Math.max(...allVals)/10)*10,range=maxV-minV||1
  ctx.save();ctx.font='10px sans-serif';ctx.fillStyle='#475569';ctx.textAlign='right'
  const tstep=Math.round(range/4/10)*10||10
  for(let t=minV;t<=maxV;t+=tstep){
    const y=pad.top+ch-((t-minV)/range)*ch
    ctx.beginPath();ctx.strokeStyle='rgba(148,163,184,0.1)';ctx.lineWidth=1
    ctx.moveTo(pad.left,y);ctx.lineTo(pad.left+cw,y);ctx.stroke()
    ctx.fillText(t,pad.left-6,y+3)
  }
  ctx.textAlign='center'
  const lstep=Math.max(1,Math.floor(n/6))
  for(let i=0;i<n;i+=lstep)ctx.fillText(labels[i],pad.left+(i/(n-1))*cw,H-8)
  ctx.restore()
  const dc=Math.max(1,Math.round(progress*(n-1)))
  for(const s of series){
    const pts=s.values.slice(0,dc+1)
    ctx.save()
    ctx.beginPath()
    pts.forEach((v,i)=>{const x=pad.left+(i/(n-1))*cw,y=pad.top+ch-((v-minV)/range)*ch;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)})
    const grad=ctx.createLinearGradient(0,pad.top,0,pad.top+ch)
    grad.addColorStop(0,s.color+'28');grad.addColorStop(1,s.color+'00')
    const lx=pad.left+((pts.length-1)/(n-1))*cw,ly=pad.top+ch-((pts[pts.length-1]-minV)/range)*ch
    ctx.lineTo(lx,pad.top+ch);ctx.lineTo(pad.left,pad.top+ch);ctx.closePath();ctx.fillStyle=grad;ctx.fill()
    ctx.beginPath()
    pts.forEach((v,i)=>{const x=pad.left+(i/(n-1))*cw,y=pad.top+ch-((v-minV)/range)*ch;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)})
    ctx.strokeStyle=s.color;ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke()
    ctx.beginPath();ctx.arc(lx,ly,4,0,Math.PI*2);ctx.fillStyle=s.color;ctx.fill()
    ctx.restore()
  }
}
function drawSleep(){
  const canvas=sleepCanvasRef.value;if(!canvas)return
  const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height
  const pad={top:16,right:16,bottom:28,left:36},cw=W-pad.left-pad.right,ch=H-pad.top-pad.bottom
  ctx.clearRect(0,0,W,H)
  const {labels,deep,light,rem}=sleepData,n=labels.length
  const barW=cw/n*0.55,gap=cw/n
  const colors=['#3b82f6','#8b5cf6','#22c55e'],layers=[deep,light,rem]
  const maxH=Math.max(...deep.map((d,i)=>d+light[i]+rem[i]))
  ctx.save();ctx.font='10px sans-serif';ctx.fillStyle='#475569';ctx.textAlign='center'
  for(let i=0;i<n;i++)ctx.fillText(labels[i],pad.left+(i+0.5)*gap,H-6)
  ctx.restore()
  for(let i=0;i<n;i++){
    let yOff=0
    for(let li=0;li<layers.length;li++){
      const val=layers[li][i],h=(val/maxH)*ch
      const x=pad.left+i*gap+(gap-barW)/2,y=pad.top+ch-yOff-h
      ctx.fillStyle=colors[li];ctx.fillRect(x,y,barW,h)
      yOff+=h
    }
  }
}
function animateVital(){
  let start=null;const dur=900
  function frame(ts){if(!start)start=ts;const p=Math.min((ts-start)/dur,1);drawVital(p);if(p<1)vitalAnimFrame=requestAnimationFrame(frame)}
  if(vitalAnimFrame)cancelAnimationFrame(vitalAnimFrame)
  vitalAnimFrame=requestAnimationFrame(frame)
}
function switchVitalTab(key){activeVitalTab.value=key;animateVital()}
function animateRings(){
  let start=null;const dur=1000
  function frame(ts){if(!start)start=ts;const p=Math.min((ts-start)/dur,1),e=1-Math.pow(1-p,3);drawLQI(e);drawActivity(e);if(p<1)requestAnimationFrame(frame)}
  requestAnimationFrame(frame)
}
function resizeCharts(){
  const vc=vitalCanvasRef.value,sc=sleepCanvasRef.value
  if(vc){vc.width=vc.parentElement.clientWidth;vc.height=200}
  if(sc){sc.width=sc.parentElement.clientWidth;sc.height=160}
}
onMounted(()=>{
  resizeCharts();animateVital();animateRings();drawSleep()
  refreshDashboardFromLatestMultimodal()
  dashboardRefreshTimer = setInterval(refreshDashboardFromLatestMultimodal, 60000)
  window.addEventListener('resize',()=>{resizeCharts();drawVital();drawSleep()})
})
onUnmounted(()=>{
  if(vitalAnimFrame)cancelAnimationFrame(vitalAnimFrame)
  if (dashboardRefreshTimer) clearInterval(dashboardRefreshTimer)
  window.removeEventListener('resize',()=>{})
})
</script>

<style scoped>
*{box-sizing:border-box}
.hd-page{display:flex;flex-direction:column;height:100%;min-height:calc(100vh - 48px);padding:0;overflow:hidden}
.hd-header{display:flex;align-items:center;justify-content:space-between;padding:16px 24px 12px;border-bottom:1px solid rgba(59,130,246,0.15);flex-shrink:0}
.hd-title{color:#f8fafc;font-size:22px;font-weight:700;margin:0 0 3px}
.hd-desc{color:#64748b;font-size:13px;margin:0}
.hd-header-right{display:flex;align-items:center;gap:16px}
.lqi-ring{position:relative;width:90px;height:90px;flex-shrink:0}
.lqi-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.lqi-val{color:#f8fafc;font-size:22px;font-weight:800;line-height:1}
.lqi-label{color:#64748b;font-size:10px}
.header-meta{display:flex;flex-direction:column;gap:4px}
.meta-name{color:#f8fafc;font-size:16px;font-weight:700}
.meta-row{display:flex;gap:6px}
.meta-tag{background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.2);color:#94a3b8;font-size:11px;padding:2px 8px;border-radius:6px}
.meta-update{color:#475569;font-size:11px}
.kpi-row{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;padding:12px 20px;flex-shrink:0;border-bottom:1px solid rgba(59,130,246,0.08)}
.kpi-card{background:rgba(15,23,41,0.8);border:1px solid rgba(59,130,246,0.15);border-radius:10px;padding:10px 12px}
.kpi-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.kpi-label{color:#64748b;font-size:11px}
.kpi-status{font-size:10px;font-weight:700;padding:1px 6px;border-radius:5px}
.kpi-status.normal{background:rgba(59,130,246,0.15);color:#3b82f6}
.kpi-status.good{background:rgba(34,197,94,0.15);color:#22c55e}
.kpi-status.warning{background:rgba(239,68,68,0.15);color:#ef4444}
.kpi-val-row{display:flex;align-items:baseline;gap:4px;margin-bottom:4px}
.kpi-val{color:#f8fafc;font-size:18px;font-weight:800;line-height:1}
.kpi-unit{color:#475569;font-size:10px}
.kpi-trend{font-size:10px;font-weight:600;margin-bottom:6px}
.kpi-trend.up{color:#ef4444}.kpi-trend.down{color:#22c55e}.kpi-trend.flat{color:#64748b}
.kpi-bar-bg{height:3px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden}
.kpi-bar-fill{height:100%;border-radius:2px;transition:width 0.6s}
.main-grid{display:grid;grid-template-columns:1fr 280px;grid-template-rows:auto auto auto;gap:12px;padding:12px 20px 16px;flex:1;overflow-y:auto;min-height:0}
.main-grid::-webkit-scrollbar{width:4px}
.main-grid::-webkit-scrollbar-thumb{background:rgba(59,130,246,0.2);border-radius:4px}
.grid-card{background:rgba(13,27,42,0.7);border:1px solid rgba(59,130,246,0.12);border-radius:14px;padding:14px}
.chart-card{grid-column:1;grid-row:1}
.ring-card{grid-column:2;grid-row:1/3}
.sleep-card{grid-column:1;grid-row:2}
.events-card{grid-column:1/3;grid-row:3}
.card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.card-title{color:#f8fafc;font-size:13px;font-weight:700}
.card-sub{color:#475569;font-size:11px}
.chart-tabs{display:flex;gap:4px}
.chart-tab{padding:3px 10px;border-radius:6px;font-size:11px;color:#64748b;cursor:pointer;transition:all 0.15s}
.chart-tab.active{background:rgba(59,130,246,0.2);color:#3b82f6;font-weight:700}
.chart-canvas{display:block;width:100%}
.chart-legend{display:flex;gap:12px;padding:8px 0 0}
.cl-item{display:flex;align-items:center;gap:5px;color:#94a3b8;font-size:11px}
.cl-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.ring-wrap{position:relative;display:flex;justify-content:center;margin:8px 0}
.ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ring-steps{color:#f8fafc;font-size:18px;font-weight:800;line-height:1}
.ring-label{color:#64748b;font-size:10px}
.activity-stats{display:flex;flex-direction:column;gap:8px;margin-top:8px}
.act-row{display:flex;align-items:center;gap:8px}
.act-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.act-label{color:#94a3b8;font-size:12px;flex:1}
.act-val{color:#f8fafc;font-size:12px;font-weight:600}
.sleep-stats{display:flex;gap:16px;padding:10px 0 0}
.sleep-stat{text-align:center}
.ss-val{color:#f8fafc;font-size:16px;font-weight:700}
.ss-label{color:#64748b;font-size:10px;margin-top:2px}
.events-list{display:flex;flex-direction:column;gap:8px}
.event-item{display:flex;align-items:flex-start;gap:10px;padding:8px 10px;border-radius:8px;background:rgba(15,23,41,0.6);border:1px solid rgba(59,130,246,0.08)}
.event-dot{width:8px;height:8px;border-radius:50%;margin-top:4px;flex-shrink:0}
.event-dot.warning{background:#eab308;box-shadow:0 0 5px #eab308}
.event-dot.good{background:#22c55e;box-shadow:0 0 5px #22c55e}
.event-dot.info{background:#3b82f6}
.event-body{flex:1;min-width:0}
.event-title{color:#f8fafc;font-size:12px;font-weight:600;margin-bottom:2px}
.event-desc{color:#94a3b8;font-size:11px;line-height:1.4}
.event-time{color:#475569;font-size:10px;white-space:nowrap;flex-shrink:0}

/* ===== 移动端 ===== */
@media(max-width:768px){
  .hd-page{min-height:auto;overflow:auto}
  .hd-header{flex-direction:column;align-items:flex-start;gap:12px;padding:12px 14px 10px}
  .hd-title{font-size:18px}
  .hd-header-right{flex-direction:row;gap:10px;width:100%}
  .lqi-ring{width:70px;height:70px}
  .lqi-val{font-size:18px}
  .meta-name{font-size:14px}
  .kpi-row{grid-template-columns:repeat(3,1fr);gap:7px;padding:10px 12px}
  .kpi-val{font-size:15px}
  .main-grid{grid-template-columns:1fr;grid-template-rows:auto;gap:10px;padding:10px 12px 60px;overflow:visible}
  .chart-card{grid-column:1;grid-row:auto}
  .ring-card{grid-column:1;grid-row:auto}
  .sleep-card{grid-column:1;grid-row:auto}
  .events-card{grid-column:1;grid-row:auto}
  .ring-wrap canvas{width:140px!important;height:140px!important}
}
@media(max-width:400px){
  .kpi-row{grid-template-columns:repeat(2,1fr)}
}
</style>
