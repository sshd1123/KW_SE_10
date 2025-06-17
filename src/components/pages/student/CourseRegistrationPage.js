import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import Sidebar from '../../dashboard/Sidebar';
import TimeTable from '../../dashboard/TimeTable';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import { availableCourses, registrationPeriod } from '../../../data/dummyCourseRegistration';
import '../../styles/CourseRegistrationPage.css';
import { CourseAPI, EnrollmentAPI } from '../../../services/api';

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
    const [availableCoursesData, setAvailableCourses] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [myCourses, setMyCourses] = useState([]);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        department: '',
        year: '',
        semester: '',
        type: ''
    });

    // 수강신청 관련 상태
    const [enrollmentLoading, setEnrollmentLoading] = useState(false);
    const [enrollmentResults, setEnrollmentResults] = useState([]);

    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCourses, setTotalCourses] = useState(0);

    const [showSyllabusModal, setShowSyllabusModal] = useState(false);
    const [selectedCourseForSyllabus, setSelectedCourseForSyllabus] = useState(null);

    const navigate = useNavigate();

    // 내 수강 강의 목록 로드
    const loadMyCourses = async () => {
        try {
            console.log('내 수강 강의 목록 로드 시작...');

            const response = await EnrollmentAPI.getMyCourses();

            if (response.success) {
                setMyCourses(response.data.courses || []);
                console.log('내 수강 강의 로드 성공:', response.data.courses?.length || 0, '개');
            } else {
                console.warn('내 수강 강의 로드 실패:', response.message);
                setMyCourses([]);
            }
        } catch (error) {
            console.error('내 수강 강의 로드 오류:', error);
            setMyCourses([]);
        }
    };

    // 수강신청 가능 강의 목록 로드
    const loadAvailableCourses = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('수강신청 가능 강의 검색:', filters);

            // API 파라미터 구성
            const params = {
                ...filters,
                keyword: searchTerm,
                limit: 50,
                available: true // 수강신청 가능한 강의만
            };

            // 빈 값 제거
            Object.keys(params).forEach(key => {
                if (!params[key] || params[key] === '') {
                    delete params[key];
                }
            });

            const response = await CourseAPI.searchCourses(params);

            if (response.success) {
                setAvailableCourses(response.data.courses || []);
                console.log('수강신청 가능 강의 로드 성공:', response.data.courses?.length || 0, '개');
            } else {
                setError(response.message || '강의 목록을 불러올 수 없습니다.');
                setAvailableCourses([]);
            }

        } catch (error) {
            console.error('강의 목록 로드 실패:', error);
            setError('강의 목록을 불러오는 중 오류가 발생했습니다.');
            setAvailableCourses([]);
        } finally {
            setLoading(false);
        }
    };

    // 수강신청 처리 (개별 강의)
    const handleEnrollCourse = async (course) => {
        try {
            setEnrollmentLoading(true);

            // 이미 수강중인지 체크
            const isAlreadyEnrolled = myCourses.some(c => c.id === course.id);
            if (isAlreadyEnrolled) {
                alert('이미 수강 중인 강의입니다.');
                return;
            }

            // 시간 겹침 체크
            const hasTimeConflict = checkTimeConflict(course, [...myCourses, ...selectedCourses]);
            if (hasTimeConflict) {
                if (!window.confirm(`다른 강의와 시간이 겹칩니다. 계속 진행하시겠습니까?`)) {
                    return;
                }
            }

            console.log('수강신청 요청:', course.id, course.name);

            // ✅ 실제 API 호출 (POST /api/enrollment)
            const response = await EnrollmentAPI.enroll({
                courseId: course.id,
                semester: filters.semester || '2025-1'
            });

            if (response.success) {
                alert(`'${course.name}' 수강신청이 완료되었습니다!`);

                // 상태 업데이트
                setSelectedCourses(prev => prev.filter(c => c.id !== course.id));

                // 최신 데이터 다시 로드
                await loadMyCourses();
                await loadAvailableCourses();

                // 성공 결과 기록
                setEnrollmentResults(prev => [...prev, {
                    courseId: course.id,
                    courseName: course.name,
                    status: 'success',
                    message: '수강신청 완료',
                    timestamp: new Date()
                }]);

            } else {
                const errorMessage = response.message || '수강신청에 실패했습니다.';
                alert(errorMessage);

                // 실패 결과 기록
                setEnrollmentResults(prev => [...prev, {
                    courseId: course.id,
                    courseName: course.name,
                    status: 'error',
                    message: errorMessage,
                    timestamp: new Date()
                }]);
            }

        } catch (error) {
            console.error('수강신청 오류:', error);

            let errorMessage = '수강신청 중 오류가 발생했습니다.';
            if (error.message.includes('409')) {
                errorMessage = '이미 수강신청한 강의이거나 정원이 마감되었습니다.';
            } else if (error.message.includes('400')) {
                errorMessage = '수강신청 조건을 만족하지 않습니다.';
            }

            alert(errorMessage);

            // 실패 결과 기록
            setEnrollmentResults(prev => [...prev, {
                courseId: course.id,
                courseName: course.name,
                status: 'error',
                message: errorMessage,
                timestamp: new Date()
            }]);

        } finally {
            setEnrollmentLoading(false);
        }
    };

    // 수강철회 처리
    const handleDropCourse = async (enrollment) => {
        if (!window.confirm(`'${enrollment.courseName || enrollment.course?.name}' 수강을 철회하시겠습니까?`)) {
            return;
        }

        try {
            setEnrollmentLoading(true);

            console.log('수강철회 요청:', enrollment.id);

            // ✅ 실제 API 호출 (DELETE /api/enrollment/:enrollmentId)
            const response = await EnrollmentAPI.dropCourse(enrollment.id);

            if (response.success) {
                alert('수강철회가 완료되었습니다.');

                // 최신 데이터 다시 로드
                await loadMyCourses();
                await loadAvailableCourses();

            } else {
                alert(response.message || '수강철회에 실패했습니다.');
            }

        } catch (error) {
            console.error('수강철회 오류:', error);
            alert('수강철회 중 오류가 발생했습니다.');
        } finally {
            setEnrollmentLoading(false);
        }
    };

    // 시간 겹침 체크 함수
    const checkTimeConflict = (newCourse, existingCourses) => {
        if (!Array.isArray(newCourse.schedule)) return false;

        for (const existingCourse of existingCourses) {
            if (!Array.isArray(existingCourse.schedule)) continue;

            for (const newSchedule of newCourse.schedule) {
                for (const existingSchedule of existingCourse.schedule) {
                    if (newSchedule.day === existingSchedule.day) {
                        const newStart = parseInt(newSchedule.startTime.replace(':', ''));
                        const newEnd = parseInt(newSchedule.endTime.replace(':', ''));
                        const existingStart = parseInt(existingSchedule.startTime.replace(':', ''));
                        const existingEnd = parseInt(existingSchedule.endTime.replace(':', ''));

                        if (newStart < existingEnd && newEnd > existingStart) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    };

    // 장바구니에 강의 추가
    const addToCart = (course) => {
        const isAlreadySelected = selectedCourses.some(c => c.id === course.id);
        const isAlreadyEnrolled = myCourses.some(c => c.id === course.id);

        if (isAlreadySelected) {
            alert('이미 선택된 강의입니다.');
            return;
        }

        if (isAlreadyEnrolled) {
            alert('이미 수강 중인 강의입니다.');
            return;
        }

        setSelectedCourses(prev => [...prev, course]);
    };

    // 장바구니에서 강의 제거
    const removeFromCart = (courseId) => {
        setSelectedCourses(prev => prev.filter(c => c.id !== courseId));
    };

    // 일괄 수강신청
    const handleBatchEnrollment = async () => {
        if (selectedCourses.length === 0) {
            alert('수강신청할 강의를 선택해주세요.');
            return;
        }

        if (!window.confirm(`선택한 ${selectedCourses.length}개 강의를 수강신청하시겠습니까?`)) {
            return;
        }

        setEnrollmentLoading(true);
        setEnrollmentResults([]);

        // 순차적으로 수강신청 처리
        for (const course of selectedCourses) {
            await handleEnrollCourse(course);
            // 서버 부하 방지를 위한 약간의 지연
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        setEnrollmentLoading(false);
    };

    // 컴포넌트 마운트시 데이터 로드
    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }

        setUserData(user);

        // 초기 데이터 로드
        const initializeData = async () => {
            await loadMyCourses();
            await loadAvailableCourses();
            setLoading(false);
        };

        initializeData();
    }, [navigate]);

    // 필터 변경시 강의 목록 새로고침
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadAvailableCourses();
        }, 500); // 디바운싱

        return () => clearTimeout(timeoutId);
    }, [searchTerm, filters]);

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
        // studentData가 null이거나 courses가 없는 경우 안전하게 처리
        const existingCourses = studentData?.courses || [];
        const existingCourse = existingCourses.find(c => c.id === courseId);

        if (existingCourse) {
            alert('이미 수강 중인 강의는 삭제할 수 없습니다.');
            return;
        }

        // 선택된 강의 목록에서 해당 강의 제거
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
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>로딩 중...</p>
                </div>
            </div>
        );
    }

    const handleViewSyllabus = (course) => {
        setSelectedCourseForSyllabus(course);
        setShowSyllabusModal(true);
    };

    const closeSyllabusModal = () => {
        setShowSyllabusModal(false);
        setSelectedCourseForSyllabus(null);
    };

    const SyllabusModal = ({ course, onClose }) => {
        if (!course) return null;

        return (
            <div className="syllabus-modal-overlay" onClick={onClose}>
                <div className="syllabus-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="syllabus-modal-header">
                        <h2>{course.name} 강의계획서</h2>
                        <button className="modal-close-btn" onClick={onClose}>×</button>
                    </div>

                    <div className="syllabus-modal-content">
                        {/* 기본 정보 */}
                        <div className="syllabus-section">
                            <h3>기본 정보</h3>
                            <div className="syllabus-info-grid">
                                <div className="info-item">
                                    <strong>강의명:</strong> {course.name}
                                </div>
                                <div className="info-item">
                                    <strong>교수명:</strong> {course.professor}
                                </div>
                                <div className="info-item">
                                    <strong>학점:</strong> {course.credits}학점
                                </div>
                                <div className="info-item">
                                    <strong>과목구분:</strong> {course.type}
                                </div>
                                <div className="info-item">
                                    <strong>강의시간:</strong> {
                                        Array.isArray(course.schedule)
                                            ? course.schedule.map(s => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')
                                            : course.schedule || course.time || '시간미정'
                                    }
                                </div>
                                <div className="info-item">
                                    <strong>강의실:</strong> {course.room}
                                </div>
                                <div className="info-item">
                                    <strong>정원:</strong> {course.capacity}명
                                </div>
                                <div className="info-item">
                                    <strong>현재인원:</strong> {course.enrolled}명
                                </div>
                            </div>
                        </div>

                        {/* 강의 개요 */}
                        <div className="syllabus-section">
                            <h3>강의 개요</h3>
                            <p>{course.description || '강의 개요가 등록되지 않았습니다.'}</p>
                        </div>

                        {/* 강의 목표 */}
                        <div className="syllabus-section">
                            <h3>강의 목표</h3>
                            <p>{course.objectives || course.goals || '강의 목표가 등록되지 않았습니다.'}</p>
                        </div>

                        {/* 주차별 계획 */}
                        <div className="syllabus-section">
                            <h3>주차별 강의 계획</h3>
                            {course.syllabus ? (
                                <div className="weekly-plan">
                                    {course.syllabus.split('\n').map((week, index) => (
                                        <div key={index} className="week-item">
                                            <span className="week-number">{index + 1}주차</span>
                                            <span className="week-content">{week}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>주차별 강의 계획이 등록되지 않았습니다.</p>
                            )}
                        </div>

                        {/* 평가 방법 */}
                        <div className="syllabus-section">
                            <h3>평가 방법</h3>
                            <p>{course.grading || '평가 방법이 등록되지 않았습니다.'}</p>
                        </div>

                        {/* 선수과목 */}
                        <div className="syllabus-section">
                            <h3>선수과목</h3>
                            <p>{
                                course.prerequisites && course.prerequisites.length > 0
                                    ? course.prerequisites.join(', ')
                                    : '선수과목이 없습니다.'
                            }</p>
                        </div>

                        {/* 교재 및 참고자료 */}
                        <div className="syllabus-section">
                            <h3>교재 및 참고자료</h3>
                            <p>{course.textbooks || course.materials || '교재 정보가 등록되지 않았습니다.'}</p>
                        </div>

                        {/* 유의사항 */}
                        {course.notes && (
                            <div className="syllabus-section">
                                <h3>유의사항</h3>
                                <p>{course.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="syllabus-modal-footer">
                        <button className="btn btn-outline" onClick={onClose}>
                            닫기
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                addCourse(course);
                                onClose();
                            }}
                            disabled={course.enrolled >= course.capacity}
                        >
                            {course.enrolled >= course.capacity ? '정원마감' : '수강신청'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="crp-page">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} userData={userData} />
            <div className="crp-main-layout">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="crp-main-content">
                    {/* 웰컴 배너 */}
                    <div className="crp-welcome-banner">
                        <h2>수강 신청</h2>
                        <p>2024학년도 1학기 수강신청 시스템</p>
                    </div>
    
                    {/* 수강신청 기간 정보 - 첫 번째 코드의 상세 정보 + 두 번째 코드의 간소함 결합 */}
                    <div className="crp-card crp-registration-period-card">
                        <div className="crp-card-header">
                            <h3>수강신청 기간</h3>
                            <span className={`crp-period-status ${registrationPeriod.isOpen ? 'open' : 'closed'}`}>
                                {registrationPeriod.isOpen ? '신청 가능' : '신청 마감'}
                            </span>
                        </div>
                        <div className="crp-card-body crp-period-card-body">
                            <div className="crp-period-info">
                                {/* 기간 단계 정보 (첫 번째 코드에서 가져옴) */}
                                <div className="crp-period-phases">
                                    {registrationPeriod.phases.map((phase, index) => (
                                        <div key={index} className={`crp-phase-item ${phase.current ? 'current' : ''}`}>
                                            <div className="crp-phase-name">{phase.name}</div>
                                            <div className="crp-phase-date">{phase.date}</div>
                                            <div className="crp-phase-target">{phase.target}</div>
                                        </div>
                                    ))}
                                </div>
                                {/* 학점 정보 */}
                                <div className="crp-credit-info">
                                    <div className="crp-credit-item">
                                        <span>신청 학점</span>
                                        <span className={`crp-credit-value ${
                                            selectedCourses.reduce((sum, c) => sum + c.credits, 0) > registrationPeriod.maxCredits ? 'over' :
                                            selectedCourses.reduce((sum, c) => sum + c.credits, 0) < registrationPeriod.minCredits ? 'under' : 'normal'
                                        }`}>
                                            {selectedCourses.reduce((sum, c) => sum + c.credits, 0)} / {registrationPeriod.maxCredits}
                                        </span>
                                    </div>
                                    <div className="crp-credit-item">
                                        <span>최소 학점</span>
                                        <span className="crp-credit-value normal">{registrationPeriod.minCredits}</span>
                                    </div>
                                    <div className="crp-credit-item">
                                        <span>최대 학점</span>
                                        <span className="crp-credit-value normal">{registrationPeriod.maxCredits}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
    
                    {/* 뷰 전환 탭 */}
                    <div className="crp-view-tabs">
                        <button
                            className={`crp-view-tab ${currentView === 'courses' ? 'active' : ''}`}
                            onClick={() => setCurrentView('courses')}
                        >
                            강의 검색 및 신청
                        </button>
                        <button
                            className={`crp-view-tab ${currentView === 'timetable' ? 'active' : ''}`}
                            onClick={() => setCurrentView('timetable')}
                        >
                            시간표 미리보기
                        </button>
                    </div>
    
                    {/* 강의 검색 및 신청 뷰 */}
                    {currentView === 'courses' && (
                        <div className="crp-registration-container">
                            {/* 선택된 강의 목록 */}
                            <div className="crp-selected-courses-container">
                                <div className="crp-card">
                                    <div className="crp-card-header">
                                        <h3>선택된 강의</h3>
                                        <span className="crp-selected-credits">
                                            {selectedCourses.reduce((sum, c) => sum + c.credits, 0)}학점
                                        </span>
                                    </div>
                                    <div className="crp-card-body crp-selected-courses-body">
                                        {selectedCourses.length > 0 ? (
                                            <div className="crp-selected-courses-list">
                                                {selectedCourses.map(course => (
                                                    <div key={course.id} className={`crp-selected-course-item ${course.existing ? 'existing' : ''}`}>
                                                        <div className="crp-course-info">
                                                            <div className="crp-course-main-info">
                                                                <h4 className="crp-course-name">{course.name}</h4>
                                                                <div className="crp-course-details">
                                                                    <span className="crp-course-professor">{course.professor}</span>
                                                                    <span className="crp-course-credits">{course.credits}학점</span>
                                                                    <span className="crp-course-type">{course.type}</span>
                                                                </div>
                                                            </div>
                                                            <div className="crp-course-schedule">
                                                                {normalizeSchedule(course).schedule.map((schedule, idx) => (
                                                                    <span key={idx} className="crp-schedule-time">
                                                                        {schedule.day} {schedule.startTime}-{schedule.endTime}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="crp-course-actions-right">
                                                            {course.existing ? (
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
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="crp-empty-message">
                                                선택된 강의가 없습니다.
                                            </div>
                                        )}
                                        
                                        <div className="crp-registration-actions">
                                            <button
                                                className="crp-btn crp-btn-primary crp-submit-btn"
                                                onClick={submitRegistration}
                                                disabled={selectedCourses.length === 0}
                                            >
                                                수강신청 완료
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
    
                            {/* 신청 가능한 강의 목록 */}
                            <div className="crp-available-courses-container">
                                <div className="crp-card">
                                    <div className="crp-card-header">
                                        <h3>신청 가능한 강의</h3>
                                        <span>총 <strong>{totalCourses}</strong>개의 강의가 검색되었습니다</span>
                                    </div>
                                    <div className="crp-card-body crp-available-courses-body">
                                        {/* 검색 및 필터 컨트롤 */}
                                        <div className="crp-course-controls">
                                            <div className="crp-search-container">
                                                <input
                                                    type="text"
                                                    placeholder="강의명, 교수명, 강의코드로 검색..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="crp-search-input"
                                                />
                                                <i className="fas fa-search crp-search-icon"></i>
                                            </div>
                                            <div className="crp-filter-controls">
                                                <select
                                                    value={filter}
                                                    onChange={(e) => setFilter(e.target.value)}
                                                    className="crp-filter-select"
                                                >
                                                    <option value="all">전체</option>
                                                    <option value="major">전공</option>
                                                    <option value="liberal">교양</option>
                                                    <option value="available">신청가능</option>
                                                </select>
                                                <select
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value)}
                                                    className="crp-sort-select"
                                                >
                                                    <option value="name">강의명순</option>
                                                    <option value="professor">교수명순</option>
                                                    <option value="credits">학점순</option>
                                                    <option value="available">여석순</option>
                                                </select>
                                            </div>
                                        </div>
    
                                        {/* 강의 목록 */}
                                        {searchLoading ? (
                                            <div className="crp-loading-container">
                                                <div className="crp-loading-spinner"></div>
                                                <p>강의를 검색하고 있습니다...</p>
                                            </div>
                                        ) : getFilteredCourses().length > 0 ? (
                                            <div className="crp-available-courses-list">
                                                {getFilteredCourses().map(course => (
                                                    <div
                                                        key={course.id}
                                                        className={`crp-available-course-item ${
                                                            course.enrolled >= course.capacity || conflictCourses.has(course.id) ? 'disabled' : ''
                                                        }`}
                                                    >
                                                        <div className="crp-course-header">
                                                            <div className="crp-course-title">
                                                                <h4>{course.name}</h4>
                                                                <span className="crp-course-code">{course.id}</span>
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
                                                                <strong>교수:</strong> {course.professor}
                                                            </div>
                                                            <div>
                                                                <i className="fas fa-building"></i>
                                                                <strong>학과:</strong> {course.department}
                                                            </div>
                                                            <div>
                                                                <i className="fas fa-graduation-cap"></i>
                                                                <strong>학점:</strong> {course.credits}
                                                            </div>
                                                            <div>
                                                                <i className="fas fa-clock"></i>
                                                                <strong>시간:</strong> {Array.isArray(course.schedule)
                                                                    ? course.schedule.map(s => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')
                                                                    : course.time || '시간미정'
                                                                }
                                                            </div>
                                                            <div>
                                                                <i className="fas fa-map-marker-alt"></i>
                                                                <strong>강의실:</strong> {course.room}
                                                            </div>
                                                            <div>
                                                                <i className="fas fa-users"></i>
                                                                <strong>정원:</strong> {course.enrolled}/{course.capacity}
                                                                <span className={`crp-capacity-status ${
                                                                    course.enrolled >= course.capacity ? 'full' :
                                                                    course.enrolled >= course.capacity * 0.8 ? 'almost-full' : 'available'
                                                                }`}>
                                                                    {course.enrolled >= course.capacity ? '마감' :
                                                                     course.enrolled >= course.capacity * 0.8 ? '거의마감' : '신청가능'}
                                                                </span>
                                                            </div>
                                                        </div>
    
                                                        {course.description && (
                                                            <div className="crp-course-description">
                                                                {course.description}
                                                            </div>
                                                        )}

                                                        <div className="crp-course-actions">
                                                            <button
                                                                className="crp-syllabus-btn"
                                                                onClick={() => handleViewSyllabus(course)}
                                                            >
                                                                강의계획서
                                                            </button>
                                                            <button
                                                                className={`crp-btn crp-btn-primary crp-add-course-btn ${
                                                                    course.enrolled >= course.capacity || conflictCourses.has(course.id) ? 'crp-btn-disabled' : ''
                                                                }`}
                                                                onClick={() => addCourse(normalizeSchedule(course))}
                                                                disabled={course.enrolled >= course.capacity || conflictCourses.has(course.id)}
                                                            >
                                                                {course.enrolled >= course.capacity ? '마감' : '신청'}
                                                            </button>
                                                        </div>
    
                                                        {conflictCourses.has(course.id) && (
                                                            <div className="crp-conflict-warning">
                                                                <i className="fas fa-exclamation-triangle"></i>
                                                                선택된 강의와 시간이 겹칩니다.
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="crp-empty-message">
                                                검색 조건에 맞는 강의가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
    
                    {/* 시간표 미리보기 뷰 */}
                    {currentView === 'timetable' && (
                        <div className="crp-timetable-preview-container">
                            <div className="crp-card">
                                <div className="crp-card-header">
                                    <h3>시간표 미리보기</h3>
                                    <div className="crp-timetable-info">
                                        총 {selectedCourses.reduce((sum, c) => sum + c.credits, 0)}학점
                                    </div>
                                </div>
                                <div className="crp-card-body crp-timetable-preview-body">
                                    {selectedCourses.length > 0 ? (
                                        <>
                                            <TimeTable courses={selectedCourses.map(normalizeSchedule)} />
                                            <div className="crp-course-summary-list">
                                                {selectedCourses.map(course => (
                                                    <div key={course.id} className={`crp-course-summary-item ${course.existing ? 'existing' : ''}`}>
                                                        <div className="crp-summary-left">
                                                            <div className="crp-summary-name">{course.name}</div>
                                                            <div className="crp-summary-details">
                                                                {course.professor} | {course.credits}학점 | {course.type}
                                                            </div>
                                                            <div className="crp-summary-schedule">
                                                                {normalizeSchedule(course).schedule.map((schedule, idx) => (
                                                                    <span key={idx} className="crp-schedule-item">
                                                                        {schedule.day} {schedule.startTime}-{schedule.endTime}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="crp-summary-right">
                                                            {course.existing ? (
                                                                <span className="crp-existing-badge">수강중</span>
                                                            ) : (
                                                                <button
                                                                    className="crp-btn crp-btn-outline crp-btn-sm"
                                                                    onClick={() => removeCourse(course.id)}
                                                                >
                                                                    삭제
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="crp-timetable-actions">
                                                <button
                                                    className="crp-btn crp-btn-outline"
                                                    onClick={() => setCurrentView('courses')}
                                                >
                                                    강의 추가하기
                                                </button>
                                                <button
                                                    className="crp-btn crp-btn-primary"
                                                    onClick={submitRegistration}
                                                >
                                                    수강신청 완료
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="crp-empty-timetable">
                                            <i className="fas fa-calendar-alt"></i>
                                            <p>선택된 강의가 없습니다.</p>
                                            <button
                                                className="crp-btn crp-btn-primary"
                                                onClick={() => setCurrentView('courses')}
                                            >
                                                강의 선택하기
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* 두 번째 코드의 모달 시스템 추가 */}
            {showSyllabusModal && (
                <SyllabusModal
                    course={selectedCourseForSyllabus}
                    onClose={closeSyllabusModal}
                />
            )}
        </div>
    );    
};

export default CourseRegistrationPage;
