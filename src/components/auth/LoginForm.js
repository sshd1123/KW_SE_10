import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../data/authUtils';
import { AuthAPI } from '../../services/authApi';

const LoginForm = () => {
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    loginId: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));

    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!loginData.loginId.trim()) {
      setError('ID를 입력해주세요.');
      return;
    }

    if (!loginData.password.trim()) {
      setError('비밀번호를 입력해주세요.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await AuthAPI.login({
        loginId: loginData.loginId,
        password: loginData.password
      });

      if (response.success) {
        const userRole = response.user.role;

        // 사용자 역할에 따라 리다이렉션
        if (userRole === 'student') {
          navigate('/student/dashboard');
        } else if (userRole === 'professor') {
          navigate('/professor/dashboard');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="loginId">아이디</label>
        <input
          type="text"
          id="loginId"
          name="loginId"
          value={loginData.loginId}
          onChange={handleChange}
          placeholder="ID(학번 또는 사번)"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">비밀번호</label>
        <input
          type="password"
          id="password"
          name="password"
          value={loginData.password}
          onChange={handleChange}
          placeholder="PASSWORD"
          required
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        type="submit"
        className="login-button"
        disabled={isLoading}
      >
        {isLoading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
};

export default LoginForm;