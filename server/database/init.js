const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'health.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// 初始化数据库
function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('SQLite 数据库已连接');

      // 读取并执行 schema
      fs.readFile(SCHEMA_PATH, 'utf8', (err, sql) => {
        if (err) {
          reject(err);
          return;
        }

        db.exec(sql, (err) => {
          if (err) {
            reject(err);
            return;
          }
          console.log('数据库表已创建');
          
          // 插入示例数据
          insertSampleData(db, resolve, reject);
        });
      });
    });
  });
}

// 插入示例数据
function insertSampleData(db, resolve, reject) {
  const bcrypt = require('bcryptjs');
  
  // 创建示例用户
  const passwordHash = bcrypt.hashSync('123456', 10);
  
  db.run(
    `INSERT OR IGNORE INTO users (username, email, password_hash, name, phone) 
     VALUES (?, ?, ?, ?, ?)`,
    ['demo', 'demo@health.com', passwordHash, '演示用户', '13800138000'],
    function(err) {
      if (err) {
        reject(err);
        return;
      }
      
      if (this.changes > 0) {
        console.log('示例用户已创建');
        const userId = this.lastID;
        
        // 创建示例健康数据
        insertSampleHealthMetrics(db, userId, () => {
          // 创建示例家庭成员
          insertSampleFamilyMembers(db, userId, () => {
            // 创建示例消息
            insertSampleMessages(db, userId, () => {
              // 创建示例设置
              insertSampleSettings(db, userId, () => {
                console.log('示例数据已初始化');
                resolve(db);
              });
            });
          });
        });
      } else {
        console.log('示例用户已存在');
        resolve(db);
      }
    }
  );
}

function insertSampleHealthMetrics(db, userId, callback) {
  const now = new Date();
  const metrics = [
    ['heart_rate', 72, 'bpm'],
    ['heart_rate', 75, 'bpm'],
    ['heart_rate', 68, 'bpm'],
    ['blood_pressure', 120, 'mmHg'],
    ['blood_pressure', 118, 'mmHg'],
    ['steps', 8500, 'steps'],
    ['steps', 10200, 'steps'],
    ['sleep', 7.5, 'hours'],
    ['sleep', 8.0, 'hours'],
  ];

  let completed = 0;
  metrics.forEach(([type, value, unit]) => {
    const date = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    db.run(
      `INSERT INTO health_metrics (user_id, metric_type, metric_value, unit, recorded_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, value, unit, date.toISOString()],
      () => {
        completed++;
        if (completed === metrics.length) {
          console.log('示例健康数据已创建');
          callback();
        }
      }
    );
  });
}

function insertSampleFamilyMembers(db, userId, callback) {
  const members = [
    ['张三', '父亲', 58, '男', '#8b5cf6', 85, '中', '2024-01-15'],
    ['李四', '母亲', 56, '女', '#f97316', 88, '中', '2024-01-15'],
    ['王五', '配偶', 32, '男', '#22c55e', 95, '低', '2024-01-15'],
  ];

  let completed = 0;
  members.forEach(([name, relation, age, gender, color, score, risk, checkIn]) => {
    db.run(
      `INSERT INTO family_members (user_id, name, relation, age, gender, avatar_color, health_score, risk_level, last_check_in)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, relation, age, gender, color, score, risk, checkIn],
      function(err) {
        if (!err) {
          // 创建生命体征数据
          db.run(
            `INSERT INTO family_vitals (member_id, heart_rate, blood_pressure, steps)
             VALUES (?, ?, ?, ?)`,
            [this.lastID, 70 + Math.floor(Math.random() * 20), '120/80', 5000 + Math.floor(Math.random() * 10000)]
          );
        }
        completed++;
        if (completed === members.length) {
          console.log('示例家庭成员已创建');
          callback();
        }
      }
    );
  });
}

function insertSampleMessages(db, userId, callback) {
  const messages = [
    ['每日健康提醒', '记得按时测量血压和心率', '完整内容：建议您每天早上起床后测量血压和心率，并记录下来。', 'health', 'normal'],
    ['系统更新通知', '系统已升级到 v2.3.0', '完整内容：本次更新优化了数据可视化效果，修复了已知问题。', 'system', 'low'],
    ['心率异常提醒', '检测到您的心率偏高', '完整内容：您今天下午的心率持续高于正常范围，建议适当休息。', 'health', 'high'],
  ];

  let completed = 0;
  messages.forEach(([title, content, fullContent, type, priority]) => {
    db.run(
      `INSERT INTO messages (user_id, title, content, full_content, type, priority)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, content, fullContent, type, priority],
      () => {
        completed++;
        if (completed === messages.length) {
          console.log('示例消息已创建');
          callback();
        }
      }
    );
  });
}

function insertSampleSettings(db, userId, callback) {
  db.run(
    `INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)`,
    [userId],
    () => {
      console.log('示例用户设置已创建');
      callback();
    }
  );
}

module.exports = { initDatabase, DB_PATH };
