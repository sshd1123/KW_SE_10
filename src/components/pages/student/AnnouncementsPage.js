import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import Sidebar from '../../dashboard/Sidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/AnnouncementsPage.css';

const AnnouncementsPage = () => {
    const [userData, setUserData] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [activeTab, setActiveTab] = useState('announcements'); // 제대로 정의
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // setActiveTab 함수를 올바르게 사용하는 핸들러 추가
    const handleMenuClick = (tabName) => {
        setActiveTab(tabName);
        // 추가 로직이 필요한 경우 여기에 작성
    };

    useEffect(() => {
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
        setLoading(false);
    }, [navigate]);

    // 나머지 함수들...
    const getFilteredAnnouncements = () => {
        if (!studentData || !studentData.announcements) return [];

        let filtered = [...studentData.announcements];

        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(announcement =>
                announcement.title.toLowerCase().includes(term) ||
                announcement.content.toLowerCase().includes(term) ||
                announcement.course.toLowerCase().includes(term)
            );
        }

        if (filter === 'course') {
            filtered = filtered.filter(announcement =>
                announcement.course !== '학사공지' && announcement.course !== '일반공지'
            );
        } else if (filter === 'admin') {
            filtered = filtered.filter(announcement =>
                announcement.course === '학사공지' || announcement.course === '일반공지'
            );
        }

        return filtered.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });
    };

    const getCategoryColorClass = (course) => {
        if (course === '학사공지') return 'ap-category-admin';
        if (course === '일반공지') return 'ap-category-general';
        return 'ap-category-course';
    };

    const handleAnnouncementClick = (id) => {
        navigate(`/student/announcement/${id}`);
    };

    const getCategoryCounts = () => {
        if (!studentData || !studentData.announcements) return {};

        const counts = {
            all: studentData.announcements.length,
            admin: 0,
            course: 0,
            courses: {}
        };

        studentData.announcements.forEach(announcement => {
            if (announcement.course === '학사공지' || announcement.course === '일반공지') {
                counts.admin++;
            } else {
                counts.course++;
                counts.courses[announcement.course] = (counts.courses[announcement.course] || 0) + 1;
            }
        });

        return counts;
    };

    const getRecentAnnouncements = () => {
        if (!studentData || !studentData.announcements) return [];
        return studentData.announcements
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
    };

    if (loading) {
        return (
            <div className="ap-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="ap-main-layout">
                    {/* setActiveTab 함수를 Sidebar에 전달 */}
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department || userData?.major}
                    />
                    <main className="ap-main-content">
                        <div className="ap-loading-container">
                            <div className="ap-loading-spinner"></div>
                            <p>공지사항을 불러오는 중입니다...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!studentData) {
        return (
            <div className="ap-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="ap-main-layout">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department || userData?.major}
                    />
                    <main className="ap-main-content">
                        <div className="ap-error-container">
                            <h2>학생 데이터를 불러올 수 없습니다. 다시 로그인해주세요.</h2>
                            <button className="ap-btn ap-btn-primary" onClick={() => navigate('/login')}>
                                로그인 페이지로 이동
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const filteredAnnouncements = getFilteredAnnouncements();
    const categoryCounts = getCategoryCounts();
    const recentAnnouncements = getRecentAnnouncements();

    return (
        <div className="ap-page">
            <Header
                username={userData?.name}
                role={userData?.role || '학생'}
            />
            <div className="ap-main-layout">
                {/* setActiveTab 함수를 Sidebar에 전달 */}
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    studentName={userData?.name}
                    studentId={userData?.studentId || userData?.id}
                    department={userData?.department || userData?.major}
                />
                <main className="ap-main-content">
                    <div className="ap-welcome-banner">
                        <h2>공지사항</h2>
                        <p>
                            {studentData.academic?.year || ''}학년 {studentData.academic?.semester || ''}학기 /
                            학번: {userData?.studentId || ''}
                        </p>
                    </div>

                    <div className="ap-announcements-container">
                        <div className="ap-main-section">
                            <div className="ap-card">
                                <div className="ap-card-header ap-announcement-card-header">
                                    <h3>공지사항 목록</h3>
                                    <div className="ap-announcement-controls">
                                        <div className="ap-search-container">
                                            <input
                                                type="text"
                                                className="ap-search-input"
                                                placeholder="공지사항 검색..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <i className="fas fa-search ap-announcement-search-icon"></i>
                                        </div>
                                        <div className="ap-filter-container">
                                            <select
                                                className="ap-filter-select"
                                                value={filter}
                                                onChange={(e) => setFilter(e.target.value)}
                                            >
                                                <option value="all">전체</option>
                                                <option value="admin">학사/일반공지</option>
                                                <option value="course">강의공지</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="ap-card-body ap-announcements-list-card-body">
                                    {filteredAnnouncements.length > 0 ? (
                                        <div className="ap-announcements-list">
                                            {filteredAnnouncements.map((announcement) => (
                                                <div
                                                    key={announcement.id}
                                                    className="ap-announcement-item"
                                                    onClick={() => handleAnnouncementClick(announcement.id)}
                                                >
                                                    <div className="ap-announcement-header">
                                                        <span className={`ap-announcement-category ${getCategoryColorClass(announcement.course)}`}>
                                                            {announcement.course}
                                                        </span>
                                                        <span className="ap-announcement-date">{announcement.date}</span>
                                                    </div>
                                                    <div className="ap-announcement-title">
                                                        {announcement.isNew && <span className="ap-new-badge">NEW</span>}
                                                        {announcement.title}
                                                    </div>
                                                    <div className="ap-announcement-preview">
                                                        {announcement.content.length > 100
                                                            ? `${announcement.content.substring(0, 100)}...`
                                                            : announcement.content}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="ap-empty-announcements-message">
                                            <div className="ap-empty-icon">
                                                <i className="fas fa-bullhorn"></i>
                                            </div>
                                            <p>
                                                {searchTerm
                                                    ? '검색 결과가 없습니다.'
                                                    : filter !== 'all'
                                                        ? '해당 카테고리의 공지사항이 없습니다.'
                                                        : '공지사항이 없습니다.'}
                                            </p>
                                            {(searchTerm || filter !== 'all') && (
                                                <button
                                                    className="ap-btn ap-btn-outline ap-btn-sm"
                                                    onClick={() => {
                                                        setSearchTerm('');
                                                        setFilter('all');
                                                    }}
                                                >
                                                    전체 공지사항 보기
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AnnouncementsPage;
