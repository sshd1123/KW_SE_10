import { useState, useCallback } from 'react';
import { AuthAPI } from '../../services/api';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await AuthAPI.login(credentials);
      
      // 로그인 성공 시 사용자 정보 저장
      if (response.user) {
        localStorage.setItem('userData', JSON.stringify(response.user));
      }
      
      return response;
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await AuthAPI.logout();
      localStorage.removeItem('userData');
      localStorage.removeItem('authToken');
    } catch (err) {
      console.error('로그아웃 중 오류:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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