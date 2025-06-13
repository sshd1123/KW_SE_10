import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import Sidebar from '../../dashboard/Sidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/NotificationsPage.css';

const NotificationsPage = () => {
    const [userData, setUserData] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [activeTab, setActiveTab] = useState('notifications');
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read', 'important'
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // 사용자 정보 및 알림 데이터 로드
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }

        const dashboardData = getDashboardData();
        if (!dashboardData) {
            navigate('/student/dashboard');
            return;
        }

        setUserData(user);
        setStudentData(dashboardData);

        // 알림 데이터 생성 (실제 환경에서는 API에서 가져옴)
        generateNotifications(dashboardData);
        setLoading(false);
    }, [navigate]);

    // 알림 데이터 생성 함수
    const generateNotifications = (data) => {
        const notificationList = [];
        let id = 1;

        // 공지사항 알림
        if (data.announcements) {
            data.announcements.forEach(announcement => {
                if (announcement.isNew) {
                    notificationList.push({
                        id: id++,
                        type: 'announcement',
                        title: '새로운 공지사항',
                        message: `${announcement.course}: ${announcement.title}`,
                        time: announcement.date,
                        isRead: false,
                        isImportant: announcement.course === '학사공지',
                        relatedId: announcement.id,
                        icon: 'fas fa-bullhorn'
                    });
                }
            });
        }

        // 과제 마감일 알림
        if (data.assignments) {
            data.assignments.forEach(assignment => {
                const today = new Date();
                const deadline = new Date(assignment.deadline);
                const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

                if (daysRemaining <= 3 && daysRemaining >= 0 && assignment.status !== '완료') {
                    notificationList.push({
                        id: id++,
                        type: 'assignment',
                        title: daysRemaining === 0 ? '과제 마감일 당일' : `과제 마감 ${daysRemaining}일 전`,
                        message: `${assignment.course}: ${assignment.title}`,
                        time: new Date().toISOString().split('T')[0],
                        isRead: false,
                        isImportant: daysRemaining <= 1,
                        relatedId: assignment.id,
                        icon: 'fas fa-tasks'
                    });
                }
            });
        }

        // 성적 관련 알림
        notificationList.push({
            id: id++,
            type: 'grade',
            title: '중간고사 성적 공개',
            message: '자바프로그래밍 중간고사 성적이 공개되었습니다.',
            time: '2025-05-20',
            isRead: true,
            isImportant: false,
            relatedId: null,
            icon: 'fas fa-chart-line'
        });

        // 시스템 알림
        notificationList.push({
            id: id++,
            type: 'system',
            title: '시스템 점검 안내',
            message: '5월 30일 오전 2시-6시 시스템 점검이 예정되어 있습니다.',
            time: '2025-05-25',
            isRead: false,
            isImportant: true,
            relatedId: null,
            icon: 'fas fa-cog'
        });

        // 학사 일정 알림
        notificationList.push({
            id: id++,
            type: 'academic',
            title: '수강신청 일정 안내',
            message: '2025년 2학기 수강신청이 7월 15일부터 시작됩니다.',
            time: '2025-05-22',
            isRead: true,
            isImportant: true,
            relatedId: null,
            icon: 'fas fa-calendar-alt'
        });

        // 시간순 정렬 (최신순)
        notificationList.sort((a, b) => new Date(b.time) - new Date(a.time));
        setNotifications(notificationList);
    };

    // 필터링된 알림 목록 가져오기
    const getFilteredNotifications = () => {
        let filtered = [...notifications];

        switch (filter) {
            case 'unread':
                filtered = filtered.filter(n => !n.isRead);
                break;
            case 'read':
                filtered = filtered.filter(n => n.isRead);
                break;
            case 'important':
                filtered = filtered.filter(n => n.isImportant);
                break;
            default:
                break;
        }

        return filtered;
    };

    // 알림 읽음 처리
    const markAsRead = (notificationId) => {
        setNotifications(prev => 
            prev.map(notification => 
                notification.id === notificationId 
                    ? { ...notification, isRead: true }
                    : notification
            )
        );
    };

    // 알림 클릭 처리
    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);

        // 알림 타입에 따른 페이지 이동
        switch (notification.type) {
            case 'announcement':
                if (notification.relatedId) {
                    navigate(`/student/announcement/${notification.relatedId}`);
                } else {
                    navigate('/student/announcements');
                }
                break;
            case 'assignment':
                if (notification.relatedId) {
                    navigate(`/student/assignment/submit/${notification.relatedId}`);
                } else {
                    navigate('/student/assignments');
                }
                break;
            case 'grade':
                navigate('/student/grades');
                break;
            case 'academic':
            case 'system':
            default:
                // 시스템 알림은 상세 모달을 표시하거나 관련 페이지로 이동
                break;
        }
    };

    // 모든 알림 읽음 처리
    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(notification => ({ ...notification, isRead: true }))
        );
    };

    // 알림 삭제
    const deleteNotification = (notificationId, event) => {
        event.stopPropagation(); // 클릭 이벤트 전파 방지
        setNotifications(prev => 
            prev.filter(notification => notification.id !== notificationId)
        );
    };

    // 알림 타입별 색상 클래스
    const getNotificationTypeClass = (type) => {
        switch (type) {
            case 'announcement':
                return 'notification-announcement';
            case 'assignment':
                return 'notification-assignment';
            case 'grade':
                return 'notification-grade';
            case 'academic':
                return 'notification-academic';
            case 'system':
                return 'notification-system';
            default:
                return 'notification-default';
        }
    };

    // 시간 포맷팅
    const formatTime = (timeStr) => {
        const time = new Date(timeStr);
        const now = new Date();
        const diffTime = now - time;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return '오늘';
        } else if (diffDays === 1) {
            return '어제';
        } else if (diffDays < 7) {
            return `${diffDays}일 전`;
        } else {
            return timeStr;
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>알림을 불러오는 중입니다...</p>
            </div>
        );
    }

    if (!studentData) {
        return (
            <div className="error-container">
                <p>학생 데이터를 불러올 수 없습니다. 다시 로그인해주세요.</p>
                <button onClick={() => navigate('/login')}>로그인 페이지로 이동</button>
            </div>
        );
    }

    const filteredNotifications = getFilteredNotifications();
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="student-dashboard">
            <Header username={userData?.name || '사용자'} role="학생" />
            
            <div className="dashboard-main">
                <Sidebar 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab}
                    studentName={userData?.name || ''}
                    studentId={userData?.studentId || ''}
                    department={userData?.department || ''}
                />
                
                <div className="dashboard-content">
                    <div className="welcome-banner">
                        <h2>알림</h2>
                        <p>새로운 알림 {unreadCount}개 / 전체 {notifications.length}개</p>
                    </div>
                    
                    <div className="notifications-container">
                        <div className="card main-notifications-card">
                            <div className="card-header notifications-card-header">
                                <h3>알림 목록</h3>
                                <div className="notifications-controls">
                                    <div className="filter-container">
                                        <select 
                                            value={filter} 
                                            onChange={(e) => setFilter(e.target.value)}
                                            className="filter-select"
                                        >
                                            <option value="all">전체 알림</option>
                                            <option value="unread">읽지 않음</option>
                                            <option value="read">읽음</option>
                                            <option value="important">중요</option>
                                        </select>
                                    </div>
                                    {unreadCount > 0 && (
                                        <button 
                                            className="btn btn-outline btn-sm"
                                            onClick={markAllAsRead}
                                        >
                                            모두 읽음
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="card-body notifications-list-card-body">
                                {filteredNotifications.length > 0 ? (
                                    <div className="notifications-list">
                                        {filteredNotifications.map(notification => (
                                            <div 
                                                key={notification.id} 
                                                className={`notification-item ${!notification.isRead ? 'unread' : ''} ${getNotificationTypeClass(notification.type)}`}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="notification-icon">
                                                    <i className={notification.icon}></i>
                                                    {notification.isImportant && (
                                                        <div className="important-badge">!</div>
                                                    )}
                                                </div>
                                                
                                                <div className="notification-content">
                                                    <div className="notification-header">
                                                        <h4 className="notification-title">
                                                            {notification.title}
                                                            {!notification.isRead && (
                                                                <span className="unread-dot"></span>
                                                            )}
                                                        </h4>
                                                        <div className="notification-time">
                                                            {formatTime(notification.time)}
                                                        </div>
                                                    </div>
                                                    <p className="notification-message">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                                
                                                <div className="notification-actions">
                                                    <button 
                                                        className="delete-button"
                                                        onClick={(e) => deleteNotification(notification.id, e)}
                                                        title="삭제"
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-notifications-message">
                                        <div className="empty-icon">
                                            <i className="fas fa-bell-slash"></i>
                                        </div>
                                        <p>
                                            {filter !== 'all' 
                                                ? '해당하는 알림이 없습니다.' 
                                                : '알림이 없습니다.'
                                            }
                                        </p>
                                        {filter !== 'all' && (
                                            <button 
                                                className="btn btn-outline btn-sm"
                                                onClick={() => setFilter('all')}
                                            >
                                                모든 알림 보기
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="sidebar-container">
                            <div className="card notification-stats-card">
                                <div className="card-header">
                                    <h3>알림 현황</h3>
                                </div>
                                <div className="card-body notifications-list-card-body">
                                    <div className="notification-statistics">
                                        <div className="stat-item">
                                            <div className="stat-icon">
                                                <i className="fas fa-bell"></i>
                                            </div>
                                            <div className="stat-info">
                                                <div className="stat-value">{notifications.length}</div>
                                                <div className="stat-label">전체 알림</div>
                                            </div>
                                        </div>
                                        
                                        <div className="stat-item">
                                            <div className="stat-icon unread">
                                                <i className="fas fa-envelope"></i>
                                            </div>
                                            <div className="stat-info">
                                                <div className="stat-value">{unreadCount}</div>
                                                <div className="stat-label">읽지 않음</div>
                                            </div>
                                        </div>
                                        
                                        <div className="stat-item">
                                            <div className="stat-icon important">
                                                <i className="fas fa-exclamation"></i>
                                            </div>
                                            <div className="stat-info">
                                                <div className="stat-value">
                                                    {notifications.filter(n => n.isImportant).length}
                                                </div>
                                                <div className="stat-label">중요 알림</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="card notification-types-card">
                                <div className="card-header">
                                    <h3>알림 유형</h3>
                                </div>
                                <div className="card-body notifications-list-card-body">
                                    <div className="notification-types-list">
                                        <div className="type-item">
                                            <div className="type-color notification-announcement"></div>
                                            <div className="type-info">
                                                <div className="type-name">공지사항</div>
                                                <div className="type-count">
                                                    {notifications.filter(n => n.type === 'announcement').length}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="type-item">
                                            <div className="type-color notification-assignment"></div>
                                            <div className="type-info">
                                                <div className="type-name">과제</div>
                                                <div className="type-count">
                                                    {notifications.filter(n => n.type === 'assignment').length}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="type-item">
                                            <div className="type-color notification-grade"></div>
                                            <div className="type-info">
                                                <div className="type-name">성적</div>
                                                <div className="type-count">
                                                    {notifications.filter(n => n.type === 'grade').length}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="type-item">
                                            <div className="type-color notification-academic"></div>
                                            <div className="type-info">
                                                <div className="type-name">학사일정</div>
                                                <div className="type-count">
                                                    {notifications.filter(n => n.type === 'academic').length}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="type-item">
                                            <div className="type-color notification-system"></div>
                                            <div className="type-info">
                                                <div className="type-name">시스템</div>
                                                <div className="type-count">
                                                    {notifications.filter(n => n.type === 'system').length}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;