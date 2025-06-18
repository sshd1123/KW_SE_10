// 간단한 인메모리 세션 저장소
const sessions = new Map();

// 세션 ID 생성
function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 세션 생성
function createSession(userId, userData) {
  const sessionId = generateSessionId();
  const sessionData = {
    id: sessionId,
    userId: userId,
    user: userData,
    createdAt: new Date(),
    lastAccess: new Date()
  };
  
  sessions.set(sessionId, sessionData);
  console.log('세션 생성:', { sessionId, userId: userData.id });
  return sessionId;
}

// 세션 조회
function getSession(sessionId) {
  if (!sessionId) return null;
  
  const session = sessions.get(sessionId);
  if (session) {
    session.lastAccess = new Date();
    console.log('세션 조회 성공:', { sessionId, userId: session.user.id });
    return session;
  }
  
  console.log('세션 조회 실패:', { sessionId });
  return null;
}

// 세션 삭제
function deleteSession(sessionId) {
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
    console.log('세션 삭제:', { sessionId });
    return true;
  }
  return false;
}

// 만료된 세션 정리 (24시간)
function cleanupExpiredSessions() {
  const now = new Date();
  const expireTime = 24 * 60 * 60 * 1000; // 24시간
  
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastAccess > expireTime) {
      sessions.delete(sessionId);
      console.log('만료된 세션 삭제:', { sessionId });
    }
  }
}

// 주기적으로 만료된 세션 정리 (1시간마다)
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = {
  createSession,
  getSession,
  deleteSession,
  cleanupExpiredSessions
}; 