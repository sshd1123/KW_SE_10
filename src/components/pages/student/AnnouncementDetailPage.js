import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import Sidebar from '../../dashboard/Sidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/AnnouncementDetailPage.css';

const AnnouncementDetailPage = () => {
    const [userData, setUserData] = useState(null);
    const [announcement, setAnnouncement] = useState(null);
    const [relatedAnnouncements, setRelatedAnnouncements] = useState([]);
    const [activeTab, setActiveTab] = useState('announcements');
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const { announcementId } = useParams();
    const navigate = useNavigate();

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

        const foundAnnouncement = dashboardData.announcements.find(a => a.id === parseInt(announcementId));
        if (!foundAnnouncement) {
            navigate('/student/announcements');
            return;
        }

        setAnnouncement(foundAnnouncement);

        if (foundAnnouncement.course !== '학사공지' && foundAnnouncement.course !== '일반공지') {
            const foundCourse = dashboardData.courses.find(c => c.name === foundAnnouncement.course);
            if (foundCourse) {
                setCourse(foundCourse);
            }
        }

        const related = dashboardData.announcements
            .filter(a => a.course === foundAnnouncement.course && a.id !== foundAnnouncement.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
        setRelatedAnnouncements(related);
        setLoading(false);
    }, [announcementId, navigate]);

    const getCategoryColorClass = (course) => {
        if (course === '학사공지') return 'adp-category-admin';
        if (course === '일반공지') return 'adp-category-general';
        return 'adp-category-course';
    };

    const handleGoBack = () => {
        navigate('/student/announcements');
    };

    const handleRelatedClick = (id) => {
        navigate(`/student/announcement/${id}`);
    };

    const handleGoToCourse = () => {
        if (course) {
            navigate(`/student/course/${course.id}`);
        }
    };

    if (loading) {
        return (
            <div className="adp-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="adp-main-layout">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department || userData?.major}
                    />
                    <main className="adp-main-content">
                        <div className="adp-loading-container">
                            <div className="adp-loading-spinner"></div>
                            <p>공지사항을 불러오는 중입니다...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!announcement) {
        return (
            <div className="adp-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="adp-main-layout">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department || userData?.major}
                    />
                    <main className="adp-main-content">
                        <div className="adp-error-container">
                            <h2>공지사항을 찾을 수 없습니다.</h2>
                            <button className="adp-btn adp-btn-primary" onClick={handleGoBack}>
                                공지사항 목록으로 돌아가기
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="adp-page">
            <Header
                username={userData?.name}
                role={userData?.role || '학생'}
            />
            <div className="adp-main-layout">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    studentName={userData?.name}
                    studentId={userData?.studentId || userData?.id}
                    department={userData?.department || userData?.major}
                />
                <main className="adp-main-content">
                    <div className="adp-announcement-detail-container">
                        {/* 네비게이션 */}
                        <div className="adp-announcement-navigation">
                            <button className="adp-back-button" onClick={handleGoBack}>
                                <i className="fas fa-arrow-left"></i>
                                공지사항 목록으로 돌아가기
                            </button>
                        </div>

                        {/* 공지사항 상세 카드 */}
                        <div className="adp-announcement-detail-card">
                            <div className="adp-card-header">
                                <div className="adp-announcement-meta">
                                    <span className={`adp-announcement-category ${getCategoryColorClass(announcement.course)}`}>
                                        {announcement.course}
                                    </span>
                                    <div className="adp-announcement-date">
                                        <i className="fas fa-calendar-alt"></i>
                                        {announcement.date}
                                    </div>
                                </div>
                                <h2 className="adp-announcement-title">
                                    {announcement.isNew && <span className="adp-new-badge">NEW</span>}
                                    {announcement.title}
                                </h2>
                            </div>

                            <div className="adp-card-body adp-announcement-card-body">
                                <div className="adp-announcement-content">
                                    <p>{announcement.content}</p>
                                </div>

                                {/* 첨부파일 */}
                                {announcement.attachments && announcement.attachments.length > 0 && (
                                    <div className="adp-announcement-attachments">
                                        <h4>첨부파일</h4>
                                        <ul className="adp-attachments-list">
                                            {announcement.attachments.map((file, index) => (
                                                <li key={index} className="adp-attachment-item">
                                                    <i className="fas fa-file-alt"></i>
                                                    <a href={file.url} download={file.name}>
                                                        {file.name}
                                                    </a>
                                                    <span className="adp-file-size">{file.size}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="adp-card-footer">
                                <div className="adp-announcement-actions">
                                    {course && (
                                        <button className="adp-btn adp-btn-outline" onClick={handleGoToCourse}>
                                            <i className="fas fa-book"></i>
                                            강의 페이지로 이동
                                        </button>
                                    )}
                                    <button className="adp-btn adp-btn-primary" onClick={handleGoBack}>
                                        <i className="fas fa-list"></i>
                                        목록으로 돌아가기
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 관련 공지사항 */}
                        {relatedAnnouncements.length > 0 && (
                            <div className="adp-related-announcements-card">
                                <div className="adp-card-header">
                                    <h3>관련 공지사항</h3>
                                </div>
                                <div className="adp-related-announcements-list">
                                    {relatedAnnouncements.map((related) => (
                                        <div
                                            key={related.id}
                                            className="adp-related-announcement"
                                            onClick={() => handleRelatedClick(related.id)}
                                        >
                                            <div className="adp-related-title">
                                                {related.isNew && <span className="adp-mini-new-badge"></span>}
                                                {related.title}
                                            </div>
                                            <div className="adp-related-date">{related.date}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AnnouncementDetailPage;
