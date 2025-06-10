const AppError = require('../utils/AppError');

// 개발 환경용 에러 응답: 상세한 정보를 보여줌
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    error: err, // 에러 객체 전체
    stack: err.stack, // 스택 트레이스
  });
};

// 프로덕션 환경용 에러 응답: 사용자에게 안전한 정보만 노출
const sendErrorProd = (err, res) => {
  // 1. 우리가 예측 가능한 운영상의 에러(Operational Error)인 경우
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }
  
  // 2. 프로그래밍 또는 알 수 없는 에러: 클라이언트에게 상세 정보를 노출하지 않음
  // 1) 서버에 로그 기록
  console.error('UNEXPECTED ERROR', err);

  // 2) 일반적인 메시지 전송
  return res.status(500).json({
    success: false,
    status: 'error',
    message: '서버에 문제가 발생했습니다. 나중에 다시 시도해주세요.',
  });
};

// 데이터베이스 관련 에러 처리 함수
const handleDBError = (err) => {
  // Unique 제약 조건 위반 (예: 사용자 ID 중복)
  if (err.code === 'ER_DUP_ENTRY') {
    let message = '중복된 데이터입니다. 다른 값을 입력해주세요.';
    
    // 안전하게 중복 값 추출 시도
    try {
      if (err.sqlMessage) {
        const match = err.sqlMessage.match(/(["'])((?:\\.|(?!\1).)*?)\1/);
        if (match && match[2]) {
          message = `'${match[2]}' 값은 이미 사용 중입니다. 다른 값을 입력해주세요.`;
        }
      }
    } catch (e) {
      // 정규표현식 처리 실패시 기본 메시지 사용
    }
    
    return new AppError(message, 409); // 409 Conflict
  }
  // Foreign Key 제약 조건 위반
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    const message = '요청하신 정보와 관련된 데이터를 찾을 수 없습니다.';
    return new AppError(message, 400); // 400 Bad Request
  }
  // 필드 값이 너무 길 때
  if (err.code === 'ER_DATA_TOO_LONG') {
    const message = '입력한 데이터 중 일부가 너무 깁니다.';
    return new AppError(message, 400);
  }
  // 기본 DB 에러
  return new AppError('데이터베이스 처리 중 오류가 발생했습니다.', 500);
};

/**
 * 중앙화된 에러 처리 미들웨어
 * 모든 에러를 이곳에서 한번에 처리합니다
 */

// 에러 타입별 처리 함수들
const errorHandlers = {
  // SQL 에러 처리
  handleSqlError: (error) => {
    console.error('SQL 에러 발생:');
    console.error('에러 메시지:', error.message);
    console.error('에러 코드:', error.code);
    console.error('실행된 쿼리:', error.sql || 'N/A');
    console.error('파라미터:', error.parameters || 'N/A');
    console.error('SQL 상태:', error.sqlState || 'N/A');

    // SQL 에러 타입별 메시지
    const sqlErrorMessages = {
      'WARN_DATA_TRUNCATED': '입력된 데이터 형식이 올바르지 않습니다. 관리자에게 문의해주세요.',
      'ER_DUP_ENTRY': '이미 존재하는 데이터입니다.',
      'ER_ACCESS_DENIED_ERROR': '데이터베이스 접근 권한이 없습니다.',
      'ECONNREFUSED': '데이터베이스 연결에 실패했습니다.',
      'ER_NO_SUCH_TABLE': '요청된 데이터를 찾을 수 없습니다.',
      'ER_BAD_FIELD_ERROR': '잘못된 데이터 필드입니다.',
      'ER_NO_REFERENCED_ROW': '참조된 데이터가 존재하지 않습니다.',
      'ER_ROW_IS_REFERENCED': '다른 데이터에서 참조중인 데이터는 삭제할 수 없습니다.'
    };

    // 특정 에러 코드에 대한 추가 로깅
    if (error.code === 'WARN_DATA_TRUNCATED') {
      console.warn('데이터 길이 초과 - 데이터베이스 스키마를 확인하세요');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('데이터베이스 접근 거부 - 권한을 확인하세요');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('데이터베이스 연결 거부 - 서버 상태를 확인하세요');
    }

    return {
      statusCode: 500,
      message: sqlErrorMessages[error.code] || '데이터베이스 처리 중 오류가 발생했습니다.',
      type: 'DATABASE_ERROR'
    };
  },

  // 인증 에러 처리
  handleAuthError: (error) => {
    console.error('인증 에러 발생:', error.message);
    
    return {
      statusCode: 401,
      message: '인증이 필요합니다.',
      type: 'AUTHENTICATION_ERROR'
    };
  },

  // 권한 에러 처리
  handleAuthorizationError: (error) => {
    console.error('권한 에러 발생:', error.message);
    
    return {
      statusCode: 403,
      message: '접근 권한이 없습니다.',
      type: 'AUTHORIZATION_ERROR'
    };
  },

  // 유효성 검증 에러 처리
  handleValidationError: (error) => {
    console.error('유효성 검증 에러 발생:', error.message);
    
    return {
      statusCode: 400,
      message: error.message || '입력된 데이터가 올바르지 않습니다.',
      type: 'VALIDATION_ERROR'
    };
  },

  // 세션 에러 처리
  handleSessionError: (error) => {
    console.error('세션 에러 발생:', error.message);
    
    return {
      statusCode: 500,
      message: '세션 처리 중 오류가 발생했습니다.',
      type: 'SESSION_ERROR'
    };
  },

  // 일반 에러 처리
  handleGenericError: (error) => {
    console.error('일반 에러 발생:', error.message);
    
    return {
      statusCode: error.status || 500,
      message: error.message || '서버 내부 오류가 발생했습니다.',
      type: 'GENERIC_ERROR'
    };
  }
};

// 에러 타입 판별 함수
const identifyErrorType = (error) => {
  // SQL 에러 체크
  if (error.code && (error.code.startsWith('ER_') || error.code === 'WARN_DATA_TRUNCATED' || error.code === 'ECONNREFUSED')) {
    return 'sql';
  }
  
  // 인증 에러 체크
  if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized') || error.message.includes('token')) {
    return 'auth';
  }
  
  // 권한 에러 체크
  if (error.message.includes('forbidden') || error.message.includes('permission')) {
    return 'authorization';
  }
  
  // 유효성 검증 에러 체크
  if (error.name === 'ValidationError' || error.message.includes('validation')) {
    return 'validation';
  }
  
  // 세션 에러 체크
  if (error.message && error.message.includes('session')) {
    return 'session';
  }
  
  // HTTP 상태 코드가 있는 경우
  if (error.status) {
    if (error.status === 401) return 'auth';
    if (error.status === 403) return 'authorization';
    if (error.status === 400) return 'validation';
  }
  
  return 'generic';
};

// 메인 에러 처리 미들웨어
const errorHandler = (error, req, res, next) => {
  // 에러 발생 기본 로깅
  console.error('글로벌 에러 핸들러 - 에러 발생:');
  console.error('요청:', req.method, req.originalUrl);
  console.error('에러 메시지:', error.message);
  console.error('에러 스택:', error.stack);
  
  // 에러 타입 식별
  const errorType = identifyErrorType(error);
  
  // 타입별 에러 처리
  let errorResponse;
  switch (errorType) {
    case 'sql':
      errorResponse = errorHandlers.handleSqlError(error);
      break;
    case 'auth':
      errorResponse = errorHandlers.handleAuthError(error);
      break;
    case 'authorization':
      errorResponse = errorHandlers.handleAuthorizationError(error);
      break;
    case 'validation':
      errorResponse = errorHandlers.handleValidationError(error);
      break;
    case 'session':
      errorResponse = errorHandlers.handleSessionError(error);
      break;
    default:
      errorResponse = errorHandlers.handleGenericError(error);
  }
  
  // 응답 객체 생성
  const response = {
    success: false,
    message: errorResponse.message,
    type: errorResponse.type,
    timestamp: new Date().toISOString(),
    errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 고유 에러 ID
    path: req.originalUrl,
    method: req.method
  };
  
  // 개발 환경에서는 더 자세한 정보 제공
  if (process.env.NODE_ENV === 'development') {
    response.debug = {
      error: error.message,
      stack: error.stack,
      code: error.code,
      sql: error.sql,
      parameters: error.parameters,
      originalError: error
    };
  }
  
  // 클라이언트에게 응답 전송
  res.status(errorResponse.statusCode).json(response);
};

// 404 에러 핸들러 (라우트를 찾을 수 없는 경우)
const notFoundHandler = (req, res, next) => {
  console.warn(`404 에러 - 존재하지 않는 경로: ${req.method} ${req.originalUrl}`);
  
  const error = new Error(`경로 '${req.originalUrl}'를 찾을 수 없습니다.`);
  error.status = 404;
  error.type = 'NOT_FOUND';
  
  next(error);
};

// 비동기 에러 캐처 헬퍼
const asyncErrorCatcher = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncErrorCatcher,
  errorHandlers
};
