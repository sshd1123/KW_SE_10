import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import '../../styles/ProfessorDashboard.css';
import TimeTable from '../../dashboard/TimeTable';

import { getDashboardData, getCurrentUser } from '../../../data/authUtils';

const ProfessorDashboard = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [professorData, setProfessorData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        // 현재 사용자 정보
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }

        // 대시보드 데이터 로드
        const dashboardData = getDashboardData();
        if (!dashboardData) {
            navigate('/professor/dashboard');
            return;
        }

        // 사용자 역할에 따라 데이터 처리
        let processedData;
        if (user.role === 'professor' || user.role === '교수') {
            // 교수용 데이터 처리
            processedData = {
                ...dashboardData,
                user: user,
                // 교수 데이터가 없으면 기본 구조 생성
                courses: dashboardData.courses || [],
                students: dashboardData.students || [],
                announcements: dashboardData.announcements || [],
                assignments: dashboardData.assignments || [],
                materials: dashboardData.materials || []
            };
        } else {
            // 기본 처리
            processedData = {
                ...dashboardData,
                user: user
            };
        }

        // 마감일이 지난 과제 상태 업데이트
        if (processedData.assignments) {
            const updatedAssignments = processedData.assignments.map(assignment => {
                const today = new Date();
                const deadlineDate = new Date(assignment.deadline);

                if (deadlineDate < today) {
                    return {
                        ...assignment,
                        status: '마감'
                    };
                }
                return assignment;
            });

            processedData = {
                ...processedData,
                assignments: updatedAssignments
            };
        }

        setUserData(user);
        setProfessorData(processedData);
        setLoading(false);

        // 디버깅 로그
        if (process.env.NODE_ENV === 'development') {
            console.log('교수 대시보드 데이터 로딩:', {
                user,
                dashboardData,
                processedData,
                courses: processedData.courses
            });
        }
    }, [navigate]);

    // 최근 공지사항 가져오기
    const getRecentAnnouncements = () => {
        if (!professorData?.announcements) return [];
        return professorData.announcements
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);
    };

    // 다가오는 과제 마감일 가져오기
    const getUpcomingAssignments = () => {
        if (!professorData?.assignments) return [];
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
        if (!professorData?.students) return { total: 0, graded: 0, pending: 0 };
        
        const total = professorData.students.length;
        const graded = professorData.students.filter(student => 
            student.final !== null && student.final !== undefined
        ).length;
        const pending = total - graded;
        
        return { total, graded, pending };
    };

    // 강의 통계 계산
    const getCourseStats = () => {
        if (!professorData?.courses) return { totalCourses: 0, totalStudents: 0, totalCredits: 0 };
        
        const totalCourses = professorData.courses.length;
        const totalStudents = professorData.courses.reduce((sum, course) => sum + (course.enrolled || 0), 0);
        const totalCredits = professorData.courses.reduce((sum, course) => sum + (course.credits || 0), 0);
        
        return { totalCourses, totalStudents, totalCredits };
    };

    // 로딩 상태
    if (loading) {
        return (
            <div className="professor-dashboard">
                <Header username={userData?.name} role="교수" />
                <div className="dashboard-main">
                    <ProfessorSidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        professorName={userData?.name}
                        professorId={userData?.professorId || userData?.id}
                        department={userData?.department}
                    />
                    <div className="dashboard-content">
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>데이터를 불러오는 중입니다...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 데이터 없음
    if (!professorData) {
        return (
            <div className="professor-dashboard">
                <Header username={userData?.name} role="교수" />
                <div className="dashboard-main">
                    <ProfessorSidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        professorName={userData?.name}
                        professorId={userData?.professorId || userData?.id}
                        department={userData?.department}
                    />
                    <div className="dashboard-content">
                        <div className="error-container">
                            <p>교수 데이터를 불러올 수 없습니다. 다시 로그인해주세요.</p>
                            <button onClick={() => navigate('/login')}>로그인 페이지로 이동</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const recentAnnouncements = getRecentAnnouncements();
    const upcomingAssignments = getUpcomingAssignments();
    const gradeStats = calculateGradeStats();
    const courseStats = getCourseStats();

    return (
        <div className="professor-dashboard">
            <Header username={userData?.name || professorData?.user?.name} role="교수" />

            <div className="dashboard-main">
                <ProfessorSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    professorName={userData?.name || professorData?.user?.name}
                    professorId={userData?.professorId || userData?.id}
                    department={userData?.department || professorData?.user?.department}
                />

                <div className="dashboard-content">
                    <div className="welcome-banner">
                        <h2>안녕하세요, {userData?.name || professorData?.user?.name}님!</h2>
                        <p>
                            {userData?.department || professorData?.user?.department} / 
                            사번: {userData?.professorId || userData?.id}
                        </p>
                    </div>

                    {activeTab === 'overview' && (
                        <>
                            <div className="dashboard-row">
                                <div className="dashboard-col">
                                    <div className="timetable-card">
                                        <div className="card-header">
                                            <h3>시간표</h3>
                                        </div>
                                        <div className="card-body">
                                            <div className="card-content">
                                                <TimeTable 
                                                    courses={professorData.courses || []} 
                                                    userRole="professor" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="dashboard-row">
                                {/* 통계 카드들 */}
                                <div className="stats-container">
                                    <div className="stat-card">
                                        <div className="stat-icon">
                                            <i className="fas fa-book"></i>
                                        </div>
                                        <div className="stat-info">
                                            <div className="stat-value">{courseStats.totalCourses}</div>
                                            <div className="stat-label">담당 강의</div>
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div className="stat-icon">
                                            <i className="fas fa-users"></i>
                                        </div>
                                        <div className="stat-info">
                                            <div className="stat-value">{courseStats.totalStudents}</div>
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfessorDashboard;