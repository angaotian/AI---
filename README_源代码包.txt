# 源代码包说明

## 目录
- src/          前端 Vue 源码
- server/       后端 Express 源码（不含 node_modules）
- docs/         文档
- *.sql         数据库示例（可选导入）

## 安装
1. 根目录: npm install
2. server 目录: npm install
3. 复制 server/.env.example 为 server/.env 并填写 MySQL、可选 MITA_AI_* 
4. 配置 server/database/config.js
5. npm run server 与 npm run dev

## 注意
- 未包含 node_modules、dist、.env（含密钥）
- 3D 模型: 1.glb、2.glb 位于包根目录
