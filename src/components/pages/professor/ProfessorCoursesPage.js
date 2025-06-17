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
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [scrollPosition, setScrollPosition] = useState(0);
    const navigate = useNavigate();

    const handleScrollLeft = () => {
        const container = document.querySelector('.pc-courses-grid');
        if (container) {
            container.scrollLeft -= 340;
            setScrollPosition(container.scrollLeft - 340);
        }
    };

    const handleScrollRight = () => {
        const container = document.querySelector('.pc-courses-grid');
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

    useEffect(() => {
        const container = document.querySelector('.pc-courses-grid');
        if (container) {
            const handleScroll = () => {
                setScrollPosition(container.scrollLeft);
            };
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [professorData]);

    const getFilteredCourses = () => {
        if (!professorData || !professorData.courses) return [];

        let filtered = [...professorData.courses];

        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(course =>
                course.name.toLowerCase().includes(term) ||
                course.id.toLowerCase().includes(term)
            );
        }

        if (filter !== 'all') {
            if (filter === 'active') {
                filtered = filtered.filter(course => course.status === 'active');
            } else if (filter === 'completed') {
                filtered = filtered.filter(course => course.status === 'completed');
            }
        }

        filtered.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'enrollment') return b.enrolled - a.enrolled;
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

    const getUpcomingDeadlines = () => {
        if (!professorData || !professorData.assignments) return [];

        const today = new Date();
        return professorData.assignments
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

        if (diffDays < 0) return 'pc-deadline-expired';
        if (diffDays === 0) return 'pc-deadline-today';
        if (diffDays <= 3) return 'pc-deadline-urgent';
        return 'pc-deadline-normal';
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

    const handleCourseDetailClick = (course) => {
        navigate(`/professor/course/${encodeURIComponent(course.id)}`);
    };

    const handleAssignmentClick = (assignment) => {
        navigate(`/professor/assignment/${assignment.id}`);
    };

    const ProfessorCourseCard = ({ course }) => {
        const formatSchedule = () => {
            if (Array.isArray(course.schedule) && course.schedule.length > 0) {
                return course.schedule
                    .map(s => `${s.day} ${s.startTime}-${s.endTime}`)
                    .join(', ');
            }
            return course.time || '시간 미정';
        };

        return (
            <div className="pc-course-card" onClick={() => handleCourseDetailClick(course)}>
                <div className="pc-course-card-header">
                    <span className="pc-course-id">{course.id}</span>
                    <span className="pc-course-credits">{course.credits}학점</span>
                </div>
                <h3 className="pc-course-name">{course.name}</h3>
                <div className="pc-course-details">
                    <p><i className="fas fa-users"></i> {course.enrolled}/{course.capacity}명</p>
                    <p><i className="fas fa-clock"></i> {formatSchedule()}</p>
                    <p><i className="fas fa-map-marker-alt"></i> {course.room}</p>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="pc-page">
                <Header username={userData?.name || '교수님'} role="교수" />
                <div className="pc-main-layout">
                    <ProfessorSidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        professorName={userData?.name || ''}
                        professorId={userData?.professorId || ''}
                        department={userData?.department || ''}
                    />
                    <main className="pc-main-content">
                        <div className="pc-loading-container">
                            <div className="pc-loading-spinner"></div>
                            <p>강의 정보를 불러오는 중입니다...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!professorData) {
        return (
            <div className="pc-page">
                <Header username={userData?.name || '교수님'} role="교수" />
                <div className="pc-main-layout">
                    <ProfessorSidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        professorName={userData?.name || ''}
                        professorId={userData?.professorId || ''}
                        department={userData?.department || ''}
                    />
                    <main className="pc-main-content">
                        <div className="pc-error-container">
                            <h2>교수 데이터를 불러올 수 없습니다. 다시 로그인해주세요.</h2>
                            <button className="pc-btn pc-btn-primary" onClick={() => navigate('/login')}>
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
    const totalStudents = professorData.courses?.reduce((sum, course) => sum + (course.enrolled || 0), 0) || 0;
    const totalAssignments = professorData.assignments?.length || 0;
    const totalAnnouncements = professorData.announcements?.length || 0;

    return (
        <div className="pc-page">
            <Header username={userData?.name || '교수님'} role="교수" />

            <div className="pc-main-layout">
                <ProfessorSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    professorName={userData?.name || ''}
                    professorId={userData?.professorId || ''}
                    department={userData?.department || ''}
                />

                <main className="pc-main-content">
                    <div className="pc-welcome-banner">
                        <h2>강의 관리</h2>
                        <p>
                            {professorData.personal?.department || userData?.department || ''} / 
                            사번: {userData?.professorId} / 총 {filteredCourses.length}개 강의 담당
                        </p>
                    </div>

                    <div className="pc-courses-container">
                        <div className="pc-top-row">
                            <div className="pc-course-list-container">
                                <div className="pc-card">
                                    <div className="pc-card-header pc-course-card-header">
                                        <h3>담당 강의 목록</h3>
                                        <div className="pc-course-controls">
                                            <div className="pc-course-search">
                                                <input
                                                    type="text"
                                                    className="pc-search-input"
                                                    placeholder="강의명, 강의코드로 검색..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                                <i className="fas fa-search pc-course-search-icon"></i>
                                            </div>
                                            <div className="pc-course-filters">
                                                <select
                                                    className="pc-sort-select"
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value)}
                                                >
                                                    <option value="name">강의명순</option>
                                                    <option value="enrollment">수강인원순</option>
                                                    <option value="day">요일순</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pc-card-body pc-courses-card-body">
                                        {filteredCourses.length > 0 ? (
                                            <div className="pc-courses-grid-wrapper">
                                                <button
                                                    className="pc-scroll-button pc-prev"
                                                    onClick={handleScrollLeft}
                                                    disabled={scrollPosition <= 0}
                                                >
                                                    <i className="fas fa-chevron-left"></i>
                                                </button>
                                                <div className="pc-courses-grid">
                                                    {filteredCourses.map((course) => (
                                                        <ProfessorCourseCard key={course.id} course={course} />
                                                    ))}
                                                </div>
                                                <button
                                                    className="pc-scroll-button pc-next"
                                                    onClick={handleScrollRight}
                                                >
                                                    <i className="fas fa-chevron-right"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="pc-empty-message">
                                                검색 조건에 맞는 강의가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pc-course-stats-container">
                                <div className="pc-card">
                                    <div className="pc-card-header">
                                        <h3>강의 통계</h3>
                                    </div>
                                    <div className="pc-card-body pc-status-card-body">
                                        <div className="pc-stats-circular-container">
                                            <div className="pc-stats-circular-item">
                                                <div className="pc-stats-label">총 수강생</div>
                                                <div className="pc-circular-progress-container">
                                                    <div
                                                        className="pc-circular-progress"
                                                        style={{
                                                            background: `conic-gradient(var(--pc-primary-color) 0deg ${(totalStudents / 200) * 360}deg, #e9ecef ${(totalStudents / 200) * 360}deg 360deg)`
                                                        }}
                                                    >
                                                        <div className="pc-circular-progress-inner">
                                                            <div className="pc-progress-value">{totalStudents}</div>
                                                            <div className="pc-progress-unit">명</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pc-stats-item">
                                            <div className="pc-stats-label">진행 중인 과제</div>
                                            <div className="pc-stats-bar">
                                                <div
                                                    className="pc-progress-bar"
                                                    style={{ width: `${Math.min((totalAssignments / 20) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="pc-stats-value">{totalAssignments}</div>
                                        </div>
                                        <div className="pc-stats-item">
                                            <div className="pc-stats-label">게시한 공지</div>
                                            <div className="pc-stats-bar">
                                                <div
                                                    className="pc-progress-bar"
                                                    style={{ width: `${Math.min((totalAnnouncements / 30) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="pc-stats-value">{totalAnnouncements}</div>
                                        </div>
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

export default ProfessorCoursesPage;