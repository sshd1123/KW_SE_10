// 환경변수 로드
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const simpleSession = require('./utils/simpleSession');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const userRouter = require('./routes/users');
const coursesRouter = require('./routes/course');
const adminRouter = require('./routes/admin');
const announcementsRouter = require('./routes/announcements');
const studentRouter = require('./routes/student');
const professorRouter = require('./routes/professor');
const dashboardRouter = require('./routes/dashboard');
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
  credentials: true, // 쿠키 전송 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200 // IE11 지원
}));

// 정적 파일 제공 (HTML, CSS, JS 등)
app.use(express.static(path.join(__dirname)));

// 기본 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 간단한 세션 미들웨어
app.use((req, res, next) => {
  // 쿠키에서 세션 ID 추출
  const sessionId = req.cookies['sessionId'];
  
  if (sessionId) {
    const session = simpleSession.getSession(sessionId);
    if (session) {
      req.user = session.user;
      req.sessionId = sessionId;
    }
  }
  
  next();
});

// 세션 디버깅 미들웨어
app.use((req, res, next) => {
  console.log(`\n=== 요청: ${req.method} ${req.path} ===`);
  console.log('쿠키 헤더:', req.headers.cookie);
  console.log('세션 ID:', req.sessionId || 'none');
  console.log('사용자:', req.user ? req.user.id : 'none');
  console.log('=================================\n');
  
  // 응답 헤더 디버깅
  const originalSend = res.send;
  res.send = function(body) {
    if (req.path === '/api/auth/login' && req.method === 'POST') {
      console.log('응답 Set-Cookie 헤더:', res.getHeaders()['set-cookie']);
    }
    return originalSend.call(this, body);
  };
  
  next();
});

app.use('/api/users', userRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/student', studentRouter);
app.use('/api/professor', professorRouter);
app.use('/api/dashboard', dashboardRouter);

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

// 로그인 테스트 페이지 라우트
app.get('/login-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test', 'simple-login-test.html'));
});

// 쿠키 세션 테스트 페이지 라우트
app.get('/cookie-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test', 'cookie-test.html'));
});

// 간단한 테스트 페이지 라우트
app.get('/simple-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test', 'simple-test.html'));
});

// 관리자 테스트 페이지 라우트 (개발용 이후 주석 처리)
app.get('/admin-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test', 'admin-test.html'));
});

// 역할별 대시보드 테스트 페이지 라우트
app.get('/dashboard-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test', 'role-dashboard-test.html'));
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
    const { email, userId, password, name, role } = req.body;
    
    // email 또는 userId 중 하나를 사용 (호환성)
    const loginId = email || userId;
    
    const allowedRoles = ['student', 'professor', 'admin'];
    const finalRole = allowedRoles.includes(role) ? role : 'student';

    if (finalRole === 'admin' && loginId !== 'admin@example.com') {
      const error = new Error('관리자로 등록할 수 없습니다.');
      error.status = 403;
      throw error;
    }

    // 입력 검증
    if (!loginId || !password || !name) {
      const error = new Error('모든 필드를 입력해주세요.');
      error.status = 400;
      throw error;
    }
    
    // 중복 사용자 확인
    const existingUser = await req.db.query('SELECT user_id FROM tb_users WHERE login_id = ?', [loginId]);
  
      if (existingUser.length > 0) {
      const error = new Error('이미 존재하는 사용자입니다.');
      error.status = 400;
      throw error;
    }
    
    // 비밀번호 해싱
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // 트랜잭션 시작: 사용자 생성과 역할별 정보 생성을 원자적으로 처리
    const connection = await req.db.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. tb_users에 기본 사용자 정보 생성
      const userResult = await connection.execute(
        'INSERT INTO tb_users (login_id, password_hash, role) VALUES (?, ?, ?)',
        [loginId, hashedPassword, finalRole]
      );
      
      const userId = userResult[0].insertId;
      
      // 2. 역할에 따라 추가 정보 생성
      if (finalRole === 'student') {
        // tb_students에 학생 정보 생성
        await connection.execute(
          'INSERT INTO tb_students (user_id, student_name, birth_date, dept_id) VALUES (?, ?, NULL, NULL)',
          [userId, name]
        );
      } else if (finalRole === 'professor') {
        // tb_professors에 교수 정보 생성
        await connection.execute(
          'INSERT INTO tb_professors (user_id, professor_name, email, dept_id) VALUES (?, ?, ?, NULL)',
          [userId, name, loginId]
        );
      }
      
      // 트랜잭션 커밋
      await connection.commit();
      
      res.status(201).json({
        success: true,
        message: `${finalRole} 회원가입이 완료되었습니다.`,
        data: {
          user: {
            id: userId,
            email: loginId,
            username: name,
            name: name,
            role: finalRole,
            studentId: finalRole === 'student' ? userId : null,
            department: null
          }
        }
      });
      
    } catch (error) {
      // 트랜잭션 롤백
      await connection.rollback();
      throw error;
    } finally {
      // 연결 해제
      connection.release();
    }
}));

  // 로그인 라우터 - 글로벌 에러 핸들러 적용
  app.post('/api/auth/login', asyncErrorCatcher(async (req, res) => {
    const { email, userId, loginId, password, rememberMe } = req.body;
    
    // email, userId, loginId 중 하나를 사용 (호환성)
    const finalLoginId = loginId || email || userId;
    
    // 입력 검증
    if (!finalLoginId || !password) {
      const error = new Error('사용자 정보와 비밀번호를 입력해주세요.');
      error.status = 400;
      throw error;
    }
    
    // 디버깅을 위한 로그 추가
    console.log('로그인 시도:', { loginId: finalLoginId, password: '***' });
    console.log('요청 본문:', req.body);
    
    // 사용자 조회 (기본 정보만) - 안전한 로그인을 위해 단순화
    const users = await req.db.query(`
      SELECT 
        user_id, 
        login_id, 
        role, 
        password_hash
      FROM tb_users 
      WHERE login_id = ?
    `, [finalLoginId]);
    
    console.log('조회된 사용자 수:', users.length);
    if (users.length > 0) {
      console.log('찾은 사용자:', { 
        user_id: users[0].user_id, 
        login_id: users[0].login_id, 
        role: users[0].role
      });
    }
  
  if (users.length > 0) {
    const user = users[0];
    
    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('비밀번호 검증 결과:', isPasswordValid);
    
    if (isPasswordValid) {
      console.log('비밀번호 검증 성공');
      
      // 세션 사용자 데이터 생성
      const sessionUser = {
        id: user.user_id,
        email: user.login_id,
        username: user.login_id,
        name: user.login_id,
        role: user.role || 'user',
        studentId: null,
        professorId: null,
        department: null
      };
      
      // 새로운 세션 생성
      const sessionId = simpleSession.createSession(user.user_id, sessionUser);
      
      // 쿠키 설정 - 더 단순하고 호환성 있게
      const cookieOptions = {
        maxAge: 24 * 60 * 60 * 1000, // 24시간
        httpOnly: false, // 클라이언트에서 접근 가능
        secure: false,   // HTTP에서도 작동
        path: '/',       // 모든 경로에서 사용
        domain: undefined, // 도메인 제한 없음
        sameSite: 'lax'  // SameSite 설정으로 CSRF 보호와 호환성 확보
      };
      res.cookie('sessionId', sessionId, cookieOptions);
      
      console.log('로그인 성공 - 세션 생성:', { sessionId, userId: sessionUser.id });
      console.log('쿠키 설정:', { sessionId, options: cookieOptions });
      
      res.json({
        success: true,
        message: '로그인 성공',
        data: { user: sessionUser }
      });
    } else {
      const error = new Error('사용자 정보 또는 비밀번호가 올바르지 않습니다.');
      error.status = 401;
      throw error;
    }
  } else {
    const error = new Error('사용자 정보 또는 비밀번호가 올바르지 않습니다.');
    error.status = 401;
    throw error;
  }
}));

// 로그인 상태 확인
app.get('/api/auth/status', (req, res) => {
  console.log('상태 확인 요청:', {
    sessionId: req.sessionId || 'none',
    hasUser: !!req.user,
    cookies: req.headers.cookie,
    user: req.user ? {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    } : null
  });

  res.json({
    success: true,
    data: {
      isAuthenticated: !!req.user,
      user: req.user || null,
      debug: {
        sessionId: req.sessionId || null,
        hasSession: !!req.sessionId,
        cookies: req.headers.cookie
      }
    }
  });
});

// 디버깅용 - 등록된 사용자 목록 확인 (임시)
app.get('/api/debug/users', asyncErrorCatcher(async (req, res) => {
  const users = await req.db.query('SELECT user_id, login_id, role FROM tb_users');
  res.json({
    success: true,
    data: { users }
  });
}));

// 디버깅용 - 테이블 스키마 확인
app.get('/api/debug/schema/:tableName', asyncErrorCatcher(async (req, res) => {
  const { tableName } = req.params;
  
  try {
    const schema = await req.db.query(`DESCRIBE ${tableName}`);
    res.json({
      success: true,
      data: { 
        tableName,
        schema 
      }
    });
  } catch (error) {
    res.json({
      success: false,
      message: `테이블 '${tableName}' 스키마 조회 실패`,
      error: error.message
    });
  }
}));

// 디버깅용 - 세션 테스트
app.get('/api/debug/session', (req, res) => {
  const sessionId = req.sessionId;
  const session = sessionId ? simpleSession.getSession(sessionId) : null;
  
  console.log('세션 디버그:', {
    sessionId: sessionId || 'none',
    hasSession: !!sessionId,
    hasUser: !!req.user,
    cookies: req.headers.cookie
  });

  res.json({
    success: true,
    data: {
      hasSession: !!sessionId,
      sessionId: sessionId || null,
      hasUser: !!req.user,
      cookies: req.headers.cookie,
      sessionData: session ? {
        cookie: {
          originalMaxAge: 86400000,
          expires: new Date(session.lastAccess.getTime() + 86400000).toISOString(),
          secure: false,
          httpOnly: false,
          path: "/"
        }
      } : null
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
  const sessionId = req.sessionId;
  
  if (sessionId) {
    simpleSession.deleteSession(sessionId);
  }
  
  res.clearCookie('sessionId', {
    path: '/',
    httpOnly: false,
    secure: false,
    domain: undefined,
    sameSite: 'lax'
  });
  res.json({
    success: true,
    message: '로그아웃되었습니다.'
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

  // 현재 비밀번호 확인
  const [user] = await req.db.query(
    'SELECT password_hash FROM tb_users WHERE user_id = ?',
    [userId]
  );

  if (!user) {
    const error = new Error('사용자를 찾을 수 없습니다.');
    error.status = 404;
    throw error;
  }

  // 현재 비밀번호 검증
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isCurrentPasswordValid) {
    const error = new Error('현재 비밀번호가 올바르지 않습니다.');
    error.status = 401;
    throw error;
  }

  // 새 비밀번호 해싱 및 업데이트
  const saltRounds = 10;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
  
  await req.db.query(
    'UPDATE tb_users SET password_hash = ? WHERE user_id = ?',
    [hashedNewPassword, userId]
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