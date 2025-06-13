import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import Sidebar from '../../dashboard/Sidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/AssignmentsPage.css';

const AssignmentsPage = () => {
    const [userData, setUserData] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [activeTab, setActiveTab] = useState('assignments');
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [sort, setSort] = useState('deadline');
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

        const updatedAssignments = dashboardData.assignments.map(assignment => {
            const today = new Date();
            const deadlineDate = new Date(assignment.deadline);

            if (deadlineDate < today && assignment.status !== '완료') {
                return { ...assignment, status: '마감' };
            }
            return assignment;
        });

        const updatedDashboardData = { ...dashboardData, assignments: updatedAssignments };
        setUserData(user);
        setStudentData(updatedDashboardData);
        setLoading(false);
    }, [navigate]);

    const getFilteredAssignments = () => {
        if (!studentData || !studentData.assignments) return [];

        let filtered = [...studentData.assignments];

        if (filter !== 'all') {
            filtered = filtered.filter(assignment => {
                if (filter === 'pending') return assignment.status === '진행중';
                if (filter === 'completed') return assignment.status === '완료';
                if (filter === 'late') return assignment.status === '지연';
                if (filter === 'expired') return assignment.status === '마감';
                return true;
            });
        }

        filtered.sort((a, b) => {
            if (sort === 'deadline') {
                return new Date(a.deadline) - new Date(b.deadline);
            } else if (sort === 'course') {
                return a.course.localeCompare(b.course);
            } else if (sort === 'status') {
                const statusOrder = { '마감': 0, '지연': 1, '진행중': 2, '완료': 3 };
                return statusOrder[a.status] - statusOrder[b.status];
            }
            return 0;
        });

        return filtered;
    };

    const getDaysRemaining = (deadline) => {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatDeadline = (deadline, daysRemaining) => {
        if (daysRemaining < 0) {
            return `마감됨 (${deadline})`;
        } else if (daysRemaining === 0) {
            return `오늘 마감 (${deadline})`;
        } else {
            return `${daysRemaining}일 남음 (${deadline})`;
        }
    };

    const getStatusClassName = (status) => {
        switch (status) {
            case '완료': return 'asgp-status-completed';
            case '지연': return 'asgp-status-late';
            case '마감': return 'asgp-status-expired';
            case '진행중': return 'asgp-status-in-progress';
            default: return 'asgp-status-pending';
        }
    };

    const getRemainingTimeClassName = (daysRemaining) => {
        if (daysRemaining < 0) return 'asgp-time-expired';
        if (daysRemaining === 0) return 'asgp-time-today';
        if (daysRemaining <= 3) return 'asgp-time-urgent';
        return 'asgp-time-normal';
    };

    const handleSubmitAssignment = (assignmentId) => {
        navigate(`/student/assignment/submit/${assignmentId}`);
    };

    const isSubmitDisabled = (status, daysRemaining) => {
        return status === '완료' || status === '마감' || daysRemaining < 0;
    };

    const getSubmitButtonText = (status, daysRemaining) => {
        if (status === '완료') return '제출 완료';
        if (status === '마감' || daysRemaining < 0) return '마감됨';
        return '과제 제출';
    };

    if (loading) {
        return (
            <div className="asgp-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="asgp-main-layout">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department || userData?.major}
                    />
                    <main className="asgp-main-content">
                        <div className="asgp-loading-container">
                            <div className="asgp-loading-spinner"></div>
                            <p>과제 정보를 불러오는 중입니다...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!studentData) {
        return (
            <div className="asgp-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="asgp-main-layout">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department || userData?.major}
                    />
                    <main className="asgp-main-content">
                        <div className="asgp-error-container">
                            <h2>학생 데이터를 불러올 수 없습니다. 다시 로그인해주세요.</h2>
                            <button className="asgp-btn asgp-btn-primary" onClick={() => navigate('/login')}>
                                로그인 페이지로 이동
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const filteredAssignments = getFilteredAssignments();
    const totalAssignments = studentData.assignments.length;
    const completedAssignments = studentData.assignments.filter(a => a.status === '완료').length;
    const progressPercentage = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

    const upcomingDeadlines = studentData.assignments
        .filter(assignment => {
            const daysRemaining = getDaysRemaining(assignment.deadline);
            return daysRemaining >= 0 && daysRemaining <= 7 && assignment.status !== '완료';
        })
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);

    return (
        <div className="asgp-page">
            <Header
                username={userData?.name}
                role={userData?.role || '학생'}
            />
            <div className="asgp-main-layout">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    studentName={userData?.name}
                    studentId={userData?.studentId || userData?.id}
                    department={userData?.department || userData?.major}
                />
                <main className="asgp-main-content">
                    <div className="asgp-welcome-banner">
                        <h2>과제 관리</h2>
                        <p>
                            {studentData.academic?.year || ''}학년 {studentData.academic?.semester || ''}학기 /
                            학번: {userData?.studentId || ''}
                        </p>
                    </div>

                    <div className="asgp-assignments-container">
                        <div className="asgp-main-section">
                            <div className="asgp-card">
                                <div className="asgp-card-header asgp-assignments-card-header">
                                    <h3>과제 목록</h3>
                                    <div className="asgp-assignments-controls">
                                        <div className="asgp-filter-container">
                                            <select
                                                className="asgp-filter-select"
                                                value={filter}
                                                onChange={(e) => setFilter(e.target.value)}
                                            >
                                                <option value="all">전체</option>
                                                <option value="pending">진행중</option>
                                                <option value="completed">완료</option>
                                                <option value="late">지연</option>
                                                <option value="expired">마감</option>
                                            </select>
                                            <select
                                                className="asgp-sort-select"
                                                value={sort}
                                                onChange={(e) => setSort(e.target.value)}
                                            >
                                                <option value="deadline">마감일순</option>
                                                <option value="course">과목순</option>
                                                <option value="status">상태순</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="asgp-card-body asgp-assignments-card-body">
                                    {filteredAssignments.length > 0 ? (
                                        <div className="asgp-assignments-list">
                                            <div className="asgp-assignments-list-header">
                                                <div className="asgp-assignment-column asgp-course-column">과목</div>
                                                <div className="asgp-assignment-column asgp-title-column">과제명</div>
                                                <div className="asgp-assignment-column asgp-deadline-column">마감일</div>
                                                <div className="asgp-assignment-column asgp-status-column">상태</div>
                                                <div className="asgp-assignment-column asgp-actions-column">작업</div>
                                            </div>
                                            {filteredAssignments.map((assignment) => {
                                                const daysRemaining = getDaysRemaining(assignment.deadline);
                                                return (
                                                    <div key={assignment.id} className="asgp-assignment-row">
                                                        <div className="asgp-assignment-column asgp-course-column">
                                                            <span className="asgp-course-code">{assignment.course}</span>
                                                        </div>
                                                        <div className="asgp-assignment-column asgp-title-column">
                                                            <div className="asgp-assignment-title">{assignment.title}</div>
                                                            <div className="asgp-assignment-description">{assignment.description}</div>
                                                        </div>
                                                        <div className="asgp-assignment-column asgp-deadline-column">
                                                            <div className={`asgp-deadline-text ${getRemainingTimeClassName(daysRemaining)}`}>
                                                                {formatDeadline(assignment.deadline, daysRemaining)}
                                                            </div>
                                                        </div>
                                                        <div className="asgp-assignment-column asgp-status-column">
                                                            <span className={`asgp-status-badge ${getStatusClassName(assignment.status)}`}>
                                                                {assignment.status}
                                                            </span>
                                                        </div>
                                                        <div className="asgp-assignment-column asgp-actions-column">
                                                            <button
                                                                className={`asgp-btn asgp-btn-primary asgp-btn-sm ${isSubmitDisabled(assignment.status, daysRemaining) ? 'asgp-btn-disabled' : ''}`}
                                                                onClick={() => handleSubmitAssignment(assignment.id)}
                                                                disabled={isSubmitDisabled(assignment.status, daysRemaining)}
                                                            >
                                                                {getSubmitButtonText(assignment.status, daysRemaining)}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="asgp-empty-assignments-message">
                                            <div className="asgp-empty-icon">
                                                <i className="fas fa-tasks"></i>
                                            </div>
                                            <p>현재 {filter !== 'all' ? '해당하는 ' : ''}과제가 없습니다.</p>
                                            {filter !== 'all' && (
                                                <button
                                                    className="asgp-btn asgp-btn-outline asgp-btn-sm"
                                                    onClick={() => setFilter('all')}
                                                >
                                                    전체 과제 보기
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="asgp-sidebar-container">
                            <div className="asgp-card asgp-assignments-summary-card">
                                <div className="asgp-card-header">
                                    <h3>과제 현황</h3>
                                </div>
                                <div className="asgp-card-body">
                                    <div className="asgp-assignments-statistics">
                                        <div className="asgp-stat-item">
                                            <div className="asgp-stat-value">{totalAssignments}</div>
                                            <div className="asgp-stat-label">전체 과제</div>
                                        </div>
                                        <div className="asgp-stat-item">
                                            <div className="asgp-stat-value">{completedAssignments}</div>
                                            <div className="asgp-stat-label">완료된 과제</div>
                                        </div>
                                        <div className="asgp-stat-item">
                                            <div className="asgp-stat-value">
                                                {studentData.assignments.filter(a => a.status === '진행중').length}
                                            </div>
                                            <div className="asgp-stat-label">진행중인 과제</div>
                                        </div>
                                        <div className="asgp-stat-item">
                                            <div className="asgp-stat-value">
                                                {studentData.assignments.filter(a => a.status === '마감').length}
                                            </div>
                                            <div className="asgp-stat-label">마감된 과제</div>
                                        </div>
                                    </div>

                                    <div className="asgp-assignments-progress">
                                        <div className="asgp-progress-label">전체 진행률</div>
                                        <div className="asgp-progress-bar-container">
                                            <div
                                                className="asgp-progress-bar"
                                                style={{ width: `${progressPercentage}%` }}
                                            ></div>
                                        </div>
                                        <div className="asgp-progress-value">{progressPercentage}%</div>
                                    </div>

                                    <div className="asgp-upcoming-deadlines">
                                        <h4>다가오는 마감일</h4>
                                        {upcomingDeadlines.length > 0 ? (
                                            upcomingDeadlines.map((assignment) => {
                                                const daysRemaining = getDaysRemaining(assignment.deadline);
                                                return (
                                                    <div key={assignment.id} className="asgp-deadline-item">
                                                        <div className="asgp-deadline-info">
                                                            <div className="asgp-deadline-course">{assignment.course}</div>
                                                            <div className="asgp-deadline-title">{assignment.title}</div>
                                                        </div>
                                                        <div className={`asgp-deadline-days ${getRemainingTimeClassName(daysRemaining)}`}>
                                                            {daysRemaining === 0 ? '오늘' : `${daysRemaining}일`}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="asgp-no-deadlines-message">
                                                다가오는 마감일이 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AssignmentsPage;
