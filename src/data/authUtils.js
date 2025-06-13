// authUtils.js
import users from './dummyUsers';
import studentData from './dummyStudentData';
import professorData from './dummyProfessorData';

// 로그인 처리 함수
export const login = (username, password) => {
    const user = users.find(user => (user.studentId === username || user.professorId === username) && user.password === password);

    if (!user) {
        throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
    }

    // 사용자 개인정보 필터링 (비밀번호 제거)
    const { password: _, ...userInfo } = user;

    // 토큰 생성 (실제로는 JWT를 사용하겠지만, 여기서는 간단히 처리)
    const token = btoa(JSON.stringify({ userId: user.id, role: user.role, timestamp: Date.now() }));

    // 로컬 스토리지에 저장
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userInfo));

    return userInfo;
};

// 로그아웃 처리 함수
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

// 현재 로그인된 사용자 정보 가져오기
export const getCurrentUser = () => {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;

    return JSON.parse(userJson);
};

// 사용자 역할에 따른 대시보드 데이터 가져오기
export const getDashboardData = () => {
    const user = getCurrentUser();
    if (!user) return null;

    switch (user.role) {
        case 'student':
            return studentData[user.id] || null;
        case 'professor':
            return professorData[user.id] || null;
        default:
            return null;
    }
};