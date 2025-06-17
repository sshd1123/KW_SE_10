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

  const logout = async () => {
    setLoading(true);

    try {
      // API 호출
      await AuthAPI.logout();

      // 성공 시 로그인 페이지로 이동
      navigate('/login');

    } catch (error) {
      console.error('로그아웃 중 오류:', error);
      // 에러가 있어도 로컬 데이터는 정리하고 로그인 페이지로 이동
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