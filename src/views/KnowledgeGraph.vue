<template>
  <div class="kg-page">
    <div class="kg-header">
      <div class="kg-header-left">
        <h1 class="kg-title">知识图谱推理</h1>
        <p class="kg-desc">医疗知识图谱智能推理与关联分析</p>
      </div>
      <div class="kg-header-right">
        <div class="stat-badge"><span class="stat-num">{{ nodes.length }}</span><span class="stat-label">节点</span></div>
        <div class="stat-badge"><span class="stat-num">{{ edges.length }}</span><span class="stat-label">关系</span></div>
        <div class="stat-badge accent"><span class="stat-num">{{ filteredReasoningResults.length }}</span><span class="stat-label">推理条目</span></div>
      </div>
    </div>
    <div class="kg-body">
      <div class="kg-canvas-wrap">
        <div class="canvas-toolbar">
          <div class="toolbar-left">
            <span class="toolbar-title">图谱可视化</span>
            <div class="legend">
              <span v-for="cat in categories" :key="cat.key" class="legend-item">
                <span class="legend-dot" :style="{ background: cat.color }"></span>{{ cat.label }}
              </span>
            </div>
          </div>
          <div class="toolbar-right">
            <button class="btn-icon" @click="resetLayout">&#8635;</button>
            <button class="btn-icon" @click="zoomIn">+</button>
            <button class="btn-icon" @click="zoomOut">&#8722;</button>
          </div>
        </div>
        <div class="query-bar">
          <input v-model="queryText" class="query-input" placeholder="输入推理查询，例如：高血压 -> 脑卒中 / 吸烟" @keydown.enter="runQuery" />
          <select v-model="reasoningMode" class="query-select">
            <option value="forward">前向链推理</option>
            <option value="risk">风险传播推理</option>
            <option value="therapy">干预方案推理</option>
          </select>
          <button class="btn-query" @click="runQuery" :class="{ loading: isQuerying }">
            <span v-if="!isQuerying">推理分析</span>
            <span v-else class="spinner"></span>
          </button>
          <button class="btn-query ghost" @click="runAutoReasoning">自动推理</button>
        </div>
        <div class="query-quick-bar">
          <span class="quick-label">快捷推理：</span>
          <button v-for="q in quickQueries" :key="q" class="quick-chip" @click="useQuickQuery(q)">{{ q }}</button>
          <div class="hop-control">最大跳数 {{ maxHop }}
            <input v-model.number="maxHop" type="range" min="2" max="5" />
          </div>
        </div>
        <div class="whatif-bar">
          <span class="quick-label">反事实：</span>
          <select v-model="whatIfAction" class="query-select">
            <option value="quit_smoking">如果戒烟</option>
            <option value="weight_loss">如果减重5%</option>
            <option value="exercise_up">如果运动提升到150分钟/周</option>
          </select>
          <button class="btn-query ghost" @click="runCounterfactual">生成反事实推理</button>
          <span class="forecast-label">时间推演：</span>
          <select v-model.number="forecastMonths" class="query-select">
            <option :value="3">3个月</option>
            <option :value="6">6个月</option>
            <option :value="12">12个月</option>
          </select>
          <button class="btn-query ghost" @click="runTimelineProjection">风险趋势推演</button>
        </div>
        <canvas ref="canvasRef" class="graph-canvas"
          @mousedown="onMouseDown" @mousemove="onMouseMove"
          @mouseup="onMouseUp" @mouseleave="onMouseUp" @wheel.prevent="onWheel"
        ></canvas>
        <div v-if="tooltip.visible" class="node-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
          <div class="tooltip-name">{{ tooltip.node && tooltip.node.label }}</div>
          <div class="tooltip-type">{{ getCategoryLabel(tooltip.node && tooltip.node.category) }}</div>
          <div class="tooltip-desc">{{ tooltip.node && tooltip.node.desc }}</div>
        </div>
      </div>
      <div class="reasoning-panel">
        <div class="panel-header">
          <span class="panel-title">推理结果</span>
          <span class="panel-badge">{{ filteredReasoningResults.length }}</span>
        </div>
        <div class="reasoning-list">
          <div v-for="(r, idx) in filteredReasoningResults" :key="idx"
            class="reasoning-card" :class="{ highlighted: r.highlighted }" @click="highlightPath(r)">
            <div class="card-top">
              <span class="card-index">#{{ idx + 1 }}</span>
              <span class="reasoning-type" :class="r.type">{{ reasoningTypeLabel[r.type] || '综合' }}</span>
              <span class="confidence-bar-wrap">
                <span class="confidence-bar" :style="{ width: r.confidence * 100 + '%', background: confidenceColor(r.confidence) }"></span>
              </span>
              <span class="confidence-val">{{ (r.confidence * 100).toFixed(0) }}%</span>
            </div>
            <div class="card-path">
              <span v-for="(step, si) in r.path" :key="si" class="path-step">
                <span class="path-node" :style="{ color: getNodeColor(step.node) }">{{ step.node }}</span>
                <span v-if="si < r.path.length - 1" class="path-arrow">
                  <span class="path-rel">{{ step.rel }}</span> &#8594;
                </span>
              </span>
            </div>
            <div class="card-conclusion">{{ r.conclusion }}</div>
            <div class="card-evidence">证据链：{{ r.evidence }}</div>
          </div>
        </div>
        <div class="reasoning-summary">
          <div class="summary-item"><span>高置信度(≥85%)</span><b>{{ highConfidenceCount }}</b></div>
          <div class="summary-item"><span>风险传播链</span><b>{{ riskCount }}</b></div>
          <div class="summary-item"><span>干预链</span><b>{{ therapyCount }}</b></div>
        </div>
        <div class="projection-panel">
          <div class="projection-title">时间推演（{{ forecastMonths }}个月）</div>
          <div class="projection-list" v-if="projectionResults.length">
            <div class="projection-card" v-for="(p, i) in projectionResults" :key="i">
              <div class="projection-top">
                <span>{{ p.metric }}</span>
                <b :class="p.trend">{{ p.after }}</b>
              </div>
              <div class="projection-meta">当前 {{ p.before }} · 变化 {{ p.delta }}</div>
            </div>
          </div>
          <div class="projection-empty" v-else>点击“风险趋势推演”生成趋势预测</div>
        </div>
        <div class="engine-status">
          <div class="engine-row"><span class="engine-label">推理引擎</span><span class="engine-val online">&#9679; 在线</span></div>
          <div class="engine-row"><span class="engine-label">知识库版本</span><span class="engine-val">v2.5.0</span></div>
          <div class="engine-row"><span class="engine-label">最近更新</span><span class="engine-val">{{ lastUpdated }}</span></div>
          <div class="engine-row"><span class="engine-label">推理模式</span><span class="engine-val">{{ reasoningTypeLabel[reasoningMode] || '前向链' }}</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

const categories = [
  { key: 'disease',    label: '疾病',    color: '#ef4444' },
  { key: 'symptom',   label: '症状',    color: '#f97316' },
  { key: 'drug',      label: '药物',    color: '#3b82f6' },
  { key: 'biomarker', label: '生物标志', color: '#8b5cf6' },
  { key: 'therapy',   label: '治疗方案', color: '#22c55e' },
  { key: 'risk',      label: '风险因素', color: '#eab308' },
]

const nodes = ref([
  { id:1,  label:'高血压',   category:'disease',    desc:'收缩压≥140mmHg或舒张压≥90mmHg', x:0,y:0,vx:0,vy:0 },
  { id:2,  label:'冠心病',   category:'disease',    desc:'冠状动脉粥样硬化性心脏病',       x:0,y:0,vx:0,vy:0 },
  { id:3,  label:'糖尿病',   category:'disease',    desc:'以高血糖为特征的代谢性疾病',     x:0,y:0,vx:0,vy:0 },
  { id:4,  label:'脑卒中',   category:'disease',    desc:'脑血管意外，俗称中风',           x:0,y:0,vx:0,vy:0 },
  { id:5,  label:'头痛头晕', category:'symptom',    desc:'高血压常见早期症状',             x:0,y:0,vx:0,vy:0 },
  { id:6,  label:'胸痛',     category:'symptom',    desc:'心肌缺血的典型表现',             x:0,y:0,vx:0,vy:0 },
  { id:7,  label:'多尿多饮', category:'symptom',    desc:'糖尿病三多症状',                 x:0,y:0,vx:0,vy:0 },
  { id:8,  label:'氨氯地平', category:'drug',       desc:'钙通道阻滞剂，一线降压药',       x:0,y:0,vx:0,vy:0 },
  { id:9,  label:'阿司匹林', category:'drug',       desc:'抗血小板聚集，预防心血管事件',   x:0,y:0,vx:0,vy:0 },
  { id:10, label:'二甲双胍', category:'drug',       desc:'2型糖尿病首选口服降糖药',        x:0,y:0,vx:0,vy:0 },
  { id:11, label:'血压',     category:'biomarker',  desc:'收缩压/舒张压，单位mmHg',        x:0,y:0,vx:0,vy:0 },
  { id:12, label:'血糖',     category:'biomarker',  desc:'空腹血糖正常值3.9-6.1mmol/L',   x:0,y:0,vx:0,vy:0 },
  { id:13, label:'低脂饮食', category:'therapy',    desc:'减少饱和脂肪酸摄入',             x:0,y:0,vx:0,vy:0 },
  { id:14, label:'有氧运动', category:'therapy',    desc:'每周≥150分钟中等强度运动',       x:0,y:0,vx:0,vy:0 },
  { id:15, label:'吸烟',     category:'risk',       desc:'心脑血管疾病重要独立危险因素',   x:0,y:0,vx:0,vy:0 },
  { id:16, label:'肥胖',     category:'risk',       desc:'BMI≥28，代谢综合征核心组分',     x:0,y:0,vx:0,vy:0 },

  { id:17, label:'慢阻肺',   category:'disease',    desc:'慢性阻塞性肺疾病，进行性气流受限', x:0,y:0,vx:0,vy:0 },
  { id:18, label:'慢性肾病', category:'disease',    desc:'肾功能持续下降，eGFR降低',       x:0,y:0,vx:0,vy:0 },
  { id:19, label:'心力衰竭', category:'disease',    desc:'心脏泵血功能受损导致灌注不足',   x:0,y:0,vx:0,vy:0 },
  { id:20, label:'房颤',     category:'disease',    desc:'常见心律失常，卒中风险增加',     x:0,y:0,vx:0,vy:0 },
  { id:21, label:'代谢综合征', category:'disease',  desc:'肥胖、糖脂代谢异常与高血压共存', x:0,y:0,vx:0,vy:0 },

  { id:22, label:'气促',     category:'symptom',    desc:'活动后呼吸困难，见于心衰/慢阻肺', x:0,y:0,vx:0,vy:0 },
  { id:23, label:'下肢水肿', category:'symptom',    desc:'常见于心衰和肾功能异常',         x:0,y:0,vx:0,vy:0 },
  { id:24, label:'心悸',     category:'symptom',    desc:'房颤和焦虑常见主诉',             x:0,y:0,vx:0,vy:0 },
  { id:25, label:'夜间咳嗽', category:'symptom',    desc:'慢阻肺及心衰常见症状',           x:0,y:0,vx:0,vy:0 },
  { id:26, label:'乏力',     category:'symptom',    desc:'慢病常见非特异性症状',           x:0,y:0,vx:0,vy:0 },

  { id:27, label:'缬沙坦',   category:'drug',       desc:'ARB降压药，兼有肾脏保护作用',    x:0,y:0,vx:0,vy:0 },
  { id:28, label:'瑞舒伐他汀', category:'drug',     desc:'他汀类降脂药，降低动脉粥样风险', x:0,y:0,vx:0,vy:0 },
  { id:29, label:'达格列净', category:'drug',       desc:'SGLT2抑制剂，心肾获益明确',      x:0,y:0,vx:0,vy:0 },
  { id:30, label:'呋塞米',   category:'drug',       desc:'袢利尿剂，缓解水钠潴留',         x:0,y:0,vx:0,vy:0 },
  { id:31, label:'华法林',   category:'drug',       desc:'抗凝药，房颤卒中预防',           x:0,y:0,vx:0,vy:0 },

  { id:32, label:'HbA1c',   category:'biomarker',   desc:'反映近2-3个月平均血糖',          x:0,y:0,vx:0,vy:0 },
  { id:33, label:'LDL-C',   category:'biomarker',   desc:'低密度脂蛋白胆固醇',             x:0,y:0,vx:0,vy:0 },
  { id:34, label:'eGFR',    category:'biomarker',   desc:'估算肾小球滤过率，评估肾功能',   x:0,y:0,vx:0,vy:0 },
  { id:35, label:'NT-proBNP', category:'biomarker', desc:'心衰风险评估生物标志物',         x:0,y:0,vx:0,vy:0 },
  { id:36, label:'血氧',     category:'biomarker',  desc:'外周血氧饱和度，反映氧合状态',   x:0,y:0,vx:0,vy:0 },

  { id:37, label:'戒烟干预', category:'therapy',    desc:'行为干预+尼古丁替代',            x:0,y:0,vx:0,vy:0 },
  { id:38, label:'限盐饮食', category:'therapy',    desc:'每日盐摄入控制在5g以内',         x:0,y:0,vx:0,vy:0 },
  { id:39, label:'睡眠管理', category:'therapy',    desc:'改善睡眠时长与质量，减轻交感兴奋', x:0,y:0,vx:0,vy:0 },
  { id:40, label:'心肺康复', category:'therapy',    desc:'呼吸训练+运动训练综合康复',      x:0,y:0,vx:0,vy:0 },

  { id:41, label:'高盐饮食', category:'risk',       desc:'升高血压并增加心血管负担',       x:0,y:0,vx:0,vy:0 },
  { id:42, label:'久坐',     category:'risk',       desc:'降低代谢水平，提升慢病风险',     x:0,y:0,vx:0,vy:0 },
  { id:43, label:'家族史',   category:'risk',       desc:'遗传易感性提高多病种风险',       x:0,y:0,vx:0,vy:0 },
  { id:44, label:'高龄',     category:'risk',       desc:'心脑血管与衰弱相关风险升高',     x:0,y:0,vx:0,vy:0 },

  { id:45, label:'哮喘',     category:'disease',    desc:'气道慢性炎症，可逆性气流受限',     x:0,y:0,vx:0,vy:0 },
  { id:46, label:'痛风',     category:'disease',    desc:'尿酸盐结晶沉积所致关节炎',       x:0,y:0,vx:0,vy:0 },
  { id:47, label:'骨质疏松', category:'disease',    desc:'骨量减少与骨微结构破坏',           x:0,y:0,vx:0,vy:0 },
  { id:48, label:'抑郁症',   category:'disease',    desc:'持续心境低落与兴趣减退',           x:0,y:0,vx:0,vy:0 },
  { id:49, label:'肺炎',     category:'disease',    desc:'肺部感染性疾病',                   x:0,y:0,vx:0,vy:0 },
  { id:50, label:'脂肪肝',   category:'disease',    desc:'肝细胞脂肪过度沉积',               x:0,y:0,vx:0,vy:0 },
  { id:51, label:'甲减',     category:'disease',    desc:'甲状腺激素不足',                   x:0,y:0,vx:0,vy:0 },
  { id:52, label:'胃溃疡',   category:'disease',    desc:'胃黏膜慢性缺损',                   x:0,y:0,vx:0,vy:0 },

  { id:53, label:'喘息',     category:'symptom',    desc:'呼吸伴哮鸣，常见于哮喘',           x:0,y:0,vx:0,vy:0 },
  { id:54, label:'关节痛',   category:'symptom',    desc:'急性关节炎常见表现',               x:0,y:0,vx:0,vy:0 },
  { id:55, label:'黄疸',     category:'symptom',    desc:'胆红素升高致皮肤巩膜黄染',         x:0,y:0,vx:0,vy:0 },
  { id:56, label:'认知下降', category:'symptom',    desc:'记忆与执行功能减退',               x:0,y:0,vx:0,vy:0 },
  { id:57, label:'胸闷',     category:'symptom',    desc:'胸部压迫感，心肺疾病均可出现',     x:0,y:0,vx:0,vy:0 },
  { id:58, label:'恶心',     category:'symptom',    desc:'上消化道不适常见表现',             x:0,y:0,vx:0,vy:0 },

  { id:59, label:'布地奈德', category:'drug',       desc:'吸入糖皮质激素，控制气道炎症',     x:0,y:0,vx:0,vy:0 },
  { id:60, label:'别嘌醇',   category:'drug',       desc:'抑制尿酸生成，痛风降尿酸治疗',     x:0,y:0,vx:0,vy:0 },
  { id:61, label:'左甲状腺素', category:'drug',   desc:'甲减替代治疗',                     x:0,y:0,vx:0,vy:0 },
  { id:62, label:'奥美拉唑', category:'drug',       desc:'质子泵抑制剂，抑酸护胃',           x:0,y:0,vx:0,vy:0 },
  { id:63, label:'甘精胰岛素', category:'drug',     desc:'长效基础胰岛素',                   x:0,y:0,vx:0,vy:0 },
  { id:64, label:'沙丁胺醇', category:'drug',       desc:'短效β2激动剂，缓解支气管痉挛',     x:0,y:0,vx:0,vy:0 },

  { id:65, label:'CRP',      category:'biomarker',  desc:'C反应蛋白，炎症标志物',            x:0,y:0,vx:0,vy:0 },
  { id:66, label:'尿酸',     category:'biomarker',  desc:'血尿酸水平，痛风与肾病相关',       x:0,y:0,vx:0,vy:0 },
  { id:67, label:'TSH',      category:'biomarker',  desc:'促甲状腺激素，筛查甲减甲亢',       x:0,y:0,vx:0,vy:0 },
  { id:68, label:'维生素D',  category:'biomarker',  desc:'与骨代谢及免疫相关',               x:0,y:0,vx:0,vy:0 },
  { id:69, label:'肌钙蛋白', category:'biomarker',  desc:'心肌损伤特异性标志物',             x:0,y:0,vx:0,vy:0 },

  { id:70, label:'吸入维持治疗', category:'therapy', desc:'规律吸入控制药物减少急性发作',   x:0,y:0,vx:0,vy:0 },
  { id:71, label:'低嘌呤饮食', category:'therapy',  desc:'减少嘌呤摄入控制尿酸',             x:0,y:0,vx:0,vy:0 },
  { id:72, label:'心理干预', category:'therapy',    desc:'认知行为等治疗改善情绪',           x:0,y:0,vx:0,vy:0 },
  { id:73, label:'根除幽门螺杆菌', category:'therapy', desc:'三联/四联方案促进溃疡愈合',    x:0,y:0,vx:0,vy:0 },
  { id:74, label:'补钙与抗骨松', category:'therapy', desc:'钙剂、维生素D与抗骨吸收药',      x:0,y:0,vx:0,vy:0 },

  { id:75, label:'空气污染', category:'risk',       desc:'PM2.5等加重呼吸与心血管负担',      x:0,y:0,vx:0,vy:0 },
  { id:76, label:'酗酒',     category:'risk',       desc:'过量饮酒损伤多脏器',               x:0,y:0,vx:0,vy:0 },
  { id:77, label:'慢性应激', category:'risk',       desc:'长期心理压力影响神经内分泌',       x:0,y:0,vx:0,vy:0 },
  { id:78, label:'高糖饮食', category:'risk',       desc:'精制糖摄入过多加重代谢负担',       x:0,y:0,vx:0,vy:0 },
])

const edges = ref([
  {source:1, target:5,  label:'表现为'},{source:1, target:2,  label:'并发'},
  {source:1, target:4,  label:'并发'}, {source:1, target:11, label:'指标'},
  {source:1, target:8,  label:'治疗'}, {source:2, target:6,  label:'表现为'},
  {source:2, target:9,  label:'治疗'}, {source:3, target:7,  label:'表现为'},
  {source:3, target:12, label:'指标'}, {source:3, target:10, label:'治疗'},
  {source:3, target:2,  label:'风险因素'},{source:15,target:1, label:'加重'},
  {source:15,target:2,  label:'加重'}, {source:16,target:1,  label:'加重'},
  {source:16,target:3,  label:'风险因素'},{source:13,target:1, label:'改善'},
  {source:14,target:1,  label:'改善'}, {source:14,target:3,  label:'改善'},
  {source:9, target:4,  label:'预防'},

  {source:17,target:22, label:'表现为'}, {source:17,target:25, label:'表现为'},
  {source:17,target:36, label:'指标'},   {source:17,target:40, label:'康复'},
  {source:18,target:34, label:'指标'},   {source:18,target:23, label:'表现为'},
  {source:18,target:1,  label:'并存'},   {source:18,target:29, label:'治疗'},
  {source:19,target:22, label:'表现为'}, {source:19,target:23, label:'表现为'},
  {source:19,target:35, label:'指标'},   {source:19,target:30, label:'治疗'},
  {source:20,target:24, label:'表现为'}, {source:20,target:31, label:'治疗'},
  {source:20,target:4,  label:'风险因素'},
  {source:21,target:1,  label:'并存'},   {source:21,target:3,  label:'并存'},
  {source:21,target:33, label:'指标'},   {source:21,target:16, label:'相关'},

  {source:27,target:1,  label:'治疗'},   {source:28,target:2,  label:'治疗'},
  {source:28,target:33, label:'改善'},   {source:29,target:3,  label:'治疗'},
  {source:29,target:18, label:'肾脏获益'},{source:29,target:19, label:'心衰获益'},

  {source:32,target:3,  label:'评估'},   {source:33,target:2,  label:'风险评估'},
  {source:34,target:18, label:'评估'},   {source:35,target:19, label:'评估'},

  {source:37,target:15, label:'干预'},   {source:38,target:41, label:'干预'},
  {source:39,target:1,  label:'改善'},   {source:40,target:17, label:'改善'},
  {source:40,target:19, label:'改善'},

  {source:41,target:1,  label:'加重'},   {source:42,target:16, label:'促进'},
  {source:42,target:3,  label:'风险因素'},{source:43,target:1, label:'易感'},
  {source:43,target:3,  label:'易感'},   {source:44,target:19, label:'风险因素'},
  {source:44,target:4,  label:'风险因素'},

  {source:45,target:53, label:'表现为'}, {source:45,target:65, label:'指标'}, {source:45,target:59, label:'治疗'},
  {source:45,target:64, label:'治疗'}, {source:45,target:70, label:'康复'}, {source:45,target:17, label:'并存'},
  {source:75,target:45, label:'加重'}, {source:75,target:49, label:'加重'}, {source:75,target:17, label:'加重'},

  {source:46,target:54, label:'表现为'}, {source:46,target:66, label:'指标'}, {source:46,target:60, label:'治疗'},
  {source:46,target:71, label:'干预'}, {source:46,target:18, label:'风险因素'}, {source:16,target:46, label:'风险因素'},

  {source:47,target:68, label:'指标'}, {source:47,target:74, label:'治疗'}, {source:44,target:47, label:'风险因素'},
  {source:3, target:47, label:'风险因素'}, {source:47,target:26, label:'表现为'},

  {source:48,target:56, label:'表现为'}, {source:48,target:72, label:'治疗'}, {source:77,target:48, label:'加重'},
  {source:48,target:3,  label:'并存'}, {source:48,target:1,  label:'并存'}, {source:48,target:4,  label:'风险因素'},

  {source:49,target:65, label:'指标'}, {source:49,target:58, label:'表现为'}, {source:49,target:57, label:'表现为'},
  {source:20,target:49, label:'并发'}, {source:3, target:49, label:'风险因素'},

  {source:50,target:55, label:'表现为'}, {source:50,target:3,  label:'风险因素'}, {source:16,target:50, label:'促进'},
  {source:78,target:3,  label:'加重'}, {source:78,target:32, label:'影响'},

  {source:51,target:67, label:'指标'}, {source:51,target:61, label:'治疗'}, {source:51,target:26, label:'表现为'},
  {source:51,target:16, label:'相关'}, {source:43,target:51, label:'易感'},

  {source:52,target:58, label:'表现为'}, {source:52,target:62, label:'治疗'}, {source:52,target:73, label:'治疗'},
  {source:3, target:52, label:'风险因素'}, {source:76,target:52, label:'加重'},

  {source:69,target:2,  label:'风险评估'}, {source:69,target:6,  label:'评估'}, {source:64,target:17, label:'治疗'},
  {source:64,target:45, label:'治疗'}, {source:63,target:3,  label:'治疗'}, {source:63,target:32, label:'改善'},

  {source:72,target:48, label:'改善'}, {source:74,target:47, label:'改善'}, {source:71,target:66, label:'改善'},
  {source:76,target:1,  label:'加重'}, {source:76,target:3,  label:'加重'}, {source:76,target:20, label:'诱发'},
  {source:76,target:50, label:'加重'}, {source:42,target:48, label:'风险因素'}
])

const reasoningResults = ref([
  { path:[{node:'高血压',rel:'并发'},{node:'冠心病',rel:'治疗'},{node:'阿司匹林',rel:''}], conclusion:'高血压合并冠心病时，建议抗血小板治疗。', evidence:'R-HTN-CHD-ASP', type:'therapy', confidence:0.91, highlighted:false, nodeIds:[1,2,9], edgePairs:[[1,2],[2,9]] },
  { path:[{node:'肥胖',rel:'风险因素'},{node:'糖尿病',rel:'指标'},{node:'血糖',rel:''}], conclusion:'肥胖显著增加糖尿病风险，应重点监测血糖。', evidence:'R-OB-DM-GLU', type:'risk', confidence:0.87, highlighted:false, nodeIds:[16,3,12], edgePairs:[[16,3],[3,12]] },
  { path:[{node:'吸烟',rel:'加重'},{node:'高血压',rel:'并发'},{node:'脑卒中',rel:''}], conclusion:'吸烟通过高血压链路提升脑卒中风险。', evidence:'R-SMK-HTN-STK', type:'risk', confidence:0.83, highlighted:false, nodeIds:[15,1,4], edgePairs:[[15,1],[1,4]] },
  { path:[{node:'有氧运动',rel:'改善'},{node:'高血压',rel:'改善'},{node:'糖尿病',rel:''}], conclusion:'持续运动可同步改善高血压和糖代谢。', evidence:'R-EX-LIFESTYLE', type:'therapy', confidence:0.79, highlighted:false, nodeIds:[14,1,3], edgePairs:[[14,1],[14,3]] },
  { path:[{node:'糖尿病',rel:'风险因素'},{node:'冠心病',rel:'并发'},{node:'脑卒中',rel:''}], conclusion:'糖尿病-冠心病共病显著抬升卒中风险。', evidence:'R-DM-CHD-STK', type:'forward', confidence:0.76, highlighted:false, nodeIds:[3,2,4], edgePairs:[[3,2],[2,4]] },

  { path:[{node:'慢阻肺',rel:'表现为'},{node:'气促',rel:'评估'},{node:'血氧',rel:''}], conclusion:'慢阻肺患者出现气促时应联合监测血氧。', evidence:'R-COPD-DYSP-SPO2', type:'forward', confidence:0.82, highlighted:false, nodeIds:[17,22,36], edgePairs:[[17,22],[17,36]] },
  { path:[{node:'慢性肾病',rel:'指标'},{node:'eGFR',rel:'并存'},{node:'高血压',rel:''}], conclusion:'eGFR下降提示慢性肾病进展，并常与高血压并存。', evidence:'R-CKD-eGFR-HTN', type:'risk', confidence:0.84, highlighted:false, nodeIds:[18,34,1], edgePairs:[[18,34],[18,1]] },
  { path:[{node:'心力衰竭',rel:'表现为'},{node:'下肢水肿',rel:'治疗'},{node:'呋塞米',rel:''}], conclusion:'心衰伴水肿可考虑利尿剂缓解容量负荷。', evidence:'R-HF-EDE-FUR', type:'therapy', confidence:0.86, highlighted:false, nodeIds:[19,23,30], edgePairs:[[19,23],[19,30]] },
  { path:[{node:'心力衰竭',rel:'指标'},{node:'NT-proBNP',rel:'评估'},{node:'心肺康复',rel:''}], conclusion:'NT-proBNP升高提示心衰风险，建议联合心肺康复。', evidence:'R-HF-BNP-REHAB', type:'therapy', confidence:0.81, highlighted:false, nodeIds:[19,35,40], edgePairs:[[19,35],[40,19]] },
  { path:[{node:'房颤',rel:'风险因素'},{node:'脑卒中',rel:'治疗'},{node:'华法林',rel:''}], conclusion:'房颤患者卒中风险高，应评估抗凝治疗。', evidence:'R-AF-STK-WAR', type:'therapy', confidence:0.88, highlighted:false, nodeIds:[20,4,31], edgePairs:[[20,4],[20,31]] },
  { path:[{node:'代谢综合征',rel:'并存'},{node:'高血压',rel:'并存'},{node:'糖尿病',rel:''}], conclusion:'代谢综合征常见高血压与糖尿病共存，应整体管理。', evidence:'R-METS-HTN-DM', type:'forward', confidence:0.8, highlighted:false, nodeIds:[21,1,3], edgePairs:[[21,1],[21,3]] },
  { path:[{node:'高盐饮食',rel:'加重'},{node:'高血压',rel:'干预'},{node:'限盐饮食',rel:''}], conclusion:'高盐饮食加重高血压，限盐是优先生活方式干预。', evidence:'R-SALT-HTN-LIMIT', type:'therapy', confidence:0.89, highlighted:false, nodeIds:[41,1,38], edgePairs:[[41,1],[38,41]] },
  { path:[{node:'久坐',rel:'促进'},{node:'肥胖',rel:'风险因素'},{node:'糖尿病',rel:''}], conclusion:'久坐通过肥胖路径提升糖尿病发生概率。', evidence:'R-SED-OB-DM', type:'risk', confidence:0.83, highlighted:false, nodeIds:[42,16,3], edgePairs:[[42,16],[16,3]] },
  { path:[{node:'家族史',rel:'易感'},{node:'高血压',rel:'易感'},{node:'糖尿病',rel:''}], conclusion:'有家族史者在高血压与糖尿病上具有遗传易感性。', evidence:'R-FHX-HTN-DM', type:'risk', confidence:0.78, highlighted:false, nodeIds:[43,1,3], edgePairs:[[43,1],[43,3]] },
  { path:[{node:'高龄',rel:'风险因素'},{node:'心力衰竭',rel:'风险因素'},{node:'脑卒中',rel:''}], conclusion:'高龄人群心衰与卒中风险同步升高，需连续随访。', evidence:'R-AGE-HF-STK', type:'risk', confidence:0.81, highlighted:false, nodeIds:[44,19,4], edgePairs:[[44,19],[44,4]] },

  { path:[{node:'哮喘',rel:'并存'},{node:'慢阻肺',rel:'表现为'},{node:'气促',rel:''}], conclusion:'哮喘与慢阻肺可并存，气促加重时需鉴别急性加重原因。', evidence:'R-ASTHMA-COPD-DYSP', type:'forward', confidence:0.82, highlighted:false, nodeIds:[45,17,22], edgePairs:[[45,17],[17,22]] },
  { path:[{node:'哮喘',rel:'治疗'},{node:'布地奈德',rel:''}], conclusion:'吸入糖皮质激素是哮喘长期抗炎治疗的核心药物之一。', evidence:'R-ICS-ASTHMA', type:'therapy', confidence:0.86, highlighted:false, nodeIds:[45,59], edgePairs:[[45,59]] },
  { path:[{node:'哮喘',rel:'康复'},{node:'吸入维持治疗',rel:''}], conclusion:'规律吸入维持治疗有助于减少哮喘急性发作与急诊就诊。', evidence:'R-MAINT-INHAL', type:'therapy', confidence:0.84, highlighted:false, nodeIds:[45,70], edgePairs:[[45,70]] },
  { path:[{node:'肥胖',rel:'风险因素'},{node:'痛风',rel:'指标'},{node:'尿酸',rel:''}], conclusion:'肥胖与高嘌呤负荷增加痛风风险，应监测血尿酸。', evidence:'R-OB-GOUT-UA', type:'risk', confidence:0.84, highlighted:false, nodeIds:[16,46,66], edgePairs:[[16,46],[46,66]] },
  { path:[{node:'痛风',rel:'治疗'},{node:'别嘌醇',rel:'干预'},{node:'低嘌呤饮食',rel:''}], conclusion:'痛风降尿酸需药物与低嘌呤饮食联合，减少急性发作。', evidence:'R-ALLOPUR-DIET', type:'therapy', confidence:0.85, highlighted:false, nodeIds:[46,60,71], edgePairs:[[46,60],[46,71]] },
  { path:[{node:'高龄',rel:'风险因素'},{node:'骨质疏松',rel:'指标'},{node:'维生素D',rel:''}], conclusion:'高龄骨质疏松患者应评估维生素D与钙摄入，防跌倒与骨折。', evidence:'R-AGE-OSTEO-VITD', type:'risk', confidence:0.8, highlighted:false, nodeIds:[44,47,68], edgePairs:[[44,47],[47,68]] },
  { path:[{node:'抑郁症',rel:'治疗'},{node:'心理干预',rel:''}], conclusion:'抑郁症规范治疗中心理干预可改善症状并减少共病波动。', evidence:'R-DEP-CBT', type:'therapy', confidence:0.83, highlighted:false, nodeIds:[48,72], edgePairs:[[48,72]] },
  { path:[{node:'慢性应激',rel:'加重'},{node:'抑郁症',rel:'并存'},{node:'高血压',rel:''}], conclusion:'慢性应激可加重抑郁并与高血压共病，需身心同治。', evidence:'R-STRESS-DEP-HTN', type:'risk', confidence:0.78, highlighted:false, nodeIds:[77,48,1], edgePairs:[[77,48],[48,1]] },
  { path:[{node:'肺炎',rel:'并发'},{node:'房颤',rel:'风险因素'},{node:'脑卒中',rel:''}], conclusion:'感染等应激可诱发房颤，房颤患者卒中风险需抗凝评估。', evidence:'R-PNA-AF-STK', type:'forward', confidence:0.77, highlighted:false, nodeIds:[49,20,4], edgePairs:[[20,49],[20,4]] },
  { path:[{node:'脂肪肝',rel:'风险因素'},{node:'糖尿病',rel:'指标'},{node:'HbA1c',rel:''}], conclusion:'非酒精性脂肪肝与胰岛素抵抗相关，应强化血糖与体重管理。', evidence:'R-NAFLD-DM-HBA1C', type:'risk', confidence:0.81, highlighted:false, nodeIds:[50,3,32], edgePairs:[[50,3],[3,32]] },
  { path:[{node:'甲减',rel:'治疗'},{node:'左甲状腺素',rel:'指标'},{node:'TSH',rel:''}], conclusion:'甲减替代治疗后应定期复查TSH以调整剂量。', evidence:'R-HYPOTHY-TSH', type:'therapy', confidence:0.88, highlighted:false, nodeIds:[51,61,67], edgePairs:[[51,61],[51,67]] },
  { path:[{node:'胃溃疡',rel:'治疗'},{node:'奥美拉唑',rel:'治疗'},{node:'根除幽门螺杆菌',rel:''}], conclusion:'胃溃疡常与幽门螺杆菌相关，PPI联合根除方案促进愈合。', evidence:'R-ULC-PPI-HP', type:'therapy', confidence:0.87, highlighted:false, nodeIds:[52,62,73], edgePairs:[[52,62],[52,73]] },
  { path:[{node:'酗酒',rel:'加重'},{node:'高血压',rel:'加重'},{node:'脑卒中',rel:''}], conclusion:'酗酒升高血压并增加出血与卒中风险，建议限酒干预。', evidence:'R-ETOH-HTN-STK', type:'risk', confidence:0.82, highlighted:false, nodeIds:[76,1,4], edgePairs:[[76,1],[1,4]] },
  { path:[{node:'空气污染',rel:'加重'},{node:'哮喘',rel:'指标'},{node:'CRP',rel:''}], conclusion:'空气污染可加重气道炎症，哮喘患者急性期可关注CRP等炎症指标。', evidence:'R-PM-ASTHMA-CRP', type:'risk', confidence:0.76, highlighted:false, nodeIds:[75,45,65], edgePairs:[[75,45],[45,65]] },
])

const baseReasoningPool = [
  { path:[{node:'达格列净',rel:'治疗'},{node:'糖尿病',rel:'肾脏获益'},{node:'慢性肾病',rel:''}], conclusion:'达格列净对糖尿病合并肾病患者具有额外获益。', evidence:'R-SGLT2-DM-CKD', type:'therapy', confidence:0.87, highlighted:false, nodeIds:[29,3,18], edgePairs:[[29,3],[29,18]] },
  { path:[{node:'瑞舒伐他汀',rel:'改善'},{node:'LDL-C',rel:'风险评估'},{node:'冠心病',rel:''}], conclusion:'他汀降低LDL-C可显著降低冠心病风险。', evidence:'R-STATIN-LDL-CHD', type:'therapy', confidence:0.9, highlighted:false, nodeIds:[28,33,2], edgePairs:[[28,33],[33,2]] },
  { path:[{node:'戒烟干预',rel:'干预'},{node:'吸烟',rel:'加重'},{node:'冠心病',rel:''}], conclusion:'戒烟干预可切断吸烟导致冠心病的风险传播链。', evidence:'R-QUIT-SMK-CHD', type:'risk', confidence:0.85, highlighted:false, nodeIds:[37,15,2], edgePairs:[[37,15],[15,2]] },
  { path:[{node:'睡眠管理',rel:'改善'},{node:'高血压',rel:'并发'},{node:'脑卒中',rel:''}], conclusion:'优化睡眠可降低血压波动并降低卒中风险。', evidence:'R-SLEEP-HTN-STK', type:'therapy', confidence:0.8, highlighted:false, nodeIds:[39,1,4], edgePairs:[[39,1],[1,4]] },
  { path:[{node:'缬沙坦',rel:'治疗'},{node:'高血压',rel:'指标'},{node:'血压',rel:''}], conclusion:'ARB类药物在降压同时兼顾靶器官保护。', evidence:'R-ARB-BP', type:'therapy', confidence:0.86, highlighted:false, nodeIds:[27,1,11], edgePairs:[[27,1],[1,11]] },
  { path:[{node:'甘精胰岛素',rel:'治疗'},{node:'糖尿病',rel:'改善'},{node:'HbA1c',rel:''}], conclusion:'基础胰岛素有助于空腹血糖与HbA1c达标。', evidence:'R-BASAL-HBA1C', type:'therapy', confidence:0.84, highlighted:false, nodeIds:[63,3,32], edgePairs:[[63,3],[63,32]] },
  { path:[{node:'沙丁胺醇',rel:'治疗'},{node:'慢阻肺',rel:'表现为'},{node:'气促',rel:''}], conclusion:'短效支气管扩张剂可快速缓解慢阻肺急性气促。', evidence:'R-SABA-COPD', type:'therapy', confidence:0.85, highlighted:false, nodeIds:[64,17,22], edgePairs:[[64,17],[17,22]] },
  { path:[{node:'肌钙蛋白',rel:'风险评估'},{node:'冠心病',rel:'表现为'},{node:'胸痛',rel:''}], conclusion:'胸痛发作时肌钙蛋白有助于急性冠脉综合征鉴别。', evidence:'R-TNI-CHD', type:'forward', confidence:0.88, highlighted:false, nodeIds:[69,2,6], edgePairs:[[69,2],[2,6]] },
  { path:[{node:'高糖饮食',rel:'加重'},{node:'糖尿病',rel:'影响'},{node:'HbA1c',rel:''}], conclusion:'高糖饮食推升餐后血糖与长期HbA1c，需饮食结构调整。', evidence:'R-SUGAR-HBA1C', type:'risk', confidence:0.82, highlighted:false, nodeIds:[78,3,32], edgePairs:[[78,3],[78,32]] },
  { path:[{node:'补钙与抗骨松',rel:'改善'},{node:'骨质疏松',rel:'指标'},{node:'维生素D',rel:''}], conclusion:'抗骨质疏松治疗需钙与维生素D作为基础。', evidence:'R-OSTEO-VITD', type:'therapy', confidence:0.83, highlighted:false, nodeIds:[74,47,68], edgePairs:[[74,47],[47,68]] },
  { path:[{node:'低嘌呤饮食',rel:'改善'},{node:'尿酸',rel:''}], conclusion:'低嘌呤饮食有助于降低血尿酸水平，协同药物治疗。', evidence:'R-DIET-UA', type:'therapy', confidence:0.81, highlighted:false, nodeIds:[71,66], edgePairs:[[71,66]] },
  { path:[{node:'哮喘',rel:'康复'},{node:'吸入维持治疗',rel:''}], conclusion:'规律吸入维持治疗是哮喘长期控制的重要环节。', evidence:'R-MAINT-INHAL', type:'therapy', confidence:0.85, highlighted:false, nodeIds:[45,70], edgePairs:[[45,70]] }
]

const reasoningTypeLabel = {
  forward: '前向链',
  risk: '风险传播',
  therapy: '干预推荐'
}

const reasoningMode = ref('forward')
const maxHop = ref(3)
const quickQueries = ref(['高血压 -> 脑卒中', '吸烟 -> 冠心病', '肥胖 -> 糖尿病', '糖尿病 -> 干预'])
const whatIfAction = ref('quit_smoking')
const forecastMonths = ref(6)
const projectionResults = ref([])

const filteredReasoningResults = computed(() => {
  if (reasoningMode.value === 'forward') return reasoningResults.value
  return reasoningResults.value.filter(r => r.type === reasoningMode.value || r.type === 'forward')
})
const highConfidenceCount = computed(() => filteredReasoningResults.value.filter(r => r.confidence >= 0.85).length)
const riskCount = computed(() => filteredReasoningResults.value.filter(r => r.type === 'risk').length)
const therapyCount = computed(() => filteredReasoningResults.value.filter(r => r.type === 'therapy').length)

const canvasRef = ref(null)
const queryText = ref('')
const isQuerying = ref(false)
const lastUpdated = ref('2026-04-02')
const tooltip = reactive({ visible:false, x:0, y:0, node:null })
const hlNodeIds = ref([])
const hlEdgePairs = ref([])

let scaleVal = 1, txVal = 0, tyVal = 0
let draggingNode = null
let panning = false
let panStart = { x:0, y:0, tx:0, ty:0 }
let animFrame = null
let lastAutoFitAt = 0

function getCatColor(key) { return (categories.find(c=>c.key===key)||{}).color||'#94a3b8' }
function getCategoryLabel(key) { return (categories.find(c=>c.key===key)||{}).label||(key||'') }
function getNodeColor(label) {
  const n = nodes.value.find(n=>n.label===label)
  return n ? getCatColor(n.category) : '#94a3b8'
}
function confidenceColor(v) {
  if(v>=0.85) return '#22c55e'
  if(v>=0.70) return '#f97316'
  return '#ef4444'
}
function getNodeById(id) { return nodes.value.find(n=>n.id===id) }

function hexToRgb(hex) {
  return { r:parseInt(hex.slice(1,3),16), g:parseInt(hex.slice(3,5),16), b:parseInt(hex.slice(5,7),16) }
}
function lightenHex(hex,f) {
  const {r,g,b}=hexToRgb(hex)
  return `rgb(${Math.min(255,(r+f*255)|0)},${Math.min(255,(g+f*255)|0)},${Math.min(255,(b+f*255)|0)})`
}
function darkenHex(hex,f) {
  const {r,g,b}=hexToRgb(hex)
  return `rgb(${Math.max(0,(r-f*255)|0)},${Math.max(0,(g-f*255)|0)},${Math.max(0,(b-f*255)|0)})`
}

function initPositions() {
  const canvas=canvasRef.value; if(!canvas) return
  const W=canvas.width, H=canvas.height, count=nodes.value.length
  nodes.value.forEach((node,i)=>{
    const angle=(2*Math.PI*i)/count, r=Math.min(W,H)*0.30
    node.x=W/2+r*Math.cos(angle); node.y=H/2+r*Math.sin(angle)
    node.vx=0; node.vy=0
  })
}

function fitGraphToViewport(force = false) {
  const canvas = canvasRef.value
  if (!canvas || !nodes.value.length) return

  const now = Date.now()
  if (!force && now - lastAutoFitAt < 250) return
  lastAutoFitAt = now

  const minX = Math.min(...nodes.value.map(n => n.x))
  const maxX = Math.max(...nodes.value.map(n => n.x))
  const minY = Math.min(...nodes.value.map(n => n.y))
  const maxY = Math.max(...nodes.value.map(n => n.y))

  const graphW = Math.max(1, maxX - minX)
  const graphH = Math.max(1, maxY - minY)
  const padding = 120

  const fitScaleX = (canvas.width - padding * 2) / graphW
  const fitScaleY = (canvas.height - padding * 2) / graphH
  const targetScale = Math.min(0.9, Math.max(0.18, Math.min(fitScaleX, fitScaleY)))

  scaleVal = targetScale

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  txVal = canvas.width / 2 - centerX * scaleVal
  tyVal = canvas.height / 2 - centerY * scaleVal
}

function forceTick() {
  const ns=nodes.value, es=edges.value
  const canvas=canvasRef.value; if(!canvas) return
  const W=canvas.width, H=canvas.height
  const cx=W/2, cy=H/2
  for(let i=0;i<ns.length;i++) {
    for(let j=i+1;j<ns.length;j++) {
      const dx=ns[j].x-ns[i].x, dy=ns[j].y-ns[i].y
      const d2=dx*dx+dy*dy+1, d=Math.sqrt(d2)
      const f=3500/d2, fx=(dx/d)*f, fy=(dy/d)*f
      ns[i].vx-=fx; ns[i].vy-=fy; ns[j].vx+=fx; ns[j].vy+=fy
    }
  }
  for(const e of es) {
    const a=getNodeById(e.source), b=getNodeById(e.target); if(!a||!b) continue
    const dx=b.x-a.x, dy=b.y-a.y, d=Math.sqrt(dx*dx+dy*dy)||1
    const f=(d-150)*0.035, fx=(dx/d)*f, fy=(dy/d)*f
    a.vx+=fx; a.vy+=fy; b.vx-=fx; b.vy-=fy
  }
  for(const n of ns) {
    n.vx+=(cx-n.x)*0.006; n.vy+=(cy-n.y)*0.006
    n.vx*=0.82; n.vy*=0.82
    if(draggingNode&&draggingNode.id===n.id) continue
    n.x+=n.vx; n.y+=n.vy
    n.x=Math.max(30,Math.min(W-30,n.x))
    n.y=Math.max(30,Math.min(H-30,n.y))
  }
}

function isEdgeHL(e) {
  return hlEdgePairs.value.some(([a,b])=>(e.source===a&&e.target===b)||(e.source===b&&e.target===a))
}

function drawScene() {
  const canvas=canvasRef.value; if(!canvas) return
  const ctx=canvas.getContext('2d')
  const W=canvas.width, H=canvas.height
  ctx.clearRect(0,0,W,H)
  // background grid
  ctx.save()
  ctx.strokeStyle='rgba(59,130,246,0.05)'; ctx.lineWidth=1
  for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
  for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
  ctx.restore()
  ctx.save()
  ctx.translate(txVal,tyVal)
  ctx.scale(scaleVal,scaleVal)
  const hasHL=hlNodeIds.value.length>0
  // edges
  for(const e of edges.value) {
    const a=getNodeById(e.source), b=getNodeById(e.target); if(!a||!b) continue
    const eHL=isEdgeHL(e), dimmed=hasHL&&!eHL
    const dx=b.x-a.x, dy=b.y-a.y, len=Math.sqrt(dx*dx+dy*dy)||1
    const nx=dx/len, ny=dy/len, R=22
    const x1=a.x+nx*R, y1=a.y+ny*R, x2=b.x-nx*(R+10), y2=b.y-ny*(R+10)
    ctx.save()
    if(eHL){ctx.strokeStyle='#facc15';ctx.lineWidth=2.5;ctx.shadowColor='#facc15';ctx.shadowBlur=10}
    else if(dimmed){ctx.strokeStyle='rgba(100,116,139,0.1)';ctx.lineWidth=1}
    else{ctx.strokeStyle='rgba(148,163,184,0.30)';ctx.lineWidth=1.2}
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()
    const ha=9, ang=Math.atan2(y2-y1,x2-x1)
    ctx.beginPath()
    ctx.moveTo(x2,y2)
    ctx.lineTo(x2-ha*Math.cos(ang-0.4),y2-ha*Math.sin(ang-0.4))
    ctx.lineTo(x2-ha*Math.cos(ang+0.4),y2-ha*Math.sin(ang+0.4))
    ctx.closePath()
    ctx.fillStyle=eHL?'#facc15':(dimmed?'rgba(100,116,139,0.1)':'rgba(148,163,184,0.35)')
    ctx.fill()
    if(!dimmed&&e.label){
      const mx=(x1+x2)/2, my=(y1+y2)/2
      ctx.shadowBlur=0; ctx.font='10px sans-serif'
      ctx.textAlign='center'; ctx.textBaseline='middle'
      const tw=ctx.measureText(e.label).width
      ctx.fillStyle='rgba(13,27,42,0.78)'
      ctx.fillRect(mx-tw/2-3,my-7,tw+6,14)
      ctx.fillStyle=eHL?'#fde68a':'rgba(148,163,184,0.9)'
      ctx.fillText(e.label,mx,my)
    }
    ctx.restore()
  }
  // nodes
  for(const n of nodes.value) {
    const isHL=hlNodeIds.value.includes(n.id)
    const dimmed=hasHL&&!isHL
    const color=getCatColor(n.category), R=22
    ctx.save()
    if(dimmed) ctx.globalAlpha=0.20
    else if(isHL){ctx.shadowColor=color;ctx.shadowBlur=22}
    if(isHL){
      ctx.beginPath();ctx.arc(n.x,n.y,R+6,0,Math.PI*2)
      ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke()
    }
    const grad=ctx.createRadialGradient(n.x-R*0.3,n.y-R*0.3,R*0.1,n.x,n.y,R)
    grad.addColorStop(0,lightenHex(color,0.32))
    grad.addColorStop(1,darkenHex(color,0.22))
    ctx.beginPath();ctx.arc(n.x,n.y,R,0,Math.PI*2)
    ctx.fillStyle=grad;ctx.fill()
    ctx.strokeStyle=isHL?'#facc15':color;ctx.lineWidth=isHL?2:1.5;ctx.stroke()
    ctx.shadowBlur=0
    ctx.font=`bold ${n.label.length>4?10:12}px sans-serif`
    ctx.fillStyle='#f8fafc';ctx.textAlign='center';ctx.textBaseline='middle'
    ctx.fillText(n.label,n.x,n.y)
    ctx.restore()
  }
  ctx.restore()
}

function loop() {
  forceTick()
  drawScene()
  animFrame=requestAnimationFrame(loop)
}

function canvasToWorld(cx,cy) {
  return { x:(cx-txVal)/scaleVal, y:(cy-tyVal)/scaleVal }
}
function hitNode(wx,wy) {
  return nodes.value.find(n=>Math.hypot(n.x-wx,n.y-wy)<24)
}

function onMouseDown(e) {
  const rect=canvasRef.value.getBoundingClientRect()
  const cx=e.clientX-rect.left, cy=e.clientY-rect.top
  const {x,y}=canvasToWorld(cx,cy)
  const hit=hitNode(x,y)
  if(hit){ draggingNode=hit; hit.vx=0; hit.vy=0 }
  else { panning=true; panStart={x:cx,y:cy,tx:txVal,ty:tyVal} }
}
function onMouseMove(e) {
  const rect=canvasRef.value.getBoundingClientRect()
  const cx=e.clientX-rect.left, cy=e.clientY-rect.top
  if(draggingNode){
    const {x,y}=canvasToWorld(cx,cy)
    draggingNode.x=x; draggingNode.y=y
    tooltip.visible=false
  } else if(panning){
    txVal=panStart.tx+(cx-panStart.x)
    tyVal=panStart.ty+(cy-panStart.y)
    tooltip.visible=false
  } else {
    const {x,y}=canvasToWorld(cx,cy)
    const hit=hitNode(x,y)
    if(hit){
      tooltip.visible=true; tooltip.node=hit
      tooltip.x=cx+14; tooltip.y=cy-10
    } else { tooltip.visible=false }
  }
}
function onMouseUp() { draggingNode=null; panning=false }
function onWheel(e) {
  const factor=e.deltaY<0?1.12:0.88
  const rect=canvasRef.value.getBoundingClientRect()
  const mx=e.clientX-rect.left, my=e.clientY-rect.top
  txVal=(txVal-mx)*factor+mx
  tyVal=(tyVal-my)*factor+my
  scaleVal=Math.min(4,Math.max(0.2,scaleVal*factor))
}

function zoomIn() { scaleVal=Math.min(4,scaleVal*1.2) }
function zoomOut() { scaleVal=Math.max(0.2,scaleVal/1.2) }
function resetLayout() {
  scaleVal=1; txVal=0; tyVal=0
  hlNodeIds.value=[]; hlEdgePairs.value=[]
  reasoningResults.value.forEach(r=>r.highlighted=false)
  initPositions()
  fitGraphToViewport(true)
}

function highlightPath(r) {
  reasoningResults.value.forEach(x=>x.highlighted=false)
  r.highlighted=true
  hlNodeIds.value=[...r.nodeIds]
  hlEdgePairs.value=[...r.edgePairs]
}

function useQuickQuery(q) {
  queryText.value = q
  runQuery()
}

function buildDynamicReasoning(query) {
  const text = query.toLowerCase()
  const dynamic = []

  if (text.includes('高血压') && text.includes('脑卒中')) {
    dynamic.push({
      path: [{ node: '吸烟', rel: '加重' }, { node: '高血压', rel: '并发' }, { node: '脑卒中', rel: '' }],
      conclusion: '高血压经由吸烟等危险因素放大后，会显著提升脑卒中风险，建议立即控压+戒烟。',
      evidence: `规则推理 + 图检索融合（maxHop=${maxHop.value}）`,
      type: 'risk',
      confidence: 0.9,
      highlighted: false,
      nodeIds: [15, 1, 4],
      edgePairs: [[15, 1], [1, 4]]
    })
  }

  if (text.includes('糖尿病') || text.includes('干预')) {
    dynamic.push({
      path: [{ node: '糖尿病', rel: '治疗' }, { node: '二甲双胍', rel: '联合干预' }, { node: '有氧运动', rel: '' }],
      conclusion: '糖尿病管理推荐“药物+运动”联合干预，可同时改善血糖与心血管结局。',
      evidence: `规则推理 干预协同（maxHop=${maxHop.value}）`,
      type: 'therapy',
      confidence: 0.86,
      highlighted: false,
      nodeIds: [3, 10, 14],
      edgePairs: [[3, 10], [14, 3]]
    })
  }

  if (text.includes('哮喘') && text.includes('慢阻肺')) {
    dynamic.push({
      path: [{ node: '哮喘', rel: '并存' }, { node: '慢阻肺', rel: '表现为' }, { node: '气促', rel: '' }],
      conclusion: '哮喘与慢阻肺重叠综合征需区分感染与急性加重，优化吸入方案。',
      evidence: '规则推理 ACOS 路径',
      type: 'forward',
      confidence: 0.81,
      highlighted: false,
      nodeIds: [45, 17, 22],
      edgePairs: [[45, 17], [17, 22]]
    })
  }

  if (text.includes('痛风') && (text.includes('肾') || text.includes('慢性肾病'))) {
    dynamic.push({
      path: [{ node: '痛风', rel: '风险因素' }, { node: '慢性肾病', rel: '指标' }, { node: 'eGFR', rel: '' }],
      conclusion: '痛风与高尿酸长期控制不佳可损伤肾功能，需监测 eGFR。',
      evidence: '规则推理 尿酸-肾脏轴',
      type: 'risk',
      confidence: 0.8,
      highlighted: false,
      nodeIds: [46, 18, 34],
      edgePairs: [[46, 18], [18, 34]]
    })
  }

  if (text.includes('抑郁')) {
    dynamic.push({
      path: [{ node: '慢性应激', rel: '加重' }, { node: '抑郁症', rel: '并存' }, { node: '高血压', rel: '' }],
      conclusion: '抑郁与心血管疾病常共病，管理血压同时应评估情绪与睡眠。',
      evidence: '规则推理 心身共病',
      type: 'risk',
      confidence: 0.78,
      highlighted: false,
      nodeIds: [77, 48, 1],
      edgePairs: [[77, 48], [48, 1]]
    })
  }

  if (dynamic.length === 0) {
    dynamic.push({
      path: [{ node: '肥胖', rel: '风险因素' }, { node: '糖尿病', rel: '并发' }, { node: '冠心病', rel: '' }],
      conclusion: `针对“${query}”未命中精确规则，返回相似高危路径。`,
      evidence: `相似召回 + 多跳路径评分（maxHop=${maxHop.value}）`,
      type: 'forward',
      confidence: 0.74,
      highlighted: false,
      nodeIds: [16, 3, 2],
      edgePairs: [[16, 3], [3, 2]]
    })
  }

  return dynamic.slice(0, Math.max(1, maxHop.value - 1))
}

function runAutoReasoning() {
  isQuerying.value = true
  setTimeout(() => {
    const sampled = [...baseReasoningPool]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(item => ({ ...item, highlighted: false }))

    const autoPack = [
      ...buildDynamicReasoning('高血压 -> 脑卒中'),
      ...buildDynamicReasoning('糖尿病 -> 干预'),
      ...sampled
    ]
    reasoningResults.value = [...autoPack, ...reasoningResults.value].slice(0, 24)
    isQuerying.value = false
  }, 850)
}

function runCounterfactual() {
  const baseMap = {
    quit_smoking: {
      path: [{ node: '戒烟', rel: '降低' }, { node: '高血压', rel: '降低并发' }, { node: '脑卒中', rel: '' }],
      conclusion: '若立即戒烟，预计3-6个月内高血压波动下降，脑卒中风险明显回落。',
      evidence: '反事实链：吸烟移除后，风险传播强度下降约18%~26%',
      type: 'risk', confidence: 0.92, nodeIds: [15, 1, 4], edgePairs: [[15, 1], [1, 4]]
    },
    weight_loss: {
      path: [{ node: '减重5%', rel: '改善' }, { node: '糖尿病', rel: '降低并发' }, { node: '冠心病', rel: '' }],
      conclusion: '若体重下降5%，糖尿病相关心血管风险预计在6个月内明显下降。',
      evidence: '反事实链：BMI下降触发代谢改善规则，冠心病风险下降约14%',
      type: 'therapy', confidence: 0.88, nodeIds: [16, 3, 2], edgePairs: [[16, 3], [3, 2]]
    },
    exercise_up: {
      path: [{ node: '有氧运动', rel: '提升' }, { node: '高血压', rel: '改善' }, { node: '糖尿病', rel: '' }],
      conclusion: '若每周运动达到150分钟，血压和血糖趋势均可获得持续改善。',
      evidence: '反事实链：运动剂量达标触发双目标干预规则',
      type: 'therapy', confidence: 0.9, nodeIds: [14, 1, 3], edgePairs: [[14, 1], [14, 3]]
    }
  }

  const picked = baseMap[whatIfAction.value]
  if (!picked) return
  reasoningResults.value = [
    { ...picked, highlighted: false },
    ...reasoningResults.value
  ].slice(0, 14)
  highlightPath(reasoningResults.value[0])
}

function runTimelineProjection() {
  const m = Number(forecastMonths.value) || 6
  const riskDrop = m === 3 ? 8 : m === 6 ? 16 : 27
  const bpAfter = 142 - Math.round(riskDrop * 0.35)
  const gluAfter = 8.2 - riskDrop * 0.03
  const strokeRiskAfter = `${Math.max(9, 24 - riskDrop)}%`

  projectionResults.value = [
    { metric: '收缩压趋势', before: '142 mmHg', after: `${bpAfter} mmHg`, delta: `-${142 - bpAfter} mmHg`, trend: 'down' },
    { metric: '空腹血糖趋势', before: '8.2 mmol/L', after: `${gluAfter.toFixed(1)} mmol/L`, delta: `-${(8.2 - gluAfter).toFixed(1)} mmol/L`, trend: 'down' },
    { metric: '脑卒中风险', before: '24%', after: strokeRiskAfter, delta: `-${24 - parseInt(strokeRiskAfter)}%`, trend: 'down' }
  ]

  reasoningResults.value = [
    {
      path: [{ node: `${m}个月趋势`, rel: '推演' }, { node: '高血压', rel: '影响' }, { node: '脑卒中', rel: '' }],
      conclusion: `${m}个月风险趋势推演完成：核心风险预计下降 ${riskDrop}% 。`,
      evidence: `时间推演链：行为干预 × ${m}个月窗口 × 风险传播衰减模型`,
      type: 'forward',
      confidence: 0.84,
      highlighted: false,
      nodeIds: [1, 4, 14],
      edgePairs: [[14, 1], [1, 4]]
    },
    ...reasoningResults.value
  ].slice(0, 14)
}

function runQuery() {
  if(!queryText.value.trim()) return
  isQuerying.value=true
  setTimeout(()=>{
    const q=queryText.value.trim()
    const dynamic = buildDynamicReasoning(q)
    const fromPool = baseReasoningPool.filter(r => r.path.some(s => s.node.includes(q) || q.includes(s.node)))

    reasoningResults.value = [...dynamic, ...fromPool, ...reasoningResults.value].slice(0, 24)

    const match=reasoningResults.value.find(r=>r.path.some(s=>s.node.includes(q)||q.includes(s.node)))
    if(match) highlightPath(match)

    queryText.value=''
    isQuerying.value=false
  },900)
}

function resizeCanvas() {
  const canvas=canvasRef.value; if(!canvas) return
  const wrap=canvas.parentElement
  canvas.width=wrap.clientWidth

  const toolbar = 44
  const queryBar = 52
  const quickBar = 42
  const whatIfBar = 42
  const reserve = toolbar + queryBar + quickBar + whatIfBar + 12
  const nextHeight = Math.max(320, wrap.clientHeight - reserve)
  canvas.height = nextHeight
}

function handleResize() {
  resizeCanvas()
  fitGraphToViewport(true)
}

onMounted(()=>{
  resizeCanvas()
  initPositions()
  fitGraphToViewport(true)
  loop()

  requestAnimationFrame(() => {
    handleResize()
  })

  setTimeout(() => {
    handleResize()
  }, 220)

  setTimeout(() => {
    handleResize()
  }, 700)

  window.addEventListener('resize', handleResize)
})
onUnmounted(()=>{
  if(animFrame) cancelAnimationFrame(animFrame)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
* { box-sizing: border-box; }
.kg-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: calc(100vh - 48px);
  padding: 0;
  background: transparent;
}
.kg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 14px;
  border-bottom: 1px solid rgba(59,130,246,0.15);
  flex-shrink: 0;
}
.kg-title { color: #f8fafc; font-size: 22px; font-weight: 700; margin: 0 0 4px; letter-spacing: -0.3px; }
.kg-desc  { color: #64748b; font-size: 13px; margin: 0; }
.kg-header-right { display: flex; gap: 12px; }
.stat-badge {
  display: flex; flex-direction: column; align-items: center;
  background: rgba(15,23,41,0.8); border: 1px solid rgba(59,130,246,0.2);
  border-radius: 10px; padding: 8px 18px;
}
.stat-badge.accent { border-color: rgba(34,197,94,0.35); }
.stat-num  { color: #f8fafc; font-size: 20px; font-weight: 700; line-height: 1; }
.stat-label{ color: #64748b; font-size: 11px; margin-top: 2px; }

.kg-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 0;
}
.kg-canvas-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
  border-right: 1px solid rgba(59,130,246,0.12);
}
.canvas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(13,27,42,0.6);
  border-bottom: 1px solid rgba(59,130,246,0.1);
  flex-shrink: 0;
}
.toolbar-title { color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; margin-right: 16px; }
.toolbar-left  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.toolbar-right { display: flex; gap: 6px; }
.legend { display: flex; gap: 10px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 5px; color: #94a3b8; font-size: 11px; }
.legend-dot  { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.btn-icon {
  width: 30px; height: 30px; border-radius: 6px;
  background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25);
  color: #94a3b8; font-size: 16px; cursor: pointer; display: flex;
  align-items: center; justify-content: center; transition: all 0.15s;
}
.btn-icon:hover { background: rgba(59,130,246,0.22); color: #f8fafc; }

.query-bar {
  display: flex; gap: 8px; padding: 10px 14px;
  background: rgba(13,27,42,0.5); border-bottom: 1px solid rgba(59,130,246,0.1);
  flex-shrink: 0;
}
.query-select {
  background: rgba(15,23,41,0.85);
  border: 1px solid rgba(59,130,246,0.25);
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 12px;
  padding: 0 8px;
}
.query-quick-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(13,27,42,0.35);
  border-bottom: 1px solid rgba(59,130,246,0.08);
  flex-wrap: wrap;
}
.whatif-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(13,27,42,0.28);
  border-bottom: 1px solid rgba(59,130,246,0.08);
  flex-wrap: wrap;
}
.forecast-label { color: #64748b; font-size: 12px; margin-left: 10px; }
.quick-label { color: #64748b; font-size: 12px; }
.quick-chip {
  background: rgba(37,99,235,0.12);
  border: 1px solid rgba(59,130,246,0.25);
  color: #93c5fd;
  border-radius: 999px;
  font-size: 11px;
  padding: 4px 10px;
  cursor: pointer;
}
.quick-chip:hover { background: rgba(37,99,235,0.2); }
.query-input {
  flex: 1; background: rgba(15,23,41,0.8); border: 1px solid rgba(59,130,246,0.25);
  border-radius: 8px; padding: 8px 14px; color: #f8fafc; font-size: 13px; outline: none;
  transition: border-color 0.2s;
}
.query-input::placeholder { color: #475569; }
.query-input:focus { border-color: #3b82f6; }
.btn-query {
  padding: 8px 20px; background: linear-gradient(135deg,#2563eb,#3b82f6);
  border: none; border-radius: 8px; color: #fff; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s; display: flex; align-items: center; white-space: nowrap;
}
.btn-query.ghost {
  background: rgba(37,99,235,0.12);
  border: 1px solid rgba(59,130,246,0.25);
  color: #93c5fd;
}
.btn-query.ghost:hover { opacity: 1; background: rgba(37,99,235,0.2); }
.btn-query:hover { opacity: 0.88; }
.btn-query.loading { opacity: 0.7; pointer-events: none; }
.spinner {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.graph-canvas {
  flex: 1;
  display: block;
  width: 100%;
  cursor: grab;
}
.graph-canvas:active { cursor: grabbing; }

.node-tooltip {
  position: absolute;
  background: rgba(13,27,42,0.95);
  border: 1px solid rgba(59,130,246,0.35);
  border-radius: 10px;
  padding: 10px 14px;
  pointer-events: none;
  z-index: 10;
  min-width: 150px;
  max-width: 220px;
  backdrop-filter: blur(4px);
}
.tooltip-name { color: #f8fafc; font-size: 14px; font-weight: 700; margin-bottom: 3px; }
.tooltip-type { color: #3b82f6; font-size: 11px; margin-bottom: 6px; }
.tooltip-desc { color: #94a3b8; font-size: 12px; line-height: 1.5; }

.reasoning-panel {
  width: 320px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  background: rgba(13,27,42,0.5);
  overflow: hidden;
}
.panel-header {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(59,130,246,0.12);
  flex-shrink: 0;
}
.panel-title { color: #f8fafc; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.panel-badge {
  background: #2563eb; color: #fff; font-size: 11px; font-weight: 700;
  border-radius: 10px; padding: 1px 7px;
}

.reasoning-list {
  flex: 1;
  max-height: 440px;
  min-height: 440px;
  overflow-y: auto;
  padding: 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.reasoning-list::-webkit-scrollbar { width: 4px; }
.reasoning-list::-webkit-scrollbar-track { background: transparent; }
.reasoning-list::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.25); border-radius: 4px; }

.reasoning-card {
  background: rgba(15,23,41,0.75);
  border: 1px solid rgba(59,130,246,0.15);
  border-radius: 10px;
  padding: 11px 13px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.reasoning-card:hover { border-color: rgba(59,130,246,0.4); background: rgba(37,99,235,0.08); }
.reasoning-card.highlighted { border-color: #facc15; background: rgba(250,204,21,0.07); }

.card-top {
  display: flex; align-items: center; gap: 8px;  
  margin-bottom: 6px;
}
.reasoning-type {
  font-size: 10px;
  border-radius: 6px;
  padding: 1px 6px;
  border: 1px solid rgba(148,163,184,0.25);
  color: #cbd5e1;
}
.reasoning-type.risk { color: #fca5a5; border-color: rgba(239,68,68,0.35); }
.reasoning-type.therapy { color: #86efac; border-color: rgba(34,197,94,0.35); }
.reasoning-type.forward { color: #93c5fd; border-color: rgba(59,130,246,0.35); }
.card-index { color: #475569; font-size: 11px; font-weight: 700; min-width: 24px; }
.confidence-bar-wrap {
  flex: 1; height: 5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;
}
.confidence-bar { display: block; height: 100%; border-radius: 3px; transition: width 0.4s; }
.confidence-val { color: #94a3b8; font-size: 11px; font-weight: 600; min-width: 32px; text-align: right; }

.card-path {
  display: flex; flex-wrap: wrap; align-items: center; gap: 3px;
  margin-bottom: 8px;
}
.path-step { display: flex; align-items: center; gap: 3px; }
.path-node { font-size: 12px; font-weight: 700; }
.path-arrow { display: flex; align-items: center; gap: 3px; color: #475569; font-size: 11px; }
.path-rel {
  font-size: 10px; color: #64748b;
  background: rgba(255,255,255,0.05);
  border-radius: 4px; padding: 1px 5px;
}
.card-conclusion {
  color: #94a3b8; font-size: 12px; line-height: 1.55;
  border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; margin-top: 2px;
}
.card-evidence {
  margin-top: 6px;
  color: #64748b;
  font-size: 11px;
  line-height: 1.5;
}

.reasoning-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 10px;
  border-top: 1px solid rgba(59,130,246,0.12);
  border-bottom: 1px solid rgba(59,130,246,0.12);
  background: rgba(13,27,42,0.45);
}
.summary-item {
  background: rgba(15,23,41,0.7);
  border: 1px solid rgba(59,130,246,0.15);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.summary-item span { color: #64748b; font-size: 10px; }
.summary-item b { color: #e2e8f0; font-size: 16px; line-height: 1; }

.projection-panel {
  padding: 10px;
  border-bottom: 1px solid rgba(59,130,246,0.12);
  background: rgba(13,27,42,0.35);
}
.projection-title {
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
}
.projection-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}
.projection-card {
  background: rgba(15,23,41,0.75);
  border: 1px solid rgba(59,130,246,0.15);
  border-radius: 8px;
  padding: 8px;
}
.projection-top {
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 12px;
}
.projection-top b { font-size: 14px; }
.projection-top b.down { color: #4ade80; }
.projection-top b.up { color: #f87171; }
.projection-meta {
  margin-top: 4px;
  color: #64748b;
  font-size: 11px;
}
.projection-empty {
  color: #64748b;
  font-size: 11px;
  padding: 8px 4px;
}
.engine-status {
  padding: 12px 16px;
  border-top: 1px solid rgba(59,130,246,0.12);
  background: rgba(13,27,42,0.4);
  flex-shrink: 0;
}
.engine-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
}
.engine-row:last-child { border-bottom: none; }
.engine-label { color: #475569; font-size: 11px; }
.engine-val   { color: #94a3b8; font-size: 11px; font-weight: 600; }
.engine-val.online { color: #22c55e; }

/* ===== 移动端 ===== */
@media(max-width:768px){
  .kg-page{min-height:auto;overflow:auto}
  .kg-header{flex-direction:column;align-items:flex-start;gap:10px;padding:12px 14px 10px}
  .kg-title{font-size:18px}
  .kg-header-right{display:flex;gap:8px;width:100%}
  .stat-badge{flex:1;padding:6px 8px}
  .stat-num{font-size:16px}
  .kg-body{flex-direction:column;overflow:visible}
  .kg-canvas-wrap{border-right:none;border-bottom:1px solid rgba(59,130,246,0.12);min-height:420px}
  .graph-canvas{min-height:280px}
  .reasoning-panel{width:100%;min-width:unset;max-height:380px}
  .legend{display:none}
  .toolbar-title{font-size:11px}
}
</style>
