const mysql = require('mysql2/promise');

// 데이터베이스 연결 설정
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'your_database_name',
  charset: 'utf8mb4',
  timezone: '+00:00', // UTC 시간 사용
  // 연결 풀 설정 (MySQL2 호환)
  connectionLimit: 10, // 최대 연결 수
  queueLimit: 0, // 대기열 제한
  // SSL 설정 (Azure MySQL은 SSL 필수)
  ssl: process.env.DB_SSL !== 'false' ? {
    rejectUnauthorized: true
  } : false
};

// 연결 풀 생성
const pool = mysql.createPool(dbConfig);

// 데이터베이스 연결 테스트 함수
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('데이터베이스 연결 성공');
    console.log(`연결된 데이터베이스: ${dbConfig.database}`);
    console.log(`호스트: ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error.message);
    return false;
  }
};

// 쿼리 실행 헬퍼 함수
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    // 에러 정보를 더 자세히 로깅
    console.error('SQL 쿼리 에러 발생:');
    console.error('에러 메시지:', error.message);
    console.error('에러 코드:', error.code);
    console.error('실행된 쿼리:', sql);
    console.error('파라미터:', params);
    console.error('SQL 상태:', error.sqlState);
    
    // 에러 객체에 쿼리 정보 추가 (디버깅용)
    error.sql = sql;
    error.parameters = params;
    
    // 특정 에러 타입에 대한 추가 정보
    if (error.code === 'WARN_DATA_TRUNCATED') {
      console.warn('데이터 길이 초과 - 데이터베이스 스키마를 확인하세요');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('데이터베이스 접근 거부 - 권한을 확인하세요');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('데이터베이스 연결 거부 - 서버 상태를 확인하세요');
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('테이블이 존재하지 않습니다');
    }
    
    throw error;
  }
};

// 트랜잭션 헬퍼 함수
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    console.log('트랜잭션 시작');
    
    const result = await callback(connection);
    
    await connection.commit();
    console.log('트랜잭션 커밋 완료');
    
    return result;
  } catch (error) {
    console.error('트랜잭션 에러 발생:', error.message);
    console.log('트랜잭션 롤백 중...');
    
    try {
      await connection.rollback();
      console.log('트랜잭션 롤백 완료');
    } catch (rollbackError) {
      console.error('롤백 실패:', rollbackError.message);
    }
    
    throw error;
  } finally {
    connection.release();
    console.log('데이터베이스 연결 해제');
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
}; 