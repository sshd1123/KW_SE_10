import React, { useEffect } from 'react';
import LoginForm from '../auth/LoginForm';
import { isAuthenticated } from '../../data/authHelpers';
import "../styles/LoginPage.css"
import { useLocation, useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigateToRegister = () => {
        navigate('/register');
    };

    return (
        <div className="login-page">
            <div className="login-panel">
                <div className="login-form-container">
                    <div className='logo-image-container'>
                        <img
                            src="symbol.png"
                            alt="학교 로고"
                            className="school-logo"
                        />
                    </div>
                    <h2 className="login-heading">로그인</h2>
                    <LoginForm />

                    <div className="login-footer">
                        <div className="auth-links">
                            <button
                                onClick={handleNavigateToRegister}
                                className="register-link-button"
                            >
                                회원가입
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;