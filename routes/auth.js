const express = require('express');
const router = express.Router();

// 인증 미들웨어 import
const { 
  requireAuth, 
  optionalAuth, 
  checkAuthStatus, 
  logout, 
  createSession 
} = require('../middlewares/auth');

// User 모델 import
const User = require('../models/User');
const AppError = require('../utils/AppError');

// 회원가입
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    
    // 입력 검증
    if (!email || !password || !name) {
      return next(new AppError('모든 필드를 입력해주세요.', 400));
    }
    
    // 이메일 중복 확인
    const isEmailTaken = await User.isEmailTaken(email);
    if (isEmailTaken) {
      return next(new AppError('이미 사용 중인 이메일입니다.', 409));
    }
    
    // 사용자 생성
    const userId = await User.create({ email, password, name });
    
    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: {
        user: {
          id: userId,
          email,
          name
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// 로그인
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    // 입력 검증
    if (!email || !password) {
      return next(new AppError('이메일과 비밀번호를 입력해주세요.', 400));
    }
    
    // 사용자 조회
    const user = await User.findByEmail(email);
    if (!user) {
      return next(new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401));
    }
    
    // 비밀번호 확인
    const isPasswordValid = await User.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return next(new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401));
    }
    
    // 세션 생성 (비밀번호 제외)
    const sessionUser = createSession(req, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }, rememberMe);
    
    res.json({
      success: true,
      message: '로그인 성공',
      data: { 
        user: sessionUser 
      }
    });
  } catch (error) {
    next(error);
  }
});

// 로그아웃
router.post('/logout', logout);

// 현재 로그인 상태 확인
router.get('/status', checkAuthStatus, (req, res) => {
  res.json({
    success: true,
    data: {
      isAuthenticated: req.isAuthenticated,
      user: req.user || null
    }
  });
});

// 내 프로필 조회 (로그인 필수)
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: '프로필 조회 성공',
    data: {
      user: req.user
    }
  });
});

// 프로필 업데이트 (로그인 필수)
router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;
    
    // TODO: 실제 프로필 업데이트 로직
    
    // 세션 정보도 업데이트
    req.session.user.name = name;
    
    res.json({
      success: true,
      message: '프로필이 업데이트되었습니다.',
      data: {
        user: req.session.user
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 