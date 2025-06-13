import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import Sidebar from '../../dashboard/Sidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/CourseDetailPage.css';

const CourseDetailPage = () => {
    const [activeCourseTab, setActiveCourseTab] = useState('공지');
    const [activeTab, setActiveTab] = useState('courses');
    const [courseData, setCourseData] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { courseId } = useParams();
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
        setStudentData(dashboardData);

        const course = dashboardData.courses.find(c => c.id === courseId);
        if (!course) {
            navigate('/student/dashboard');
            return;
        }

        const announcements = dashboardData.announcements.filter(a => a.course === course.name);
        const assignments = dashboardData.assignments.filter(a => a.course === course.name);
        const materials = course.materials || [];

        setCourseData({
            ...course,
            announcements,
            assignments,
            materials
        });
        setLoading(false);
    }, [courseId, navigate]);

    if (loading) {
        return (
            <div className="cdp-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="cdp-main-layout">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department || userData?.major}
                    />
                    <main className="cdp-main-content">
                        <div className="cdp-loading-container">
                            <div className="cdp-loading-spinner"></div>
                            <p>강의 정보를 불러오는 중입니다...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!courseData) {
        return (
            <div className="cdp-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="cdp-main-layout">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department || userData?.major}
                    />
                    <main className="cdp-main-content">
                        <div className="cdp-error-container">
                            <h2>강의 정보를 찾을 수 없습니다.</h2>
                            <button className="cdp-btn cdp-btn-primary" onClick={() => navigate('/student/dashboard')}>
                                대시보드로 돌아가기
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="cdp-page">
            <Header
                username={userData?.name}
                role={userData?.role || '학생'}
            />
            <div className="cdp-main-layout">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    studentName={userData?.name}
                    studentId={userData?.studentId || userData?.id}
                    department={userData?.department || userData?.major}
                />
                <main className="cdp-main-content">
                    <div className="cdp-welcome-banner cdp-course-banner">
                        <div className="cdp-course-banner-info">
                            <h2>{courseData.name}</h2>
                            <span className="cdp-course-code">{courseData.code || courseData.courseCode || courseData.id || '과목코드 없음'}</span>
                        </div>
                        <div className="cdp-course-banner-meta">
                            <p><strong>교수:</strong> {courseData.professor}</p>
                            <p><strong>시간:</strong> {courseData.time}</p>
                            <p><strong>강의실:</strong> {courseData.room}</p>
                            <p><strong>학점:</strong> {courseData.credits}학점</p>
                        </div>
                    </div>

                    <div className="cdp-course-content-container">
                        <div className="cdp-course-tabs">
                            <button
                                className={`cdp-course-tab ${activeCourseTab === '공지' ? 'active' : ''}`}
                                onClick={() => setActiveCourseTab('공지')}
                            >
                                공지사항
                            </button>
                            <button
                                className={`cdp-course-tab ${activeCourseTab === '자료' ? 'active' : ''}`}
                                onClick={() => setActiveCourseTab('자료')}
                            >
                                강의자료
                            </button>
                            <button
                                className={`cdp-course-tab ${activeCourseTab === '계획서' ? 'active' : ''}`}
                                onClick={() => setActiveCourseTab('계획서')}
                            >
                                강의계획서
                            </button>
                            <button
                                className={`cdp-course-tab ${activeCourseTab === '과제' ? 'active' : ''}`}
                                onClick={() => setActiveCourseTab('과제')}
                            >
                                과제
                            </button>
                            <button
                                className={`cdp-course-tab ${activeCourseTab === '출석' ? 'active' : ''}`}
                                onClick={() => setActiveCourseTab('출석')}
                            >
                                출석
                            </button>
                        </div>

                        <div className="cdp-card cdp-course-detail-card">
                            <div className="cdp-card-body cdp-course-detail-card-body">
                                {activeCourseTab === '공지' && (
                                    <div className="cdp-notices-section">
                                        {courseData.announcements.length > 0 ? (
                                            courseData.announcements.map((announcement) => (
                                                <div key={announcement.id} className="cdp-notice-item">
                                                    <div className="cdp-notice-date">{announcement.date}</div>
                                                    <h4 className="cdp-notice-title">
                                                        {announcement.isNew && <span className="cdp-new-badge">NEW</span>}
                                                        {announcement.title}
                                                    </h4>
                                                    <div className="cdp-notice-content">
                                                        {announcement.content}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="cdp-empty-message">
                                                등록된 공지사항이 없습니다.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeCourseTab === '자료' && (
                                    <div className="cdp-materials-section">
                                        {courseData.materials.length > 0 ? (
                                            courseData.materials.map((material, index) => (
                                                <div key={index} className="cdp-material-item">
                                                    <div className="cdp-material-left">
                                                        <i className="fas fa-file-pdf cdp-material-icon"></i>
                                                        <div>
                                                            <h4 className="cdp-material-title">{material.title}</h4>
                                                            <div className="cdp-material-meta">
                                                                <span className="cdp-material-date">{material.date}</span>
                                                                <span>{material.size}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button className="cdp-btn cdp-btn-outline cdp-btn-sm">
                                                        <i className="fas fa-download"></i>
                                                        다운로드
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="cdp-empty-message">
                                                등록된 강의자료가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeCourseTab === '계획서' && (
                                    <div className="cdp-syllabus-section">
                                        <div className="cdp-syllabus-section">
                                            <h3>강의 개요</h3>
                                            <p>본 강의는 학생들에게 {courseData.name}의 기본 개념과 원리를 소개합니다. 이론과 실습을 통해 학생들은 실제 문제 해결 능력을 키울 수 있습니다.</p>
                                        </div>

                                        <div className="cdp-syllabus-section">
                                            <h3>주차별 강의 계획</h3>
                                            <table className="cdp-syllabus-table">
                                                <thead>
                                                    <tr>
                                                        <th>주차</th>
                                                        <th>주제</th>
                                                        <th>내용</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td>1</td>
                                                        <td>강의 소개</td>
                                                        <td>강의 계획 및 평가 방법 소개</td>
                                                    </tr>
                                                    <tr>
                                                        <td>2</td>
                                                        <td>기본 개념</td>
                                                        <td>기본 이론 및 개념 학습</td>
                                                    </tr>
                                                    <tr>
                                                        <td>3-4</td>
                                                        <td>핵심 원리</td>
                                                        <td>주요 원리 및 방법론 학습</td>
                                                    </tr>
                                                    <tr>
                                                        <td>5-6</td>
                                                        <td>응용 사례</td>
                                                        <td>실제 응용 사례 분석</td>
                                                    </tr>
                                                    <tr>
                                                        <td>7</td>
                                                        <td>중간고사</td>
                                                        <td>중간 평가</td>
                                                    </tr>
                                                    <tr>
                                                        <td>8-10</td>
                                                        <td>심화 학습</td>
                                                        <td>고급 개념 및 기술 학습</td>
                                                    </tr>
                                                    <tr>
                                                        <td>11-13</td>
                                                        <td>프로젝트</td>
                                                        <td>팀 프로젝트 진행</td>
                                                    </tr>
                                                    <tr>
                                                        <td>14</td>
                                                        <td>프로젝트 발표</td>
                                                        <td>팀별 프로젝트 결과 발표</td>
                                                    </tr>
                                                    <tr>
                                                        <td>15</td>
                                                        <td>기말고사</td>
                                                        <td>최종 평가</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeCourseTab === '과제' && (
                                    <div className="cdp-assignments-section">
                                        {courseData.assignments.length > 0 ? (
                                            courseData.assignments.map((assignment) => (
                                                <div key={assignment.id} className="cdp-assignment-item">
                                                    <div className="cdp-assignment-header">
                                                        <h4 className="cdp-assignment-title">{assignment.title}</h4>
                                                        <span className="cdp-assignment-status">{assignment.status}</span>
                                                    </div>
                                                    <div className="cdp-assignment-content">
                                                        {assignment.description}
                                                    </div>
                                                    <div className="cdp-assignment-meta">
                                                        <span className="cdp-assignment-deadline">
                                                            <i className="fas fa-clock"></i>
                                                            마감일: {assignment.deadline}
                                                        </span>
                                                    </div>
                                                    <div className="cdp-assignment-actions">
                                                        <button className="cdp-btn cdp-btn-primary cdp-btn-sm">
                                                            과제 제출
                                                        </button>
                                                        <button className="cdp-btn cdp-btn-outline cdp-btn-sm">
                                                            상세 보기
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="cdp-empty-message">
                                                등록된 과제가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeCourseTab === '출석' && (
                                    <div className="cdp-attendance-section">
                                        <div className="cdp-attendance-summary">
                                            <div className="cdp-attendance-chart">
                                                <div className="cdp-attendance-circle" style={{
                                                    background: `conic-gradient(#28a745 0deg ${(12 / 15) * 360}deg, #ffc107 ${(12 / 15) * 360}deg ${(13 / 15) * 360}deg, #dc3545 ${(13 / 15) * 360}deg 360deg)`
                                                }}>
                                                    <div className="cdp-attendance-value">80%</div>
                                                </div>
                                            </div>
                                            <div className="cdp-attendance-stats">
                                                <div className="cdp-attendance-stat-item">
                                                    <div className="cdp-attendance-stat-label">출석</div>
                                                    <div className="cdp-attendance-stat-value">12</div>
                                                </div>
                                                <div className="cdp-attendance-stat-item">
                                                    <div className="cdp-attendance-stat-label">지각</div>
                                                    <div className="cdp-attendance-stat-value">1</div>
                                                </div>
                                                <div className="cdp-attendance-stat-item">
                                                    <div className="cdp-attendance-stat-label">결석</div>
                                                    <div className="cdp-attendance-stat-value">0</div>
                                                </div>
                                                <div className="cdp-attendance-stat-item">
                                                    <div className="cdp-attendance-stat-label">총 수업</div>
                                                    <div className="cdp-attendance-stat-value">15</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="cdp-attendance-table-container">
                                            <table className="cdp-attendance-table">
                                                <thead>
                                                    <tr>
                                                        <th>주차</th>
                                                        <th>날짜</th>
                                                        <th>출결 상태</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Array.from({ length: 15 }, (_, i) => (
                                                        <tr key={i}>
                                                            <td>{i + 1}주차</td>
                                                            <td>{`2025-03-${String(i + 4).padStart(2, '0')}`}</td>
                                                            <td>
                                                                <span className={`cdp-attendance-status ${i < 12 ? 'status-present' :
                                                                    i === 12 ? 'status-late' :
                                                                        'status-future'
                                                                    }`}>
                                                                    {i < 12 ? '출석' : i === 12 ? '지각' : '-'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CourseDetailPage;
