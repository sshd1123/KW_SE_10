import React, { useState } from 'react';
import RegisterForm from '../auth/RegisterForm';
import { useNavigate } from 'react-router-dom';
import '../styles/RegisterPage.css';
import { AuthAPI } from '../../services/api';

// 회원가입 페이지 컴포넌트
const RegisterPage = () => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleRegistrationSubmit = async (userData) => {
    setLoading(true);
    setErrors({});

    try {
      const response = await AuthAPI.register(userData);

      if (response.success) {
        console.log('회원가입 성공:', userData);
        setShowSuccessMessage(true);

        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        // API에서 반환된 에러 처리
        setErrors(response.errors || { general: response.message || '회원가입에 실패했습니다.' });
      }
    } catch (error) {
      console.error('회원가입 에러:', error);

      // 네트워크 에러나 서버 에러 처리
      if (error.message.includes('이미 사용')) {
        setErrors({
          studentId: '이미 등록된 학번입니다.',
          professorId: '이미 등록된 교수번호입니다.'
        });
      } else {
        setErrors({ general: error.message || '회원가입에 실패했습니다. 다시 시도해주세요.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  if (showSuccessMessage) {
    return (
      <div className="register-page">
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h2 className="success-title">회원가입 완료!</h2>
          <p className="success-message">
            회원가입이 성공적으로 완료되었습니다.<br />
            잠시 후 로그인 페이지로 이동됩니다.
          </p>
          <div className="progress-bar"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-container">
        {/* 로고 영역 */}
        <div className="logo-container">
          <img
            src="symbol.png"
            alt="학교 로고"
            className="school-logo"
          />
        </div>

        {/* 제목 */}
        <h2 className="register-title">회원가입</h2>
        <p className="register-subtitle">
          학사관리시스템에 오신 것을 환영합니다
        </p>

        {/* 회원가입 폼 */}
        <RegisterForm
          onSubmit={handleRegistrationSubmit}
          onNavigateToLogin={handleNavigateToLogin}
          loading={loading}
          errors={errors}
        />

        {/* 로그인 링크 */}
        <div className="auth-link">
          <span>이미 계정이 있으신가요? </span>
          <button
            onClick={handleNavigateToLogin}
            className="login-link-button"
          >
            로그인하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;