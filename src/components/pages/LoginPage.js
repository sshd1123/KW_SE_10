import React from 'react';
import LoginForm from '../auth/LoginForm';
import "../styles/LoginPage.css"

const LoginPage = () => {
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
                        <div className="remember-me">
                            <input type="checkbox" id="remember-me" />
                            <label htmlFor="remember-me">로그인 상태 유지</label>
                        </div>

                        <div className="auth-links">
                            <a href="/forgot-password" className="forgot-password-link">비밀번호 찾기</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;