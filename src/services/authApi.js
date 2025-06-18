import { apiService } from "./api";

export const AuthAPI = {
    // 회원가입
    register: async (userData) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
                // HTTP 상태 코드가 에러인 경우
                throw new Error(data.message || `HTTP ${response.status}: 회원가입에 실패했습니다.`);
            }

            return {
                success: true,
                message: '회원가입이 완료되었습니다.',
                data: data
            };
        } catch (error) {
            console.error('Register API Error:', error);

            // 네트워크 에러나 기타 에러
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('네트워크 연결을 확인해주세요.');
            }

            throw error;
        }
    },

    // 로그인
    login: async (credentials) => {
        try {
            console.log('로그인 요청 데이터:', credentials);

            if (!credentials.loginId || !credentials.password) {
                throw new Error('로그인 ID와 비밀번호를 모두 입력해주세요.');
            }

            const response = await apiService.post('/auth/login', {
                loginId: credentials.loginId,  // 명시적으로 loginId 사용
                password: credentials.password
            });

            // 성공 시 토큰 및 사용자 정보 저장
            if (response.success) {
                if (response.token) {
                    localStorage.setItem('authToken', response.token);
                    apiService.updateToken(response.token);
                }

                // 사용자 정보 저장 (response.user 또는 response.data 확인)
                const userData = response.user || response.data;
                if (userData) {
                    localStorage.setItem('userData', JSON.stringify(userData));
                }
            }

            return response;
        } catch (error) {
            console.error('로그인 API 오류:', error);
            throw error;
        }
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