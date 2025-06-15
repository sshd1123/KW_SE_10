const AppError = require('../utils/AppError');

// 로그인 필수 미들웨어
const requireAuth = (req, res, next) => {
  // 세션에 사용자 정보가 있는지 확인
  if (!req.session || !req.session.user) {
    return next(new AppError('로그인이 필요합니다.', 401));
  }

  // 세션이 유효한지 확인 (만료 시간 체크)
  if (req.session.expires && new Date() > new Date(req.session.expires)) {
    // 만료된 세션 삭제
    req.session.destroy((err) => {
      if (err) {
        console.error('세션 삭제 중 오류:', err);
      }
    });
    return next(new AppError('세션이 만료되었습니다. 다시 로그인해주세요.', 401));
  }

  // 사용자 정보를 req 객체에 추가하여 다음 미들웨어에서 사용할 수 있도록 함
  req.user = req.session.user;
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
      return next(new AppError('로그인이 필요합니다.', 401));
    }

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
      res.clearCookie('connect.sid'); // express-session 기본 쿠키 이름
      
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
  // 세션에 저장할 사용자 정보 (비밀번호 제외)
  const sessionUser = {
    id: user.user_id,
    email: user.email || user.login_id,
    name: user.name || null, // TODO: tb_users name 컬럼 추가 이후 '||null' 부분 삭제
    role: user.role || 'user'
  };

  req.session.user = sessionUser;
  
  // Remember Me 기능
  if (rememberMe) {
    // 30일간 유지
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    req.session.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  } else {
    // 브라우저 세션 (브라우저 종료시 만료)
    req.session.cookie.maxAge = null;
    req.session.expires = null;
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