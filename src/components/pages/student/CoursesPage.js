import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import Sidebar from '../../dashboard/Sidebar';
import CourseCard from '../../dashboard/CourseCard';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/CoursesPage.css';

const CoursesPage = () => {
    const [userData, setUserData] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [activeTab, setActiveTab] = useState('courses');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [scrollPosition, setScrollPosition] = useState(0);
    const navigate = useNavigate();

    const handleScrollLeft = () => {
        const container = document.querySelector('.cp-courses-grid');
        if (container) {
            container.scrollLeft -= 340;
            setScrollPosition(container.scrollLeft - 340);
        }
    };

    const handleScrollRight = () => {
        const container = document.querySelector('.cp-courses-grid');
        if (container) {
            container.scrollLeft += 340;
            setScrollPosition(container.scrollLeft + 340);
        }
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

    useEffect(() => {
        const container = document.querySelector('.cp-courses-grid');
        if (container) {
            const handleScroll = () => {
                setScrollPosition(container.scrollLeft);
            };
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [studentData]);

    const getFilteredCourses = () => {
        if (!studentData || !studentData.courses) return [];

        let filtered = [...studentData.courses];

        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(course =>
                course.name.toLowerCase().includes(term) ||
                course.professor.toLowerCase().includes(term) ||
                course.code?.toLowerCase().includes(term)
            );
        }

        if (filter !== 'all') {
            if (filter === 'major') {
                filtered = filtered.filter(course => course.type?.includes('전공'));
            } else if (filter === 'liberal') {
                filtered = filtered.filter(course => course.type === '교양필수' || course.type === '교양선택');
            }
        }

        filtered.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'professor') return a.professor.localeCompare(b.professor);
            if (sortBy === 'day') {
                const dayOrder = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 7 };
                const aDayMatch = a.time?.match(/([월화수목금토일])/);
                const bDayMatch = b.time?.match(/([월화수목금토일])/);
                const aDay = aDayMatch ? dayOrder[aDayMatch[1]] : 8;
                const bDay = bDayMatch ? dayOrder[bDayMatch[1]] : 8;
                return aDay - bDay;
            }
            return 0;
        });

        return filtered;
    };

    const getUpcomingDeadlines = () => {
        if (!studentData || !studentData.assignments) return [];

        const today = new Date();
        return studentData.assignments
            .filter(assignment => {
                const deadlineDate = new Date(assignment.deadline);
                const diffTime = deadlineDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 7;
            })
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 6);
    };

    const getDeadlineStatus = (deadline) => {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'cp-deadline-expired';
        if (diffDays === 0) return 'cp-deadline-today';
        if (diffDays <= 3) return 'cp-deadline-urgent';
        return 'cp-deadline-normal';
    };

    const formatDeadline = (deadline) => {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `마감됨 (${deadline})`;
        if (diffDays === 0) return `오늘 마감 (${deadline})`;
        if (diffDays === 1) return `내일 마감 (${deadline})`;
        return `${diffDays}일 남음 (${deadline})`;
    };

    if (loading) {
        return (
            <div className="cp-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="cp-main-layout">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department || userData?.major}
                    />
                    <main className="cp-main-content">
                        <div className="cp-loading-container">
                            <div className="cp-loading-spinner"></div>
                            <p>강의 정보를 불러오는 중입니다...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!studentData) {
        return (
            <div className="cp-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="cp-main-layout">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department || userData?.major}
                    />
                    <main className="cp-main-content">
                        <div className="cp-error-container">
                            <h2>학생 데이터를 불러올 수 없습니다. 다시 로그인해주세요.</h2>
                            <button className="cp-btn cp-btn-primary" onClick={() => navigate('/login')}>
                                로그인 페이지로 이동
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const filteredCourses = getFilteredCourses();
    const upcomingDeadlines = getUpcomingDeadlines();
    const totalCredits = studentData.courses?.reduce((sum, course) => sum + (course.credits || 0), 0) || 0;
    const majorCourses = studentData.courses?.filter(course => course.type?.includes('전공')).length || 0;
    const liberalCourses = studentData.courses?.filter(course => course.type === '교양필수' || course.type === '교양선택').length || 0;

    return (
        <div className="cp-page">
            <Header
                username={userData?.name}
                role={userData?.role || '학생'}
            />
            <div className="cp-main-layout">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    studentName={userData?.name}
                    studentId={userData?.studentId || userData?.id}
                    department={userData?.department || userData?.major}
                />
                <main className="cp-main-content">
                    <div className="cp-welcome-banner">
                        <h2>내 강의실</h2>
                        <p>
                            {studentData.academic?.year || ''}학년 {studentData.academic?.semester || ''}학기 /
                            총 {filteredCourses.length}개 강의 수강중
                        </p>
                    </div>

                    <div className="cp-courses-container">
                        <div className="cp-top-row">
                            <div className="cp-course-list-container">
                                <div className="cp-card">
                                    <div className="cp-card-header cp-course-card-header">
                                        <h3>내 강의 목록</h3>
                                        <div className="cp-course-controls">
                                            <div className="cp-course-search">
                                                <input
                                                    type="text"
                                                    className="cp-search-input"
                                                    placeholder="강의명, 교수명으로 검색..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                                <i className="fas fa-search cp-course-search-icon"></i>
                                            </div>
                                            <div className="cp-course-filters">
                                                <select
                                                    className="cp-filter-select"
                                                    value={filter}
                                                    onChange={(e) => setFilter(e.target.value)}
                                                >
                                                    <option value="all">전체</option>
                                                    <option value="major">전공</option>
                                                    <option value="liberal">교양</option>
                                                </select>
                                                <select
                                                    className="cp-sort-select"
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value)}
                                                >
                                                    <option value="name">강의명순</option>
                                                    <option value="professor">교수명순</option>
                                                    <option value="day">요일순</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="cp-card-body cp-courses-card-body">
                                        {filteredCourses.length > 0 ? (
                                            <div className="cp-courses-grid-wrapper">
                                                <button
                                                    className="cp-scroll-button cp-prev"
                                                    onClick={handleScrollLeft}
                                                    disabled={scrollPosition <= 0}
                                                >
                                                    <i className="fas fa-chevron-left"></i>
                                                </button>
                                                <div className="cp-courses-grid">
                                                    {filteredCourses.map((course) => (
                                                        <CourseCard key={course.id} course={course} />
                                                    ))}
                                                </div>
                                                <button
                                                    className="cp-scroll-button cp-next"
                                                    onClick={handleScrollRight}
                                                >
                                                    <i className="fas fa-chevron-right"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="cp-empty-message">
                                                검색 조건에 맞는 강의가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="cp-course-stats-container">
                                <div className="cp-card">
                                    <div className="cp-card-header">
                                        <h3>강의 통계</h3>
                                    </div>
                                    <div className="cp-card-body cp-status-card-body">
                                        <div className="cp-stats-circular-container">
                                            <div className="cp-stats-circular-item">
                                                <div className="cp-stats-label">총 학점</div>
                                                <div className="cp-circular-progress-container">
                                                    <div
                                                        className="cp-circular-progress"
                                                        style={{
                                                            background: `conic-gradient(var(--cp-primary-color) 0deg ${(totalCredits / 21) * 360}deg, #e9ecef ${(totalCredits / 21) * 360}deg 360deg)`
                                                        }}
                                                    >
                                                        <div className="cp-circular-progress-inner">
                                                            <div className="cp-progress-value">{totalCredits}</div>
                                                            <div className="cp-progress-unit">학점</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="cp-stats-item">
                                            <div className="cp-stats-label">전공 강의</div>
                                            <div className="cp-stats-bar">
                                                <div
                                                    className="cp-progress-bar"
                                                    style={{ width: `${(majorCourses / filteredCourses.length) * 100}%` }}
                                                ></div>
                                            </div>
                                            <div className="cp-stats-value">{majorCourses}</div>
                                        </div>
                                        <div className="cp-stats-item">
                                            <div className="cp-stats-label">교양 강의</div>
                                            <div className="cp-stats-bar">
                                                <div
                                                    className="cp-progress-bar"
                                                    style={{ width: `${(liberalCourses / filteredCourses.length) * 100}%` }}
                                                ></div>
                                            </div>
                                            <div className="cp-stats-value">{liberalCourses}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="cp-bottom-row">
                            <div className="cp-card">
                                <div className="cp-card-header">
                                    <h3>다가오는 마감일</h3>
                                </div>
                                <div className="cp-card-body cp-deadline-card-body">
                                    {upcomingDeadlines.length > 0 ? (
                                        <div className="cp-deadline-cards">
                                            {upcomingDeadlines.map((assignment) => (
                                                <div
                                                    key={assignment.id}
                                                    className={`cp-deadline-card ${getDeadlineStatus(assignment.deadline)}`}
                                                    onClick={() => navigate(`/student/assignment/submit/${assignment.id}`)}
                                                >
                                                    <div className="cp-deadline-header">
                                                        <div className="cp-deadline-course">{assignment.course}</div>
                                                        <div className="cp-deadline-date">
                                                            <i className="fas fa-clock"></i>
                                                            {formatDeadline(assignment.deadline)}
                                                        </div>
                                                    </div>
                                                    <div className="cp-deadline-content">
                                                        <h4 className="cp-deadline-title">{assignment.title}</h4>
                                                        <p className="cp-deadline-description">{assignment.description}</p>
                                                    </div>
                                                    <div className="cp-deadline-footer">
                                                        <span className={`cp-deadline-status ${assignment.status === '완료' ? 'completed' : assignment.status === '지연' ? 'late' : ''}`}>
                                                            {assignment.status}
                                                        </span>
                                                        <button className="cp-btn-outline cp-btn-sm">
                                                            과제 제출
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="cp-empty-message">
                                            다가오는 마감일이 없습니다.
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

export default CoursesPage;
