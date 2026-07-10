<template>
  <div class="rpt-page">
    <div class="rpt-header">
      <div><h1 class="rpt-title">健康报告</h1><p class="rpt-desc">综合健康评估报告与历史记录</p></div>
      <div class="header-actions">
        <select v-model="selectedPeriod" class="period-select">
          <option v-for="p in periods" :key="p.key" :value="p.key">{{ p.label }}</option>
        </select>
        <button class="btn-export">导出报告</button>
      </div>
    </div>
    <div class="rpt-body">
      <div class="summary-row">
        <div v-for="s in summaryCards" :key="s.key" class="sum-card" :class="s.color">
          <div class="sum-icon">{{ s.icon }}</div>
          <div class="sum-body">
            <div class="sum-label">{{ s.label }}</div>
            <div class="sum-val">{{ s.value }}</div>
            <div class="sum-change" :class="s.changeDir">{{ s.change }}</div>
          </div>
        </div>
      </div>
      <div class="rpt-main">
        <div class="rpt-left">
          <div class="sec-title">报告列表</div>
          <div class="report-list">
            <div v-for="r in reports" :key="r.id"
              class="report-item" :class="{ active: selectedReport===r.id }"
              @click="selectedReport=r.id">
              <div class="ri-top">
                <span class="ri-type" :class="r.type">{{ r.typeLabel }}</span>
                <span class="ri-date">{{ r.date }}</span>
              </div>
              <div class="ri-title">{{ r.title }}</div>
              <div class="ri-summary">{{ r.summary }}</div>
              <div class="ri-score-row">
                <span class="ri-score-label">综合评分</span>
                <span class="ri-score" :class="r.scoreClass">{{ r.score }}</span>
                <span class="ri-trend" :class="r.trend>0?'up':'down'">{{ r.trend>0?'↑':'↓' }}{{ Math.abs(r.trend) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="rpt-right">
          <div class="sec-title">报告详情</div>
          <div class="report-detail" v-if="currentReport">
            <div class="detail-header">
              <h2 class="detail-title">{{ currentReport.title }}</h2>
              <div class="detail-meta">
                <span class="ri-type" :class="currentReport.type">{{ currentReport.typeLabel }}</span>
                <span class="detail-date">{{ currentReport.date }}</span>
                <span class="detail-doctor">{{ currentReport.doctor }}</span>
              </div>
            </div>
            <div class="detail-score-row">
              <canvas ref="scoreCanvasRef" width="100" height="100"></canvas>
              <div class="score-info">
                <div class="score-big" :class="currentReport.scoreClass">{{ currentReport.score }}</div>
                <div class="score-label">综合健康评分</div>
                <div class="score-desc">{{ currentReport.scoreDesc }}</div>
              </div>
              <div class="score-items">
                <div v-for="item in currentReport.items" :key="item.key" class="score-item">
                  <span class="si-name">{{ item.name }}</span>
                  <span class="si-bar-bg"><span class="si-bar" :style="{width:item.score+'%',background:item.color}"></span></span>
                  <span class="si-val" :style="{color:item.color}">{{ item.score }}</span>
                </div>
              </div>
            </div>
            <div class="detail-sections">
              <div v-for="sec in currentReport.sections" :key="sec.title" class="detail-section">
                <div class="ds-title">{{ sec.title }}</div>
                <div class="ds-content">{{ sec.content }}</div>
                <div v-if="sec.findings" class="ds-findings">
                  <div v-for="f in sec.findings" :key="f" class="ds-finding"><span class="ds-dot"></span>{{ f }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="trend-section">
        <div class="sec-title">健康评分趋势</div>
        <div class="trend-wrap"><canvas ref="trendCanvasRef" class="trend-canvas"></canvas></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const selectedPeriod = ref('year')
const periods = [
  {key:'month',label:'近1个月'},{key:'quarter',label:'近3个月'},
  {key:'halfyear',label:'近6个月'},{key:'year',label:'近1年'},
]

const summaryCards = ref([
  {key:'reports',  icon:'R', label:'报告总数',   value:'12',   change:'本年度',       changeDir:'',     color:'blue'},
  {key:'avg',      icon:'S', label:'平均评分',   value:'76.4', change:'↑3.2 较上期',  changeDir:'up',   color:'green'},
  {key:'alerts',   icon:'W', label:'预警次数',   value:'3',    change:'↓2 较上期',    changeDir:'down', color:'yellow'},
  {key:'followup', icon:'C', label:'随访完成率', value:'91%',  change:'↑5% 较上期',  changeDir:'up',   color:'cyan'},
])

const reports = ref([
  { id:1, type:'annual',  typeLabel:'年度报告', date:'2026-01-15', title:'2025年度健康综合报告',
    summary:'年度体检综合评估，各项指标整体良好', score:82, scoreClass:'good', trend:5,
    doctor:'王医生', scoreDesc:'健康状况良好，有提升空间',
    items:[
      {key:'cardio',name:'心肺',score:85,color:'#3b82f6'},
      {key:'metabolic',name:'代谢',score:72,color:'#f97316'},
      {key:'neuro',name:'神经',score:80,color:'#8b5cf6'},
      {key:'immune',name:'免疫',score:88,color:'#22c55e'},
    ],
    sections:[
      {title:'总体评估',content:'本次年度体检结果显示，患者整体健康状况良好，较去年有所改善。心肺功能正常，代谢指标基本达标。',
       findings:['血压控制良好，平均收缩压128mmHg','血糖略偏高，空腹血糖6.2mmol/L','体重指数24.8，处于正常范围','肺功能FVC达到预测值95%']},
      {title:'风险提示',content:'以下方面需要重点关注和持续监测：',
       findings:['血糖波动需持续监控，建议低糖饮食','睡眠质量有待改善，建议规律作息','注意颈椎保健，减少长时间低头']},
      {title:'随访建议',content:'建议3个月后复查血糖和血压，半年后进行下一次全面体检。继续保持当前的运动习惯，同时加强饮食管理。',findings:null},
    ]},
  { id:2, type:'monthly', typeLabel:'月度报告', date:'2026-03-01', title:'2026年3月健康月报',
    summary:'本月血压控制良好，运动达标，睡眠质量待改善', score:76, scoreClass:'medium', trend:2,
    doctor:'李医生', scoreDesc:'整体状况中等偏好',
    items:[
      {key:'cardio',name:'心肺',score:80,color:'#3b82f6'},
      {key:'metabolic',name:'代谢',score:68,color:'#f97316'},
      {key:'sleep',name:'睡眠',score:62,color:'#8b5cf6'},
      {key:'activity',name:'活动',score:90,color:'#22c55e'},
    ],
    sections:[
      {title:'本月亮点',content:'本月运动目标完成率达92%，步数连续21天超过8000步，心率变异性较上月提升8%。',
       findings:['步数目标达成率92%','有氧运动时长186分钟，超出目标24%','静息心率降至68bpm，较上月改善']},
      {title:'待改善项',content:'睡眠质量和血糖管理是本月主要待改善方向。',
       findings:['平均睡眠5.9小时，未达7小时目标','餐后血糖峰值偏高，最高8.1mmol/L','3次血压读数超过135/85mmHg']},
      {title:'下月计划',content:'建议下月重点关注睡眠管理，设置固定就寝时间，并配合饮食调整控制餐后血糖。',findings:null},
    ]},
  { id:3, type:'checkup', typeLabel:'体检报告', date:'2025-09-20', title:'2025年秋季专项体检',
    summary:'心血管专项检查，结果基本正常', score:79, scoreClass:'medium', trend:-1,
    doctor:'陈医生', scoreDesc:'心血管功能良好',
    items:[
      {key:'cardio',name:'心肺',score:84,color:'#3b82f6'},
      {key:'vessel',name:'血管',score:76,color:'#ef4444'},
      {key:'blood',name:'血液',score:80,color:'#06b6d4'},
      {key:'ecg',name:'心电',score:88,color:'#22c55e'},
    ],
    sections:[
      {title:'检查结论',content:'心脏功能正常，心电图无明显异常。颈动脉超声提示轻度斑块，建议定期复查。',
       findings:['心脏彩超：左室功能正常，EF值62%','心电图：窦性心律，PR间期正常','颈动脉：双侧内中膜轻度增厚0.9mm','血脂：LDL-C 3.2mmol/L，略偏高']},
      {title:'医生建议',content:'建议低脂饮食，适度有氧运动，6个月后复查颈动脉超声和血脂。',
       findings:['坚持每日步行30分钟以上','减少红肉及油炸食品摄入','遵医嘱服用他汀类药物']},
      {title:'复查计划',content:'2026年3月复查血脂四项和颈动脉超声，与本次结果对比分析。',findings:null},
    ]},
])

const selectedReport = ref(1)
const currentReport = computed(() => reports.value.find(r => r.id === selectedReport.value))

function genTrend(base, n) {
  const a=[]; let v=base
  for(let i=0;i<n;i++){v=Math.max(50,Math.min(99,v+(Math.random()-0.45)*5));a.push(Math.round(v))}
  return a
}
const trendLabels = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
const trendValues = genTrend(72, 12)

const scoreCanvasRef = ref(null)
const trendCanvasRef = ref(null)
let trendAnim = null
function drawScoreRing(score) {
  const c=scoreCanvasRef.value; if(!c) return
  const ctx=c.getContext('2d'),W=c.width,H=c.height,cx=W/2,cy=H/2,R=40
  ctx.clearRect(0,0,W,H)
  ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2)
  ctx.strokeStyle='rgba(59,130,246,0.12)';ctx.lineWidth=8;ctx.stroke()
  const end=-Math.PI/2+(score/100)*Math.PI*2
  const g=ctx.createLinearGradient(cx-R,cy,cx+R,cy)
  g.addColorStop(0,'#3b82f6');g.addColorStop(1,'#22c55e')
  ctx.beginPath();ctx.arc(cx,cy,R,-Math.PI/2,end)
  ctx.strokeStyle=g;ctx.lineWidth=8;ctx.lineCap='round';ctx.stroke()
}
function drawTrend(progress) {
  if(progress===undefined)progress=1
  const canvas=trendCanvasRef.value; if(!canvas) return
  const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height
  const pad={top:20,right:20,bottom:32,left:40},cw=W-pad.left-pad.right,ch=H-pad.top-pad.bottom
  ctx.clearRect(0,0,W,H)
  const n=trendLabels.length
  const minV=Math.floor(Math.min(...trendValues)/10)*10
  const maxV=Math.ceil(Math.max(...trendValues)/10)*10,range=maxV-minV||1
  ctx.save();ctx.font='10px sans-serif';ctx.fillStyle='#475569';ctx.textAlign='right'
  for(const t of [minV,Math.round((minV+maxV)/2),maxV]){
    const y=pad.top+ch-((t-minV)/range)*ch
    ctx.beginPath();ctx.strokeStyle='rgba(148,163,184,0.1)';ctx.lineWidth=1
    ctx.moveTo(pad.left,y);ctx.lineTo(pad.left+cw,y);ctx.stroke()
    ctx.fillText(t,pad.left-5,y+3)
  }
  ctx.textAlign='center'
  for(let i=0;i<n;i++)ctx.fillText(trendLabels[i],pad.left+(i/(n-1))*cw,H-8)
  ctx.restore()
  const dc=Math.max(1,Math.round(progress*(n-1)))
  const pts=trendValues.slice(0,dc+1)
  ctx.save();ctx.beginPath()
  pts.forEach((v,i)=>{const x=pad.left+(i/(n-1))*cw,y=pad.top+ch-((v-minV)/range)*ch;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)})
  const grad=ctx.createLinearGradient(0,pad.top,0,pad.top+ch)
  grad.addColorStop(0,'#3b82f644');grad.addColorStop(1,'#3b82f600')
  const lx=pad.left+((pts.length-1)/(n-1))*cw
  const ly=pad.top+ch-((pts[pts.length-1]-minV)/range)*ch
  ctx.lineTo(lx,pad.top+ch);ctx.lineTo(pad.left,pad.top+ch);ctx.closePath()
  ctx.fillStyle=grad;ctx.fill()
  ctx.beginPath()
  pts.forEach((v,i)=>{const x=pad.left+(i/(n-1))*cw,y=pad.top+ch-((v-minV)/range)*ch;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)})
  ctx.strokeStyle='#3b82f6';ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke()
  pts.forEach((v,i)=>{const x=pad.left+(i/(n-1))*cw,y=pad.top+ch-((v-minV)/range)*ch;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle='#3b82f6';ctx.fill()})
  ctx.restore()
}
function animateTrend(){
  let start=null;const dur=900
  function frame(ts){if(!start)start=ts;const p=Math.min((ts-start)/dur,1);drawTrend(p);if(p<1)trendAnim=requestAnimationFrame(frame)}
  if(trendAnim)cancelAnimationFrame(trendAnim);trendAnim=requestAnimationFrame(frame)
}
function resizeTrend(){const c=trendCanvasRef.value;if(!c)return;c.width=c.parentElement.clientWidth;c.height=160}
watch(()=>currentReport.value,()=>{if(currentReport.value)drawScoreRing(currentReport.value.score)},{immediate:false})
onMounted(()=>{
  resizeTrend();animateTrend()
  if(currentReport.value)drawScoreRing(currentReport.value.score)
  window.addEventListener('resize',()=>{resizeTrend();drawTrend()})
})
onUnmounted(()=>{
  if(trendAnim)cancelAnimationFrame(trendAnim)
  window.removeEventListener('resize',()=>{})
})
</script>
<style scoped>*{box-sizing:border-box}
.rpt-page{display:flex;flex-direction:column;height:100%;min-height:calc(100vh - 48px);padding:0;overflow:hidden}
.rpt-header{display:flex;align-items:center;justify-content:space-between;padding:16px 24px 12px;border-bottom:1px solid rgba(59,130,246,0.15);flex-shrink:0}
.rpt-title{color:#f8fafc;font-size:22px;font-weight:700;margin:0 0 3px}
.rpt-desc{color:#64748b;font-size:13px;margin:0}
.header-actions{display:flex;align-items:center;gap:10px}
.period-select{background:rgba(15,23,41,0.8);border:1px solid rgba(59,130,246,0.25);color:#f8fafc;padding:6px 12px;border-radius:8px;font-size:12px;outline:none;cursor:pointer}
.btn-export{background:linear-gradient(135deg,#2563eb,#3b82f6);border:none;color:#fff;padding:7px 16px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:opacity 0.15s}
.btn-export:hover{opacity:0.85}
.rpt-body{display:flex;flex-direction:column;flex:1;overflow:hidden}
.summary-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:12px 20px;flex-shrink:0;border-bottom:1px solid rgba(59,130,246,0.08)}
.sum-card{display:flex;align-items:center;gap:12px;background:rgba(15,23,41,0.8);border:1px solid rgba(59,130,246,0.12);border-radius:12px;padding:12px 14px}
.sum-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0}
.sum-card.blue  .sum-icon{background:rgba(59,130,246,0.15);color:#3b82f6}
.sum-card.green .sum-icon{background:rgba(34,197,94,0.15);color:#22c55e}
.sum-card.yellow .sum-icon{background:rgba(234,179,8,0.15);color:#eab308}
.sum-card.cyan  .sum-icon{background:rgba(6,182,212,0.15);color:#06b6d4}
.sum-label{color:#64748b;font-size:11px;margin-bottom:3px}
.sum-val{color:#f8fafc;font-size:20px;font-weight:800;line-height:1;margin-bottom:3px}
.sum-change{font-size:10px;font-weight:600;color:#94a3b8}
.sum-change.up{color:#22c55e}.sum-change.down{color:#ef4444}
.rpt-main{display:flex;flex:1;overflow:hidden;min-height:0}
.rpt-left{width:300px;min-width:260px;display:flex;flex-direction:column;overflow-y:auto;padding:14px 12px;border-right:1px solid rgba(59,130,246,0.12)}
.rpt-left::-webkit-scrollbar{width:4px}
.rpt-left::-webkit-scrollbar-thumb{background:rgba(59,130,246,0.2);border-radius:4px}
.rpt-right{flex:1;display:flex;flex-direction:column;overflow-y:auto;padding:14px 18px}
.rpt-right::-webkit-scrollbar{width:4px}
.rpt-right::-webkit-scrollbar-thumb{background:rgba(59,130,246,0.2);border-radius:4px}
.sec-title{color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px}
.report-list{display:flex;flex-direction:column;gap:8px}
.report-item{background:rgba(15,23,41,0.8);border:1px solid rgba(59,130,246,0.12);border-radius:10px;padding:11px 12px;cursor:pointer;transition:all 0.2s}
.report-item:hover{border-color:rgba(59,130,246,0.35)}
.report-item.active{border-color:#3b82f6;background:rgba(59,130,246,0.08)}
.ri-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px}
.ri-type{font-size:10px;font-weight:700;padding:1px 6px;border-radius:5px}
.ri-type.annual{background:rgba(139,92,246,0.2);color:#8b5cf6}
.ri-type.monthly{background:rgba(59,130,246,0.2);color:#3b82f6}
.ri-type.checkup{background:rgba(6,182,212,0.2);color:#06b6d4}
.ri-date{color:#475569;font-size:10px}
.ri-title{color:#f8fafc;font-size:12px;font-weight:600;margin-bottom:3px}
.ri-summary{color:#64748b;font-size:10px;line-height:1.4;margin-bottom:6px}
.ri-score-row{display:flex;align-items:center;gap:6px}
.ri-score-label{color:#475569;font-size:10px}
.ri-score{font-size:15px;font-weight:800}
.ri-score.good{color:#22c55e}.ri-score.medium{color:#eab308}.ri-score.low{color:#ef4444}
.ri-trend{font-size:11px;font-weight:700}
.ri-trend.up{color:#22c55e}.ri-trend.down{color:#ef4444}
.detail-header{margin-bottom:14px}
.detail-title{color:#f8fafc;font-size:16px;font-weight:700;margin:0 0 8px}
.detail-meta{display:flex;align-items:center;gap:10px}
.detail-date{color:#475569;font-size:12px}
.detail-doctor{color:#3b82f6;font-size:12px}
.detail-score-row{display:flex;align-items:flex-start;gap:16px;background:rgba(13,27,42,0.6);border:1px solid rgba(59,130,246,0.12);border-radius:12px;padding:14px;margin-bottom:14px}
.score-info{display:flex;flex-direction:column;gap:4px;flex-shrink:0}
.score-big{font-size:36px;font-weight:900;line-height:1}
.score-big.good{color:#22c55e}.score-big.medium{color:#eab308}.score-big.low{color:#ef4444}
.score-label{color:#64748b;font-size:11px}
.score-desc{color:#94a3b8;font-size:11px}
.score-items{flex:1;display:flex;flex-direction:column;gap:8px}
.score-item{display:flex;align-items:center;gap:8px}
.si-name{color:#94a3b8;font-size:11px;width:32px;flex-shrink:0}
.si-bar-bg{flex:1;height:5px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden}
.si-bar{display:block;height:100%;border-radius:3px;transition:width 0.6s}
.si-val{font-size:11px;font-weight:700;width:28px;text-align:right;flex-shrink:0}
.detail-sections{display:flex;flex-direction:column;gap:12px}
.detail-section{background:rgba(13,27,42,0.5);border:1px solid rgba(59,130,246,0.1);border-radius:10px;padding:12px 14px}
.ds-title{color:#f8fafc;font-size:12px;font-weight:700;margin-bottom:6px}
.ds-content{color:#94a3b8;font-size:12px;line-height:1.6;margin-bottom:6px}
.ds-findings{display:flex;flex-direction:column;gap:4px}
.ds-finding{display:flex;align-items:flex-start;gap:7px;color:#cbd5e1;font-size:11px;line-height:1.5}
.ds-dot{width:5px;height:5px;border-radius:50%;background:#3b82f6;flex-shrink:0;margin-top:5px}
.trend-section{padding:10px 20px 16px;flex-shrink:0;border-top:1px solid rgba(59,130,246,0.08)}
.trend-wrap{background:rgba(13,27,42,0.6);border:1px solid rgba(59,130,246,0.12);border-radius:12px;padding:12px}
.trend-canvas{display:block;width:100%}

/* ===== 移动端 ===== */
@media(max-width:768px){
  .rpt-page{min-height:auto;overflow:auto}
  .rpt-header{flex-direction:column;align-items:flex-start;gap:10px;padding:12px 14px 10px}
  .rpt-title{font-size:18px}
  .header-actions{display:flex;gap:8px;width:100%}
  .period-select{flex:1}
  .btn-export{white-space:nowrap}
  .summary-row{grid-template-columns:repeat(2,1fr);gap:8px;padding:10px 12px}
  .sum-val{font-size:16px}
  .sum-card{padding:10px 10px;gap:8px}
  .rpt-body{overflow:visible}
  .rpt-main{flex-direction:column;overflow:visible}
  .rpt-left{width:100%;min-width:unset;border-right:none;border-bottom:1px solid rgba(59,130,246,0.12);padding:12px;overflow:visible;max-height:none}
  .rpt-right{padding:12px;overflow:visible}
  .detail-score-row{flex-direction:column;gap:12px}
  .score-big{font-size:28px}
  .trend-section{padding:10px 12px 70px}
}
</style>
