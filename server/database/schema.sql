-- 健康管理系统数据库 Schema (MySQL)

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(50),
  phone VARCHAR(20),
  avatar_url VARCHAR(255),
  member_since DATE,
  created_at DATETIME,
  updated_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户健康数据表
CREATE TABLE IF NOT EXISTS health_metrics (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  metric_value REAL NOT NULL,
  unit VARCHAR(20),
  recorded_at DATETIME NOT NULL,
  created_at DATETIME,
  INDEX idx_user_id (user_id),
  INDEX idx_recorded_at (recorded_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 家庭成员表
CREATE TABLE IF NOT EXISTS family_members (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  name VARCHAR(50) NOT NULL,
  relation VARCHAR(30) NOT NULL,
  age INTEGER,
  gender VARCHAR(10),
  avatar_color VARCHAR(20) DEFAULT '#3b82f6',
  health_score INTEGER DEFAULT 100,
  risk_level VARCHAR(20) DEFAULT '低',
  last_check_in DATE,
  created_at DATETIME,
  updated_at DATETIME,
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 家庭成员生命体征表
CREATE TABLE IF NOT EXISTS family_vitals (
  id VARCHAR(50) PRIMARY KEY,
  member_id VARCHAR(50) NOT NULL,
  heart_rate INTEGER,
  blood_pressure VARCHAR(20),
  steps INTEGER DEFAULT 0,
  recorded_at DATETIME,
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 消息通知表
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  full_content TEXT,
  type VARCHAR(20) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 系统设置表
CREATE TABLE IF NOT EXISTS user_settings (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE NOT NULL,
  theme VARCHAR(20) DEFAULT 'dark',
  font_size INTEGER DEFAULT 14,
  heart_rate_alert TINYINT(1) DEFAULT 1,
  medication_alert TINYINT(1) DEFAULT 1,
  sleep_alert TINYINT(1) DEFAULT 1,
  system_update TINYINT(1) DEFAULT 1,
  health_report TINYINT(1) DEFAULT 1,
  data_sync TINYINT(1) DEFAULT 1,
  analytics TINYINT(1) DEFAULT 0,
  family_visible TINYINT(1) DEFAULT 1,
  two_factor TINYINT(1) DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 健康报告表
CREATE TABLE IF NOT EXISTS health_reports (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  report_date DATE NOT NULL,
  lqi_score REAL,
  overall_health INTEGER,
  biological_age INTEGER,
  risk_assessment TEXT,
  suggestions TEXT,
  created_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 多模态采集记录表
CREATE TABLE IF NOT EXISTS multimodal_records (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  face_expression VARCHAR(50),
  face_confidence REAL,
  age_estimate INTEGER,
  gender_label VARCHAR(10),
  gender_confidence REAL,
  audio_emotion VARCHAR(50),
  volume REAL,
  pitch REAL,
  heart_rate INTEGER,
  health_label VARCHAR(50),
  source VARCHAR(20) DEFAULT 'camera_voice',
  recorded_at DATETIME NOT NULL,
  created_at DATETIME,
  INDEX idx_mm_user_time (user_id, recorded_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
