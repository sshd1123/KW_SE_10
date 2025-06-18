import React from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeTab, setActiveTab, adminName=''}) => {
  const navigate = useNavigate();
  
  const menuItems = [
    { id: 'announcements', label: '학사 공지 관리', icon: 'fa fa-check-circle'},
    { id: 'courses', label: '강의 관리', icon: 'fas fa-book'},
    { id: 'syllabus', label: '강의계획서 관리', icon: 'fa fa-clipboard'},
    { id: 'users', label: '사용자 관리', icon: 'fas fa-users'}
  ];

  // 메뉴 클릭 핸들러
  const handleMenuClick = (item) => {
    setActiveTab(item.id);
    if (item.path) {
      navigate(item.path);
    }
  };

  const firstLetter = adminName && adminName.length > 0 ? adminName.charAt(0) : '?';
  
  return (
    <aside className="dashboard-sidebar student-sidebar">
      <div className="sidebar-profile">
        <div className="profile-avatar">
          {firstLetter}
        </div>
        <div className="profile-info">
          <h3 className="profile-name">{adminName || '이름 없음'}</h3>
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