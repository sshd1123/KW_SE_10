// 환경변수 로드
require('dotenv').config();

try {
  const app = require('./app');
  
  const PORT = process.env.PORT || 8000;
  
  // 서버 시작
  const server = app.listen(PORT, () => {
    console.log('서버가 시작되었습니다!');
    console.log(`포트: ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log('세션/쿠키 인증 시스템 활성화됨');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('서버 종료: Ctrl+C');
  });

  // 에러 핸들링
  server.on('error', (error) => {
    console.error('서버 에러:', error);
    process.exit(1);
  });

} catch (error) {
  console.error('앱 로딩 에러:', error.message);
  console.error('전체 에러:', error);
  process.exit(1);
}

// 종료 처리
process.on('SIGTERM', () => {
  console.log('서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 안전하게 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 안전하게 종료되었습니다.');
    process.exit(0);
  });
}); 