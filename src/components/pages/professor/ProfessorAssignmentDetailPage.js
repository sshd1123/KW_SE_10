import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/ProfessorAssignmentDetailPage.css';

const ProfessorAssignmentDetailPage = () => {
    const [userData, setUserData] = useState(null);
    const [professorData, setProfessorData] = useState(null);
    const [activeTab, setActiveTab] = useState('assignments');
    const [activeSection, setActiveSection] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [assignmentData, setAssignmentData] = useState(null);
    const [courseData, setCourseData] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [filterBy, setFilterBy] = useState('all');
    const navigate = useNavigate();
    const { assignmentId } = useParams();

    // 가상의 제출물 데이터
    const generateSubmissions = (assignment, courseStudents) => {
        const submissionData = [
            {
                id: 1,
                studentId: "2023123456",
                studentName: "홍길동",
                department: "소프트웨어학과",
                submittedAt: "2025-05-20 14:30:00",
                fileName: "GUI_Programming_Project.zip",
                fileSize: "2.5MB",
                status: "submitted",
                score: null,
                feedback: "",
                isLate: false,
                downloadCount: 0
            },
            {
                id: 2,
                studentId: "2022987654",
                studentName: "김철수",
                department: "경영학과",
                submittedAt: "2025-05-22 09:15:00",
                fileName: "Assignment1_Solution.pdf",
                fileSize: "1.8MB",
                status: "submitted",
                score: 25,
                feedback: "잘 작성되었습니다. 코드 주석이 명확해서 이해하기 쉬웠습니다.",
                isLate: false,
                downloadCount: 2
            },
            {
                id: 3,
                studentId: "2023111222",
                studentName: "이영희",
                department: "소프트웨어학과",
                submittedAt: "2025-05-24 23:45:00",
                fileName: "Project_Final.zip",
                fileSize: "3.2MB",
                status: "submitted",
                score: null,
                feedback: "",
                isLate: true,
                downloadCount: 0
            },
            {
                id: 4,
                studentId: "2023333444",
                studentName: "박민수",
                department: "소프트웨어학과",
                submittedAt: null,
                fileName: null,
                fileSize: null,
                status: "not_submitted",
                score: null,
                feedback: "",
                isLate: true,
                downloadCount: 0
            }
        ];

        return submissionData;
    };

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
        
        // URL에서 assignmentId로 해당 과제 찾기
        const assignment = dashboardData.assignments?.find(a => a.id === parseInt(assignmentId));
        if (!assignment) {
            navigate('/professor/assignments');
            return;
        }
        
        // 해당 과제의 강의 정보 찾기
        const course = dashboardData.courses?.find(c => c.id === assignment.courseId);
        const courseStudents = dashboardData.students?.filter(s => s.courseId === assignment.courseId) || [];
        
        setAssignmentData(assignment);
        setCourseData(course);
        setSubmissions(generateSubmissions(assignment, courseStudents));
        setLoading(false);
    }, [navigate, assignmentId]);

    const getAssignmentStatus = () => {
        if (!assignmentData) return null;
        
        const today = new Date();
        const deadline = new Date(assignmentData.deadline);
        const daysUntilDeadline = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

        if (deadline < today) {
            return { status: 'expired', label: '마감됨', className: 'status-expired', color: '#ef4444' };
        } else if (daysUntilDeadline <= 1) {
            return { status: 'urgent', label: '곧 마감', className: 'status-urgent', color: '#f59e0b' };
        } else if (daysUntilDeadline <= 7) {
            return { status: 'warning', label: '마감 임박', className: 'status-warning', color: '#f59e0b' };
        } else {
            return { status: 'active', label: '진행중', className: 'status-active', color: '#10b981' };
        }
    };

    const getSubmissionStats = () => {
        const totalStudents = courseData?.enrolled || 0;
        const submittedCount = submissions.filter(s => s.status === 'submitted').length;
        const gradedCount = submissions.filter(s => s.score !== null).length;
        const lateCount = submissions.filter(s => s.isLate).length;
        const averageScore = submissions.filter(s => s.score !== null).reduce((sum, s) => sum + s.score, 0) / gradedCount || 0;

        return {
            totalStudents,
            submittedCount,
            notSubmittedCount: totalStudents - submittedCount,
            gradedCount,
            notGradedCount: submittedCount - gradedCount,
            lateCount,
            submissionRate: totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0,
            averageScore: Math.round(averageScore * 10) / 10
        };
    };

    const getFilteredSubmissions = () => {
        let filtered = [...submissions];

        // 필터링
        switch (filterBy) {
            case 'submitted':
                filtered = filtered.filter(s => s.status === 'submitted');
                break;
            case 'not_submitted':
                filtered = filtered.filter(s => s.status === 'not_submitted');
                break;
            case 'graded':
                filtered = filtered.filter(s => s.score !== null);
                break;
            case 'not_graded':
                filtered = filtered.filter(s => s.status === 'submitted' && s.score === null);
                break;
            case 'late':
                filtered = filtered.filter(s => s.isLate);
                break;
            default:
                break;
        }

        // 정렬
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.studentName.localeCompare(b.studentName);
                case 'department':
                    return a.department.localeCompare(b.department);
                case 'submittedAt':
                    if (!a.submittedAt && !b.submittedAt) return 0;
                    if (!a.submittedAt) return 1;
                    if (!b.submittedAt) return -1;
                    return new Date(b.submittedAt) - new Date(a.submittedAt);
                case 'score':
                    if (a.score === null && b.score === null) return 0;
                    if (a.score === null) return 1;
                    if (b.score === null) return -1;
                    return b.score - a.score;
                default:
                    return 0;
            }
        });

        return filtered;
    };

    const openGradeModal = (submission) => {
        setSelectedSubmission(submission);
        setShowGradeModal(true);
    };

    const downloadSubmission = (submission) => {
        alert(`${submission.fileName} 다운로드를 시작합니다.`);
    };

    const downloadAllSubmissions = () => {
        const submittedFiles = submissions.filter(s => s.status === 'submitted');
        alert(`${submittedFiles.length}개의 제출물을 일괄 다운로드합니다.`);
    };

    const extendDeadline = () => {
        alert('마감일 연장 기능이 실행됩니다.');
    };

    const renderOverviewSection = () => {
        const status = getAssignmentStatus();
        const stats = getSubmissionStats();

        return (
            <div className="assignment-overview-section">
                {/* 과제 정보 배너 */}
                <div className="assignment-info-banner">
                    <div className="assignment-info-content">
                        <div className="assignment-title-section">
                            <h1>{assignmentData.title}</h1>
                            <span className={`assignment-status-badge ${status.className}`}>
                                {status.label}
                            </span>
                        </div>
                        <div className="assignment-basic-info">
                            <div className="info-grid">
                                <div className="info-item">
                                    <i className="fas fa-book"></i>
                                    <span>{courseData?.name}</span>
                                </div>
                                <div className="info-item">
                                    <i className="fas fa-calendar"></i>
                                    <span>마감: {new Date(assignmentData.deadline).toLocaleDateString()}</span>
                                </div>
                                <div className="info-item">
                                    <i className="fas fa-star"></i>
                                    <span>{assignmentData.maxScore}점</span>
                                </div>
                                <div className="info-item">
                                    <i className="fas fa-users"></i>
                                    <span>{stats.submittedCount}/{stats.totalStudents}명 제출</span>
                                </div>
                            </div>
                        </div>
                        <div className="assignment-description">
                            <p>{assignmentData.description}</p>
                        </div>
                    </div>
                    <div className="assignment-actions">
                        <button 
                            className="btn btn-secondary"
                            onClick={() => setShowEditModal(true)}
                        >
                            <i className="fas fa-edit"></i> 과제 수정
                        </button>
                        <button 
                            className="btn btn-warning"
                            onClick={extendDeadline}
                        >
                            <i className="fas fa-clock"></i> 마감일 연장
                        </button>
                        <button 
                            className="btn btn-primary"
                            onClick={downloadAllSubmissions}
                        >
                            <i className="fas fa-download"></i> 일괄 다운로드
                        </button>
                    </div>
                </div>

                {/* 통계 카드 */}
                <div className="stats-grid">
                    <div className="stat-card primary">
                        <div className="stat-icon">
                            <i className="fas fa-upload"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{stats.submittedCount}</h3>
                            <p>제출 완료</p>
                            <div className="stat-detail">
                                제출률: {stats.submissionRate}%
                            </div>
                        </div>
                    </div>

                    <div className="stat-card warning">
                        <div className="stat-icon">
                            <i className="fas fa-clock"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{stats.notSubmittedCount}</h3>
                            <p>미제출</p>
                            <div className="stat-detail">
                                지각 제출: {stats.lateCount}명
                            </div>
                        </div>
                    </div>

                    <div className="stat-card success">
                        <div className="stat-icon">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{stats.gradedCount}</h3>
                            <p>채점 완료</p>
                            <div className="stat-detail">
                                미채점: {stats.notGradedCount}개
                            </div>
                        </div>
                    </div>

                    <div className="stat-card info">
                        <div className="stat-icon">
                            <i className="fas fa-chart-line"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{stats.averageScore}</h3>
                            <p>평균 점수</p>
                            <div className="stat-detail">
                                만점: {assignmentData.maxScore}점
                            </div>
                        </div>
                    </div>
                </div>

                {/* 제출률 차트 */}
                <div className="submission-analysis">
                    <div className="analysis-card">
                        <div className="card-header">
                            <h3>제출 현황 분석</h3>
                        </div>
                        <div className="card-body">
                            <div className="submission-chart">
                                <div className="chart-item submitted">
                                    <div className="chart-bar">
                                        <div 
                                            className="chart-fill"
                                            style={{width: `${stats.submissionRate}%`}}
                                        ></div>
                                    </div>
                                    <span>제출 완료: {stats.submittedCount}명 ({stats.submissionRate}%)</span>
                                </div>
                                <div className="chart-item not-submitted">
                                    <div className="chart-bar">
                                        <div 
                                            className="chart-fill"
                                            style={{width: `${100 - stats.submissionRate}%`}}
                                        ></div>
                                    </div>
                                    <span>미제출: {stats.notSubmittedCount}명 ({100 - stats.submissionRate}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSubmissionsSection = () => {
        const filteredSubmissions = getFilteredSubmissions();

        return (
            <div className="submissions-management-section">
                <div className="section-header">
                    <h3>제출물 관리</h3>
                    <div className="section-actions">
                        <select 
                            value={filterBy} 
                            onChange={(e) => setFilterBy(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">전체</option>
                            <option value="submitted">제출 완료</option>
                            <option value="not_submitted">미제출</option>
                            <option value="graded">채점 완료</option>
                            <option value="not_graded">미채점</option>
                            <option value="late">지각 제출</option>
                        </select>
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="filter-select"
                        >
                            <option value="name">이름순</option>
                            <option value="department">학과순</option>
                            <option value="submittedAt">제출일순</option>
                            <option value="score">점수순</option>
                        </select>
                        <button 
                            className="btn btn-primary"
                            onClick={downloadAllSubmissions}
                        >
                            <i className="fas fa-download"></i> 일괄 다운로드
                        </button>
                    </div>
                </div>

                <div className="submissions-table-container">
                    <table className="submissions-table">
                        <thead>
                            <tr>
                                <th>학번</th>
                                <th>이름</th>
                                <th>학과</th>
                                <th>제출 상태</th>
                                <th>제출 시간</th>
                                <th>파일명</th>
                                <th>파일 크기</th>
                                <th>점수</th>
                                <th>액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubmissions.map(submission => (
                                <tr key={submission.id} className={submission.status === 'not_submitted' ? 'not-submitted-row' : ''}>
                                    <td>{submission.studentId}</td>
                                    <td className="student-name">{submission.studentName}</td>
                                    <td>{submission.department}</td>
                                    <td>
                                        <span className={`status-badge ${submission.status === 'submitted' ? 'submitted' : 'not-submitted'} ${submission.isLate ? 'late' : ''}`}>
                                            {submission.status === 'submitted' ? (submission.isLate ? '지각 제출' : '제출 완료') : '미제출'}
                                        </span>
                                    </td>
                                    <td className="submission-time">
                                        {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : '-'}
                                    </td>
                                    <td className="file-name">
                                        {submission.fileName ? (
                                            <span 
                                                className="file-link"
                                                onClick={() => downloadSubmission(submission)}
                                            >
                                                <i className="fas fa-file"></i>
                                                {submission.fileName}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td>{submission.fileSize || '-'}</td>
                                    <td>
                                        {submission.score !== null ? (
                                            <span className="score-display">
                                                {submission.score}/{assignmentData.maxScore}
                                            </span>
                                        ) : (
                                            submission.status === 'submitted' ? (
                                                <span className="not-graded">미채점</span>
                                            ) : '-'
                                        )}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {submission.status === 'submitted' && (
                                                <>
                                                    <button 
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => downloadSubmission(submission)}
                                                        title="다운로드"
                                                    >
                                                        <i className="fas fa-download"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => openGradeModal(submission)}
                                                        title="채점"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                </>
                                            )}
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

    const renderGradingSection = () => {
        const submittedSubmissions = submissions.filter(s => s.status === 'submitted');
        const gradedSubmissions = submittedSubmissions.filter(s => s.score !== null);
        const notGradedSubmissions = submittedSubmissions.filter(s => s.score === null);

        return (
            <div className="grading-management-section">
                <div className="section-header">
                    <h3>채점 관리</h3>
                    <div className="grading-stats">
                        <span className="grading-stat">
                            채점 완료: {gradedSubmissions.length}개
                        </span>
                        <span className="grading-stat">
                            미채점: {notGradedSubmissions.length}개
                        </span>
                    </div>
                </div>

                <div className="grading-content">
                    <div className="grading-queue">
                        <h4>채점 대기 목록</h4>
                        <div className="queue-list">
                            {notGradedSubmissions.map(submission => (
                                <div key={submission.id} className="queue-item">
                                    <div className="queue-info">
                                        <div className="student-info">
                                            <span className="student-name">{submission.studentName}</span>
                                            <span className="student-id">({submission.studentId})</span>
                                        </div>
                                        <div className="submission-info">
                                            <span className="file-name">{submission.fileName}</span>
                                            <span className="submission-date">
                                                {new Date(submission.submittedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="queue-actions">
                                        <button 
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => downloadSubmission(submission)}
                                        >
                                            <i className="fas fa-download"></i>
                                        </button>
                                        <button 
                                            className="btn btn-primary btn-sm"
                                            onClick={() => openGradeModal(submission)}
                                        >
                                            <i className="fas fa-edit"></i> 채점
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="graded-list">
                        <h4>채점 완료 목록</h4>
                        <div className="graded-items">
                            {gradedSubmissions.map(submission => (
                                <div key={submission.id} className="graded-item">
                                    <div className="graded-info">
                                        <div className="student-info">
                                            <span className="student-name">{submission.studentName}</span>
                                            <span className="score-badge">
                                                {submission.score}/{assignmentData.maxScore}
                                            </span>
                                        </div>
                                        <div className="feedback-preview">
                                            {submission.feedback && (
                                                <p>"{submission.feedback.substring(0, 50)}..."</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="graded-actions">
                                        <button 
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => openGradeModal(submission)}
                                        >
                                            <i className="fas fa-eye"></i> 보기
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>과제 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

    if (!assignmentData) {
        return (
            <div className="error-container">
                <p>과제를 찾을 수 없습니다.</p>
                <button onClick={() => navigate('/professor/assignments')}>
                    과제 목록으로 돌아가기
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
                        <span onClick={() => navigate('/professor/assignments')} className="breadcrumb-link">
                            과제 관리
                        </span>
                        <i className="fas fa-chevron-right"></i>
                        <span className="breadcrumb-current">{assignmentData.title}</span>
                    </div>

                    <div className="assignment-detail-container">
                        {/* 탭 네비게이션 */}
                        <div className="assignment-detail-tabs">
                            <button 
                                className={`tab-button ${activeSection === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveSection('overview')}
                            >
                                <i className="fas fa-chart-pie"></i> 개요
                            </button>
                            <button 
                                className={`tab-button ${activeSection === 'submissions' ? 'active' : ''}`}
                                onClick={() => setActiveSection('submissions')}
                            >
                                <i className="fas fa-upload"></i> 제출물
                            </button>
                            <button 
                                className={`tab-button ${activeSection === 'grading' ? 'active' : ''}`}
                                onClick={() => setActiveSection('grading')}
                            >
                                <i className="fas fa-edit"></i> 채점
                            </button>
                        </div>

                        {/* 탭 콘텐츠 */}
                        <div className="assignment-detail-content">
                            {activeSection === 'overview' && renderOverviewSection()}
                            {activeSection === 'submissions' && renderSubmissionsSection()}
                            {activeSection === 'grading' && renderGradingSection()}
                        </div>
                    </div>
                </div>
            </div>

            {/* 채점 모달 */}
            {showGradeModal && selectedSubmission && (
                <div className="modal-overlay" onClick={() => setShowGradeModal(false)}>
                    <div className="modal-content grade-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>채점 - {selectedSubmission.studentName}</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowGradeModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="grade-form">
                                <div className="submission-info">
                                    <p><strong>학생:</strong> {selectedSubmission.studentName} ({selectedSubmission.studentId})</p>
                                    <p><strong>제출 파일:</strong> {selectedSubmission.fileName}</p>
                                    <p><strong>제출 시간:</strong> {selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString() : '-'}</p>
                                    {selectedSubmission.isLate && (
                                        <p className="late-warning"><strong>지각 제출입니다.</strong></p>
                                    )}
                                </div>
                                
                                <div className="grade-input-section">
                                    <div className="input-group">
                                        <label>점수</label>
                                        <div className="score-input">
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max={assignmentData.maxScore}
                                                defaultValue={selectedSubmission.score}
                                                placeholder="점수 입력"
                                            />
                                            <span>/ {assignmentData.maxScore}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="input-group">
                                        <label>피드백</label>
                                        <textarea 
                                            rows="5"
                                            defaultValue={selectedSubmission.feedback}
                                            placeholder="학생에게 전달할 피드백을 입력하세요..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => downloadSubmission(selectedSubmission)}
                            >
                                <i className="fas fa-download"></i> 파일 다운로드
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={() => {
                                    alert('채점이 저장되었습니다.');
                                    setShowGradeModal(false);
                                }}
                            >
                                <i className="fas fa-save"></i> 저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default ProfessorAssignmentDetailPage;