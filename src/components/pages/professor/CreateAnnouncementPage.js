// CreateAnnouncementPage.js - 공지사항 작성 페이지
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getCurrentUser } from '../../../data/authUtils';
import { AnnouncementAPI, CourseAPI } from '../../../services/api';
import '../../styles/CreateAnnouncementPage.css';

const CreateAnnouncementPage = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [courses, setCourses] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    // 공지사항 폼 데이터
    const [formData, setFormData] = useState({
        courseId: '',
        title: '',
        content: '',
        isPinned: false,
        isUrgent: false,
        publishDate: '',
        expiryDate: ''
    });

    const navigate = useNavigate();
    const { courseId, announcementId } = useParams();
    const isEditMode = !!announcementId;

    // 교수의 담당 강의 목록 로드
    const loadProfessorCourses = async () => {
        try {
            setLoading(true);
            setError(null); // 이전 오류 초기화

            // 사용자 데이터 검증
            if (!userData?.id && !userData?.professorId) {
                throw new Error('교수 ID가 없습니다. 다시 로그인해주세요.');
            }

            const response = await CourseAPI.searchCourses({
                professorId: userData?.id || userData?.professorId,
                semester: '2025-1'
            });

            if (response.success) {
                setCourses(response.data.courses || []);
            } else {
                // API에서 반환한 구체적인 오류 메시지 사용
                setError(response.message || '담당 강의 목록을 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('담당 강의 목록 로드 실패:', error);

            // 오류 유형별 메시지 분기
            let errorMessage = '담당 강의 목록을 불러오는 중 오류가 발생했습니다.';

            if (error.message.includes('401')) {
                errorMessage = '로그인이 만료되었습니다. 다시 로그인해주세요.';
            } else if (error.message.includes('403')) {
                errorMessage = '강의 목록에 접근할 권한이 없습니다.';
            } else if (error.message.includes('404')) {
                errorMessage = '해당 학기의 강의 정보를 찾을 수 없습니다.';
            } else if (error.message.includes('Network Error')) {
                errorMessage = '네트워크 연결을 확인해주세요.';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    // 기존 공지사항 로드 (수정 모드)
    const loadExistingAnnouncement = async () => {
        if (!isEditMode || !courseId || !announcementId) return;
        try {
            setLoading(true);
            const response = await AnnouncementAPI.getAnnouncement(courseId, announcementId);
            if (response.success) {
                const announcement = response.data;
                setFormData({
                    courseId: courseId,
                    title: announcement.title || '',
                    content: announcement.content || '',
                    isPinned: announcement.isPinned || false,
                    isUrgent: announcement.isUrgent || false,
                    publishDate: announcement.publishDate ? new Date(announcement.publishDate).toISOString().slice(0, 16) : '',
                    expiryDate: announcement.expiryDate ? new Date(announcement.expiryDate).toISOString().slice(0, 16) : ''
                });
            } else {
                setError(response.message || '공지사항을 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('공지사항 로드 실패:', error);
            setError('공지사항을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 폼 입력 핸들러
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (error) setError(null);
    };

    // 폼 검증
    const validateForm = () => {
        if (!formData.courseId) {
            setError('강의를 선택해주세요.');
            return false;
        }
        if (!formData.title.trim()) {
            setError('제목을 입력해주세요.');
            return false;
        }
        if (!formData.content.trim()) {
            setError('내용을 입력해주세요.');
            return false;
        }
        if (formData.title.length > 100) {
            setError('제목은 100자 이내로 입력해주세요.');
            return false;
        }
        if (formData.content.length > 5000) {
            setError('내용은 5000자 이내로 입력해주세요.');
            return false;
        }
        return true;
    };

    // 공지사항 작성/수정 제출
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setSubmitting(true);
            setError(null);
            setSuccess(null);

            const submitData = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                isPinned: formData.isPinned,
                isUrgent: formData.isUrgent,
                publishDate: formData.publishDate || null,
                expiryDate: formData.expiryDate || null
            };

            let response;
            if (isEditMode) {
                response = await AnnouncementAPI.updateAnnouncement(
                    formData.courseId,
                    announcementId,
                    submitData
                );
            } else {
                response = await AnnouncementAPI.createAnnouncement(
                    formData.courseId,
                    submitData
                );
            }

            if (response.success) {
                const successMessage = isEditMode ? '공지사항이 수정되었습니다.' : '공지사항이 작성되었습니다.';
                setSuccess(successMessage);
                setTimeout(() => {
                    navigate(`/professor/course/${formData.courseId}`);
                }, 2000);
            } else {
                setError(response.message || (isEditMode ? '공지사항 수정에 실패했습니다.' : '공지사항 작성에 실패했습니다.'));
            }
        } catch (error) {
            console.error(isEditMode ? '공지사항 수정 오류:' : '공지사항 작성 오류:', error);
            let errorMessage = isEditMode ? '공지사항 수정 중 오류가 발생했습니다.' : '공지사항 작성 중 오류가 발생했습니다.';
            if (error.message.includes('403')) {
                errorMessage = '해당 강의의 공지사항을 작성할 권한이 없습니다.';
            } else if (error.message.includes('404')) {
                errorMessage = isEditMode ? '수정할 공지사항을 찾을 수 없습니다.' : '강의를 찾을 수 없습니다.';
            }
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // 공지사항 삭제 (수정 모드에서만)
    const handleDelete = async () => {
        if (!isEditMode) return;
        if (!window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) return;

        try {
            setSubmitting(true);
            setError(null);
            const response = await AnnouncementAPI.deleteAnnouncement(courseId, announcementId);
            if (response.success) {
                alert('공지사항이 삭제되었습니다.');
                navigate(`/professor/course/${courseId}`);
            } else {
                setError(response.message || '공지사항 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('공지사항 삭제 오류:', error);
            setError('공지사항 삭제 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    // 컴포넌트 마운트시 데이터 로드
    useEffect(() => {
        const user = getCurrentUser();
        if (!user || user.role !== 'professor') {
            navigate('/login');
            return;
        }
        setUserData(user);
    }, [navigate]);

    useEffect(() => {
        if (userData) {
            loadProfessorCourses();

            // URL에 courseId가 있으면 직접 설정 (임시 해결책)
            if (courseId && !formData.courseId) {
                setFormData(prev => ({ ...prev, courseId }));
            }

            if (isEditMode) {
                loadExistingAnnouncement();
            }
        }
    }, [userData, isEditMode, courseId, announcementId]);

    // 로딩 상태 - className 수정
    if (loading) {
        return (
            <div className="ca-loading-container">
                <div className="ca-loading-spinner"></div>
                <p>로딩 중...</p>
            </div>
        );
    }

    // 선택된 강의 정보
    const selectedCourse = courses.find(course => course.id === formData.courseId);

    return (
        <div className="ca-page">
            <Header activeTab="courses" setActiveTab={() => { }} userData={userData} />
            <div className="ca-main-layout">
                <ProfessorSidebar activeTab="courses" setActiveTab={() => { }} />
                <div className="ca-main-content">
                    {/* 헤더 섹션 - className 수정 */}
                    <div className="ca-header">
                        <div className="ca-breadcrumb">
                            <span
                                className="ca-breadcrumb-link"
                                onClick={() => navigate('/professor/dashboard')}
                            >
                                대시보드
                            </span>
                            <i className="fas fa-chevron-right"></i>
                            <span
                                className="ca-breadcrumb-link"
                                onClick={() => navigate('/professor/courses')}
                            >
                                강의 관리
                            </span>
                            {selectedCourse && (
                                <>
                                    <i className="fas fa-chevron-right"></i>
                                    <span
                                        className="ca-breadcrumb-link"
                                        onClick={() => navigate(`/professor/course/${selectedCourse.id}`)}
                                    >
                                        {selectedCourse.name}
                                    </span>
                                </>
                            )}
                            <i className="fas fa-chevron-right"></i>
                            <span className="ca-breadcrumb-current">
                                {isEditMode ? '공지사항 수정' : '공지사항 작성'}
                            </span>
                        </div>

                        <div className="ca-course-info">
                            <h1>{isEditMode ? '공지사항 수정' : '공지사항 작성'}</h1>
                            {selectedCourse && (
                                <div className="ca-course-meta">
                                    <span className="ca-course-name">{selectedCourse.name}</span>
                                    <span className="ca-course-code">({selectedCourse.code})</span>
                                    <span className="ca-course-students">
                                        수강생 {selectedCourse.enrolledStudents || 0}명
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 콘텐츠 섹션 - className 수정 */}
                    <div className="ca-content">
                        {/* 에러/성공 메시지 */}
                        {error && (
                            <div className="ca-error-container">
                                <i className="fas fa-exclamation-triangle"></i>
                                <p>{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="ca-success-container">
                                <i className="fas fa-check-circle"></i>
                                <p>{success}</p>
                            </div>
                        )}

                        {/* 에디터 컨테이너 - className 수정 */}
                        <div className="ca-editor-container">
                            {/* 에디터 탭 - className 수정 */}
                            <div className="ca-editor-tabs">
                                <button
                                    className={`ca-tab ${!showPreview ? 'active' : ''}`}
                                    onClick={() => setShowPreview(false)}
                                >
                                    <i className="fas fa-edit"></i>
                                    작성
                                </button>
                                <button
                                    className={`ca-tab ${showPreview ? 'active' : ''}`}
                                    onClick={() => setShowPreview(true)}
                                >
                                    <i className="fas fa-eye"></i>
                                    미리보기
                                </button>
                            </div>

                            {/* 작성 모드 */}
                            {!showPreview && (
                                <form onSubmit={handleSubmit} className="ca-editor">
                                    {/* 강의 선택 - className 수정 */}
                                    <div className="ca-form-group">
                                        <label className="ca-label">
                                            강의 선택<span className="ca-required">*</span>
                                        </label>
                                        <select
                                            name="courseId"
                                            value={formData.courseId}
                                            onChange={handleInputChange}
                                            className="ca-select"
                                            disabled={isEditMode}
                                        >
                                            <option value="">강의를 선택하세요</option>
                                            {courses.map(course => (
                                                <option key={course.id} value={course.id}>
                                                    {course.name} ({course.code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 제목 입력 - className 수정 */}
                                    <div className="ca-form-group">
                                        <label className="ca-label">
                                            제목<span className="ca-required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder="공지사항 제목을 입력하세요"
                                            className="ca-input"
                                            maxLength={100}
                                        />
                                        <div className="ca-char-count">
                                            {formData.title.length}/100
                                        </div>
                                    </div>

                                    {/* 내용 입력 - className 수정 */}
                                    <div className="ca-form-group">
                                        <label className="ca-label">
                                            내용<span className="ca-required">*</span>
                                        </label>
                                        <textarea
                                            name="content"
                                            value={formData.content}
                                            onChange={handleInputChange}
                                            placeholder="공지사항 내용을 입력하세요"
                                            className="ca-textarea"
                                            maxLength={5000}
                                        />
                                        <div className="ca-char-count">
                                            {formData.content.length}/5000
                                        </div>
                                    </div>
                                </form>
                            )}

                            {/* 미리보기 모드 - className 수정 */}
                            {showPreview && (
                                <div className="ca-preview">
                                    <div className="ca-preview-header">
                                        <div className="ca-preview-meta">
                                            <div className="ca-preview-course">
                                                {selectedCourse?.name || '강의 선택 필요'}
                                            </div>
                                            <div className="ca-preview-date">
                                                {new Date().toLocaleDateString('ko-KR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                        <div className="ca-preview-badges">
                                            {formData.isPinned && (
                                                <span className="ca-badge ca-badge-pinned">고정</span>
                                            )}
                                            {formData.isUrgent && (
                                                <span className="ca-badge ca-badge-urgent">긴급</span>
                                            )}
                                        </div>
                                    </div>

                                    <h2 className="ca-preview-title">
                                        {formData.title || '제목을 입력하세요'}
                                    </h2>

                                    <div className="ca-preview-content">
                                        {formData.content ? (
                                            formData.content.split('\n').map((line, index) => (
                                                <p key={index}>{line}</p>
                                            ))
                                        ) : (
                                            <p className="ca-preview-placeholder">내용을 입력하세요</p>
                                        )}
                                    </div>

                                    <div className="ca-preview-footer">
                                        <span>작성자: {userData?.name || '교수'}</span>
                                        <span>조회수: 0</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 액션 버튼 - className 수정 */}
                        <div className="ca-actions">
                            <div className="ca-actions-left">
                                <button
                                    type="button"
                                    className="ca-btn ca-btn-outline"
                                    onClick={() => navigate(selectedCourse ? `/professor/course/${selectedCourse.id}` : '/professor/courses')}
                                >
                                    <i className="fas fa-arrow-left"></i>
                                    취소
                                </button>
                            </div>
                            <div className="ca-actions-right">
                                {isEditMode && (
                                    <button
                                        type="button"
                                        className="ca-btn ca-btn-secondary"
                                        onClick={handleDelete}
                                        disabled={submitting}
                                    >
                                        <i className="fas fa-trash"></i>
                                        삭제
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="ca-btn ca-btn-primary"
                                    onClick={handleSubmit}
                                    disabled={submitting || !formData.courseId || !formData.title.trim() || !formData.content.trim()}
                                >
                                    {submitting ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            {isEditMode ? '수정 중...' : '작성 중...'}
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save"></i>
                                            {isEditMode ? '수정 완료' : '작성 완료'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateAnnouncementPage;
