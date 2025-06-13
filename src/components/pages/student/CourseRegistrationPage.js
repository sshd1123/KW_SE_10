import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import Sidebar from '../../dashboard/Sidebar';
import TimeTable from '../../dashboard/TimeTable';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import { availableCourses, registrationPeriod } from '../../../data/dummyCourseRegistration';
import '../../styles/CourseRegistrationPage.css';

const CourseRegistrationPage = () => {
    const [userData, setUserData] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [activeTab, setActiveTab] = useState('registration');
    const [loading, setLoading] = useState(true);
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [currentView, setCurrentView] = useState('courses');
    const [conflictCourses, setConflictCourses] = useState(new Set());
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
        setSelectedCourses(dashboardData.courses || []);
        setLoading(false);
    }, [navigate]);

    const normalizeSchedule = (course) => {
        if (!course.schedule) {
            if (course.time) {
                const schedule = [];
                const timeSchedules = course.time.split(',').map(s => s.trim());
                timeSchedules.forEach(timeItem => {
                    const match = timeItem.match(/([월화수목금토])\s+(\d+:\d+)[-~](\d+:\d+)/);
                    if (match) {
                        schedule.push({
                            day: match[1],
                            startTime: match[2],
                            endTime: match[3]
                        });
                    }
                });
                return { ...course, schedule };
            }
            return { ...course, schedule: [] };
        }

        if (Array.isArray(course.schedule)) {
            return course;
        }

        return { ...course, schedule: [] };
    };

    const checkTimeConflict = (newCourse, existingCourses) => {
        for (const existingCourse of existingCourses) {
            if (existingCourse.id === newCourse.id) continue;

            for (const newSchedule of newCourse.schedule) {
                for (const existingSchedule of (existingCourse.schedule || [])) {
                    if (newSchedule.day === existingSchedule.day) {
                        const newStart = parseInt(newSchedule.startTime.replace(':', ''));
                        const newEnd = parseInt(newSchedule.endTime.replace(':', ''));
                        const existingStart = parseInt(existingSchedule.startTime.replace(':', ''));
                        const existingEnd = parseInt(existingSchedule.endTime.replace(':', ''));

                        if ((newStart < existingEnd && newEnd > existingStart)) {
                            return existingCourse;
                        }
                    }
                }
            }
        }
        return null;
    };

    const addCourse = (course) => {
        const conflictingCourse = checkTimeConflict(course, selectedCourses);
        if (conflictingCourse) {
            if (window.confirm(`'${conflictingCourse.name}' 강의와 시간이 겹칩니다. 기존 강의를 삭제하고 새 강의를 추가하시겠습니까?`)) {
                const updatedCourses = selectedCourses.filter(c => c.id !== conflictingCourse.id);
                setSelectedCourses([...updatedCourses, course]);
            }
            return;
        }

        const totalCredits = selectedCourses.reduce((sum, c) => sum + c.credits, 0) + course.credits;
        if (totalCredits > registrationPeriod.maxCredits) {
            alert(`최대 신청 가능 학점(${registrationPeriod.maxCredits}학점)을 초과합니다.`);
            return;
        }

        setSelectedCourses([...selectedCourses, course]);
    };

    const removeCourse = (courseId) => {
        const existingCourse = studentData.courses.find(c => c.id === courseId);
        if (existingCourse) {
            alert('이미 수강 중인 강의는 삭제할 수 없습니다.');
            return;
        }
        setSelectedCourses(selectedCourses.filter(c => c.id !== courseId));
    };

    const submitRegistration = () => {
        const totalCredits = selectedCourses.reduce((sum, c) => sum + c.credits, 0);
        if (totalCredits < registrationPeriod.minCredits) {
            alert(`최소 신청 학점(${registrationPeriod.minCredits}학점) 이상 신청해야 합니다.`);
            return;
        }

        if (window.confirm('수강 신청을 완료하시겠습니까? (완료 후 수정이 어려울 수 있습니다)')) {
            alert('수강 신청이 완료되었습니다!');
        }
    };

    const getFilteredCourses = () => {
        let filtered = availableCourses.filter(course => {
            if (selectedCourses.some(selected => selected.id === course.id)) {
                return false;
            }

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                if (!course.name.toLowerCase().includes(term) &&
                    !course.professor.toLowerCase().includes(term) &&
                    !course.id.toLowerCase().includes(term)) {
                    return false;
                }
            }

            if (filter !== 'all') {
                if (filter === 'major' && !course.type.includes('전공')) return false;
                if (filter === 'liberal' && course.type !== '교양필수' && course.type !== '교양선택') return false;
                if (filter === 'available' && course.enrolled >= course.capacity) return false;
            }

            return true;
        });

        filtered.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'professor') return a.professor.localeCompare(b.professor);
            if (sortBy === 'credits') return b.credits - a.credits;
            if (sortBy === 'available') return (b.capacity - b.enrolled) - (a.capacity - a.enrolled);
            return 0;
        });

        return filtered;
    };

    useEffect(() => {
        const conflicts = new Set();
        availableCourses.forEach(course => {
            if (!selectedCourses.some(selected => selected.id === course.id)) {
                const conflictingCourse = checkTimeConflict(course, selectedCourses);
                if (conflictingCourse) {
                    conflicts.add(course.id);
                }
            }
        });
        setConflictCourses(conflicts);
    }, [selectedCourses]);

    if (loading) {
        return (
            <div className="crp-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="crp-main-layout">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department || userData?.major}
                    />
                    <main className="crp-main-content">
                        <div className="crp-loading-container">
                            <div className="crp-loading-spinner"></div>
                            <p>수강 신청 정보를 불러오는 중입니다...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const totalCredits = selectedCourses.reduce((sum, c) => sum + c.credits, 0);
    const filteredCourses = getFilteredCourses();

    return (
        <div className="crp-page">
            <Header
                username={userData?.name}
                role={userData?.role || '학생'}
            />
            <div className="crp-main-layout">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    studentName={userData?.name}
                    studentId={userData?.studentId || userData?.id}
                    department={userData?.department || userData?.major}
                />
                <main className="crp-main-content">
                    <div className="crp-welcome-banner">
                        <h2>수강 신청</h2>
                        <p>2025년 1학기 / {registrationPeriod.currentPhase} 신청 기간</p>
                    </div>

                    <div className="crp-card crp-registration-period-card">
                        <div className="crp-card-header">
                            <h3>수강 신청 기간</h3>
                            <span className={`crp-period-status ${registrationPeriod.isOpen ? 'open' : 'closed'}`}>
                                {registrationPeriod.isOpen ? '신청 가능' : '신청 마감'}
                            </span>
                        </div>
                        <div className="crp-card-body crp-period-card-body">
                            <div className="crp-period-info">
                                <div className="crp-period-phases">
                                    {registrationPeriod.phases.map((phase, index) => (
                                        <div
                                            key={index}
                                            className={`crp-phase-item ${phase.name === registrationPeriod.currentPhase ? 'current' : ''}`}
                                        >
                                            <div className="crp-phase-name">{phase.name}</div>
                                            <div className="crp-phase-date">{phase.date}</div>
                                            <div className="crp-phase-target">{phase.target}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="crp-credit-info">
                                    <div className="crp-credit-item">
                                        <span>신청 학점</span>
                                        <span className={`crp-credit-value ${totalCredits > registrationPeriod.maxCredits ? 'over' :
                                            totalCredits < registrationPeriod.minCredits ? 'under' : 'normal'
                                            }`}>
                                            {totalCredits}학점
                                        </span>
                                    </div>
                                    <div className="crp-credit-item">
                                        <span>최대 학점</span>
                                        <span className="crp-credit-value normal">{registrationPeriod.maxCredits}학점</span>
                                    </div>
                                    <div className="crp-credit-item">
                                        <span>최소 학점</span>
                                        <span className="crp-credit-value normal">{registrationPeriod.minCredits}학점</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="crp-view-tabs">
                        <button
                            className={`crp-view-tab ${currentView === 'courses' ? 'active' : ''}`}
                            onClick={() => setCurrentView('courses')}
                        >
                            강의 목록
                        </button>
                        <button
                            className={`crp-view-tab ${currentView === 'timetable' ? 'active' : ''}`}
                            onClick={() => setCurrentView('timetable')}
                        >
                            시간표 미리보기
                        </button>
                    </div>

                    {currentView === 'courses' ? (
                        <div className="crp-registration-container">
                            <div className="crp-card">
                                <div className="crp-card-header">
                                    <h3>신청 가능한 강의</h3>
                                </div>
                                <div className="crp-card-body crp-available-courses-body">
                                    <div className="crp-course-controls">
                                        <div className="crp-search-container">
                                            <input
                                                type="text"
                                                className="crp-search-input"
                                                placeholder="강의명, 교수명, 강의코드로 검색..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <i className="fas fa-search crp-search-icon"></i>
                                        </div>
                                        <div className="crp-filter-controls">
                                            <select
                                                className="crp-filter-select"
                                                value={filter}
                                                onChange={(e) => setFilter(e.target.value)}
                                            >
                                                <option value="all">전체</option>
                                                <option value="major">전공</option>
                                                <option value="liberal">교양</option>
                                                <option value="available">신청 가능</option>
                                            </select>
                                            <select
                                                className="crp-sort-select"
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                            >
                                                <option value="name">강의명순</option>
                                                <option value="professor">교수명순</option>
                                                <option value="credits">학점순</option>
                                                <option value="available">여석순</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="crp-available-courses-list">
                                        {filteredCourses.length > 0 ? (
                                            filteredCourses.map((course) => {
                                                const isConflict = conflictCourses.has(course.id);
                                                const isFull = course.enrolled >= course.capacity;
                                                const isDisabled = isConflict || isFull;

                                                return (
                                                    <div
                                                        key={course.id}
                                                        className={`crp-available-course-item ${isDisabled ? 'disabled' : ''}`}
                                                    >
                                                        <div className="crp-course-header">
                                                            <div className="crp-course-title">
                                                                <h4>{course.name}</h4>
                                                                <div className="crp-course-code">{course.id}</div>
                                                            </div>
                                                            <div className="crp-course-tags">
                                                                <span className={`crp-course-type-tag ${course.type.includes('전공') ? 'major' : ''}`}>
                                                                    {course.type}
                                                                </span>
                                                                <span className="crp-course-credits-tag">{course.credits}학점</span>
                                                            </div>
                                                        </div>

                                                        <div className="crp-course-info-grid">
                                                            <div>
                                                                <i className="fas fa-user"></i>
                                                                <span>{course.professor}</span>
                                                            </div>
                                                            <div>
                                                                <i className="fas fa-clock"></i>
                                                                <span>{course.time}</span>
                                                            </div>
                                                            <div>
                                                                <i className="fas fa-map-marker-alt"></i>
                                                                <span>{course.room}</span>
                                                            </div>
                                                            <div>
                                                                <i className="fas fa-users"></i>
                                                                <span>
                                                                    {course.enrolled}/{course.capacity}
                                                                    <span className={`crp-capacity-status ${course.enrolled >= course.capacity ? 'full' :
                                                                        course.enrolled >= course.capacity * 0.8 ? 'almost-full' : 'available'
                                                                        }`}>
                                                                        {course.enrolled >= course.capacity ? '마감' :
                                                                            course.enrolled >= course.capacity * 0.8 ? '거의마감' : '여석있음'}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                            {course.prerequisites && (
                                                                <div className="crp-course-prerequisites">
                                                                    <i className="fas fa-exclamation-triangle"></i>
                                                                    <span>선수과목: {course.prerequisites}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {course.description && (
                                                            <div className="crp-course-description">
                                                                {course.description}
                                                            </div>
                                                        )}

                                                        <div className="crp-course-actions">
                                                            <button
                                                                className={`crp-btn crp-btn-primary crp-add-course-btn ${isDisabled ? 'crp-btn-disabled' : ''}`}
                                                                onClick={() => addCourse(normalizeSchedule(course))}
                                                                disabled={isDisabled}
                                                            >
                                                                {isFull ? '마감' : '신청'}
                                                            </button>
                                                            <button className="crp-btn crp-btn-outline crp-detail-btn">
                                                                상세보기
                                                            </button>
                                                        </div>

                                                        {isConflict && (
                                                            <div className="crp-conflict-warning">
                                                                <i className="fas fa-exclamation-triangle"></i>
                                                                시간이 겹치는 강의가 있습니다.
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="crp-empty-message">
                                                검색 조건에 맞는 강의가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="crp-selected-courses-container">
                                <div className="crp-card">
                                    <div className="crp-card-header">
                                        <h3>신청한 강의</h3>
                                        <span className="crp-selected-credits">{totalCredits}학점</span>
                                    </div>
                                    <div className="crp-card-body crp-selected-courses-body">
                                        {selectedCourses.length > 0 ? (
                                            <div className="crp-selected-courses-list">
                                                {selectedCourses.map((course) => {
                                                    const isExisting = studentData.courses.some(c => c.id === course.id);
                                                    return (
                                                        <div
                                                            key={course.id}
                                                            className={`crp-selected-course-item ${isExisting ? 'existing' : ''}`}
                                                        >
                                                            {/* 이 부분을 아래 코드로 완전히 교체 */}
                                                            <div className="crp-course-info">
                                                                <div className="crp-course-main-info">
                                                                    <div className="crp-course-name">{course.name}</div>
                                                                    <div className="crp-course-details">
                                                                        <span className="crp-course-professor">{course.professor}</span>
                                                                        <span className="crp-course-credits">{course.credits}학점</span>
                                                                        <span className="crp-course-type">{course.type}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="crp-course-schedule">
                                                                    {course.time && course.time.split(',').map((time, index) => (
                                                                        <span key={index} className="crp-schedule-time">
                                                                            {time.trim()}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="crp-course-actions-right">
                                                                {isExisting ? (
                                                                    <span className="crp-existing-label">수강중</span>
                                                                ) : (
                                                                    <button
                                                                        className="crp-remove-btn"
                                                                        onClick={() => removeCourse(course.id)}
                                                                    >
                                                                        삭제
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="crp-empty-message">
                                                신청한 강의가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="crp-timetable-preview-container">
                            <div className="crp-card">
                                <div className="crp-card-header">
                                    <h3>시간표 미리보기</h3>
                                    <div className="crp-timetable-info">
                                        총 {selectedCourses.length}개 강의, {totalCredits}학점
                                    </div>
                                </div>
                                <div className="crp-card-body crp-timetable-preview-body">
                                    {selectedCourses.length > 0 ? (
                                        <TimeTable courses={selectedCourses} />
                                    ) : (
                                        <div className="crp-empty-timetable">
                                            <i className="fas fa-calendar-alt"></i>
                                            <p>신청한 강의가 없습니다.</p>
                                            <button
                                                className="crp-btn crp-btn-primary"
                                                onClick={() => setCurrentView('courses')}
                                            >
                                                강의 신청하기
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedCourses.length > 0 && (
                                <div className="crp-card">
                                    <div className="crp-card-header">
                                        <h3>신청 강의 목록</h3>
                                    </div>
                                    <div className="crp-card-body">
                                        <div className="crp-course-summary-list">
                                            {selectedCourses.map((course) => {
                                                const isExisting = studentData.courses.some(c => c.id === course.id);
                                                return (
                                                    <div
                                                        key={course.id}
                                                        className={`crp-selected-course-item ${isExisting ? 'existing' : ''}`}
                                                    >
                                                        <div className="crp-course-info">
                                                            <div className="crp-course-main-info">
                                                                <div className="crp-course-name">{course.name}</div>
                                                                <div className="crp-course-details">
                                                                    <span className="crp-course-professor">{course.professor}</span>
                                                                    <span className="crp-course-credits">{course.credits}학점</span>
                                                                    <span className="crp-course-type">{course.type}</span>
                                                                </div>
                                                            </div>
                                                            <div className="crp-course-schedule">
                                                                {course.time && course.time.split(',').map((time, index) => (
                                                                    <span key={index} className="crp-schedule-time">
                                                                        {time.trim()}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="crp-course-actions-right">
                                                            {isExisting ? (
                                                                <span className="crp-existing-label">수강중</span>
                                                            ) : (
                                                                <button
                                                                    className="crp-remove-btn"
                                                                    onClick={() => removeCourse(course.id)}
                                                                >
                                                                    삭제
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                        </div>
                                        <div className="crp-timetable-actions">
                                            <button
                                                className="crp-btn crp-btn-outline"
                                                onClick={() => setCurrentView('courses')}
                                            >
                                                강의 목록으로
                                            </button>
                                            <button
                                                className="crp-btn crp-btn-primary"
                                                onClick={submitRegistration}
                                                disabled={!registrationPeriod.isOpen}
                                            >
                                                수강 신청 완료
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CourseRegistrationPage;
