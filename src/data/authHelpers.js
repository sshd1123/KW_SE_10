// data/authHelpers.js
const DEVELOPMENT_BYPASS = true; // 개발 시 true, 배포 시 false

export const getCurrentUser = () => {
    // 개발 모드에서 더미 사용자 반환
    if (DEVELOPMENT_BYPASS && process.env.NODE_ENV === 'development') {
        // URL에 따라 다른 역할의 사용자 반환
        const path = window.location.pathname;

        console.log('🚀 개발 모드: 현재 경로 =', path);

        if (path.includes('/professor/')) {
            const user = {
                id: 'prof001',
                name: '개발교수',
                role: 'professor',
                professorId: 'prof001',
                department: '컴퓨터공학과',
                email: 'dev.professor@university.ac.kr'
            };
            console.log('👨‍🏫 교수 사용자로 설정:', user);
            return user;
        } else {
            // 기본값: 학생
            const user = {
                id: 'student001',
                name: '개발학생',
                role: 'student',
                studentId: '2024000001',
                department: '컴퓨터공학과',
                year: 3,
                email: 'dev.student@university.ac.kr'
            };
            console.log('👨‍🎓 학생 사용자로 설정:', user);
            return user;
        }
    }

    try {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('사용자 데이터 파싱 오류:', error);
        return null;
    }
};

export const isAuthenticated = () => {
    // 개발 모드 우회
    if (DEVELOPMENT_BYPASS && process.env.NODE_ENV === 'development') {
        console.log('🚀 개발 모드: 인증 우회 활성화');
        return true;
    }

    const token = localStorage.getItem('authToken');
    const user = getCurrentUser();
    const isAuth = !!(token && user);

    console.log('🔐 인증 확인:', { token: !!token, user: !!user, isAuth });
    return isAuth;
};

export const clearAuthData = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
};

export const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

// 사용자 역할 확인
export const hasRole = (requiredRole) => {
    const user = getCurrentUser();
    const hasRequiredRole = user?.role === requiredRole;

    console.log('🎭 역할 확인:', {
        userRole: user?.role,
        requiredRole,
        hasRequiredRole
    });

    return hasRequiredRole;
};

// 개발 모드 상태 확인
export const isDevelopmentMode = () => {
    return DEVELOPMENT_BYPASS && process.env.NODE_ENV === 'development';
};