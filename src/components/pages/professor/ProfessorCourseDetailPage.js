import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/ProfessorCourseDetailPage.css';

const ProfessorCourseDetailPage = () => {
    const [userData, setUserData] = useState(null);
    const [professorData, setProfessorData] = useState(null);
    const [activeTab, setActiveTab] = useState('courses');
    const [activeSection, setActiveSection] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [courseData, setCourseData] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
    const [showAddAnnouncementModal, setShowAddAnnouncementModal] = useState(false);
    const navigate = useNavigate();
    const { courseId } = useParams();

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
        
        // URL에서 courseId로 해당 강의 찾기
        const course = dashboardData.courses?.find(c => c.id === decodeURIComponent(courseId));
        if (!course) {
            navigate('/professor/courses');
            return;
        }
        
        setCourseData(course);
        setLoading(false);
    }, [navigate, courseId]);

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

    const getAttendanceStats = (students) => {
        if (!students.length) return { excellent: 0, good: 0, warning: 0 };
        
        const stats = { excellent: 0, good: 0, warning: 0 };
        students.forEach(student => {
            if (student.attendance >= 90) stats.excellent++;
            else if (student.attendance >= 80) stats.good++;
            else stats.warning++;
        });
        
        return stats;
    };

    const getGradeDistribution = (students) => {
        if (!students.length) return {};
        
        const distribution = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
        students.forEach(student => {
            if (student.midterm) {
                const grade = student.midterm >= 90 ? 'A' : 
                             student.midterm >= 80 ? 'B' : 
                             student.midterm >= 70 ? 'C' : 
                             student.midterm >= 60 ? 'D' : 'F';
                distribution[grade]++;
            }
        });
        
        return distribution;
    };

    const renderOverviewSection = () => {
        if (!courseData) return null;

        const students = getStudentsForCourse(courseData.id);
        const assignments = getAssignmentsForCourse(courseData.id);
        const announcements = getAnnouncementsForCourse(courseData.id);
        const materials = getMaterialsForCourse(courseData.id);
        const attendanceStats = getAttendanceStats(students);
        const gradeDistribution = getGradeDistribution(students);

        return (
            <div className="course-overview-section">
                {/* 강의 기본 정보 */}
                <div className="course-info-banner">
                    <div className="course-info-content">
                        <div className="course-title-section">
                            <h1>{courseData.name}</h1>
                            <span className="course-code-badge">{courseData.id}</span>
                        </div>
                        <div className="course-basic-info">
                            <div className="info-grid">
                                <div className="info-item">
                                    <i className="fas fa-clock"></i>
                                    <span>{courseData.time}</span>
                                </div>
                                <div className="info-item">
                                    <i className="fas fa-map-marker-alt"></i>
                                    <span>{courseData.room}</span>
                                </div>
                                <div className="info-item">
                                    <i className="fas fa-credit-card"></i>
                                    <span>{courseData.credits}학점</span>
                                </div>
                                <div className="info-item">
                                    <i className="fas fa-users"></i>
                                    <span>{courseData.enrolled}/{courseData.capacity}명</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="course-actions">
                        <button 
                            className="btn btn-secondary"
                            onClick={() => setShowEditModal(true)}
                        >
                            <i className="fas fa-edit"></i> 강의 정보 수정
                        </button>
                        <button className="btn btn-primary">
                            <i className="fas fa-download"></i> 출석부 다운로드
                        </button>
                    </div>
                </div>

                {/* 통계 카드 */}
                <div className="stats-grid">
                    <div className="stat-card primary">
                        <div className="stat-icon">
                            <i className="fas fa-users"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{students.length}</h3>
                            <p>총 수강생</p>
                            <div className="stat-detail">
                                수강률: {Math.round((courseData.enrolled / courseData.capacity) * 100)}%
                            </div>
                        </div>
                    </div>

                    <div className="stat-card success">
                        <div className="stat-icon">
                            <i className="fas fa-tasks"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{assignments.length}</h3>
                            <p>등록된 과제</p>
                            <div className="stat-detail">
                                진행 중: {assignments.filter(a => new Date(a.deadline) > new Date()).length}개
                            </div>
                        </div>
                    </div>

                    <div className="stat-card warning">
                        <div className="stat-icon">
                            <i className="fas fa-bullhorn"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{announcements.length}</h3>
                            <p>공지사항</p>
                            <div className="stat-detail">
                                이번 주: {announcements.filter(a => {
                                    const diff = Math.ceil((new Date() - new Date(a.date)) / (1000 * 60 * 60 * 24));
                                    return diff <= 7;
                                }).length}개
                            </div>
                        </div>
                    </div>

                    <div className="stat-card info">
                        <div className="stat-icon">
                            <i className="fas fa-folder"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{materials.length}</h3>
                            <p>강의 자료</p>
                            <div className="stat-detail">
                                최근 업로드: {materials.length > 0 ? '3일 전' : '없음'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 상세 분석 */}
                <div className="analysis-grid">
                    <div className="analysis-card">
                        <div className="card-header">
                            <h3>출석률 분석</h3>
                        </div>
                        <div className="card-body">
                            <div className="attendance-chart">
                                <div className="attendance-item excellent">
                                    <div className="attendance-bar" style={{width: `${(attendanceStats.excellent / students.length) * 100}%`}}></div>
                                    <span>우수 (90% 이상): {attendanceStats.excellent}명</span>
                                </div>
                                <div className="attendance-item good">
                                    <div className="attendance-bar" style={{width: `${(attendanceStats.good / students.length) * 100}%`}}></div>
                                    <span>양호 (80-89%): {attendanceStats.good}명</span>
                                </div>
                                <div className="attendance-item warning">
                                    <div className="attendance-bar" style={{width: `${(attendanceStats.warning / students.length) * 100}%`}}></div>
                                    <span>주의 (80% 미만): {attendanceStats.warning}명</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="analysis-card">
                        <div className="card-header">
                            <h3>성적 분포</h3>
                        </div>
                        <div className="card-body">
                            <div className="grade-distribution">
                                {Object.entries(gradeDistribution).map(([grade, count]) => (
                                    <div key={grade} className="grade-item">
                                        <div className="grade-label">{grade}</div>
                                        <div className="grade-bar">
                                            <div 
                                                className="grade-fill" 
                                                style={{width: `${students.length > 0 ? (count / students.length) * 100 : 0}%`}}
                                            ></div>
                                        </div>
                                        <div className="grade-count">{count}명</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="analysis-card">
                        <div className="card-header">
                            <h3>최근 활동</h3>
                        </div>
                        <div className="card-body">
                            <div className="recent-activities">
                                <div className="activity-item">
                                    <i className="fas fa-upload"></i>
                                    <div>
                                        <span>새로운 강의 자료 업로드</span>
                                        <small>3시간 전</small>
                                    </div>
                                </div>
                                <div className="activity-item">
                                    <i className="fas fa-tasks"></i>
                                    <div>
                                        <span>과제 제출 마감일 연장</span>
                                        <small>1일 전</small>
                                    </div>
                                </div>
                                <div className="activity-item">
                                    <i className="fas fa-bullhorn"></i>
                                    <div>
                                        <span>새로운 공지사항 게시</span>
                                        <small>2일 전</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStudentsSection = () => {
        const students = getStudentsForCourse(courseData.id);
        
        return (
            <div className="students-management-section">
                <div className="section-header">
                    <h3>수강생 관리</h3>
                    <div className="section-actions">
                        <button 
                            className="btn btn-secondary"
                            onClick={() => setShowAddStudentModal(true)}
                        >
                            <i className="fas fa-user-plus"></i> 학생 추가
                        </button>
                        <button className="btn btn-primary">
                            <i className="fas fa-download"></i> 명단 다운로드
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
                                <th>총점</th>
                                <th>등급</th>
                                <th>액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => {
                                const total = (student.midterm || 0) + (student.final || 0);
                                const grade = total >= 90 ? 'A' : total >= 80 ? 'B' : total >= 70 ? 'C' : total >= 60 ? 'D' : 'F';
                                
                                return (
                                    <tr key={student.id}>
                                        <td>{student.id}</td>
                                        <td className="student-name">{student.name}</td>
                                        <td>{student.department}</td>
                                        <td>
                                            <span className={`attendance-badge ${
                                                student.attendance >= 90 ? 'excellent' : 
                                                student.attendance >= 80 ? 'good' : 'warning'
                                            }`}>
                                                {student.attendance}%
                                            </span>
                                        </td>
                                        <td>{student.midterm || '-'}</td>
                                        <td>{student.final || '-'}</td>
                                        <td className="total-score">{total}</td>
                                        <td>
                                            <span className={`grade-badge grade-${grade.toLowerCase()}`}>
                                                {grade}
                                            </span>
                                        </td>
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderAssignmentsSection = () => {
        const assignments = getAssignmentsForCourse(courseData.id);
        
        return (
            <div className="assignments-management-section">
                <div className="section-header">
                    <h3>과제 관리</h3>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowAddAssignmentModal(true)}
                    >
                        <i className="fas fa-plus"></i> 새 과제 등록
                    </button>
                </div>

                <div className="assignments-grid">
                    {assignments.map(assignment => (
                        <div key={assignment.id} className="assignment-card">
                            <div className="assignment-header">
                                <h4>{assignment.title}</h4>
                                <span className="assignment-score">{assignment.maxScore}점</span>
                            </div>
                            <p className="assignment-description">{assignment.description}</p>
                            
                            <div className="assignment-meta">
                                <div className="assignment-deadline">
                                    <i className="fas fa-calendar"></i>
                                    마감: {new Date(assignment.deadline).toLocaleDateString()}
                                </div>
                                <div className="assignment-submissions">
                                    <i className="fas fa-users"></i>
                                    제출: {assignment.submissions}명
                                </div>
                            </div>

                            <div className="assignment-progress">
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{width: `${(assignment.submissions / courseData.enrolled) * 100}%`}}
                                    ></div>
                                </div>
                                <span className="progress-text">
                                    {assignment.submissions}/{courseData.enrolled} 
                                    ({Math.round((assignment.submissions / courseData.enrolled) * 100)}%)
                                </span>
                            </div>

                            <div className="assignment-actions">
                                <button className="btn btn-secondary btn-sm">
                                    <i className="fas fa-eye"></i> 제출물 보기
                                </button>
                                <button className="btn btn-primary btn-sm">
                                    <i className="fas fa-edit"></i> 수정
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderAnnouncementsSection = () => {
        const announcements = getAnnouncementsForCourse(courseData.id);
        
        return (
            <div className="announcements-management-section">
                <div className="section-header">
                    <h3>공지사항 관리</h3>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowAddAnnouncementModal(true)}
                    >
                        <i className="fas fa-plus"></i> 새 공지 작성
                    </button>
                </div>

                <div className="announcements-list">
                    {announcements.map(announcement => (
                        <div key={announcement.id} className="announcement-card">
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

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>강의 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

    if (!courseData) {
        return (
            <div className="error-container">
                <p>강의를 찾을 수 없습니다.</p>
                <button onClick={() => navigate('/professor/courses')}>
                    강의 목록으로 돌아가기
                </button>
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
                    <div className="breadcrumb">
                        <span onClick={() => navigate('/professor/courses')} className="breadcrumb-link">
                            강의 관리
                        </span>
                        <i className="fas fa-chevron-right"></i>
                        <span className="breadcrumb-current">{courseData.name}</span>
                    </div>

                    <div className="course-detail-container">
                        {/* 탭 네비게이션 */}
                        <div className="course-detail-tabs">
                            <button 
                                className={`tab-button ${activeSection === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveSection('overview')}
                            >
                                <i className="fas fa-chart-pie"></i> 개요
                            </button>
                            <button 
                                className={`tab-button ${activeSection === 'students' ? 'active' : ''}`}
                                onClick={() => setActiveSection('students')}
                            >
                                <i className="fas fa-users"></i> 수강생
                            </button>
                            <button 
                                className={`tab-button ${activeSection === 'assignments' ? 'active' : ''}`}
                                onClick={() => setActiveSection('assignments')}
                            >
                                <i className="fas fa-tasks"></i> 과제
                            </button>
                            <button 
                                className={`tab-button ${activeSection === 'announcements' ? 'active' : ''}`}
                                onClick={() => setActiveSection('announcements')}
                            >
                                <i className="fas fa-bullhorn"></i> 공지사항
                            </button>
                        </div>

                        {/* 탭 콘텐츠 */}
                        <div className="course-detail-content">
                            {activeSection === 'overview' && renderOverviewSection()}
                            {activeSection === 'students' && renderStudentsSection()}
                            {activeSection === 'assignments' && renderAssignmentsSection()}
                            {activeSection === 'announcements' && renderAnnouncementsSection()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfessorCourseDetailPage;