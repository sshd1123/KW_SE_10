// 연결 문제 유형 구분 테스트
require('dotenv').config();
const mysql = require('mysql2/promise');

async function diagnoseConnectionIssue() {
  console.log('연결 문제 진단 시작...\n');
  
  const host = process.env.DB_HOST;
  const port = parseInt(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  
  console.log('연결 정보:');
  console.log(`호스트: ${host}:${port}`);
  console.log(`사용자: ${user}`);
  console.log(`DB: ${database}\n`);
  
  // 1. 기본 네트워크 연결 테스트 (포트만)
  console.log('네트워크 연결 테스트 (방화벽 확인)');
  try {
    const testConfig = {
      host: host,
      port: port,
      user: 'nonexistentuser', // 존재하지 않는 사용자
      password: 'wrongpassword',
      database: database,
      ssl: { rejectUnauthorized: true },
      connectTimeout: 10000
    };
    
    await mysql.createConnection(testConfig);
    console.log('네트워크 연결 성공 (방화벽 OK)');
    
  } catch (error) {
    if (error.message.includes('Access denied')) {
      console.log('네트워크 연결 성공 (방화벽 OK)');
      console.log('방화벽은 정상, 인증 문제입니다');
    } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      console.log('네트워크 연결 실패 (방화벽 문제)');
      console.log('Azure Portal에서 방화벽 설정 필요');
      return { issue: 'firewall', canUseWorkbench: false };
    } else {
      console.log('예상치 못한 네트워크 오류:', error.message);
    }
  }
  
  // 2. 실제 인증 테스트
  console.log('\n인증 테스트');
  try {
    const realConfig = {
      host: host,
      port: port,
      user: user,
      password: password,
      database: database,
      ssl: { rejectUnauthorized: true },
      connectTimeout: 10000
    };
    
    const connection = await mysql.createConnection(realConfig);
    console.log('인증 성공! 연결 완료');
    await connection.end();
    return { issue: 'none', canUseWorkbench: true };
    
  } catch (error) {
    if (error.message.includes('Access denied')) {
      console.log('인증 실패');
      console.log('MySQL Workbench에서 사용자 설정 가능');
      return { issue: 'authentication', canUseWorkbench: true };
    } else {
      console.log('기타 오류:', error.message);
      return { issue: 'other', canUseWorkbench: false };
    }
  }
}

// 해결 방법 안내
function showSolution(result) {
  console.log('\n🔧 해결 방법:');
  
  if (result.issue === 'firewall') {
    console.log('📍 Azure Portal에서 해결해야 함:');
    console.log('   1. Azure Portal > MySQL 서버 > Connection security');
    console.log('   2. "Add current client IP address" 클릭');
    console.log('   3. 또는 수동으로 IP 추가: 58.141.166.115');
    console.log('\n❌ MySQL Workbench 사용 불가 (방화벽 차단됨)');
    
  } else if (result.issue === 'authentication') {
    console.log('💻 MySQL Workbench에서 해결 가능:');
    console.log('   1. MySQL Workbench로 관리자 계정 연결');
    console.log('   2. Users and Privileges 메뉴');
    console.log('   3. tester 계정 활성화 또는 새 계정 생성');
    console.log('\n✅ MySQL Workbench 사용 가능');
    
  } else if (result.issue === 'none') {
    console.log('🎉 모든 것이 정상입니다!');
    console.log('✅ MySQL Workbench 사용 가능');
    
  } else {
    console.log('⚠️  복합적인 문제가 있습니다.');
    console.log('   Azure Portal과 MySQL Workbench 모두 확인 필요');
  }
}

// 실행
if (require.main === module) {
  diagnoseConnectionIssue()
    .then(result => {
      showSolution(result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 진단 중 오류:', error);
      process.exit(1);
    });
}

module.exports = { diagnoseConnectionIssue }; 