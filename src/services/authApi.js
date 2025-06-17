import { apiService } from "./api";

export const AuthAPI = {
    // 회원가입
    register: async (userData) => {
        return apiService.post('/auth/register', userData);
    },

    // 로그인
    login: async (credentials) => {
        const response = await apiService.post('/auth/login', credentials);

        // 성공 시 토큰 저장
        if (response.success && response.token) {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('userData', JSON.stringify(response.user));
            apiService.token = response.token;
        }

        return response;
    },

    // 로그아웃
    logout: async () => {
        const response = await apiService.post('/auth/logout');

        // 로컬 데이터 정리
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        apiService.token = null;

        return response;
    }
};