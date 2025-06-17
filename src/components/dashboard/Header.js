import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Header = ({ username, role }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { logout, loading } = useAuth();

  const navigate = useNavigate();

  // const handleLogout = () => {
  //   // 로그아웃 처리
  //   localStorage.removeItem('token');
  //   localStorage.removeItem('user');
  //   navigate('/login');
  // };

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await logout();
    }
  };

  // 사용자 역할에 따른 대시보드 경로 결정
  const getDashboardPath = () => {
    if (role === '교수' || role === 'professor') {
      return '/professor/dashboard';
    } else if (role === '학생' || role === 'student') {
      return '/student/dashboard';
    } 
    // 기본값은 학생 대시보드
    return '/student/dashboard';
  };

  const getRoleInKorean = (role) => {
    if (role === 'student') return '학생';
    if (role === 'professor') return '교수';
    if (role === '교수') return '교수';
    if (role === '학생') return '학생';
    return '학생';
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <Link to={getDashboardPath()}>
          <img src="/symbol.png" alt="로고" className="header-logo" />
        </Link>
      </div>

      <div className="header-right">
        <div className="notification-icon">
          <i className="fas fa-bell"></i>
          <span className="notification-badge">3</span>
        </div>

        <div className="user-dropdown">
          <button
            className="user-dropdown-toggle"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="user-name">{username}</span>
            <span className="user-role">{getRoleInKorean(role)}</span>
            <i className="fas fa-chevron-down"></i>
          </button>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              <button 
              onClick={handleLogout} 
              disabled={loading}
              className="dropdown-item logout-button"
              >
                <i className="fas fa-sign-out-alt"></i> 로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;