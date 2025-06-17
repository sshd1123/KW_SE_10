import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import Sidebar from '../../dashboard/Sidebar';
import { getCurrentUser, getDashboardData } from '../../../data/authUtils'; // ✅ getDashboardData도 임포트
import { CourseAPI, AnnouncementAPI, AssignmentAPI, ArchiveAPI } from '../../../services/api';
import '../../styles/CourseDetailPage.css';

const CourseDetailPage = () => {
    const [activeCourseTab, setActiveCourseTab] = useState('공지');
    const [activeTab, setActiveTab] = useState('courses');
    const [courseData, setCourseData] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 각 탭별 데이터와 로딩 상태
    const [announcements, setAnnouncements] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(false);
    const [assignmentsLoading, setAssignmentsLoading] = useState(false);
    const [materialsLoading, setMaterialsLoading] = useState(false);

    const { courseId } = useParams();
    const navigate = useNavigate();

    // ✅ 백업 방식: 로컬 데이터 사용
    const loadCourseFromLocalData = () => {
        try {
            console.log('🔄 로컬 데이터에서 강의 정보 로드 시도...');

            const dashboardData = getDashboardData();
            if (!dashboardData || !dashboardData.courses) {
                throw new Error('로컬 데이터가 없습니다.');
            }

            // courseId로 강의 찾기 (여러 방식으로 시도)
            let course = dashboardData.courses.find(c => c.id === courseId);
            if (!course) {
                course = dashboardData.courses.find(c => String(c.id) === String(courseId));
            }
            if (!course) {
                course = dashboardData.courses.find(c => c.id === decodeURIComponent(courseId));
            }

            if (course) {
                console.log('✅ 로컬 데이터에서 강의 찾음:', course);
                setCourseData(course);

                // 로컬 데이터에서 관련 데이터도 로드
                const courseAnnouncements = dashboardData.announcements?.filter(a =>
                    a.course === course.name || a.courseId === course.id
                ) || [];

                const courseAssignments = dashboardData.assignments?.filter(a =>
                    a.course === course.name || a.courseId === course.id
                ) || [];

                setAnnouncements(courseAnnouncements);
                setAssignments(courseAssignments);
                setMaterials(course.materials || []);

                return true; // 성공
            }

            return false; // 실패
        } catch (error) {
            console.error('로컬 데이터 로드 실패:', error);
            return false;
        }
    };

    // ✅ API를 통한 강의 정보 로드 (에러 처리 강화)
    const loadCourseDetail = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🌐 API를 통한 강의 정보 로드 시작:', courseId);

            // 먼저 로컬 데이터 시도
            if (loadCourseFromLocalData()) {
                console.log('✅ 로컬 데이터 로드 성공');
                setLoading(false);
                return;
            }

            // 로컬 데이터 실패시 API 호출
            console.log('🌐 API 호출 시도...');
            const response = await CourseAPI.getCourse(courseId);

            if (response && response.success) {
                setCourseData(response.data);
                console.log('✅ API 강의 정보 로드 성공:', response.data);

                // 공지사항도 로드 시도 (실패해도 괜찮음)
                try {
                    await loadAnnouncements();
                } catch (announcementError) {
                    console.warn('공지사항 로드 실패 (무시):', announcementError);
                }
            } else {
                throw new Error(response?.message || '강의 정보를 찾을 수 없습니다.');
            }

        } catch (error) {
            console.error('강의 정보 로드 실패:', error);

            // API 실패시 로컬 데이터로 재시도
            console.log('🔄 API 실패, 로컬 데이터로 재시도...');
            if (loadCourseFromLocalData()) {
                console.log('✅ 로컬 데이터 백업 성공');
                setError(null);
            } else {
                setError('강의 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
            }
        } finally {
            setLoading(false);
        }
    };

    // ✅ 공지사항 로드 (에러 무시)
    const loadAnnouncements = async () => {
        try {
            setAnnouncementsLoading(true);

            const response = await AnnouncementAPI.getAnnouncements(courseId, {
                page: 1,
                limit: 10,
                orderBy: 'createdAt',
                order: 'DESC'
            });

            if (response && response.success) {
                setAnnouncements(response.data.announcements || []);
            }
        } catch (error) {
            console.warn('공지사항 로드 실패 (무시):', error);
            // 에러 무시 - 로컬 데이터나 빈 배열 유지
        } finally {
            setAnnouncementsLoading(false);
        }
    };

    // ✅ 과제 목록 로드 (에러 무시)
    const loadAssignments = async () => {
        try {
            setAssignmentsLoading(true);

            const response = await AssignmentAPI.getAssignments(courseId, {
                page: 1,
                limit: 10,
                orderBy: 'deadline',
                order: 'ASC'
            });

            if (response && response.success) {
                setAssignments(response.data.assignments || []);
            }
        } catch (error) {
            console.warn('과제 목록 로드 실패 (무시):', error);
            // 에러 무시 - 로컬 데이터나 빈 배열 유지
        } finally {
            setAssignmentsLoading(false);
        }
    };

    // ✅ 자료실 목록 로드 (에러 무시)
    const loadMaterials = async () => {
        try {
            setMaterialsLoading(true);

            const response = await ArchiveAPI.getArchives(courseId, {
                page: 1,
                limit: 20,
                orderBy: 'createdAt',
                order: 'DESC'
            });

            if (response && response.success) {
                setMaterials(response.data.archives || []);
            }
        } catch (error) {
            console.warn('자료실 로드 실패 (무시):', error);
            // 에러 무시 - 로컬 데이터나 빈 배열 유지
        } finally {
            setMaterialsLoading(false);
        }
    };

    // 탭 변경 핸들러
    const handleTabChange = (tabName) => {
        setActiveCourseTab(tabName);

        // 탭별로 필요한 데이터 로드 (이미 있으면 스킵)
        switch (tabName) {
            case '공지':
                if (announcements.length === 0 && !announcementsLoading) {
                    loadAnnouncements();
                }
                break;
            case '과제':
                if (assignments.length === 0 && !assignmentsLoading) {
                    loadAssignments();
                }
                break;
            case '자료실':
                if (materials.length === 0 && !materialsLoading) {
                    loadMaterials();
                }
                break;
            default:
                break;
        }
    };

    // 공지사항 클릭 핸들러 (에러 처리)
    const handleAnnouncementClick = async (announcementId) => {
        try {
            // 조회수 증가 시도 (실패해도 페이지 이동은 진행)
            await AnnouncementAPI.incrementViews(courseId, announcementId);
        } catch (error) {
            console.warn('조회수 증가 실패 (무시):', error);
        }

        // 페이지 이동
        navigate(`/student/course/${courseId}/announcement/${announcementId}`);
    };

    // 과제 클릭 핸들러
    const handleAssignmentClick = (assignmentId) => {
        navigate(`/student/course/${courseId}/assignment/${assignmentId}/submit`);
    };

    // 자료 다운로드 핸들러 (에러 처리)
    const handleMaterialDownload = async (materialId, fileName) => {
        try {
            const blob = await ArchiveAPI.downloadArchive(courseId, materialId);

            // 파일 다운로드
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || 'download';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // 다운로드 카운트 증가 시도 (실패해도 무시)
            try {
                await ArchiveAPI.incrementDownloadCount(courseId, materialId);
            } catch (countError) {
                console.warn('다운로드 카운트 증가 실패 (무시):', countError);
            }

        } catch (error) {
            console.error('파일 다운로드 실패:', error);
            alert('파일 다운로드에 실패했습니다.');
        }
    };

    // 컴포넌트 마운트시 데이터 로드
    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }

        setUserData(user);
        loadCourseDetail();
    }, [courseId, navigate]);

    // 로딩 상태
    if (loading) {
        return (
            <div className="cdp-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="cdp-main-layout">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department}
                    />
                    <div className="cdp-content">
                        <div className="cdp-loading-container">
                            <div className="spinner"></div>
                            <p>강의 정보를 불러오고 있습니다...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <div className="cdp-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="cdp-main-layout">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department}
                    />
                    <div className="cdp-content">
                        <div className="cdp-error-container">
                            <i className="cdp-error-icon">⚠️</i>
                            <h2>오류가 발생했습니다</h2>
                            <p>{error}</p>
                            <div className="error-actions">
                                <button onClick={() => loadCourseDetail()}>
                                    다시 시도
                                </button>
                                <button onClick={() => navigate('/student/courses')}>
                                    강의 목록으로
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 강의 데이터가 없는 경우
    if (!courseData) {
        return (
            <div className="cdp-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="cdp-main-layout">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department}
                    />
                    <div className="cdp-content">
                        <div className="error-container">
                            <h2>강의를 찾을 수 없습니다</h2>
                            <p>요청한 강의 정보가 존재하지 않습니다.</p>
                            <button onClick={() => navigate('/student/courses')}>
                                강의 목록으로 돌아가기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cdp-page">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} userData={userData} />
            <div className="cdp-main-layout">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="cdp-main-content">
                    {/* 웰컴 배너 - className 수정 */}
                    <div className="cdp-welcome-banner">
                        <div className="cdp-course-banner">
                            <div className="cdp-course-banner-info">
                                <h2>{courseData?.name || '강의명 없음'}</h2>
                                <span className="cdp-course-code">{courseData?.code || courseData?.id}</span>
                            </div>
                            <div className="cdp-course-banner-meta">
                                <p><strong>담당교수:</strong> {courseData?.professor || '미정'}</p>
                                <p><strong>학점:</strong> {courseData?.credits || courseData?.credit || '미정'}</p>
                                <p><strong>시간:</strong> {
                                    Array.isArray(courseData?.schedule)
                                        ? courseData.schedule.map(s => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')
                                        : courseData?.schedule || courseData?.time || '시간미정'
                                }</p>
                            </div>
                        </div>
                    </div>

                    {/* 강의 콘텐츠 - className 수정 */}
                    <div className="cdp-course-content-container">
                        {/* 탭 메뉴 - className 수정 */}
                        <div className="cdp-course-tabs">
                            {['공지', '과제', '자료실', '강의계획서'].map(tab => (
                                <button
                                    key={tab}
                                    className={`cdp-course-tab ${activeCourseTab === tab ? 'active' : ''}`}
                                    onClick={() => handleTabChange(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* 탭 콘텐츠 - className 수정 */}
                        <div className="cdp-card cdp-course-detail-card">
                            <div className="cdp-card-header">
                                <h3>{activeCourseTab}</h3>
                            </div>
                            <div className="cdp-card-body cdp-course-detail-card-body">
                                {/* 공지사항 탭 */}
                                {activeCourseTab === '공지' && (
                                    <div>
                                        {announcementsLoading ? (
                                            <div className="cdp-loading-container">
                                                <div className="cdp-loading-spinner"></div>
                                                <p>공지사항을 불러오고 있습니다...</p>
                                            </div>
                                        ) : announcements.length > 0 ? (
                                            announcements.map(announcement => (
                                                <div
                                                    key={announcement.id}
                                                    className="cdp-notice-item"
                                                    onClick={() => handleAnnouncementClick(announcement.id)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="cdp-notice-date">
                                                        {new Date(announcement.createdAt || announcement.date).toLocaleDateString()}
                                                    </div>
                                                    <h4 className="cdp-notice-title">
                                                        {announcement.isNew && <span className="cdp-new-badge">NEW</span>}
                                                        {announcement.title}
                                                    </h4>
                                                    <div className="cdp-notice-content">
                                                        {announcement.content?.substring(0, 100)}...
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="cdp-empty-message">
                                                등록된 공지사항이 없습니다.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 과제 탭 */}
                                {activeCourseTab === '과제' && (
                                    <div>
                                        {assignmentsLoading ? (
                                            <div className="cdp-loading-container">
                                                <div className="cdp-loading-spinner"></div>
                                                <p>과제 목록을 불러오고 있습니다...</p>
                                            </div>
                                        ) : assignments.length > 0 ? (
                                            assignments.map(assignment => (
                                                <div key={assignment.id} className="cdp-assignment-item">
                                                    <div className="cdp-assignment-header">
                                                        <h4 className="cdp-assignment-title">{assignment.title}</h4>
                                                        <span className="cdp-assignment-status">
                                                            {assignment.status || '미제출'}
                                                        </span>
                                                    </div>
                                                    <div className="cdp-assignment-content">
                                                        {assignment.description}
                                                    </div>
                                                    <div className="cdp-assignment-meta">
                                                        <div className="cdp-assignment-deadline">
                                                            <i className="fas fa-clock"></i>
                                                            마감: {new Date(assignment.deadline || assignment.dueDate).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <div className="cdp-assignment-actions">
                                                        <button
                                                            className="cdp-btn cdp-btn-primary cdp-btn-sm"
                                                            onClick={() => handleAssignmentClick(assignment.id)}
                                                        >
                                                            과제 제출
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="cdp-empty-message">
                                                등록된 과제가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 자료실 탭 */}
                                {activeCourseTab === '자료실' && (
                                    <div>
                                        {materialsLoading ? (
                                            <div className="cdp-loading-container">
                                                <div className="cdp-loading-spinner"></div>
                                                <p>자료를 불러오고 있습니다...</p>
                                            </div>
                                        ) : materials.length > 0 ? (
                                            materials.map(material => (
                                                <div key={material.id} className="cdp-material-item">
                                                    <div className="cdp-material-left">
                                                        <div className="cdp-material-icon">📄</div>
                                                        <div>
                                                            <h4 className="cdp-material-title">{material.title || material.name}</h4>
                                                            <div className="cdp-material-meta">
                                                                <span className="cdp-material-date">
                                                                    {new Date(material.createdAt || material.date).toLocaleDateString()}
                                                                </span>
                                                                <span>크기: {material.size || '알 수 없음'}</span>
                                                            </div>
                                                            <div className="cdp-notice-content">
                                                                {material.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="cdp-btn cdp-btn-outline cdp-btn-sm"
                                                        onClick={() => handleMaterialDownload(material.id, material.fileName || material.name)}
                                                    >
                                                        다운로드
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="cdp-empty-message">
                                                등록된 자료가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 강의계획서 탭 */}
                                {activeCourseTab === '강의계획서' && (
                                    <div>
                                        <div className="cdp-syllabus-section">
                                            <h3>강의 목표</h3>
                                            <p>{courseData?.objectives || courseData?.description || '강의 목표가 등록되지 않았습니다.'}</p>
                                        </div>
                                        <div className="cdp-syllabus-section">
                                            <h3>강의 내용</h3>
                                            <p>{courseData?.syllabus || courseData?.content || '강의 내용이 등록되지 않았습니다.'}</p>
                                        </div>
                                        <div className="cdp-syllabus-section">
                                            <h3>평가 방법</h3>
                                            <p>{courseData?.grading || '평가 방법이 등록되지 않았습니다.'}</p>
                                        </div>
                                        <div className="cdp-syllabus-section">
                                            <h3>선수과목</h3>
                                            <p>{courseData?.prerequisites?.join(', ') || '선수과목이 없습니다.'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetailPage;