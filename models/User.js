const { query, transaction } = require('../config/database');
const bcrypt = require('bcrypt'); // 실제 bcrypt 사용

// bcrypt 설정
const SALT_ROUNDS = 12; // 보안성을 위해 12라운드 사용

class User {
  // 사용자 생성
  static async create(userData) {
    const { email, password, name, role = 'user' } = userData;
    
    // 비밀번호 해싱 (실제 bcrypt 사용)
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const sql = `
      INSERT INTO users (email, password, name, role, created_at, updated_at) 
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    
    const result = await query(sql, [email, hashedPassword, name, role]);
    return result.insertId;
  }

  // 이메일로 사용자 찾기
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const users = await query(sql, [email]);
    return users[0] || null;
  }

  // ID로 사용자 찾기
  static async findById(id) {
    const sql = 'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?';
    const users = await query(sql, [id]);
    return users[0] || null;
  }

  // 모든 사용자 조회 (관리자용)
  static async findAll(limit = 50, offset = 0) {
    const sql = `
      SELECT id, email, name, role, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    return await query(sql, [limit, offset]);
  }

  // 사용자 정보 업데이트
  static async updateById(id, updateData) {
    const { name, email } = updateData;
    const sql = `
      UPDATE users 
      SET name = ?, email = ?, updated_at = NOW() 
      WHERE id = ?
    `;
    
    const result = await query(sql, [name, email, id]);
    return result.affectedRows > 0;
  }

  // 비밀번호 변경
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const sql = 'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?';
    
    const result = await query(sql, [hashedPassword, id]);
    return result.affectedRows > 0;
  }

  // 사용자 삭제
  static async deleteById(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }

  // 비밀번호 확인 (실제 bcrypt 사용)
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // 이메일 중복 확인
  static async isEmailTaken(email, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
    let params = [email];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = await query(sql, params);
    return result[0].count > 0;
  }

  // 사용자 통계
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_count,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_users_this_month
      FROM users
    `;
    
    const result = await query(sql);
    return result[0];
  }
}

module.exports = User; 