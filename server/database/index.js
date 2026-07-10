const mysql = require('mysql2/promise');
const config = require('./config');

let pool = null;

// 创建数据库连接池
async function createPool() {
  try {
    pool = mysql.createPool(config);
    
    // 测试连接
    const connection = await pool.getConnection();
    console.log('✅ MySQL 数据库连接成功');
    connection.release();
    
    return pool;
  } catch (error) {
    console.error('❌ MySQL 数据库连接失败:', error.message);
    console.log('请确保:');
    console.log('1. MySQL 服务已启动');
    console.log('2. 数据库配置正确 (server/database/config.js)');
    console.log('3. 数据库 health_management 已创建');
    throw error;
  }
}

// 获取数据库连接池
function getPool() {
  if (!pool) {
    throw new Error('数据库连接池未初始化');
  }
  return pool;
}

// 初始化数据库表
async function initTables() {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const pool = getPool();
    
    // 不删除旧表，直接用 CREATE TABLE IF NOT EXISTS 创建缺失的表
    console.log('检查并创建缺失的表...');
    
    // 读取并执行 schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // 先按换行符分割，再按分号分割，确保每个语句独立
    const lines = schema.split('\n');
    const statements = [];
    let currentStatement = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 跳过注释和空行
      if (trimmedLine.startsWith('--') || trimmedLine === '') {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
        continue;
      }
      
      // 如果行内包含分号，分割成多个语句
      if (trimmedLine.includes(';')) {
        const parts = trimmedLine.split(';');
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim();
          if (part) {
            if (i === 0 && currentStatement.trim()) {
              currentStatement += ' ' + part;
              statements.push(currentStatement.trim());
              currentStatement = '';
            } else if (i === 0) {
              currentStatement = part;
            } else {
              if (part) {
                statements.push(part);
              }
            }
          }
        }
      } else {
        currentStatement += ' ' + trimmedLine;
      }
    }
    
    // 添加最后一个语句
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    // 过滤空语句
    const filteredStatements = statements.filter(stmt => stmt.length > 0);
    
    console.log(`开始执行 ${filteredStatements.length} 个 SQL 语句...`);
    
    for (let i = 0; i < filteredStatements.length; i++) {
      const statement = filteredStatements[i];
      if (statement.trim()) {
        try {
          await pool.execute(statement);
          console.log(`✓ 执行语句 ${i + 1}/${filteredStatements.length}`);
        } catch (err) {
          console.error(`✗ 语句 ${i + 1} 失败:`, statement.substring(0, 100));
          throw err;
        }
      }
    }

    const ensureColumn = async (tableName, columnName, definition) => {
      const [rows] = await pool.execute(
        `SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [config.database, tableName, columnName]
      );

      if (!rows[0].count) {
        await pool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
      }
    };

    // 兼容旧库结构：补齐多模态字段
    await ensureColumn('multimodal_records', 'age_estimate', 'INTEGER');
    await ensureColumn('multimodal_records', 'gender_label', 'VARCHAR(10)');
    await ensureColumn('multimodal_records', 'gender_confidence', 'REAL');
    
    console.log('✅ 数据库表初始化完成');
    
    // 触发器需要 SUPER 权限，宝塔环境跳过，时间戳由表的 DEFAULT CURRENT_TIMESTAMP 自动处理
    console.log('✅ 触发器创建跳过（使用 DEFAULT CURRENT_TIMESTAMP）');
  } catch (error) {
    console.error('❌ 数据库表初始化失败:', error.message);
    throw error;
  }
}

// 插入示例数据
async function initSampleData() {
  try {
    const pool = getPool();
    const bcrypt = require('bcryptjs');
    
    // 检查是否已有用户
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    
    if (users[0].count === 0) {
      console.log('正在初始化示例数据...');
      
      const passwordHash = await bcrypt.hash('123456', 10);
      const userId = 'demo-user-id'; // 使用固定的用户 ID
      
      // 插入示例用户
      await pool.execute(
        `INSERT INTO users (id, username, email, password_hash, name, phone, member_since) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, 'demo', 'demo@health.com', passwordHash, '演示用户', '13800138000', new Date().toISOString().split('T')[0]]
      );
      
      // 插入示例健康数据
      const now = new Date();
      for (let i = 0; i < 10; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const formattedDate = date.toISOString().replace('Z', '').split('.')[0];
        const metricId = 'metric-' + Date.now() + '-' + i;
        await pool.execute(
          `INSERT INTO health_metrics (id, user_id, metric_type, metric_value, unit, recorded_at) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [metricId, userId, 'heart_rate', 70 + Math.random() * 10, 'bpm', formattedDate]
        );
        await pool.execute(
          `INSERT INTO health_metrics (id, user_id, metric_type, metric_value, unit, recorded_at) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [metricId + '-bp', userId, 'blood_pressure', 115 + Math.random() * 10, 'mmHg', formattedDate]
        );
        await pool.execute(
          `INSERT INTO health_metrics (id, user_id, metric_type, metric_value, unit, recorded_at) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [metricId + '-steps', userId, 'steps', 5000 + Math.floor(Math.random() * 10000), 'steps', formattedDate]
        );
      }
      
      // 插入示例家庭成员
      const members = [
        { id: 'demo-member-1', name: '张三', relation: '父亲', age: 58, gender: '男', avatar_color: '#8b5cf6', health_score: 85, risk_level: '中' },
        { id: 'demo-member-2', name: '李四', relation: '母亲', age: 56, gender: '女', avatar_color: '#f97316', health_score: 88, risk_level: '中' },
        { id: 'demo-member-3', name: '王五', relation: '配偶', age: 32, gender: '男', avatar_color: '#22c55e', health_score: 95, risk_level: '低' }
      ];
      
      for (const member of members) {
        const today = new Date().toISOString().replace('Z', '').split('.')[0];
        await pool.execute(
          `INSERT INTO family_members (id, user_id, name, relation, age, gender, avatar_color, health_score, risk_level, last_check_in)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [member.id, userId, member.name, member.relation, member.age, member.gender, member.avatar_color, member.health_score, member.risk_level, today]
        );
        
        // 插入生命体征数据
        await pool.execute(
          `INSERT INTO family_vitals (id, member_id, heart_rate, blood_pressure, steps)
           VALUES (?, ?, ?, ?, ?)`,
          ['demo-vital-' + member.id.split('-').pop(), member.id, 70 + Math.floor(Math.random() * 20), '120/80', 5000 + Math.floor(Math.random() * 10000)]
        );
      }
      
      // 插入示例消息
      await pool.execute(
        `INSERT INTO messages (id, user_id, title, content, full_content, type, priority) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['msg-' + Date.now() + '-1', userId, '每日健康提醒', '记得按时测量血压和心率', '完整内容：建议您每天早上起床后测量血压和心率，并记录下来。', 'health', 'normal']
      );
      await pool.execute(
        `INSERT INTO messages (id, user_id, title, content, full_content, type, priority) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['msg-' + Date.now() + '-2', userId, '系统更新通知', '系统已升级到 v2.3.0', '完整内容：本次更新优化了数据可视化效果，修复了已知问题。', 'system', 'low']
      );
      await pool.execute(
        `INSERT INTO messages (id, user_id, title, content, full_content, type, priority) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['msg-' + Date.now() + '-3', userId, '心率异常提醒', '检测到您的心率偏高', '完整内容：您今天下午的心率持续高于正常范围，建议适当休息。', 'health', 'high']
      );
      
      // 插入示例设置
      await pool.execute(
        `INSERT INTO user_settings (id, user_id) VALUES (?, ?)`,
        ['settings-' + Date.now(), userId]
      );
      
      console.log('✅ 示例数据初始化完成');
      console.log('演示账号：username: demo / password: 123456');
    } else {
      console.log('✅ 数据库已有数据，跳过示例数据初始化');
    }
  } catch (error) {
    console.error('❌ 示例数据初始化失败:', error.message);
  }
}

// 关闭数据库连接
async function closePool() {
  if (pool) {
    await pool.end();
    console.log('数据库连接已关闭');
  }
}

module.exports = {
  createPool,
  getPool,
  initTables,
  initSampleData,
  closePool
}
