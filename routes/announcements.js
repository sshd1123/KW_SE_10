const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../middlewares/auth');
const { asyncErrorCatcher } = require('../middlewares/error');
const AppError = require('../utils/AppError');
const Board = require('../models/Board');

// ============= 공개 학사공지사항 조회 (모든 사용자) =============

// 모든 학사공지사항 조회 (로그인 선택적)
router.get('/', optionalAuth, asyncErrorCatcher(async (req, res) => {
  const { page = 1, limit = 10, search = '', dept_id = null } = req.query;
  
  const result = await Board.findAllNotices(
    parseInt(page), 
    parseInt(limit), 
    search,
    dept_id ? parseInt(dept_id) : null
  );
  
  res.json({
    success: true,
    message: '학사공지사항 목록입니다.',
    data: {
      announcements: result.notices,
      pagination: {
        current_page: parseInt(page),
        total_items: result.total,
        total_pages: Math.ceil(result.total / parseInt(limit)),
        limit: parseInt(limit)
      }
    }
  });
}));

// 특정 학사공지사항 상세 조회 (로그인 선택적)
router.get('/:id', optionalAuth, asyncErrorCatcher(async (req, res, next) => {
  const boardId = parseInt(req.params.id);
  
  if (isNaN(boardId)) {
    return next(new AppError('유효하지 않은 공지사항 ID입니다.', 400));
  }
  
  const announcement = await Board.findNoticeById(boardId);
  
  if (!announcement) {
    return next(new AppError('공지사항을 찾을 수 없습니다.', 404));
  }
  
  res.json({
    success: true,
    message: '학사공지사항 상세 정보입니다.',
    data: { announcement }
  });
}));

// 중요 공지사항만 조회 (로그인 선택적)
router.get('/important/list', optionalAuth, asyncErrorCatcher(async (req, res) => {
  const { dept_id = null } = req.query;
  const importantAnnouncements = await Board.findImportantNotices(
    dept_id ? parseInt(dept_id) : null
  );
  
  res.json({
    success: true,
    message: '중요 학사공지사항 목록입니다.',
    data: {
      announcements: importantAnnouncements,
      total: importantAnnouncements.length
    }
  });
}));

module.exports = router; 