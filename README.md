# SE_10 프로젝트
Express.js와 MySQL을 사용한 웹 애플리케이션 백엔드 API 서버

버전: v 1.0.0

##주요 기능
- **사용자 인증 시스템**: 회원가입, 로그인, 로그아웃
- **세션 기반 인증**: Express Session + Cookie
- **데이터베이스 연동**: Azure MySQL 연결
- **에러 처리**: 글로벌 에러 핸들러

## 기술 스택
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (Azure MySQL)
- **Authentication**: Express Session
- **Security**: bcrypt, CORS
- **Environment**: dotenv

## 설치 및 실행
### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
# env.example을 참고하여 .env 파일 생성
cp env.example .env
```

`.env` 파일에서 다음 값들을 설정:
- `DB_HOST`: MySQL 호스트
- `DB_USER`: MySQL 사용자명
- `DB_PASSWORD`: MySQL 비밀번호
- `DB_NAME`: 데이터베이스명
- `SESSION_SECRET`: 세션 암호화 키 (32자 이상)

### 3. 서버 실행
```bash
# 배포 모드
npm start
# 개발 모드 (nodemon)
npm run dev
```

서버는 기본적으로 `http://localhost:3000`에서 실행

## Restful API 엔드포인트

### 인증 관련
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/status` - 로그인 상태 확인
- `GET /api/auth/me` - 사용자 프로필 조회

### 기본
- `GET /` - 서버 상태 확인
- `GET /api` - API 상태 및 DB 연결 확인
- `GET /test` - 테스트 페이지

## 개발 환경
- Node.js 14+ 필요
- MySQL 5.7+ 또는 8.0+
- 포트 3000 사용 (변경 가능)

## Restful API 명세
- https://www.notion.so/API-20b90a69b6a58053b83fd268ba12c267

## 라이센스
MIT License

