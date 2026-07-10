# AI 全息生命质量指数平台 — 非侵入式多模态全周期健康预测系统

基于 Vue 3 + Vite + Express 的全栈个人健康管理系统。集成 3D 数字孪生、知识图谱推理、多模态生理采集、LQI 生命质量指数评估、健康风险预测、AI 辅助问诊等模块，实现个人健康的全周期智能化管理。

## 技术栈

| 层次 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue 3 (Composition API) | ^3.0.4 |
| 构建工具 | Vite | ^1.0.0 |
| 路由 | Vue Router 4 | ^4.6.4 |
| 3D 可视化 | Three.js | ^0.183.2 |
| 人脸/表情分析 | face-api.js (TensorFlow.js) | ^0.22.2 |
| 后端框架 | Express | ^4.18.2 |
| 数据库 | MySQL 5.7+ / 8.0+ | — |
| 认证 | JWT (jsonwebtoken) | ^9.0.2 |
| 密码加密 | bcryptjs | ^2.4.3 |
| HTTP 客户端 | Axios | ^1.6.2 |

## 功能模块

### 🏥 个人健康
| 模块 | 路由 | 说明 |
|------|------|------|
| **健康大盘** | `/health-dashboard` | 生命体征指标卡片、趋势图、环形图可视化 |
| **LQI 详情** | `/lqi-details` | 生命质量指数综合评分、维度雷达图、趋势曲线 |
| **3D 数字孪生** | `/digital-twin` | Three.js 人体模型展示、器官标注与健康状态联动、线框/自动旋转模式 |
| **健康风险预测** | `/health-risk` | 多维度风险评分、雷达图、预警列表 |
| **健康报告** | `/health-report` | 报告摘要、评分趋势、导出入口（默认首页） |

### 🤖 智能分析
| 模块 | 路由 | 说明 |
|------|------|------|
| **知识图谱推理** | `/knowledge-graph` | 前端 Canvas 力导向图谱，支持前向链推理、风险传播推理、干预方案推理、反事实推理、风险趋势推演 |
| **多模态采集** | `/multi-modal` | 基于 face-api.js 的本地面部表情/年龄/性别分析 + 语音情绪分析 + 心率估算，**本地计算，数据不上传** |

### 👨‍👩‍👧‍👦 家庭与消息
| 模块 | 路由 | 说明 |
|------|------|------|
| **家庭守护** | `/family-guardian` | 家庭成员管理（增删改查），健康评分与体征展示 |
| **消息中心** | `/message-center` | 消息列表、单条/全部已读、删除 |
| **系统设置** | `/system-settings` | 深色/浅色主题切换、字体大小调节、通知偏好、数据同步 |

### ⚙️ 系统运维
| 模块 | 路由 | 说明 |
|------|------|------|
| **后台运维** | `/backend-ops` | 运维看板原型，系统状态、资源占用、在线用户、告警日志 |

### 💬 AI 问诊
| 功能 | 说明 |
|------|------|
| **AI 医生** | 主布局右下角悬浮球入口，支持关键词规则引擎 + 可选的秘塔 AI 大模型（OpenAI 兼容接口） |
| **风险分级** | 根据问题关键词自动判断风险等级（低/中/高） |
| **知识图谱联动** | 问诊结果中展示关联的知识图谱命中词条 |

## 快速开始

### 环境要求

- **Node.js** 18.x / 20.x（LTS）
- **MySQL** 5.7+ 或 8.0+
- **npm**（随 Node.js 安装）

### 安装步骤

```bash
# 1. 安装前端依赖
npm install

# 2. 安装后端依赖
cd server
npm install
cd ..

# 3. 配置数据库
#    修改 server/database/config.js 中的数据库连接信息
#    默认配置：
#       host: 127.0.0.1
#       port: 3306
#       user: root
#       password: 123456
#       database: health_management
#    首次启动时程序会自动创建表结构

# 4. （可选）配置 AI 接口
#    复制 server/.env.example 为 server/.env 并填写
#    MITA_AI_API_URL — 秘塔 AI 或 OpenAI 兼容接口地址
#    MITA_AI_API_KEY — API 密钥
#    不配置则使用内置规则引擎应答

# 5. 启动后端（需先启动 MySQL）
npm run server

# 6. 新开终端，启动前端开发服务器
npm run dev
```

### 访问

- **前端**：http://localhost:3001
- **后端 API**：http://localhost:3002

## 项目结构

```
router_demo_source/
├── index.html                    # 入口 HTML
├── vite.config.js                # Vite 配置 (端口 3001)
├── package.json                  # 前端依赖
├── .gitignore
├── 1.glb / 2.glb                 # 3D 人体模型文件
├── localhost.sql                 # 数据库示例数据
├── import-localhost-sql.js       # 数据库导入脚本
├── src/
│   ├── main.js                   # Vue 应用入口
│   ├── App.vue                   # 根组件（主题变量定义）
│   ├── index.css                 # 全局样式
│   ├── router/
│   │   └── index.js              # 路由配置 + 守卫
│   ├── layouts/
│   │   └── MainLayout.vue        # 主布局（侧边栏 + AI 医生）
│   ├── components/
│   │   ├── Sidebar.vue           # 侧边导航栏
│   │   └── NavIcon.vue           # 导航图标组件
│   ├── views/
│   │   ├── Login.vue             # 登录/注册
│   │   ├── HealthDashboard.vue   # 健康大盘
│   │   ├── LQIDetails.vue        # LQI 详情
│   │   ├── DigitalTwin.vue       # 3D 数字孪生
│   │   ├── HealthRisk.vue        # 健康风险预测
│   │   ├── HealthReport.vue      # 健康报告
│   │   ├── KnowledgeGraph.vue    # 知识图谱推理
│   │   ├── MultiModal.vue        # 多模态采集
│   │   ├── FamilyGuardian.vue    # 家庭守护
│   │   ├── MessageCenter.vue     # 消息中心
│   │   ├── SystemSettings.vue    # 系统设置
│   │   └── BackendOps.vue        # 后台运维
│   ├── services/
│   │   └── api.js                # Axios API 封装
│   └── utils/
│       └── theme.js              # 主题工具
├── server/
│   ├── index.js                  # Express 服务端入口 (端口 3002)
│   ├── package.json              # 后端依赖
│   ├── .env.example              # AI 配置模板
│   ├── database/
│   │   ├── config.js             # 数据库连接配置
│   │   ├── schema.sql            # 数据库建表 SQL
│   │   ├── init.js               # 初始化脚本
│   │   └── index.js              # 数据库连接池管理
│   └── test-*.js                 # 测试脚本
└── docs/
    ├── 人工智能大模型使用说明.md  # AI 使用说明文档
    ├── 安装使用项目总结与参考文献.md # 安装指南与项目总结
    └── 模块测试报告.md           # 模块功能测试报告
```

## API 接口一览

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | ❌ |
| POST | `/api/auth/login` | 用户登录 | ❌ |
| GET | `/api/health/metrics` | 获取健康数据 | ✅ |
| POST | `/api/health/metrics` | 添加健康数据 | ✅ |
| GET | `/api/family/members` | 获取家庭成员列表 | ✅ |
| POST | `/api/family/members` | 添加家庭成员 | ✅ |
| PUT | `/api/family/members/:id` | 更新家庭成员 | ✅ |
| DELETE | `/api/family/members/:id` | 删除家庭成员 | ✅ |
| GET | `/api/messages` | 获取消息列表 | ✅ |
| PUT | `/api/messages/:id/read` | 标记单条已读 | ✅ |
| PUT | `/api/messages/read-all` | 标记全部已读 | ✅ |
| DELETE | `/api/messages/:id` | 删除消息 | ✅ |
| POST | `/api/multimodal/records` | 保存多模态采集记录 | ✅ |
| GET | `/api/multimodal/records` | 获取多模态采集记录 | ✅ |
| DELETE | `/api/multimodal/records/:id` | 删除采集记录 | ✅ |
| POST | `/api/doctor/consult` | AI 医生问诊 | ✅ |
| GET | `/api/settings` | 获取系统设置 | ✅ |
| PUT | `/api/settings` | 更新系统设置 | ✅ |
| GET | `/api/user/profile` | 获取用户信息 | ✅ |
| PUT | `/api/user/profile` | 更新用户信息 | ✅ |

## 配置说明

### 数据库配置

编辑 `server/database/config.js`：

```js
module.exports = {
  host: '127.0.0.1',   // MySQL 主机地址
  port: 3306,           // MySQL 端口
  user: 'root',         // 数据库用户名
  password: '123456',   // 数据库密码
  database: 'health_management', // 数据库名
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}
```

### AI 大模型配置

编辑 `server/.env`（从 `.env.example` 复制）：

```env
MITA_AI_API_URL=https://api.metaso.cn/v1/chat/completions  # 兼容 OpenAI 的接口地址
MITA_AI_API_KEY=your-api-key-here                           # API 密钥
MITA_AI_MODEL=mita                                          # 模型名称（可选）
```

不配置上述变量时，AI 问诊自动回退到服务端规则引擎与关键词匹配应答。

## 生产构建

```bash
npm run build
```

生成静态资源至 `dist/` 目录，可由任意静态服务器或反向代理托管。需通过环境变量 `VITE_API_BASE_URL` 将 API 指向已部署的后端地址。

## 隐私说明

- **多模态采集**：所有面部表情分析与语音情绪分析均在浏览器本地完成（基于 TensorFlow.js WebGL 后端），原始数据不上传至服务器
- **用户密码**：采用 bcrypt 哈希加密存储
- **API 密钥**：仅存放于本地 `.env` 文件，不提交至版本库

## 文档

- [人工智能大模型使用说明](./docs/人工智能大模型使用说明.md) — AI 工具使用说明、提示词样例与版权说明
- [安装使用项目总结与参考文献](./docs/安装使用项目总结与参考文献.md) — 详细安装步骤、项目总结与 GB/T 7714 参考文献
- [模块测试报告](./docs/模块测试报告.md) — 各模块功能测试用例与结果

## 许可证

本项目仅作课程/个人学习演示使用，**不构成**商业授权证明。第三方库以其各自许可证为准。
