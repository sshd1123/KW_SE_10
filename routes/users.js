const express = require('express');
const router = express.Router();

// 인증 미들웨어 import
const { 
  requireAuth, 
  requireAdmin, 
  requireOwnerOrAdmin,
  optionalAuth,
  createSession //여기서는 AppError만 사용
} = require('../middlewares/auth');

// 모든 사용자 목록 조회 (관리자만)
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    // TODO: 실제 사용자 목록 조회 로직
    
    // 임시 데이터
    const users = [
      { id: 1, email: 'user1@example.com', name: '사용자1', role: 'user' },
      { id: 2, email: 'admin@example.com', name: '관리자', role: 'admin' },
      { id: 3, email: 'user2@example.com', name: '사용자2', role: 'user' }
    ];
    
    res.json({
      success: true,
      message: '사용자 목록 조회 성공',
      data: {
        users,
        total: users.length
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
      req.session.user.name = name;
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

    // 트랜잭션 시작
    await req.db.transaction(async (connection) => {
      // 1. tb_professors 테이블에서 해당 user_id 참조 레코드 삭제
      await connection.query('DELETE FROM tb_professors WHERE user_id = ?', [userId]);
      console.log(`[User Delete] tb_professors에서 user_id ${userId} 관련 레코드 삭제 시도 완료`);

      // 2. tb_students 테이블에서 해당 user_id 참조 레코드 삭제
      await connection.query('DELETE FROM tb_students WHERE user_id = ?', [userId]);
      console.log(`[User Delete] tb_students에서 user_id ${userId} 관련 레코드 삭제 시도 완료`);
      
      // 3. tb_notifications 테이블에서 해당 user_id 참조 레코드 삭제
      await connection.query('DELETE FROM tb_notifications WHERE user_id = ?', [userId]);
      console.log(`[User Delete] tb_notifications에서 user_id ${userId} 관련 레코드 삭제 시도 완료`);

      // 4. tb_board 테이블에서 해당 creator_id 참조 레코드 삭제 (또는 creator_id를 NULL로 설정 - 정책에 따라)
      // 여기서는 게시물도 함께 삭제하는 것으로 가정
      await connection.query('DELETE FROM tb_board WHERE creator_id = ?', [userId]);
      console.log(`[User Delete] tb_board에서 creator_id ${userId} 관련 레코드 삭제 시도 완료`);

      // 5. tb_users 테이블에서 사용자 삭제
      await connection.query('DELETE FROM tb_users WHERE user_id = ?', [userId]);
      console.log(`[User Delete] tb_users에서 user_id ${userId} 사용자 삭제 완료`);
    });

    res.json({ success: true, message: `사용자 ID ${userId}가 성공적으로 삭제되었습니다.` });
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

// --- 알림 관련 API ---

// 현재 로그인한 사용자의 모든 알림 조회
// GET /api/users/me/notifications
router.get('/me/notifications', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { query } = req.db;

    const notifications = await query(
      'SELECT notification_id, message, link_url, is_read, created_at FROM tb_notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      message: '내 알림 목록입니다.',
      data: { notifications }
    });
  } catch (error) {
    next(error);
  }
});

// 특정 알림 읽음 처리
// PATCH /api/users/me/notifications/:notificationId/read
router.patch('/me/notifications/:notificationId/read', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.notificationId);
    const { query } = req.db;

    if (isNaN(notificationId)) {
      const AppError = require('../utils/AppError');
      return next(new AppError('유효하지 않은 알림 ID입니다.', 400));
    }

    const result = await query(
      'UPDATE tb_notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      const AppError = require('../utils/AppError');
      return next(new AppError('알림을 찾을 수 없거나 권한이 없습니다.', 404));
    }

    res.json({ success: true, message: '알림을 읽음 처리했습니다.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 