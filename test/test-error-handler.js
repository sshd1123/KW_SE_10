const http = require('http');

// 서버 응답을 기다리는 함수
function waitForServer() {
  return new Promise((resolve) => {
    const checkServer = () => {
      const req = http.get('http://localhost:8000/', (res) => {
        console.log('서버가 시작되었습니다. 테스트를 시작합니다...\n');
        resolve();
      });
      
      req.on('error', () => {
        setTimeout(checkServer, 1000);
      });
    };
    
    checkServer();
  });
}

// API 테스트 함수
async function testAPI(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// 테스트 실행
async function runTests() {
  await waitForServer();
  
  console.log('글로벌 에러 핸들러 테스트 시작\n');
  console.log('=' .repeat(50));
  
  // 테스트 1: 유효성 검증 에러 (필수 필드 누락)
  console.log('\n테스트 1: 유효성 검증 에러 (필수 필드 누락)');
  try {
    const result1 = await testAPI('POST', '/api/auth/register', {
      email: 'test@example.com'
      // password와 name 누락
    });
    
    console.log(`상태 코드: ${result1.statusCode}`);
    console.log(`응답:`, JSON.stringify(result1.data, null, 2));
    console.log(`에러 타입: ${result1.data.type || 'N/A'}`);
    console.log(`에러 ID: ${result1.data.errorId || 'N/A'}`);
  } catch (error) {
    console.error('테스트 1 실패:', error.message);
  }
  
  // 테스트 2: SQL 에러 (role 필드 데이터 길이 초과)
  console.log('\n테스트 2: SQL 에러 (role 필드 문제)');
  try {
    const result2 = await testAPI('POST', '/api/auth/register', {
      email: 'testsql@example.com',
      password: 'test123',
      name: '테스트사용자'
    });
    
    console.log(`상태 코드: ${result2.statusCode}`);
    console.log(`응답:`, JSON.stringify(result2.data, null, 2));
    console.log(`에러 타입: ${result2.data.type || 'N/A'}`);
    console.log(`에러 ID: ${result2.data.errorId || 'N/A'}`);
  } catch (error) {
    console.error('테스트 2 실패:', error.message);
  }
  
  // 테스트 3: 404 에러
  console.log('\n테스트 3: 404 에러 (존재하지 않는 경로)');
  try {
    const result3 = await testAPI('GET', '/api/nonexistent-route');
    
    console.log(`상태 코드: ${result3.statusCode}`);
    console.log(`응답:`, JSON.stringify(result3.data, null, 2));
    console.log(`에러 타입: ${result3.data.type || 'N/A'}`);
    console.log(`에러 ID: ${result3.data.errorId || 'N/A'}`);
  } catch (error) {
    console.error('테스트 3 실패:', error.message);
  }
  
  // 테스트 4: 인증 에러
  console.log('\n테스트 4: 인증 에러 (잘못된 로그인 정보)');
  try {
    const result4 = await testAPI('POST', '/api/auth/login', {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    });
    
    console.log(`상태 코드: ${result4.statusCode}`);
    console.log(`응답:`, JSON.stringify(result4.data, null, 2));
    console.log(`에러 타입: ${result4.data.type || 'N/A'}`);
    console.log(`에러 ID: ${result4.data.errorId || 'N/A'}`);
  } catch (error) {
    console.error('테스트 4 실패:', error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('모든 테스트 완료! 서버 콘솔에서 에러 로깅을 확인하세요.');
  console.log('브라우저에서 http://localhost:8000/test 를 열어서 더 자세한 테스트를 진행할 수 있습니다.');
}

// 테스트 실행
runTests().catch(console.error); 