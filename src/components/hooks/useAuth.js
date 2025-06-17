import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthAPI } from '../../services/authApi';

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const login = useCallback(async (credentials) => {
        setLoading(true);
        setError(null);
        
        try {
            // ✅ 필드 검증 추가
            if (!credentials.loginId || !credentials.password) {
                throw new Error('로그인 ID와 비밀번호를 모두 입력해주세요.');
            }

            const response = await AuthAPI.login(credentials);
            
            if (response.success) {
                const userData = response.user || response.data;
                
                if (userData) {
                    // 역할별 리다이렉션
                    if (userData.role === 'student') {
                        navigate('/student/dashboard');
                    } else if (userData.role === 'professor') {
                        navigate('/professor/dashboard');
                    }
                    return response;
                } else {
                    throw new Error('사용자 정보를 받을 수 없습니다.');
                }
            } else {
                throw new Error(response.message || '로그인에 실패했습니다.');
            }
        } catch (err) {
            const errorMessage = err.message || '로그인에 실패했습니다.';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    const logout = async () => {
        setLoading(true);
        try {
            await AuthAPI.logout();
            navigate('/login');
        } catch (error) {
            console.error('로그아웃 중 오류:', error);
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const register = useCallback(async (userData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await AuthAPI.register(userData);
            return response;
        } catch (err) {
            setError(err.message || '회원가입에 실패했습니다.');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        login,
        logout,
        register,
        loading,
        error,
        clearError: () => setError(null)
    };
};
