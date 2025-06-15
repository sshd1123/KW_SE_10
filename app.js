// 환경변수 로드
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const userRouter = require('./routes/users');
const coursesRouter = require('./routes/course');
const { createSession, requireAuth } = require('./middlewares/auth');

// 데이터베이스 연결 import
const { query, testConnection, pool, transaction } = require('./config/database');

// 중앙화된 에러 처리 미들웨어 import
const { errorHandler, notFoundHandler, asyncErrorCatcher } = require('./middlewares/error');

const app = express();

// 데이터베이스를 전역으로 설정 (모든 요청에서 접근 가능)
app.use((req, res, next) => {
  req.db = {
    query,
    transaction,
    pool,
    testConnection
  };
  next();
});

// CORS 설정 - 개발환경에서 모든 origin 허용
app.use(cors({
  origin: true, // 모든 origin 허용 (개발용)
  credentials: true
}));

// 정적 파일 제공 (HTML, CSS, JS 등)
app.use(express.static(path.join(__dirname)));

// 기본 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  },
  name: 'sessionId'
}));

app.use('/api/users', userRouter);
app.use('/api/courses', coursesRouter);

// 서버 시작시 데이터베이스 연결 테스트 (개발용 이후 주석 처리)
(async () => {
  try {
    await testConnection();
    console.log('데이터베이스 연결 확인 완료');
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error.message);
  }
})();

// 테스트 페이지 라우트 (개발용 이후 주석 처리)
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test', 'test.html'));
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API 서버가 정상적으로 실행 중입니다.',
    timestamp: new Date().toISOString()
  });
});

// API 기본 라우트 - 데이터베이스 연결 상태 포함
app.get('/api', async (req, res) => {
  try {
    // 전역 db 객체 사용 예시
    const dbTest = await req.db.testConnection();
    
    res.json({
      success: true,
      message: 'API 서버가 정상적으로 실행 중입니다.',
      version: '1.0.0',
      database: dbTest ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: true,
      message: 'API 서버가 정상적으로 실행 중입니다.',
      version: '1.0.0',
      database: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

// 회원가입 라우터 - 중앙화된 에러 처리 적용
app.post('/api/auth/register', asyncErrorCatcher(async (req, res) => {
  const { email, password, name, role } = req.body;
  
  const allowedRoles = ['student', 'professor', 'admin'];
  const finalRole = allowedRoles.includes(role) ? role : 'student';

  if (finalRole === 'admin' && email !== 'admin@example.com') {
    const error = new Error('관리자로 등록할 수 없습니다.');
    error.status = 403;
    throw error;
  }

  // 입력 검증
  if (!email || !password || !name) {
    const error = new Error('모든 필드를 입력해주세요.');
    error.status = 400;
    throw error;
  }
  
  // 실제 테이블 구조에 맞게 수정: login_id 컬럼 사용
  const existingUser = await req.db.query('SELECT user_id FROM tb_users WHERE login_id = ?', [email]);
  
  if (existingUser.length > 0) {
    const error = new Error('이미 존재하는 이메일입니다.');
    error.status = 400;
    throw error;
  }
  
  // 새 사용자 생성 
  // 참고: 실제로는 password를 bcrypt로 해싱해야 함
  // TODO: tb_users name 컬럼 추가 이후 name 필드, 값 복원
  const result = await req.db.query(
    'INSERT INTO tb_users (login_id, password_hash, role) VALUES (?, ?, ?)',
    [email, password, finalRole] 
  );
  
  res.status(201).json({
    success: true,
    message: `${finalRole} 회원가입이 완료되었습니다.`,
    data: {
      user: {
        user_id: result.insertId,
        login_id: email,
        name: name, // tb_user에 name 컬럼 추가 필요
        role: finalRole
      }
    }
  });
}));

// 로그인 라우터 - 글로벌 에러 핸들러 적용
app.post('/api/auth/login', asyncErrorCatcher(async (req, res) => {
  const { email, password, rememberMe } = req.body;
  
  // 실제 테이블 구조에 맞게 수정
  // TODO: tb_users name 컬럼 추가 이후 name 컬럼 SELECT 하도록 변경
  const users = await req.db.query(
    'SELECT user_id, login_id, role FROM tb_users WHERE login_id = ? AND password_hash = ?',
    [email, password] // 실제로는 bcrypt.compare() 사용
  );
  
  if (users.length > 0) {
    const user = users[0];
    
    const sessionUser = createSession(req, user, rememberMe);
    
    res.json({
      success: true,
      message: '로그인 성공',
      data: { user: sessionUser }
    });
  } else {
    const error = new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    error.status = 401;
    throw error;
  }
}));

// 로그인 상태 확인
app.get('/api/auth/status', (req, res) => {
  res.json({
    success: true,
    data: {
      isAuthenticated: !!req.session.user,
      user: req.session.user || null
    }
  });
});

// 프로필 조회 (로그인 필요)
app.get('/api/auth/me', (req, res) => {
  // 로그인 여부 확인
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: '로그인이 필요합니다.'
    });
  }
  
  res.json({
    success: true,
    message: '프로필 조회 성공',
    data: {
      user: req.session.user
    }
  });
});

// 로그아웃 - 중앙화된 에러 처리 적용
app.post('/api/auth/logout', asyncErrorCatcher(async (req, res) => {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        const error = new Error('로그아웃 중 오류가 발생했습니다.');
        error.status = 500;
        reject(error);
      } else {
        res.clearCookie('sessionId');
        res.json({
          success: true,
          message: '로그아웃되었습니다.'
        });
        resolve();
      }
    });
  });
}));


// 패스워드 변경 라우터 - 중앙화된 에러 처리 및 인증 적용
app.post('/api/auth/change-password', requireAuth, asyncErrorCatcher(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const userId = req.user.id;

  // 입력 값 유효성 검사
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    const error = new Error('모든 필드를 입력해주세요.');
    error.status = 400;
    throw error;
  }

  if (newPassword !== confirmNewPassword) {
    const error = new Error('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
    error.status = 400;
    throw error;
  }

  // 현재 비밀번호 확인 (실제로는 bcrypt.compare()를 사용하여 해시된 비밀번호를 비교)
  const [user] = await req.db.query(
    'SELECT password_hash FROM tb_users WHERE user_id = ?',
    [userId]
  );

  if (!user || user.password_hash !== currentPassword) {
    const error = new Error('현재 비밀번호가 올바르지 않습니다.');
    error.status = 401;
    throw error;
  }

  // 새 비밀번호로 업데이트 (실제로는 newPassword를 bcrypt로 해싱하여 저장)
  await req.db.query(
    'UPDATE tb_users SET password_hash = ? WHERE user_id = ?',
    [newPassword, userId]
  );

  res.json({
    success: true,
    message: '비밀번호가 성공적으로 변경되었습니다.'
  });
}));


// 404 핸들러 적용
app.use(notFoundHandler);

// 글로벌 에러 핸들러 적용
app.use(errorHandler);

// 미처리 Promise 거부 핸들러
process.on('unhandledRejection', (reason, promise) => {
  console.error('미처리 Promise 거부:', reason);
  console.error('Promise:', promise);
});

// 미처리 예외 핸들러
process.on('uncaughtException', (error) => {
  console.error('미처리 예외:', error);
  process.exit(1); // 안전하게 프로세스 종료
});

module.exports = app; 