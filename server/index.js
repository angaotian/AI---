const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createPool, getPool, initTables, initSampleData, closePool } = require('./database');

const app = express();
const PORT = 3002;
const JWT_SECRET = 'health-management-secret-key-2024';

const generateNormalBloodPressure = () => {
  const systolic = 108 + Math.floor(Math.random() * 13);
  const diastolic = 68 + Math.floor(Math.random() * 13);
  return `${systolic}/${diastolic}`;
};

// 中间件
app.use(cors());
app.use(express.json());

// JWT 验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
};

// ============ 认证路由 ============

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, name, phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: '用户名、邮箱和密码为必填项' });
    }

    const pool = getPool();
    
    // 检查用户是否已存在
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}`;
    
    await pool.execute(
      `INSERT INTO users (id, username, email, password_hash, name, phone, member_since) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, username, email, passwordHash, name || username, phone || '', new Date().toISOString().split('T')[0]]
    );

    const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });

    // 创建默认设置
    await pool.execute(
      'INSERT INTO user_settings (user_id) VALUES (?)',
      [userId]
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: { 
        id: userId, 
        username, 
        email, 
        name: name || username 
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码为必填项' });
    }

    const pool = getPool();
    
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone,
        member_since: user.member_since
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ 健康数据路由 ============

// 获取健康数据
app.get('/api/health/metrics', authenticateToken, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const pool = getPool();
    
    let query = 'SELECT * FROM health_metrics WHERE user_id = ?';
    const params = [req.user.id];

    if (type) {
      query += ' AND metric_type = ?';
      params.push(type);
    }

    if (startDate && endDate) {
      query += ' AND recorded_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY recorded_at DESC LIMIT 100';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('查询健康数据错误:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// 添加健康数据
app.post('/api/health/metrics', authenticateToken, async (req, res) => {
  try {
    const { metric_type, metric_value, unit, recorded_at } = req.body;

    if (!metric_type || metric_value === undefined) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const pool = getPool();
    const metricId = `metric-${Date.now()}`;
    const recordedAt = recorded_at || new Date().toISOString();

    await pool.execute(
      `INSERT INTO health_metrics (id, user_id, metric_type, metric_value, unit, recorded_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [metricId, req.user.id, metric_type, metric_value, unit || '', recordedAt]
    );

    res.status(201).json({
      id: metricId,
      message: '添加成功'
    });
  } catch (error) {
    console.error('添加健康数据错误:', error);
    res.status(500).json({ error: '添加失败' });
  }
});

// ============ 家庭成员路由 ============

// 获取家庭成员列表
app.get('/api/family/members', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    
    const [members] = await pool.execute(
      'SELECT * FROM family_members WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    // 获取每个成员的生命体征
    const membersWithVitals = await Promise.all(
      members.map(async (member) => {
        const [vitalsRows] = await pool.execute(
          'SELECT * FROM family_vitals WHERE member_id = ? ORDER BY recorded_at DESC LIMIT 1',
          [member.id]
        );

        let vitals = vitalsRows[0] || null;
        const shouldRandomizeBloodPressure = !vitals || !vitals.blood_pressure || vitals.blood_pressure === '0/0' || vitals.blood_pressure === '120/80';

        if (shouldRandomizeBloodPressure) {
          const randomBloodPressure = generateNormalBloodPressure();

          if (vitals) {
            await pool.execute(
              `UPDATE family_vitals SET blood_pressure = ?, recorded_at = CURRENT_TIMESTAMP WHERE id = ?`,
              [randomBloodPressure, vitals.id]
            );
            vitals = {
              ...vitals,
              blood_pressure: randomBloodPressure
            };
          } else {
            vitals = {
              id: `vital-${Date.now()}-${member.id}`,
              member_id: member.id,
              heart_rate: 70 + Math.floor(Math.random() * 20),
              blood_pressure: randomBloodPressure,
              steps: 5000 + Math.floor(Math.random() * 5000),
              recorded_at: new Date().toISOString()
            };

            await pool.execute(
              `INSERT INTO family_vitals (id, member_id, heart_rate, blood_pressure, steps, recorded_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [vitals.id, vitals.member_id, vitals.heart_rate, vitals.blood_pressure, vitals.steps, vitals.recorded_at]
            );
          }
        }
        
        return {
          ...member,
          vitals: vitals || { heart_rate: 0, blood_pressure: generateNormalBloodPressure(), steps: 0 }
        };
      })
    );

    res.json(membersWithVitals);
  } catch (error) {
    console.error('查询家庭成员错误:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// 添加家庭成员
app.post('/api/family/members', authenticateToken, async (req, res) => {
  try {
    const { name, relation, age, gender, avatar_color, health_score, risk_level, heart_rate, blood_pressure } = req.body;

    if (!name || !relation) {
      return res.status(400).json({ error: '姓名和关系为必填项' });
    }

    const pool = getPool();
    const memberId = `member-${Date.now()}`;
    const finalAvatarColor = avatar_color || '#3b82f6';
    const finalHealthScore = health_score || 100;
    const finalRiskLevel = risk_level || '低';
    const finalBloodPressure = blood_pressure || generateNormalBloodPressure();

    await pool.execute(
      `INSERT INTO family_members (id, user_id, name, relation, age, gender, avatar_color, health_score, risk_level, last_check_in)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [memberId, req.user.id, name, relation, age || 0, gender || '', finalAvatarColor, finalHealthScore, finalRiskLevel, new Date().toISOString().split('T')[0]]
    );

    const [existingVitals] = await pool.execute(
      'SELECT id FROM family_vitals WHERE member_id = ? LIMIT 1',
      [memberId]
    );

    if (existingVitals.length > 0) {
      await pool.execute(
        `UPDATE family_vitals SET heart_rate = ?, blood_pressure = ?, recorded_at = CURRENT_TIMESTAMP WHERE member_id = ?`,
        [heart_rate || (70 + Math.floor(Math.random() * 20)), finalBloodPressure, memberId]
      );
    } else {
      const vitalId = `vital-${Date.now()}`;
      await pool.execute(
        `INSERT INTO family_vitals (id, member_id, heart_rate, blood_pressure, steps)
         VALUES (?, ?, ?, ?, ?)`,
        [vitalId, memberId, heart_rate || (70 + Math.floor(Math.random() * 20)), finalBloodPressure, 5000 + Math.floor(Math.random() * 5000)]
      );
    }

    res.status(201).json({
      id: memberId,
      message: '添加成功'
    });
  } catch (error) {
    console.error('添加家庭成员错误:', error);
    console.error('错误详情:', error.message);
    console.error('SQL 错误:', error.sql);
    res.status(500).json({ error: '添加失败：' + error.message });
  }
});

// 更新家庭成员
app.put('/api/family/members/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, relation, age, gender, avatar_color, health_score, risk_level, heart_rate, blood_pressure } = req.body;

    const pool = getPool();
    
    const [result] = await pool.execute(
      `UPDATE family_members 
       SET name = ?, relation = ?, age = ?, gender = ?, avatar_color = ?, health_score = ?, risk_level = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [name, relation, age, gender, avatar_color || '#3b82f6', health_score, risk_level, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '成员不存在' });
    }

    const finalBloodPressure = blood_pressure || '120/80';
    const finalHeartRate = heart_rate || 0;
    const [vitalsRows] = await pool.execute(
      'SELECT id FROM family_vitals WHERE member_id = ? LIMIT 1',
      [id]
    );

    if (vitalsRows.length > 0) {
      await pool.execute(
        `UPDATE family_vitals
         SET heart_rate = ?, blood_pressure = ?, recorded_at = CURRENT_TIMESTAMP
         WHERE member_id = ?`,
        [finalHeartRate, finalBloodPressure, id]
      );
    } else {
      await pool.execute(
        `INSERT INTO family_vitals (id, member_id, heart_rate, blood_pressure, steps, recorded_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [`vital-${Date.now()}`, id, finalHeartRate, finalBloodPressure, 0]
      );
    }

    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('更新家庭成员错误:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// 删除家庭成员
app.delete('/api/family/members/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    await pool.execute('DELETE FROM family_vitals WHERE member_id = ?', [id]);
    const [result] = await pool.execute('DELETE FROM family_members WHERE id = ? AND user_id = ?', [id, req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '成员不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除家庭成员错误:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// ============ 消息路由 ============

// 获取消息列表
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { type, filter } = req.query;
    const pool = getPool();
    
    let query = 'SELECT * FROM messages WHERE user_id = ?';
    const params = [req.user.id];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (filter === 'unread') {
      query += ' AND is_read = 0';
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('查询消息错误:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// 标记消息为已读
app.put('/api/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    const [result] = await pool.execute(
      'UPDATE messages SET is_read = 0 WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '消息不存在' });
    }

    res.json({ message: '已标记为已读' });
  } catch (error) {
    console.error('标记消息错误:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// 标记全部消息为已读
app.put('/api/messages/read-all', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    
    const [result] = await pool.execute(
      'UPDATE messages SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    res.json({ message: '全部已标记为已读', count: result.affectedRows });
  } catch (error) {
    console.error('标记全部消息错误:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// 删除消息
app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    const [result] = await pool.execute(
      'DELETE FROM messages WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '消息不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除消息错误:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// ============ 多模态采集路由 ============

// 保存多模态采集记录
app.post('/api/multimodal/records', authenticateToken, async (req, res) => {
  try {
    const {
      face_expression,
      face_confidence,
      age_estimate,
      gender_label,
      gender_confidence,
      audio_emotion,
      volume,
      pitch,
      heart_rate,
      health_label,
      source,
      recorded_at
    } = req.body;

    const pool = getPool();
    const recordId = `mm-${Date.now()}`;
    const recordedAt = recorded_at || new Date().toISOString().replace('Z', '').split('.')[0];

    await pool.execute(
      `INSERT INTO multimodal_records (
        id, user_id, face_expression, face_confidence, age_estimate, gender_label, gender_confidence, audio_emotion,
        volume, pitch, heart_rate, health_label, source, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId,
        req.user.id,
        face_expression || '未检测',
        face_confidence || 0,
        age_estimate || 0,
        gender_label || '未知',
        gender_confidence || 0,
        audio_emotion || '平静',
        volume || 0,
        pitch || 0,
        heart_rate || 0,
        health_label || '评估中',
        source || 'camera_voice',
        recordedAt
      ]
    );

    res.status(201).json({ id: recordId, message: '保存成功' });
  } catch (error) {
    console.error('保存多模态采集记录错误:', error);
    res.status(500).json({ error: '保存失败' });
  }
});

// 获取多模态采集记录
app.get('/api/multimodal/records', authenticateToken, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const pool = getPool();

    const [rows] = await pool.execute(
      'SELECT * FROM multimodal_records WHERE user_id = ? ORDER BY recorded_at DESC LIMIT ?',
      [req.user.id, Number(limit)]
    );

    res.json(rows);
  } catch (error) {
    console.error('查询多模态采集记录错误:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// 删除多模态采集记录
app.delete('/api/multimodal/records/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [result] = await pool.execute(
      'DELETE FROM multimodal_records WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除多模态采集记录错误:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// ============ AI 医生问答路由 ============

app.post('/api/doctor/consult', authenticateToken, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !String(question).trim()) {
      return res.status(400).json({ error: '问题不能为空' });
    }

    const q = String(question).trim();
    const graphKeywords = [
      '高血压', '冠心病', '糖尿病', '脑卒中', '头晕', '胸闷', '胸痛',
      '血糖', '血压', '慢阻肺', '哮喘', '痛风', '甲减', '胃溃疡', '抑郁'
    ];
    const knowledgeHits = graphKeywords.filter(k => q.includes(k));

    let answer = '建议结合病史、用药和近期检查综合判断；如症状持续或加重，请线下就医评估。';
    let riskLevel = '中';

    if (q.includes('头晕') || q.includes('血压')) {
      answer = '建议先监测血压并记录波动；若伴随胸痛、言语不清或肢体无力，请立即就医。';
      riskLevel = '中';
    } else if (q.includes('血糖') || q.includes('糖尿病')) {
      answer = '建议关注空腹/餐后血糖和HbA1c，饮食与运动联合管理，并按医嘱复诊。';
      riskLevel = '中';
    } else if (q.includes('胸闷') || q.includes('胸痛')) {
      answer = '胸闷胸痛需优先排除心血管急症，如持续超过10分钟或伴出汗恶心，请立即急诊。';
      riskLevel = '高';
    } else if (q.includes('发热') || q.includes('咳嗽')) {
      answer = '建议先监测体温、血氧并观察呼吸情况；若高热持续或气促明显，请尽快就医。';
      riskLevel = '中';
    }

    let mitaAnswer = '';
    let mitaUsed = false;

    const mitaApiUrl = process.env.MITA_AI_API_URL;
    const mitaApiKey = process.env.MITA_AI_API_KEY;
    const mitaModel = process.env.MITA_AI_MODEL || 'mita';

    if (mitaApiUrl && mitaApiKey) {
      try {
        const isChatCompletions = /chat\/completions/i.test(mitaApiUrl);
        const isMetaSoSearch = /metaso\.cn\/api\/v1\/search/i.test(mitaApiUrl);

        const extractMitaAnswer = (result) => {
          let text =
            result?.answer ||
            result?.data?.answer ||
            result?.output_text ||
            result?.choices?.[0]?.message?.content ||
            '';

          if (!text && isMetaSoSearch) {
            const searchList =
              result?.results ||
              result?.data?.results ||
              result?.items ||
              result?.data?.items ||
              result?.data ||
              [];

            if (Array.isArray(searchList) && searchList.length > 0) {
              text = searchList.slice(0, 3).map((item, idx) => {
                const title = item?.title || `结果${idx + 1}`;
                const snippet = item?.snippet || item?.content || item?.summary || '';
                return `【${title}】${snippet}`;
              }).join('；');
            }
          }

          return String(text || '').trim();
        };

        const baseHeaders = {
          Authorization: `Bearer ${mitaApiKey}`,
          'x-api-key': mitaApiKey
        };

        const tryRequests = [];

        if (isChatCompletions) {
          tryRequests.push({
            url: mitaApiUrl,
            method: 'POST',
            headers: { ...baseHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: mitaModel,
              messages: [
                { role: 'system', content: '你是严谨的医疗健康助手，请给出清晰且安全的建议。' },
                { role: 'user', content: q }
              ],
              temperature: 0.4
            })
          });
        } else if (isMetaSoSearch) {
          const encodedQ = encodeURIComponent(q);
          tryRequests.push(
            {
              url: mitaApiUrl,
              method: 'POST',
              headers: { ...baseHeaders, 'Content-Type': 'application/json' },
              body: JSON.stringify({ q, query: q })
            },
            {
              url: mitaApiUrl,
              method: 'POST',
              headers: { ...baseHeaders, 'Content-Type': 'application/json' },
              body: JSON.stringify({ q })
            },
            {
              url: `${mitaApiUrl}?q=${encodedQ}`,
              method: 'GET',
              headers: baseHeaders
            },
            {
              url: `${mitaApiUrl}?query=${encodedQ}`,
              method: 'GET',
              headers: baseHeaders
            }
          );
        } else {
          tryRequests.push({
            url: mitaApiUrl,
            method: 'POST',
            headers: { ...baseHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: q })
          });
        }

        for (const reqCfg of tryRequests) {
          try {
            const response = await fetch(reqCfg.url, {
              method: reqCfg.method,
              headers: reqCfg.headers,
              body: reqCfg.body
            });

            const raw = await response.text();
            let result;
            try {
              result = raw ? JSON.parse(raw) : {};
            } catch {
              result = { output_text: raw };
            }

            if (!response.ok) {
              console.error('秘塔AI响应异常:', response.status, raw);
              continue;
            }

            mitaAnswer = extractMitaAnswer(result);
            if (mitaAnswer) {
              mitaUsed = true;
              break;
            }
          } catch (err) {
            console.error('秘塔AI单次请求失败:', err.message);
          }
        }
      } catch (e) {
        console.error('调用秘塔AI失败:', e.message);
      }
    }

    if (!mitaAnswer) {
      mitaAnswer = answer;
    }

    res.json({
      answer,
      riskLevel,
      source: mitaUsed ? 'mita-ai+knowledge-graph' : 'doctor-rule-engine+knowledge-graph',
      knowledgeHits,
      mita: {
        used: mitaUsed,
        answer: mitaAnswer
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI医生问答错误:', error);
    res.status(500).json({ error: '问答失败' });
  }
});

// ============ 系统设置路由 ============

// 获取用户设置
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    
    const [rows] = await pool.execute(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '设置不存在' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('查询设置错误:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// 更新用户设置
app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const settings = req.body;
    const pool = getPool();
    
    const updateFields = [];
    const values = [];
    
    const allowedFields = [
      'theme', 'font_size', 'heart_rate_alert', 'medication_alert', 'sleep_alert',
      'system_update', 'health_report', 'data_sync', 'analytics', 'family_visible', 'two_factor'
    ];
    
    allowedFields.forEach(field => {
      if (settings[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        values.push(settings[field]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);
    
    const [result] = await pool.execute(
      `UPDATE user_settings SET ${updateFields.join(', ')} WHERE user_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '设置不存在' });
    }

    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('更新设置错误:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// ============ 用户信息路由 ============

// 获取用户信息
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    
    const [rows] = await pool.execute(
      'SELECT id, username, email, name, phone, member_since, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('查询用户信息错误:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// 更新用户信息
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const pool = getPool();
    
    const [result] = await pool.execute(
      'UPDATE users SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, phone, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// ============ 启动服务器 ============

async function startServer() {
  try {
    // 初始化数据库连接
    await createPool();
    
    // 初始化表结构
    await initTables();
    
    // 初始化示例数据
    await initSampleData();
    
    // 启动服务器
    app.listen(PORT, '::', () => {
      console.log(`🚀 后端服务器运行在 http://[::1]:${PORT}`);
      console.log(`📊 API 文档：http://[::1]:${PORT}/api`);
      console.log(`💾 数据库：MySQL (localhost:3306/health_management)`);
    });
  } catch (error) {
    console.error('❌ 启动服务器失败:', error.message);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...');
  await closePool();
  process.exit(0);
});

startServer();
