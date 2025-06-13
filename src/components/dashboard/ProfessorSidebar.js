import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProfessorSidebar = ({ activeTab, setActiveTab, professorName = '', professorId = '', department = '' }) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'overview', label: '대시보드', icon: 'fas fa-home', path: '/professor/dashboard' },
    { id: 'courses', label: '강의 관리', icon: 'fas fa-book', path: '/professor/courses' },
    { id: 'students', label: '학생 관리', icon: 'fas fa-users', path: '/professor/students' },
    { id: 'assignments', label: '과제 관리', icon: 'fas fa-tasks', path: '/professor/assignments' },
    { id: 'grades', label: '성적 관리', icon: 'fas fa-chart-line', path: '/professor/grades' },
    { id: 'announcements', label: '공지사항', icon: 'fas fa-bullhorn', path: '/professor/announcements' },
    { id: 'schedule', label: '강의 시간표', icon: 'fas fa-calendar', path: '/professor/schedule' },
    { id: 'materials', label: '강의 자료', icon: 'fas fa-folder', path: '/professor/materials' },
    { id: 'attendance', label: '출석 관리', icon: 'fas fa-clipboard-check', path: '/professor/attendance' },
    { id: 'settings', label: '계정 설정', icon: 'fas fa-cog', path: '/professor/settings' }
  ];

  const handleMenuClick = (item) => {
    setActiveTab(item.id);
    if (item.path) {
      navigate(item.path);
    }
  };

  const firstLetter = professorName && professorName.length > 0 ? professorName.charAt(0) : '?';

  return (
    <aside className="dashboard-sidebar student-sidebar">
      <div className="sidebar-profile">
        <div className="profile-avatar">
          {firstLetter}
        </div>
        <div className="profile-info">
          <h3 className="profile-name">{professorName || '교수님'}</h3>
          <p className="profile-details">
            {department || ''} / 사번: {professorId}
          </p>
          <div className="professor-profile-role">교수</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
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

      <div className="sidebar-footer">
        <button className="help-button">
          <i className="fas fa-question-circle"></i>
          도움말
        </button>
      </div>
    </aside>
  );
};

export default ProfessorSidebar;
