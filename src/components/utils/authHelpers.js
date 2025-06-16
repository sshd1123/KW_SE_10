const DEVELOPMENT_BYPASS = true; // 개발 시 true, 배포 시 false

export const getCurrentUser = () => {
    // 개발 모드에서 더미 사용자 반환
    if (DEVELOPMENT_BYPASS && process.env.NODE_ENV === 'development') {
        return {
            id: '2024000001',
            name: '개발자',
            role: 'professor', // 필요에 따라 변경
            studentId: '2024000001',
            department: '컴퓨터공학과'
        };
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
        return true;
    }

    const token = localStorage.getItem('authToken');
    const user = getCurrentUser();
    return !!(token && user);
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
    return user?.role === requiredRole;
};