import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/ProfessorAssignmentsPage.css';

const ProfessorAssignmentsPage = () => {
    const [userData, setUserData] = useState(null);
    const [professorData, setProfessorData] = useState(null);
    const [activeTab, setActiveTab] = useState('assignments');
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('deadline');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'card'
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
        setLoading(false);
    }, [navigate]);

    // 과제 목록 필터링 및 정렬
    const getFilteredAssignments = () => {
        if (!professorData?.assignments) return [];

        let filteredAssignments = [...professorData.assignments];

        // 강의별 필터링
        if (selectedCourse !== 'all') {
            filteredAssignments = filteredAssignments.filter(assignment => assignment.courseId === selectedCourse);
        }

        // 상태별 필터링
        if (statusFilter !== 'all') {
            const today = new Date();
            filteredAssignments = filteredAssignments.filter(assignment => {
                const deadline = new Date(assignment.deadline);
                switch (statusFilter) {
                    case 'active':
                        return deadline >= today;
                    case 'expired':
                        return deadline < today;
                    case 'graded':
                        return assignment.graded || false;
                    case 'ungraded':
                        return !assignment.graded;
                    default:
                        return true;
                }
            });
        }

        // 검색어 필터링
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            filteredAssignments = filteredAssignments.filter(assignment =>
                assignment.title.toLowerCase().includes(term) ||
                assignment.description.toLowerCase().includes(term)
            );
        }

        // 정렬
        filteredAssignments.sort((a, b) => {
            switch (sortBy) {
                case 'deadline':
                    return new Date(a.deadline) - new Date(b.deadline);
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'submissions':
                    return b.submissions - a.submissions;
                case 'maxScore':
                    return b.maxScore - a.maxScore;
                default:
                    return 0;
            }
        });

        return filteredAssignments;
    };

    // 과제 상태 계산
    const getAssignmentStatus = (assignment) => {
        const today = new Date();
        const deadline = new Date(assignment.deadline);
        const daysUntilDeadline = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

        if (deadline < today) {
            return { status: 'expired', label: '마감됨', className: 'status-expired' };
        } else if (daysUntilDeadline <= 1) {
            return { status: 'urgent', label: '곧 마감', className: 'status-urgent' };
        } else if (daysUntilDeadline <= 7) {
            return { status: 'warning', label: '마감 임박', className: 'status-warning' };
        } else {
            return { status: 'active', label: '진행중', className: 'status-active' };
        }
    };

    // 제출률 계산
    const getSubmissionRate = (assignment) => {
        const courseStudents = professorData.students?.filter(s => s.courseId === assignment.courseId) || [];
        const totalStudents = courseStudents.length;
        return totalStudents > 0 ? Math.round((assignment.submissions / totalStudents) * 100) : 0;
    };

    // 과제 생성/수정 모달 열기
    const openCreateModal = (assignment = null) => {
        setSelectedAssignment(assignment);
        setShowCreateModal(true);
    };

    // 채점 모달 열기
    const openGradeModal = (assignment) => {
        setSelectedAssignment(assignment);
        setShowGradeModal(true);
    };

    // 과제 삭제
    const deleteAssignment = (assignmentId) => {
        if (window.confirm('정말로 이 과제를 삭제하시겠습니까?')) {
            alert('과제가 삭제되었습니다.');
        }
    };

    const handleAssignmentClick = (assignment) => {
        navigate(`/professor/assignment/${assignment.id}`);
    };

    // 통계 계산
    const getStatistics = () => {
        const assignments = getFilteredAssignments();
        const totalAssignments = assignments.length;
        const activeAssignments = assignments.filter(a => getAssignmentStatus(a).status === 'active').length;
        const expiredAssignments = assignments.filter(a => getAssignmentStatus(a).status === 'expired').length;
        const totalSubmissions = assignments.reduce((sum, a) => sum + a.submissions, 0);
        const avgSubmissionRate = totalAssignments > 0
            ? Math.round(assignments.reduce((sum, a) => sum + getSubmissionRate(a), 0) / totalAssignments)
            : 0;

        return {
            total: totalAssignments,
            active: activeAssignments,
            expired: expiredAssignments,
            totalSubmissions,
            avgSubmissionRate
        };
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>과제 정보를 불러오는 중입니다...</p>
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

    const filteredAssignments = getFilteredAssignments();
    const statistics = getStatistics();

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
                        <h2>과제 관리</h2>
                        <p>{professorData.personal?.department || ''} / 사번: {userData?.professorId}</p>
                    </div>

                    {/* 통계 카드 */}
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-tasks"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.total}</div>
                                <div className="stat-label">총 과제</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-play-circle"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.active}</div>
                                <div className="stat-label">진행중 과제</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-upload"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.totalSubmissions}</div>
                                <div className="stat-label">총 제출</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-percentage"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.avgSubmissionRate}%</div>
                                <div className="stat-label">평균 제출률</div>
                            </div>
                        </div>
                    </div>

                    {/* 과제 관리 메인 카드 */}
                    <div className="card assignments-management-card">
                        <div className="card-header">
                            <h3>과제 목록</h3>
                            <div className="header-actions">
                                <div className="view-toggle">
                                    <button
                                        className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <i className="fas fa-list"></i>
                                    </button>
                                    <button
                                        className={`btn btn-sm ${viewMode === 'card' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setViewMode('card')}
                                    >
                                        <i className="fas fa-th"></i>
                                    </button>
                                </div>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => openCreateModal()}
                                >
                                    <i className="fas fa-plus"></i> 새 과제 등록
                                </button>
                            </div>
                        </div>

                        {/* 필터 및 검색 영역 */}
                        <div className="assignments-filters">
                            <div className="filter-row">
                                <div className="filter-group">
                                    <label>강의 선택:</label>
                                    <select
                                        value={selectedCourse}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">전체 강의</option>
                                        {professorData.courses?.map(course => (
                                            <option key={course.id} value={course.id}>
                                                {course.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label>상태 필터:</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">전체</option>
                                        <option value="active">진행중</option>
                                        <option value="expired">마감됨</option>
                                        <option value="graded">채점 완료</option>
                                        <option value="ungraded">채점 대기</option>
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label>정렬 기준:</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="deadline">마감일순</option>
                                        <option value="title">제목순</option>
                                        <option value="submissions">제출순</option>
                                        <option value="maxScore">배점순</option>
                                    </select>
                                </div>

                                <div className="search-group">
                                    <div className="search-container">
                                        <input
                                            type="text"
                                            placeholder="과제 제목이나 내용으로 검색"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="search-input"
                                        />
                                        <i className="fas fa-search search-icon"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 과제 목록 */}
                        <div className="assignments-content">
                            {filteredAssignments.length > 0 ? (
                                viewMode === 'list' ? (
                                    <div className="assignments-table-container">
                                        <table className="assignments-table">
                                            <thead>
                                                <tr>
                                                    <th>과제명</th>
                                                    <th>강의</th>
                                                    <th>마감일</th>
                                                    <th>배점</th>
                                                    <th>제출률</th>
                                                    <th>상태</th>
                                                    <th>작업</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredAssignments.map((assignment, index) => {
                                                    const statusInfo = getAssignmentStatus(assignment);
                                                    const submissionRate = getSubmissionRate(assignment);
                                                    const courseName = professorData.courses?.find(c => c.id === assignment.courseId)?.name || '-';

                                                    return (
                                                        <tr key={index}>
                                                            <td className="assignment-title-cell">
                                                                <div className="assignment-title"
                                                                    onClick={() => handleAssignmentClick(assignment)}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    {assignment.title}
                                                                </div>
                                                                <div className="assignment-description">{assignment.description}</div>
                                                            </td>
                                                            <td className="course-name">{courseName}</td>
                                                            <td className="deadline-cell">
                                                                <div className="deadline-date">{assignment.deadline}</div>
                                                                <div className="deadline-time">
                                                                    {Math.ceil((new Date(assignment.deadline) - new Date()) / (1000 * 60 * 60 * 24))}일 남음
                                                                </div>
                                                            </td>
                                                            <td className="score-cell">{assignment.maxScore}점</td>
                                                            <td className="submission-cell">
                                                                <div className="submission-count">{assignment.submissions}명</div>
                                                                <div className="submission-rate">({submissionRate}%)</div>
                                                            </td>
                                                            <td className={statusInfo.className}>{statusInfo.label}</td>
                                                            <td>
                                                                <button className="btn btn-primary btn-sm">저장</button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    // 카드 뷰 등 다른 뷰가 있다면 여기에 추가
                                    null
                                )
                            ) : (
                                <div className="no-assignments-message">
                                    <p>등록된 과제가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfessorAssignmentsPage;