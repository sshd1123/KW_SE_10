import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../data/authUtils';

const LoginForm = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    username: '',
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
        // 더미 로그인 함수 사용
        const user = login(loginData.username, loginData.password);
        
        // 사용자 역할에 따라 리디렉션
        if (user.role === 'student') {
          navigate('/student/dashboard');
        } else if (user.role === 'professor') {
          navigate('/professor/dashboard');
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
        <label htmlFor="username">아이디</label>
        <input
          type="text"
          id="username"
          name="username"
          value={loginData.username}
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