const express = require('express');
const router = express.Router();

// 인증 미들웨어 import
const { 
  requireAuth, 
  requireAdmin, 
  requireOwnerOrAdmin,
  optionalAuth
} = require('../middlewares/auth');

// 모든 사용자 목록 조회 (관리자만) - 실제 DB 연동
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let sql = `
      SELECT user_id, login_id, username, role, is_approved, created_at, updated_at
      FROM tb_users 
      WHERE 1=1
    `;
    let params = [];
    
    // 검색 조건 추가 (username 컬럼 사용)
    if (search) {
      sql += ` AND (login_id LIKE ? OR username LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // 역할 필터 추가
    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const users = await req.db.query(sql, params);
    
    // 전체 개수 조회
    let countSql = `SELECT COUNT(*) as total FROM tb_users WHERE 1=1`;
    let countParams = [];
    
    if (search) {
      countSql += ` AND (login_id LIKE ? OR username LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (role) {
      countSql += ` AND role = ?`;
      countParams.push(role);
    }
    
    const [{ total }] = await req.db.query(countSql, countParams);
    
    res.json({
      success: true,
      message: '사용자 목록 조회 성공',
      data: {
        users,
        pagination: {
          current_page: parseInt(page),
          total_items: total,
          total_pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// 특정 사용자 정보 조회 (본인 또는 관리자만)
router.get('/:id', requireAuth, requireOwnerOrAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    // TODO: 실제 사용자 조회 로직
    
    // 임시 데이터
    const user = {
      id: userId,
      email: 'user@example.com',
      name: '사용자',
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: '사용자 정보 조회 성공',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// 사용자 정보 수정 (본인 또는 관리자만)
router.put('/:id', requireAuth, requireOwnerOrAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email } = req.body;
    
    // TODO: 실제 사용자 정보 수정 로직
    
    // 본인 정보 수정 시 세션도 업데이트
    if (req.user.id == userId) {
      req.session.user.name = name; // 세션의 name은 username에서 온 값
      req.session.user.email = email;
    }
    
    res.json({
      success: true,
      message: '사용자 정보가 수정되었습니다.',
      data: {
        user: {
          id: userId,
          name,
          email
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// 사용자 삭제 (관리자만)
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { query } = req.db;
    
    // 본인 계정은 삭제할 수 없음
    if (req.user.id == userId) {
      const AppError = require('../utils/AppError');
      return next(new AppError('본인 계정은 삭제할 수 없습니다.', 400));
    }
    
    // 사용자 존재 여부 확인
    const existing = await query('SELECT * FROM tb_users WHERE user_id = ?', [userId]);
    if (existing.length === 0) {
      const AppError = require('../utils/AppError');
      return next(new AppError('존재하지 않는 사용자입니다.', 404));
    }

    // 삭제 수행
    const result = await query('DELETE FROM tb_users WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      message: `사용자 ${userId}가 삭제되었습니다.`
    });
  } catch (error) {
    next(error);
  }
});

// 사용자 역할 변경 (관리자만)
router.patch('/:id/role', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    
    // 허용된 역할인지 확인
    const allowedRoles = ['user', 'admin'];
    if (!allowedRoles.includes(role)) {
      const AppError = require('../utils/AppError');
      return next(new AppError('유효하지 않은 역할입니다.', 400));
    }
    
    // 본인의 역할은 변경할 수 없음
    if (req.user.id == userId) {
      const AppError = require('../utils/AppError');
      return next(new AppError('본인의 역할은 변경할 수 없습니다.', 400));
    }
    
    // TODO: 실제 역할 변경 로직
    
    res.json({
      success: true,
      message: '사용자 역할이 변경되었습니다.',
      data: {
        userId,
        newRole: role
      }
    });
  } catch (error) {
    next(error);
  }
});

// 사용자 승인 (관리자만)
router.patch('/:id/approve', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { query } = req.db;

    const result = await query(
      'UPDATE tb_users SET is_approved = TRUE WHERE user_id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      const AppError = require('../utils/AppError');
      return next(new AppError('존재하지 않는 사용자입니다.', 404));
    }

    res.json({
      success: true,
      message: `사용자 ID ${userId} 승인 완료`
    });
  } catch (error) {
    next(error);
  }
});


module.exports = router; 