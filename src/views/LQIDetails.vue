<template>
  <div class="lqi-page">
    <div class="lqi-header">
      <div><h1 class="lqi-title">LQI 详情</h1><p class="lqi-desc">生命质量指数详细数据与分析</p></div>
      <div class="header-right">
        <div class="lqi-score-block">
          <canvas ref="gaugeRef" width="120" height="120"></canvas>
          <div class="gauge-center">
            <span class="gauge-val">{{ lqiScore }}</span>
            <span class="gauge-label">LQI</span>
          </div>
        </div>
        <div class="lqi-meta">
          <div class="lqi-grade" :class="gradeClass">{{ grade }}</div>
          <div class="lqi-comment">{{ gradeComment }}</div>
          <div class="lqi-update">评估时间：{{ lastUpdate }}</div>
          <div class="lqi-trend-row">
            <span class="trend-label">较上周</span>
            <span class="trend-val" :class="weekTrend > 0 ? 'up' : weekTrend < 0 ? 'down' : 'flat'">
              {{ weekTrend > 0 ? '↑' : weekTrend < 0 ? '↓' : '—' }} {{ Math.abs(weekTrend) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="lqi-body">
      <!-- Left -->
      <div class="lqi-left">
        <div class="sec-title">LQI 维度评分</div>
        <div class="dim-list">
          <div v-for="d in dimensions" :key="d.key" class="dim-item"
            :class="{ active: selectedDim===d.key }" @click="selectedDim=d.key">
            <div class="dim-head">
              <span class="dim-name">{{ d.name }}</span>
              <span class="dim-score" :style="{ color: d.color }">{{ d.score }}</span>
            </div>
            <div class="dim-bar-bg">
              <div class="dim-bar-fill" :style="{ width: d.score+'%', background: d.color }"></div>
            </div>
            <div class="dim-sub">{{ d.comment }}</div>
          </div>
        </div>

        <div class="sec-title" style="margin-top:18px">影响因素</div>
        <div class="factor-list">
          <div v-for="f in factors" :key="f.id" class="factor-item" :class="f.impact">
            <span class="factor-icon">{{ f.impact==='positive' ? '+' : f.impact==='negative' ? '−' : '·' }}</span>
            <div class="factor-body">
              <div class="factor-name">{{ f.name }}</div>
              <div class="factor-desc">{{ f.desc }}</div>
            </div>
            <span class="factor-pts" :class="f.impact">{{ f.pts > 0 ? '+' : '' }}{{ f.pts }}</span>
          </div>
        </div>
      </div>

      <!-- Right -->
      <div class="lqi-right">
        <div class="sec-title">LQI 历史趋势
          <div class="chart-tabs">
            <span v-for="t in tabs" :key="t.key" class="chart-tab"
              :class="{ active: activeTab===t.key }" @click="switchTab(t.key)">{{ t.label }}</span>
          </div>
        </div>
        <div class="trend-wrap">
          <canvas ref="trendRef" class="trend-canvas"></canvas>
        </div>

        <div class="sec-title" style="margin-top:18px">维度雷达图</div>
        <div class="radar-wrap">
          <canvas ref="radarRef" width="240" height="240"></canvas>
          <div class="radar-legend">
            <div v-for="d in dimensions" :key="d.key" class="rl-item">
              <span class="rl-dot" :style="{ background: d.color }"></span>
              <span class="rl-name">{{ d.name }}</span>
              <span class="rl-val" :style="{ color: d.color }">{{ d.score }}</span>
            </div>
          </div>
        </div>

        <div class="sec-title" style="margin-top:18px">改善建议</div>
        <div class="suggest-list">
          <div v-for="s in suggestions" :key="s.id" class="suggest-item">
            <span class="s-tag" :class="s.priority">{{ s.priorityLabel }}</span>
            <div class="s-body">
              <div class="s-title">{{ s.title }}</div>
              <div class="s-desc">{{ s.desc }}</div>
            </div>
            <span class="s-pts">+{{ s.pts }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const lqiScore = ref(78)
const weekTrend = ref(3)
const lastUpdate = ref('2026-03-11 09:32')
const grade = computed(() => {
  const s = lqiScore.value
  if (s >= 90) return '优秀'
  if (s >= 75) return '良好'
  if (s >= 60) return '中等'
  if (s >= 45) return '偏低'
  return '较差'
})
const gradeClass = computed(() => {
  const s = lqiScore.value
  if (s >= 90) return 'grade-excellent'
  if (s >= 75) return 'grade-good'
  if (s >= 60) return 'grade-medium'
  return 'grade-low'
})
const gradeComment = computed(() => {
  const s = lqiScore.value
  if (s >= 90) return '各项指标表现优异，继续保持'
  if (s >= 75) return '整体健康状况良好，有提升空间'
  if (s >= 60) return '部分指标需要关注和改善'
  return '建议尽快进行健康干预'
})

const dimensions = ref([
  { key:'cardio',   name:'心肺功能', score:82, color:'#3b82f6', comment:'心率稳定，有氧能力良好' },
  { key:'metabolic',name:'代谢健康', score:70, color:'#f97316', comment:'血糖略偏高，需控制饮食' },
  { key:'sleep',    name:'睡眠质量', score:65, color:'#8b5cf6', comment:'深睡比例偏低，建议早睡' },
  { key:'mental',   name:'心理状态', score:80, color:'#22c55e', comment:'压力水平正常，情绪稳定' },
  { key:'activity', name:'活动水平', score:88, color:'#06b6d4', comment:'日均步数达标，运动充足' },
  { key:'nutrition',name:'营养状态', score:72, color:'#eab308', comment:'蛋白质摄入不足，需补充' },
])

const selectedDim = ref('cardio')

const factors = ref([
  { id:1, impact:'positive', name:'规律运动',     desc:'连续21天完成步数目标',            pts:+5 },
  { id:2, impact:'positive', name:'按时服药',     desc:'近30天服药依从性98%',             pts:+3 },
  { id:3, impact:'negative', name:'睡眠不足',     desc:'本周平均睡眠仅5.8小时',           pts:-4 },
  { id:4, impact:'negative', name:'血压波动',     desc:'收缩压多次超过135mmHg',           pts:-3 },
  { id:5, impact:'positive', name:'饮食改善',     desc:'本周减少高盐食物摄入',            pts:+2 },
  { id:6, impact:'neutral',  name:'体重稳定',     desc:'近2周体重波动在0.5kg以内',        pts:0  },
])

const suggestions = ref([
  { id:1, priority:'urgent', priorityLabel:'紧急', title:'改善睡眠质量', desc:'建议23:00前就寝，保证7小时以上睡眠',    pts:8 },
  { id:2, priority:'high',   priorityLabel:'重要', title:'控制血糖波动', desc:'餐后散步15分钟，减少精制碳水摄入',       pts:6 },
  { id:3, priority:'medium', priorityLabel:'建议', title:'增加蛋白质摄入', desc:'每日蛋白质目标72g，当前摄入约55g',    pts:4 },
  { id:4, priority:'low',    priorityLabel:'提示', title:'定期复查血压', desc:'建议每日早晨测量并记录血压数据',         pts:2 },
])

const tabs = [
  { key:'week',  label:'近7天'  },
  { key:'month', label:'近30天' },
  { key:'year',  label:'近6月'  },
]
const activeTab = ref('month')

function genLQI(base, noise, len) {
  const a = []; let v = base
  for (let i = 0; i < len; i++) {
    v = Math.max(40, Math.min(99, v + (Math.random()-0.5)*noise))
    a.push(Math.round(v))
  }
  return a
}

const trendData = {
  week:  { labels:['周一','周二','周三','周四','周五','周六','周日'], values: genLQI(75,5,7) },
  month: { labels:Array.from({length:30},(_,i)=>`${i+1}日`),        values: genLQI(74,6,30) },
  year:  { labels:['10月','11月','12月','1月','2月','3月'],           values: genLQI(70,8,6) },
}

const gaugeRef = ref(null)
const trendRef = ref(null)
const radarRef = ref(null)
let trendAnim = null
function drawGauge(p) {
  if (p===undefined) p=1
  const c=gaugeRef.value; if(!c) return
  const ctx=c.getContext('2d'),W=c.width,H=c.height,cx=W/2,cy=H/2+8,R=46
  ctx.clearRect(0,0,W,H)
  const startA=Math.PI*0.75,endA=Math.PI*2.25
  ctx.beginPath();ctx.arc(cx,cy,R,startA,endA)
  ctx.strokeStyle='rgba(59,130,246,0.12)';ctx.lineWidth=10;ctx.stroke()
  const scoreA=startA+(lqiScore.value/100)*(endA-startA)*p
  const g=ctx.createLinearGradient(cx-R,cy,cx+R,cy)
  g.addColorStop(0,'#ef4444');g.addColorStop(0.5,'#eab308');g.addColorStop(1,'#22c55e')
  ctx.beginPath();ctx.arc(cx,cy,R,startA,scoreA)
  ctx.strokeStyle=g;ctx.lineWidth=10;ctx.lineCap='round';ctx.stroke()
}
function drawTrend(progress) {
  if (progress===undefined) progress=1
  const canvas=trendRef.value; if(!canvas) return
  const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height
  const pad={top:20,right:16,bottom:32,left:40},cw=W-pad.left-pad.right,ch=H-pad.top-pad.bottom
  ctx.clearRect(0,0,W,H)
  const {labels,values}=trendData[activeTab.value],n=labels.length
  const minV=Math.floor(Math.min(...values)/10)*10
  const maxV=Math.ceil(Math.max(...values)/10)*10,range=maxV-minV||1
  ctx.save();ctx.font='10px sans-serif';ctx.fillStyle='#475569';ctx.textAlign='right'
  for(const t of [minV,Math.round((minV+maxV)/2),maxV]){
    const y=pad.top+ch-((t-minV)/range)*ch
    ctx.beginPath();ctx.strokeStyle='rgba(148,163,184,0.1)';ctx.lineWidth=1
    ctx.moveTo(pad.left,y);ctx.lineTo(pad.left+cw,y);ctx.stroke()
    ctx.fillText(t,pad.left-5,y+3)
  }
  ctx.textAlign='center'
  const lstep=Math.max(1,Math.floor(n/6))
  for(let i=0;i<n;i+=lstep)ctx.fillText(labels[i],pad.left+(i/(n-1))*cw,H-8)
  ctx.restore()
  const dc=Math.max(1,Math.round(progress*(n-1)))
  const pts=values.slice(0,dc+1)
  ctx.save();ctx.beginPath()
  pts.forEach((v,i)=>{const x=pad.left+(i/(n-1))*cw,y=pad.top+ch-((v-minV)/range)*ch;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)})
  const grad=ctx.createLinearGradient(0,pad.top,0,pad.top+ch)
  grad.addColorStop(0,'#3b82f644');grad.addColorStop(1,'#3b82f600')
  const lx=pad.left+((pts.length-1)/(n-1))*cw,ly=pad.top+ch-((pts[pts.length-1]-minV)/range)*ch
  ctx.lineTo(lx,pad.top+ch);ctx.lineTo(pad.left,pad.top+ch);ctx.closePath()
  ctx.fillStyle=grad;ctx.fill()
  ctx.beginPath()
  pts.forEach((v,i)=>{const x=pad.left+(i/(n-1))*cw,y=pad.top+ch-((v-minV)/range)*ch;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)})
  ctx.strokeStyle='#3b82f6';ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke()
  pts.forEach((v,i)=>{const x=pad.left+(i/(n-1))*cw,y=pad.top+ch-((v-minV)/range)*ch;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle='#3b82f6';ctx.fill()})
  ctx.restore()
}
function drawRadar(progress) {
  if (progress===undefined) progress=1
  const canvas=radarRef.value; if(!canvas) return
  const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height
  const cx=W/2,cy=H/2,R=Math.min(W,H)/2-30,dims=dimensions.value,n=dims.length
  ctx.clearRect(0,0,W,H)
  for(let ring=1;ring<=4;ring++){
    const r=(ring/4)*R;ctx.beginPath()
    for(let i=0;i<n;i++){const a=(2*Math.PI*i)/n-Math.PI/2;i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a))}
    ctx.closePath();ctx.strokeStyle='rgba(148,163,184,0.12)';ctx.lineWidth=1;ctx.stroke()
  }
  ctx.font='10px sans-serif'
  for(let i=0;i<n;i++){
    const a=(2*Math.PI*i)/n-Math.PI/2
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a))
    ctx.strokeStyle='rgba(148,163,184,0.15)';ctx.lineWidth=1;ctx.stroke()
    ctx.fillStyle='#94a3b8';ctx.textAlign='center';ctx.textBaseline='middle'
    ctx.fillText(dims[i].name,cx+(R+18)*Math.cos(a),cy+(R+18)*Math.sin(a))
  }
  ctx.save();ctx.beginPath()
  for(let i=0;i<n;i++){const a=(2*Math.PI*i)/n-Math.PI/2,r=(dims[i].score/100)*R*progress;i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a))}
  ctx.closePath()
  const g=ctx.createRadialGradient(cx,cy,0,cx,cy,R)
  g.addColorStop(0,'rgba(59,130,246,0.4)');g.addColorStop(1,'rgba(139,92,246,0.15)')
  ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#3b82f6';ctx.lineWidth=2;ctx.stroke()
  for(let i=0;i<n;i++){const a=(2*Math.PI*i)/n-Math.PI/2,r=(dims[i].score/100)*R*progress;ctx.beginPath();ctx.arc(cx+r*Math.cos(a),cy+r*Math.sin(a),4,0,Math.PI*2);ctx.fillStyle=dims[i].color;ctx.fill()}
  ctx.restore()
}
function animateTrend(){
  let start=null;const dur=900
  function frame(ts){if(!start)start=ts;const p=Math.min((ts-start)/dur,1);drawTrend(p);if(p<1)trendAnim=requestAnimationFrame(frame)}
  if(trendAnim)cancelAnimationFrame(trendAnim);trendAnim=requestAnimationFrame(frame)
}
function switchTab(key){activeTab.value=key;animateTrend()}
function resizeTrend(){const c=trendRef.value;if(!c)return;c.width=c.parentElement.clientWidth;c.height=180}
onMounted(()=>{
  resizeTrend()
  let start=null;const dur=1000
  function frame(ts){if(!start)start=ts;const p=Math.min((ts-start)/dur,1),e=1-Math.pow(1-p,3);drawGauge(e);drawRadar(e);if(p<1)requestAnimationFrame(frame)}
  requestAnimationFrame(frame);animateTrend()
  window.addEventListener('resize',()=>{resizeTrend();drawTrend()})
})
onUnmounted(()=>{
  if(trendAnim)cancelAnimationFrame(trendAnim)
  window.removeEventListener('resize',()=>{})
})
</script>
<style scoped>
*{box-sizing:border-box}
.lqi-page{display:flex;flex-direction:column;height:100%;min-height:calc(100vh - 48px);padding:0;overflow:hidden}
.lqi-header{display:flex;align-items:center;justify-content:space-between;padding:16px 24px 12px;border-bottom:1px solid rgba(59,130,246,0.15);flex-shrink:0}
.lqi-title{color:#f8fafc;font-size:22px;font-weight:700;margin:0 0 3px}
.lqi-desc{color:#64748b;font-size:13px;margin:0}
.header-right{display:flex;align-items:center;gap:20px}
.lqi-score-block{position:relative;width:120px;height:120px;flex-shrink:0}
.gauge-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:10px}
.gauge-val{color:#f8fafc;font-size:28px;font-weight:800;line-height:1}
.gauge-label{color:#64748b;font-size:11px}
.lqi-meta{display:flex;flex-direction:column;gap:6px}
.lqi-grade{font-size:18px;font-weight:800;padding:4px 14px;border-radius:8px;display:inline-block}
.grade-excellent{background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.3)}
.grade-good{background:rgba(59,130,246,0.15);color:#3b82f6;border:1px solid rgba(59,130,246,0.3)}
.grade-medium{background:rgba(234,179,8,0.15);color:#eab308;border:1px solid rgba(234,179,8,0.3)}
.grade-low{background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.3)}
.lqi-comment{color:#94a3b8;font-size:12px}
.lqi-update{color:#475569;font-size:11px}
.lqi-trend-row{display:flex;align-items:center;gap:6px}
.trend-label{color:#64748b;font-size:11px}
.trend-val{font-size:13px;font-weight:700}
.trend-val.up{color:#22c55e}.trend-val.down{color:#ef4444}.trend-val.flat{color:#64748b}
.lqi-body{display:flex;flex:1;overflow:hidden}
.lqi-left{width:320px;min-width:280px;display:flex;flex-direction:column;overflow-y:auto;padding:16px 14px;border-right:1px solid rgba(59,130,246,0.12)}
.lqi-left::-webkit-scrollbar{width:4px}
.lqi-left::-webkit-scrollbar-thumb{background:rgba(59,130,246,0.2);border-radius:4px}
.lqi-right{flex:1;display:flex;flex-direction:column;overflow-y:auto;padding:16px 18px}
.lqi-right::-webkit-scrollbar{width:4px}
.lqi-right::-webkit-scrollbar-thumb{background:rgba(59,130,246,0.2);border-radius:4px}
.sec-title{color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between}
.dim-list{display:flex;flex-direction:column;gap:10px}
.dim-item{background:rgba(15,23,41,0.8);border:1px solid rgba(59,130,246,0.12);border-radius:10px;padding:10px 12px;cursor:pointer;transition:all 0.2s}
.dim-item:hover{border-color:rgba(59,130,246,0.35)}
.dim-item.active{border-color:#3b82f6;background:rgba(59,130,246,0.08)}
.dim-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.dim-name{color:#cbd5e1;font-size:12px;font-weight:600}
.dim-score{font-size:16px;font-weight:800}
.dim-bar-bg{height:4px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;margin-bottom:5px}
.dim-bar-fill{height:100%;border-radius:3px;transition:width 0.6s}
.dim-sub{color:#64748b;font-size:10px}
.factor-list{display:flex;flex-direction:column;gap:8px}
.factor-item{display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:8px;border:1px solid}
.factor-item.positive{border-color:rgba(34,197,94,0.25);background:rgba(34,197,94,0.06)}
.factor-item.negative{border-color:rgba(239,68,68,0.25);background:rgba(239,68,68,0.06)}
.factor-item.neutral{border-color:rgba(100,116,139,0.2);background:rgba(100,116,139,0.05)}
.factor-icon{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;margin-top:1px}
.factor-item.positive .factor-icon{background:rgba(34,197,94,0.2);color:#22c55e}
.factor-item.negative .factor-icon{background:rgba(239,68,68,0.2);color:#ef4444}
.factor-item.neutral  .factor-icon{background:rgba(100,116,139,0.2);color:#64748b}
.factor-body{flex:1}
.factor-name{color:#f8fafc;font-size:12px;font-weight:600;margin-bottom:2px}
.factor-desc{color:#94a3b8;font-size:10px;line-height:1.4}
.factor-pts{font-size:13px;font-weight:800;flex-shrink:0}
.factor-item.positive .factor-pts{color:#22c55e}
.factor-item.negative .factor-pts{color:#ef4444}
.factor-item.neutral  .factor-pts{color:#64748b}
.chart-tabs{display:flex;gap:4px}
.chart-tab{padding:3px 10px;border-radius:6px;font-size:11px;color:#64748b;cursor:pointer;transition:all 0.15s}
.chart-tab.active{background:rgba(59,130,246,0.2);color:#3b82f6;font-weight:700}
.trend-wrap{background:rgba(13,27,42,0.6);border:1px solid rgba(59,130,246,0.12);border-radius:12px;padding:12px}
.trend-canvas{display:block;width:100%}
.radar-wrap{display:flex;align-items:center;gap:16px;background:rgba(13,27,42,0.6);border:1px solid rgba(59,130,246,0.12);border-radius:12px;padding:14px}
.radar-legend{flex:1;display:flex;flex-direction:column;gap:8px}
.rl-item{display:flex;align-items:center;gap:8px}
.rl-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.rl-name{color:#94a3b8;font-size:12px;flex:1}
.rl-val{font-size:13px;font-weight:700}
.suggest-list{display:flex;flex-direction:column;gap:10px;padding-bottom:16px}
.suggest-item{display:flex;align-items:flex-start;gap:10px;background:rgba(15,23,41,0.8);border:1px solid rgba(59,130,246,0.12);border-radius:10px;padding:12px}
.s-tag{font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;white-space:nowrap;flex-shrink:0}
.s-tag.urgent{background:rgba(239,68,68,0.2);color:#ef4444}
.s-tag.high{background:rgba(249,115,22,0.2);color:#f97316}
.s-tag.medium{background:rgba(59,130,246,0.2);color:#3b82f6}
.s-tag.low{background:rgba(100,116,139,0.2);color:#64748b}
.s-body{flex:1}
.s-title{color:#f8fafc;font-size:12px;font-weight:600;margin-bottom:3px}
.s-desc{color:#94a3b8;font-size:11px;line-height:1.5}
.s-pts{color:#22c55e;font-size:13px;font-weight:800;flex-shrink:0}

/* ===== 移动端 ===== */
@media(max-width:768px){
  .lqi-page{min-height:auto;overflow:auto}
  .lqi-header{flex-direction:column;align-items:flex-start;gap:10px;padding:12px 14px 10px}
  .lqi-title{font-size:18px}
  .header-right{flex-direction:row;gap:10px;align-items:center}
  .lqi-score-block{width:90px;height:90px}
  .gauge-val{font-size:22px}
  .lqi-grade{font-size:14px;padding:3px 10px}
  .lqi-body{flex-direction:column;overflow:visible}
  .lqi-left{width:100%;min-width:unset;border-right:none;border-bottom:1px solid rgba(59,130,246,0.12);padding:14px 12px;overflow:visible}
  .lqi-right{padding:14px 12px;overflow:visible}
  .radar-wrap{flex-direction:column;align-items:center}
  .radar-wrap canvas{width:200px!important;height:200px!important}
}
</style>
