// 최종 데이터베이스 연결 테스트 (안전한 SQL만 사용)
require('dotenv').config();
const mysql = require('mysql2/promise');

async function finalConnectionTest() {
  console.log('최종 데이터베이스 연결 테스트...\n');
  
  console.log('연결 정보:');
  console.log(`호스트: ${process.env.DB_HOST}`);
  console.log(`사용자: ${process.env.DB_USER}`);
  console.log(`데이터베이스: ${process.env.DB_NAME}\n`);
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: true }
    });
    
    console.log('1단계: 연결 성공!');
    
    // 가장 기본적인 쿼리만
    console.log('2단계: 기본 쿼리 테스트...');
    const [result1] = await connection.execute('SELECT 1 as test_value');
    console.log('기본 쿼리 성공:', result1[0].test_value);
    
    // 계산 쿼리 테스트
    console.log('3단계: 계산 쿼리 테스트...');
    const [result2] = await connection.execute('SELECT 2 + 3 as calculation');
    console.log('계산 쿼리 성공:', result2[0].calculation);
    
    // 문자열 쿼리 테스트
    console.log('4단계: 문자열 쿼리 테스트...');
    const [result3] = await connection.execute("SELECT 'Hello Database' as message");
    console.log('문자열 쿼리 성공:', result3[0].message);
    
    // 테이블 목록 확인 (SHOW TABLES는 안전함)
    console.log('5단계: 테이블 목록 확인...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`테이블 개수: ${tables.length}개`);
    if (tables.length > 0) {
      console.log('기존 테이블 목록:');
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`   ${index + 1}. ${tableName}`);
      });
    } else {
      console.log('테이블이 없습니다. (새 데이터베이스)');
    }
    
    // 테이블 생성 테스트
    console.log('6단계: 테이블 생성 테스트...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS app_test (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active'
      )
    `);
    console.log('테이블 생성 성공');
    
    // 데이터 삽입 테스트
    console.log('🔍 7단계: 데이터 삽입 테스트...');
    await connection.execute(
      'INSERT INTO app_test (name, email) VALUES (?, ?)', 
      ['테스트사용자', 'test@example.com']
    );
    console.log('데이터 삽입 성공');
    
    // 데이터 조회 테스트
    console.log('8단계: 데이터 조회 테스트...');
    const [users] = await connection.execute('SELECT * FROM app_test');
    console.log(`데이터 조회 성공 (${users.length}건)`);
    
    if (users.length > 0) {
      console.log('저장된 데이터:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}, 이름: ${user.name}, 이메일: ${user.email}, 상태: ${user.status}`);
      });
    }
    
    // 데이터 업데이트 테스트
    console.log('9단계: 데이터 업데이트 테스트...');
    await connection.execute(
      'UPDATE app_test SET status = ? WHERE name = ?', 
      ['verified', '테스트사용자']
    );
    console.log('데이터 업데이트 성공');
    
    // 업데이트 결과 확인
    const [updatedUsers] = await connection.execute('SELECT * FROM app_test WHERE name = ?', ['테스트사용자']);
    if (updatedUsers.length > 0) {
      console.log('업데이트된 데이터:', updatedUsers[0]);
    }
    
    await connection.end();
    
    console.log('\n모든 테스트 성공!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 데이터베이스 연결 ');
    console.log('✅ SQL 쿼리 실행');
    console.log('✅ 테이블 생성');
    console.log('✅ 데이터 삽입');
    console.log('✅ 데이터 조회');
    console.log('✅ 데이터 수정');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('이제 app.js와 server.js를 사용할 수 있습니다!');
    console.log('다음 명령어로 서버를 시작하세요:');
    console.log('   node server.js');
    
    return true;
    
  } catch (error) {
    console.error('테스트 실패:', error.message);
    
    if (error.message.includes('Access denied')) {
      console.error('\nMySQL Workbench에서 다시 확인하세요:');
      console.error('   1. tester 계정의 Host가 % 로 설정되어 있는지');
      console.error('   2. school_db에 대한 모든 권한이 있는지');
      console.error('   3. 계정이 활성화되어 있는지');
      console.error('\nMySQL Workbench에서 실행할 SQL:');
      console.error('   GRANT ALL PRIVILEGES ON school_db.* TO "tester"@"%";');
      console.error('   FLUSH PRIVILEGES;');
    }
    
    return false;
  }
}

if (require.main === module) {
  finalConnectionTest()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('예상치 못한 오류:', error);
      process.exit(1);
    });
}

module.exports = { finalConnectionTest }; 