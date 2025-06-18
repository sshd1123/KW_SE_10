const AppError = require('../utils/AppError');

// 로그인 필수 미들웨어
const requireAuth = (req, res, next) => {
  console.log('requireAuth - 세션 확인:', {
    hasSession: !!req.sessionId,
    hasUser: !!req.user,
    sessionId: req.sessionId || 'none',
    user: req.user ? {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    } : null
  });

  // 사용자 정보가 있는지 확인
  if (!req.user) {
    console.log('requireAuth - 인증 실패: 사용자 정보 없음');
    return next(new AppError('로그인이 필요합니다.', 401));
  }

  console.log('requireAuth - 인증 성공:', {
    userId: req.user.id,
    userRole: req.user.role
  });
  next();
};

// 선택적 인증 미들웨어 (로그인하지 않아도 접근 가능)
const optionalAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    // 세션이 만료되지 않았는지 확인
    if (!req.session.expires || new Date() <= new Date(req.session.expires)) {
      req.user = req.session.user;
    } else {
      // 만료된 세션 삭제
      req.session.destroy((err) => {
        if (err) {
          console.error('세션 삭제 중 오류:', err);
        }
      });
    }
  }
  next();
};

// 특정 역할(role) 권한 확인 미들웨어
const requireRole = (...roles) => {
  return (req, res, next) => {
    // 먼저 로그인되어 있는지 확인
    if (!req.user) {
      console.log('requireRole - 사용자 정보 없음');
      return next(new AppError('로그인이 필요합니다.', 401));
    }

    console.log('requireRole - 사용자 역할 확인:', {
      userRole: req.user.role,
      requiredRoles: roles,
      isAllowed: roles.includes(req.user.role)
    });

    // 사용자의 역할이 허용된 역할 목록에 있는지 확인
    if (!roles.includes(req.user.role)) {
      return next(new AppError('이 작업을 수행할 권한이 없습니다.', 403));
    }

    next();
  };
};

// 관리자 권한 확인 미들웨어
const requireAdmin = requireRole('admin');

// 사용자 본인 또는 관리자만 접근 가능한 미들웨어
const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('로그인이 필요합니다.', 401));
  }

  const targetUserId = req.params.id || req.params.userId;
  
  // 관리자이거나 본인인 경우 접근 허용
  if (req.user.role === 'admin' || req.user.id == targetUserId) {
    return next();
  }

  return next(new AppError('본인의 정보만 접근할 수 있습니다.', 403));
};

// 로그인 상태 확인 미들웨어 (API 응답용)
const checkAuthStatus = (req, res, next) => {
  if (req.session && req.session.user) {
    // 세션 만료 확인
    if (!req.session.expires || new Date() <= new Date(req.session.expires)) {
      req.user = req.session.user;
      req.isAuthenticated = true;
    } else {
      req.isAuthenticated = false;
      // 만료된 세션 삭제
      req.session.destroy((err) => {
        if (err) {
          console.error('세션 삭제 중 오류:', err);
        }
      });
    }
  } else {
    req.isAuthenticated = false;
  }
  next();
};

// 로그아웃 처리 헬퍼 함수
const logout = (req, res, next) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return next(new AppError('로그아웃 처리 중 오류가 발생했습니다.', 500));
      }
      
      // 쿠키 삭제
      res.clearCookie('connect.sid'); // 기본 세션 쿠키 이름
      
      res.status(200).json({
        success: true,
        message: '성공적으로 로그아웃되었습니다.'
      });
    });
  } else {
    res.status(200).json({
      success: true,
      message: '이미 로그아웃된 상태입니다.'
    });
  }
};

// 세션 생성 헬퍼 함수
const createSession = (req, user, rememberMe = false) => {
  // 디버깅을 위한 로그
  console.log('createSession - 받은 사용자 정보:', {
    user_id: user.user_id,
    login_id: user.login_id,
    role: user.role,
    전체_사용자_객체: user
  });

  console.log('createSession - 세션 설정 전:', {
    세션_존재: !!req.session,
    세션_ID: req.session ? req.session.id : 'none',
    기존_사용자: req.session ? req.session.user : 'none'
  });

  // 기본 사용자 정보로 세션 생성 (안전한 방식)
  const sessionUser = {
    id: user.user_id,
    email: user.email || user.login_id,
    username: user.login_id,                              // login_id를 username으로 사용
    name: user.login_id,                                  // 호환성 유지
    role: user.role || 'user',
    studentId: null,                                      // 나중에 별도 API로 조회
    professorId: null,                                    // 나중에 별도 API로 조회
    department: null                                      // 나중에 별도 API로 조회
  };

  console.log('createSession - 생성된 세션 사용자:', sessionUser);

  // 세션에 사용자 정보 저장
  req.session.user = sessionUser;
  
  console.log('createSession - 세션 설정 후:', {
    세션_사용자: req.session.user,
    세션_전체: req.session
  });
  
  // Remember Me 기능
  if (rememberMe) {
    // 30일간 유지
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    req.session.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  } else {
    // 1일간 유지 (브라우저 세션보다 길게)
    req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
  }

  return sessionUser;
};

// 세션 갱신 미들웨어 (활동 시 세션 연장)
const refreshSession = (req, res, next) => {
  if (req.session && req.session.user) {
    // 마지막 활동 시간 업데이트
    req.session.lastActivity = new Date();
    
    // Remember Me가 설정된 경우 만료시간 연장
    if (req.session.expires) {
      req.session.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireOwnerOrAdmin,
  checkAuthStatus,
  logout,
  createSession,
  refreshSession
}; 