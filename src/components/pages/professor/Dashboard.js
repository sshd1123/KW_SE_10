import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import '../../styles/ProfessorDashboard.css';

import { getDashboardData, getCurrentUser } from '../../../data/authUtils';

const ProfessorDashboard = () => {
    const navigate = useNavigate();
    const [professorData, setProfessorData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        // 현재 사용자 정보
        const user = getCurrentUser();

        // 대시보드 데이터 로드
        const dashboardData = getDashboardData();

        if (user && dashboardData) {
            // 마감일이 지난 과제 상태 업데이트
            const updatedAssignments = dashboardData.assignments.map(assignment => {
                const today = new Date();
                const deadlineDate = new Date(assignment.deadline);

                if (deadlineDate < today && assignment.submissions < assignment.maxSubmissions) {
                    return {
                        ...assignment,
                        status: '마감'
                    };
                }
                return assignment;
            });

            const updatedDashboardData = {
                ...dashboardData,
                assignments: updatedAssignments,
                user: user
            };

            setProfessorData(updatedDashboardData);
        } else {
            console.log("Failed to load data: user or dashboardData is null/undefined");
        }

        setLoading(false);
    }, []);

    // 최근 공지사항 가져오기
    const getRecentAnnouncements = () => {
        if (!professorData || !professorData.announcements) return [];

        return professorData.announcements
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);
    };

    // 다가오는 과제 마감일 가져오기
    const getUpcomingAssignments = () => {
        if (!professorData || !professorData.assignments) return [];

        const today = new Date();

        return professorData.assignments
            .filter(assignment => {
                const deadlineDate = new Date(assignment.deadline);
                return deadlineDate >= today;
            })
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 4);
    };

    // 학생 성적 통계 계산
    const calculateGradeStats = () => {
        if (!professorData || !professorData.students) return { total: 0, graded: 0, pending: 0 };

        const total = professorData.students.length;
        const graded = professorData.students.filter(student => student.final !== null).length;
        const pending = total - graded;

        return { total, graded, pending };
    };

    // 로딩 중 표시
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>데이터를 불러오는 중입니다...</p>
            </div>
        );
    }

    if (!professorData) {
        return (
            <div className="error-container">
                <p>교수 데이터를 불러올 수 없습니다. 다시 로그인해주세요.</p>
                <button onClick={() => navigate('/login')}>로그인 페이지로 이동</button>
            </div>
        );
    }

    const recentAnnouncements = getRecentAnnouncements();
    const upcomingAssignments = getUpcomingAssignments();
    const gradeStats = calculateGradeStats();

    return (
        <div className="professor-dashboard">
            <Header username={professorData.user.name || '교수님'} role="교수" />

            <div className="dashboard-main">
                <ProfessorSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    professorName={professorData.user ? professorData.user.name : ''}
                    professorId={professorData.user ? professorData.user.professorId : ''}
                    department={professorData.user ? professorData.user.department : ''}
                />

                <div className="dashboard-content">
                    <div className="welcome-banner">
                        <h2>안녕하세요, {professorData.user.name}님!</h2>
                        <p>{professorData.personal?.department || ''} / 사번: {professorData.user.professorId}</p>
                    </div>

                    {activeTab === 'overview' && (
                        <>
                            <div className="dashboard-row">
                                {/* 통계 카드들 */}
                                <div className="stats-container">
                                    <div className="stat-card">
                                        <div className="stat-icon">
                                            <i className="fas fa-book"></i>
                                        </div>
                                        <div className="stat-info">
                                            <div className="stat-value">{professorData.courses?.length || 0}</div>
                                            <div className="stat-label">담당 강의</div>
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div className="stat-icon">
                                            <i className="fas fa-users"></i>
                                        </div>
                                        <div className="stat-info">
                                            <div className="stat-value">{gradeStats.total}</div>
                                            <div className="stat-label">수강 학생</div>
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div className="stat-icon">
                                            <i className="fas fa-tasks"></i>
                                        </div>
                                        <div className="stat-info">
                                            <div className="stat-value">{professorData.assignments?.length || 0}</div>
                                            <div className="stat-label">등록 과제</div>
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div className="stat-icon">
                                            <i className="fas fa-clipboard-check"></i>
                                        </div>
                                        <div className="stat-info">
                                            <div className="stat-value">{gradeStats.pending}</div>
                                            <div className="stat-label">채점 대기</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="dashboard-row">
                                <div className="dashboard-col">
                                    <div className="card">
                                        <div className="card-header">
                                            <h3>담당 강의</h3>
                                        </div>
                                        <div className="card-body">
                                            <div className="card-content">
                                                <div className="courses-list">
                                                    {professorData.courses && professorData.courses.length > 0 ? (
                                                        professorData.courses.map((course, index) => (
                                                            <div key={index} className="course-item">
                                                                <div className="course-header">
                                                                    <h4 className="course-name">{course.name}</h4>
                                                                    <span className="course-code">{course.id}</span>
                                                                </div>
                                                                <div className="course-details">
                                                                    <p><i className="fas fa-clock"></i> {course.time}</p>
                                                                    <p><i className="fas fa-map-marker-alt"></i> {course.room}</p>
                                                                    <p><i className="fas fa-users"></i> {course.enrolled}/{course.capacity}명</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="empty-message">담당 강의가 없습니다.</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="card-footer">
                                                <button className="btn btn-outline btn-sm">
                                                    모든 강의 보기
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="dashboard-col">
                                    <div className="card">
                                        <div className="card-header">
                                            <h3>최근 공지사항</h3>
                                        </div>
                                        <div className="card-body">
                                            <div className="card-content">
                                                {recentAnnouncements.length > 0 ? (
                                                    recentAnnouncements.map((announcement, index) => (
                                                        <div key={index} className="announcement-item">
                                                            <div className="announcement-meta">
                                                                <span className="announcement-course">{announcement.courseId}</span>
                                                                <span className="announcement-date">{announcement.date}</span>
                                                            </div>
                                                            <h4 className="announcement-title">{announcement.title}</h4>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="empty-message">등록된 공지사항이 없습니다.</p>
                                                )}
                                            </div>
                                            <div className="card-footer">
                                                <button className="btn btn-outline btn-sm">
                                                    공지사항 관리
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="dashboard-row">
                                <div className="dashboard-col">
                                    <div className="card">
                                        <div className="card-header">
                                            <h3>과제 관리</h3>
                                        </div>
                                        <div className="card-body">
                                            <div className="card-content">
                                                {upcomingAssignments.length > 0 ? (
                                                    <div className="assignments-list">
                                                        {upcomingAssignments.map((assignment, index) => (
                                                            <div key={index} className="assignment-item">
                                                                <div className="assignment-info">
                                                                    <div className="assignment-course">{assignment.courseId}</div>
                                                                    <h4 className="assignment-title">{assignment.title}</h4>
                                                                    <div className="assignment-meta">
                                                                        <span><i className="far fa-calendar-alt"></i> 마감: {assignment.deadline}</span>
                                                                        <span><i className="fas fa-users"></i> 제출: {assignment.submissions}명</span>
                                                                    </div>
                                                                </div>
                                                                <div className="assignment-actions">
                                                                    <button className="btn btn-primary btn-sm">채점</button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="empty-message">등록된 과제가 없습니다.</p>
                                                )}
                                            </div>
                                            <div className="card-footer">
                                                <button className="btn btn-outline btn-sm">
                                                    과제 관리
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="dashboard-col">
                                    <div className="card">
                                        <div className="card-header">
                                            <h3>성적 관리</h3>
                                        </div>
                                        <div className="card-body">
                                            <div className="card-content">
                                                <div className="grade-summary">
                                                    <div className="grade-progress">
                                                        <div className="progress-info">
                                                            <div className="progress-label">채점 진행률</div>
                                                            <div className="progress-value">
                                                                {gradeStats.total > 0 ? Math.round((gradeStats.graded / gradeStats.total) * 100) : 0}%
                                                            </div>
                                                        </div>
                                                        <div className="progress-bar-container">
                                                            <div 
                                                                className="progress-bar" 
                                                                style={{ 
                                                                    width: `${gradeStats.total > 0 ? (gradeStats.graded / gradeStats.total) * 100 : 0}%` 
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grade-stats">
                                                        <div className="grade-stat-item">
                                                            <div className="grade-stat-value">{gradeStats.graded}</div>
                                                            <div className="grade-stat-label">채점 완료</div>
                                                        </div>
                                                        <div className="grade-stat-item">
                                                            <div className="grade-stat-value">{gradeStats.pending}</div>
                                                            <div className="grade-stat-label">채점 대기</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="card-footer">
                                                <button className="btn btn-primary btn-sm">
                                                    성적 입력
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'courses' && (
                        <div className="card">
                            <div className="card-header">
                                <h3>강의 관리</h3>
                            </div>
                            <div className="card-body">
                                <div className="card-content">
                                    <p>여기에 강의 관리 기능이 표시됩니다.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'grades' && (
                        <div className="card">
                            <div className="card-header">
                                <h3>성적 관리</h3>
                            </div>
                            <div className="card-body">
                                <div className="card-content">
                                    <p>여기에 성적 관리 기능이 표시됩니다.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'assignments' && (
                        <div className="card">
                            <div className="card-header">
                                <h3>과제 관리</h3>
                            </div>
                            <div className="card-body">
                                <div className="card-content">
                                    <p>여기에 과제 관리 기능이 표시됩니다.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'students' && (
                        <div className="card">
                            <div className="card-header">
                                <h3>학생 관리</h3>
                            </div>
                            <div className="card-body">
                                <div className="card-content">
                                    <p>여기에 학생 관리 기능이 표시됩니다.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="card">
                            <div className="card-header">
                                <h3>계정 설정</h3>
                            </div>
                            <div className="card-body">
                                <div className="card-content">
                                    <p>여기에 계정 설정 기능이 표시됩니다.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfessorDashboard;