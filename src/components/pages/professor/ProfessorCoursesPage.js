import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/ProfessorCoursesPage.css';

const ProfessorCoursesPage = () => {
    const [userData, setUserData] = useState(null);
    const [professorData, setProfessorData] = useState(null);
    const [activeTab, setActiveTab] = useState('courses');
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [activeSection, setActiveSection] = useState('overview');
    const [showNewCourseModal, setShowNewCourseModal] = useState(false);
    const [showEditCourseModal, setShowEditCourseModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }

        const dashboardData = getDashboardData();
        if (!dashboardData) {
            navigate('/professor/dashboard');
            return;
        }

        setUserData(user);
        setProfessorData(dashboardData);

        // 첫 번째 강의를 기본 선택
        if (dashboardData.courses && dashboardData.courses.length > 0) {
            setSelectedCourse(dashboardData.courses[0]);
        }

        setLoading(false);
    }, [navigate]);

    const handleCourseSelect = (course) => {
        setSelectedCourse(course);
        setActiveSection('overview');
    };

    const getStudentsForCourse = (courseId) => {
        if (!professorData.students) return [];
        return professorData.students.filter(student => student.courseId === courseId);
    };

    const getAssignmentsForCourse = (courseId) => {
        if (!professorData.assignments) return [];
        return professorData.assignments.filter(assignment => assignment.courseId === courseId);
    };

    const getAnnouncementsForCourse = (courseId) => {
        if (!professorData.announcements) return [];
        return professorData.announcements.filter(announcement => announcement.courseId === courseId);
    };

    const getMaterialsForCourse = (courseId) => {
        if (!professorData.materials) return [];
        return professorData.materials.filter(material => material.courseId === courseId);
    };

    const handleCourseDetailClick = (course) => {
        navigate(`/professor/course/${encodeURIComponent(course.id)}`);
    };

    const handleAssignmentClick = (assignment) => {
        navigate(`/professor/assignment/${assignment.id}`);
    };

    const renderCourseOverview = () => {
        if (!selectedCourse) return null;

        const students = getStudentsForCourse(selectedCourse.id);
        const assignments = getAssignmentsForCourse(selectedCourse.id);
        const announcements = getAnnouncementsForCourse(selectedCourse.id);
        const materials = getMaterialsForCourse(selectedCourse.id);

        return (
            <div className="course-overview">
                <div className="overview-stats">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-users"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{students.length}</h3>
                            <p>수강 학생</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-tasks"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{assignments.length}</h3>
                            <p>진행 중인 과제</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-bullhorn"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{announcements.length}</h3>
                            <p>공지사항</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-folder"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{materials.length}</h3>
                            <p>강의 자료</p>
                        </div>
                    </div>
                </div>

                <div className="overview-content">
                    <div className="overview-left">
                        <div className="card">
                            <div className="card-header">
                                <h3>최근 활동</h3>
                            </div>
                            <div className="pcourses-card-body">
                                <div className="recent-activity-list">
                                    <div className="recent-activity-item">
                                        <i className="fas fa-upload"></i>
                                        <div className="recent-activity-content">
                                            <p>새로운 강의 자료 업로드</p>
                                            <span className="recent-activity-time">2시간 전</span>
                                        </div>
                                    </div>
                                    <div className="recent-activity-item">
                                        <i className="fas fa-tasks"></i>
                                        <div className="recent-activity-content">
                                            <p>과제 제출 마감일 연장</p>
                                            <span className="recent-activity-time">1일 전</span>
                                        </div>
                                    </div>
                                    <div className="recent-activity-item">
                                        <i className="fas fa-bullhorn"></i>
                                        <div className="recent-activity-content">
                                            <p>새로운 공지사항 게시</p>
                                            <span className="recent-activity-time">3일 전</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overview-right">
                        <div className="card">
                            <div className="card-header">
                                <h3>강의 정보</h3>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setShowEditCourseModal(true)}
                                >
                                    <i className="fas fa-edit"></i> 수정
                                </button>
                            </div>
                            <div className="card-body">
                                <div className="course-info-grid">
                                    <div className="info-item">
                                        <label>강의실</label>
                                        <span>{selectedCourse.room}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>학점</label>
                                        <span>{selectedCourse.credits}학점</span>
                                    </div>
                                    <div className="info-item">
                                        <label>수강인원</label>
                                        <span>{selectedCourse.enrolled}/{selectedCourse.capacity}명</span>
                                    </div>
                                    <div className="info-item">
                                        <label>강의시간</label>
                                        <span>{selectedCourse.time}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3>수강률 현황</h3>
                            </div>
                            <div className="card-body">
                                <div className="enrollment-progress">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${(selectedCourse.enrolled / selectedCourse.capacity) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                                    <p>
                                        {selectedCourse.enrolled}명 / {selectedCourse.capacity}명
                                        ({Math.round((selectedCourse.enrolled / selectedCourse.capacity) * 100)}%)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStudentsList = () => {
        const students = getStudentsForCourse(selectedCourse.id);

        return (
            <div className="students-section">
                <div className="section-header">
                    <h3>수강 학생 목록</h3>
                    <div className="section-actions">
                        <button className="btn btn-secondary btn-sm">
                            <i className="fas fa-download"></i> 출석부 다운로드
                        </button>
                        <button className="btn btn-primary btn-sm">
                            <i className="fas fa-plus"></i> 학생 추가
                        </button>
                    </div>
                </div>

                <div className="students-table-container">
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>학번</th>
                                <th>이름</th>
                                <th>학과</th>
                                <th>출석률</th>
                                <th>중간고사</th>
                                <th>기말고사</th>
                                <th>액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id}>
                                    <td>{student.id}</td>
                                    <td className="student-name">{student.name}</td>
                                    <td>{student.department}</td>
                                    <td>
                                        <span className={`attendance-rate ${student.attendance >= 90 ? 'excellent' :
                                            student.attendance >= 80 ? 'good' : 'warning'
                                            }`}>
                                            {student.attendance}%
                                        </span>
                                    </td>
                                    <td>{student.midterm || '-'}</td>
                                    <td>{student.final || '-'}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn btn-sm btn-secondary">
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            <button className="btn btn-sm btn-primary">
                                                <i className="fas fa-edit"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderAssignmentsList = () => {
        const assignments = getAssignmentsForCourse(selectedCourse.id);

        return (
            <div className="assignments-section">
                <div className="section-header">
                    <h3>과제 관리</h3>
                    <button className="btn btn-primary btn-sm">
                        <i className="fas fa-plus"></i> 새 과제
                    </button>
                </div>

                <div className="assignments-grid">
                    {assignments.map(assignment => (
                        <div key={assignment.id} className="assignment-card">
                            <div className="assignment-header">
                                <h4
                                    onClick={() => handleAssignmentClick(assignment)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {assignment.title}
                                </h4>
                                <span className="assignment-score">{assignment.maxScore}점</span>
                            </div>
                            <p className="assignment-description">{assignment.description}</p>
                            <div className="assignment-info">
                                <div className="assignment-deadline">
                                    <i className="fas fa-calendar"></i>
                                    마감: {new Date(assignment.deadline).toLocaleDateString()}
                                </div>
                                <div className="assignment-submissions">
                                    <i className="fas fa-users"></i>
                                    제출: {assignment.submissions}명
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderAnnouncementsList = () => {
        const announcements = getAnnouncementsForCourse(selectedCourse.id);

        return (
            <div className="announcements-section">
                <div className="section-header">
                    <h3>공지사항</h3>
                    <button className="btn btn-primary btn-sm">
                        <i className="fas fa-plus"></i> 새 공지
                    </button>
                </div>

                <div className="announcements-list">
                    {announcements.map(announcement => (
                        <div key={announcement.id} className="announcement-item">
                            <div className="announcement-header">
                                <h4>{announcement.title}</h4>
                                <span className="announcement-date">
                                    {new Date(announcement.date).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="announcement-content">{announcement.content}</p>
                            <div className="announcement-actions">
                                <button className="btn btn-secondary btn-sm">
                                    <i className="fas fa-edit"></i> 수정
                                </button>
                                <button className="btn btn-danger btn-sm">
                                    <i className="fas fa-trash"></i> 삭제
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderCourseDetail = () => {
        if (!selectedCourse) {
            return (
                <div className="no-course-selected">
                    <i className="fas fa-book-open"></i>
                    <h3>강의를 선택해주세요</h3>
                    <p>왼쪽에서 관리할 강의를 선택하세요.</p>
                </div>
            );
        }

        return (
            <div className="course-detail">
                <div className="course-detail-header">
                    <div className="course-header-left">
                        <h1>{selectedCourse.name}</h1>
                        <p className="course-code">{selectedCourse.id}</p>
                        <div className="course-meta">
                            <span><i className="fas fa-calendar"></i> {selectedCourse.time}</span>
                            <span><i className="fas fa-map-marker-alt"></i> {selectedCourse.room}</span>
                            <span><i className="fas fa-users"></i> {selectedCourse.enrolled}/{selectedCourse.capacity}명</span>
                        </div>
                    </div>
                    <div className="course-header-right">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowEditCourseModal(true)}
                        >
                            <i className="fas fa-edit"></i> 강의 정보 수정
                        </button>
                    </div>
                </div>

                <div className="course-detail-nav">
                    <button
                        className={`nav-tab ${activeSection === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveSection('overview')}
                    >
                        <i className="fas fa-chart-pie"></i> 개요
                    </button>
                    <button
                        className={`nav-tab ${activeSection === 'students' ? 'active' : ''}`}
                        onClick={() => setActiveSection('students')}
                    >
                        <i className="fas fa-users"></i> 수강생
                    </button>
                    <button
                        className={`nav-tab ${activeSection === 'assignments' ? 'active' : ''}`}
                        onClick={() => setActiveSection('assignments')}
                    >
                        <i className="fas fa-tasks"></i> 과제
                    </button>
                    <button
                        className={`nav-tab ${activeSection === 'announcements' ? 'active' : ''}`}
                        onClick={() => setActiveSection('announcements')}
                    >
                        <i className="fas fa-bullhorn"></i> 공지사항
                    </button>
                </div>

                <div className="course-detail-content">
                    {activeSection === 'overview' && renderCourseOverview()}
                    {activeSection === 'students' && renderStudentsList()}
                    {activeSection === 'assignments' && renderAssignmentsList()}
                    {activeSection === 'announcements' && renderAnnouncementsList()}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>강의 정보를 불러오는 중입니다...</p>
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

    return (
        <div className="professor-dashboard">
            <Header username={userData?.name || '교수님'} role="교수" />

            <div className="dashboard-main">
                <ProfessorSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    professorName={userData?.name || ''}
                    professorId={userData?.professorId || ''}
                    department={userData?.department || ''}
                />

                <div className="dashboard-content">
                    <div className="welcome-banner">
                        <h2>강의 관리</h2>
                        <p>{professorData.personal?.department || ''} / 사번: {userData?.professorId}</p>
                    </div>

                    <div className="courses-management-container">
                        {/* 강의 목록 사이드바 */}
                        <div className="courses-sidebar">
                            <div className="card">
                                <div className="card-header">
                                    <h3>담당 강의</h3>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setShowNewCourseModal(true)}
                                    >
                                        <i className="fas fa-plus"></i> 새 강의
                                    </button>
                                </div>
                                <div className="courses-list-body">
                                    <div className="courses-list">
                                        {professorData.courses && professorData.courses.length > 0 ? (
                                            professorData.courses.map((course, index) => (
                                                <div
                                                    key={index}
                                                    className={`course-list-item ${selectedCourse?.id === course.id ? 'selected' : ''}`}
                                                    onClick={() => handleCourseSelect(course)}
                                                    onDoubleClick={() => handleCourseDetailClick(course)}
                                                >
                                                    <div className="course-list-header">
                                                        <h4 className="course-list-name">{course.name}</h4>
                                                        <span className="course-list-code">{course.id}</span>
                                                    </div>
                                                    <div className="course-list-info">
                                                        <span><i className="fas fa-users"></i> {course.enrolled}/{course.capacity}</span>
                                                        <span><i className="fas fa-credit-card"></i> {course.credits}학점</span>
                                                    </div>
                                                    <div className="course-list-time">
                                                        <i className="fas fa-clock"></i> {course.time}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-courses">
                                                <i className="fas fa-book"></i>
                                                <p>담당 강의가 없습니다.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 강의 상세 정보 */}
                        <div className="course-detail-section">
                            {renderCourseDetail()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfessorCoursesPage;