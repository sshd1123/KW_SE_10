import React from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeTab, setActiveTab, studentName='', studentId='', department='' }) => {
  const navigate = useNavigate();
  
  const menuItems = [
    { id: 'overview', label: '대시보드', icon: 'fas fa-home', path: '/student/dashboard' },
    { id: 'courses', label: '내 강의실', icon: 'fas fa-book', path: '/student/courses' },
    { id: 'grades', label: '수강/성적 조회', icon: 'fas fa-chart-line', path: '/student/grades' },
    { id: 'registration', label: '수강 신청', icon: 'fas fa-pencil-alt', path: '/student/registration' },
    { id: 'graduation', label: '졸업 요건', icon: 'fas fa-graduation-cap', path: '/student/graduation' },
    { id: 'settings', label: '계정 설정', icon: 'fas fa-cog', path: '/student/settings' }
  ];

  // 메뉴 클릭 핸들러
  const handleMenuClick = (item) => {
    setActiveTab(item.id);
    if (item.path) {
      navigate(item.path);
    }
  };

  const firstLetter = studentName && studentName.length > 0 ? studentName.charAt(0) : '?';
  
  return (
    <aside className="dashboard-sidebar student-sidebar">
      <div className="sidebar-profile">
        <div className="profile-avatar">
          {firstLetter}
        </div>
        <div className="profile-info">
          <h3 className="profile-name">{studentName || '이름 없음'}</h3>
          <p className="profile-details">{studentId || '학번 없음'}</p>
          <p className="profile-details">{department || '학과 없음'}</p>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map(item => (
            <li key={item.id}>
              <button
                className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleMenuClick(item)}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;