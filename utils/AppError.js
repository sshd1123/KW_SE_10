class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
  
      this.statusCode = statusCode;
      // 상태 코드가 4xx로 시작하면 'fail', 그렇지 않으면 'error'
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      // isOperational은 예측 가능한 에러임을 나타냄
      this.isOperational = true;
  
      // 생성자 함수가 에러 스택 트레이스에 포함되지 않도록 함
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  module.exports = AppError;