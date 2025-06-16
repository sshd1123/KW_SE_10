import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/CreateAnnouncementPage.css';

const CreateAnnouncementPage = () => {
    const [userData, setUserData] = useState(null);
    const [professorData, setProfessorData] = useState(null);
    const [courseData, setCourseData] = useState(null);
    const [originalAnnouncement, setOriginalAnnouncement] = useState(null);
    const [activeTab, setActiveTab] = useState('announcements');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // 공지사항 폼 데이터
    const [announcement, setAnnouncement] = useState({
        title: '',
        content: '',
        priority: 'normal',
        isPinned: false,
        isUrgent: false,
        allowComments: true,
        notifyStudents: true,
        scheduledDate: '',
        attachments: []
    });

    const [errors, setErrors] = useState({});
    const [previewMode, setPreviewMode] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    
    const { courseId, announcementId } = useParams();
    const navigate = useNavigate();

    // 수정 모드인지 확인
    const isEditMode = !!announcementId;

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

        // 수정 모드인 경우 기존 공지사항 찾기
        if (isEditMode) {
            const foundAnnouncement = dashboardData.announcements?.find(ann => ann.id === announcementId);
            if (!foundAnnouncement) {
                alert('공지사항을 찾을 수 없습니다.');
                navigate('/professor/courses');
                return;
            }

            // 권한 확인 (작성자만 수정 가능)
            if (foundAnnouncement.authorId !== user.professorId) {
                alert('이 공지사항을 수정할 권한이 없습니다.');
                navigate(-1);
                return;
            }

            setOriginalAnnouncement(foundAnnouncement);
            
            // 기존 데이터로 폼 초기화
            setAnnouncement({
                title: foundAnnouncement.title || '',
                content: foundAnnouncement.content || '',
                priority: foundAnnouncement.priority || 'normal',
                isPinned: foundAnnouncement.isPinned || false,
                isUrgent: foundAnnouncement.isUrgent || false,
                allowComments: foundAnnouncement.allowComments !== false,
                notifyStudents: false, // 수정 시에는 기본적으로 알림 안함
                scheduledDate: '', // 수정 시에는 즉시 업데이트
                attachments: foundAnnouncement.attachments || []
            });
        }

        // 강의 데이터 찾기
        const course = dashboardData.courses?.find(c => c.id === courseId);
        if (!course) {
            alert('강의를 찾을 수 없습니다.');
            navigate('/professor/courses');
            return;
        }

        setCourseData(course);
        setLoading(false);
    }, [navigate, courseId, announcementId, isEditMode]);

    // 변경사항 감지 (수정 모드에서만)
    useEffect(() => {
        if (!isEditMode || !originalAnnouncement) {
            setHasChanges(announcement.title.trim() !== '' || announcement.content.trim() !== '');
            return;
        }
        
        const hasChanged = 
            announcement.title !== originalAnnouncement.title ||
            announcement.content !== originalAnnouncement.content ||
            announcement.priority !== originalAnnouncement.priority ||
            announcement.isPinned !== originalAnnouncement.isPinned ||
            announcement.isUrgent !== originalAnnouncement.isUrgent ||
            announcement.allowComments !== (originalAnnouncement.allowComments !== false);
            
        setHasChanges(hasChanged);
    }, [announcement, originalAnnouncement, isEditMode]);

    // 폼 데이터 변경 핸들러
    const handleInputChange = (field, value) => {
        setAnnouncement(prev => ({
            ...prev,
            [field]: value
        }));
        
        // 에러 메시지 제거
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // 폼 유효성 검사
    const validateForm = () => {
        const newErrors = {};

        if (!announcement.title.trim()) {
            newErrors.title = '제목을 입력해주세요.';
        } else if (announcement.title.length > 100) {
            newErrors.title = '제목은 100자 이내로 입력해주세요.';
        }

        if (!announcement.content.trim()) {
            newErrors.content = '내용을 입력해주세요.';
        } else if (announcement.content.length < 10) {
            newErrors.content = '내용은 최소 10자 이상 입력해주세요.';
        }

        if (announcement.scheduledDate) {
            const scheduleDate = new Date(announcement.scheduledDate);
            const now = new Date();
            if (scheduleDate <= now) {
                newErrors.scheduledDate = '예약 발행일은 현재 시간보다 미래여야 합니다.';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 원본으로 되돌리기 (수정 모드에서만)
    const handleReset = () => {
        if (!isEditMode || !originalAnnouncement) return;
        
        if (window.confirm('원본 내용으로 되돌리시겠습니까? 현재 수정 중인 내용이 모두 사라집니다.')) {
            setAnnouncement({
                title: originalAnnouncement.title || '',
                content: originalAnnouncement.content || '',
                priority: originalAnnouncement.priority || 'normal',
                isPinned: originalAnnouncement.isPinned || false,
                isUrgent: originalAnnouncement.isUrgent || false,
                allowComments: originalAnnouncement.allowComments !== false,
                notifyStudents: false,
                scheduledDate: '',
                attachments: originalAnnouncement.attachments || []
            });
            setErrors({});
        }
    };

    // 공지사항 발행/수정
    const handlePublish = async () => {
        if (!validateForm()) {
            return;
        }

        if (isEditMode && !hasChanges) {
            alert('변경된 내용이 없습니다.');
            return;
        }

        setSaving(true);
        
        try {
            if (isEditMode) {
                // 수정 모드
                const updatedAnnouncement = {
                    ...originalAnnouncement,
                    ...announcement,
                    updatedAt: new Date().toISOString(),
                    status: 'published'
                };

                console.log('수정된 공지사항:', updatedAnnouncement);
                alert('공지사항이 성공적으로 수정되었습니다.');
                
                // 공지사항 상세 페이지로 이동
                navigate(`/professor/announcement/${announcementId}`);
            } else {
                // 새 작성 모드
                const newAnnouncement = {
                    id: Date.now().toString(),
                    ...announcement,
                    courseId: courseData.id,
                    courseName: courseData.name,
                    authorId: userData.professorId,
                    authorName: userData.name,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    views: 0,
                    comments: [],
                    status: announcement.scheduledDate ? 'scheduled' : 'published'
                };

                console.log('새 공지사항:', newAnnouncement);
                alert('공지사항이 성공적으로 발행되었습니다.');
                
                // 강의 상세 페이지로 이동
                navigate(`/professor/course/${courseId}`);
            }

            // 임시저장 데이터 삭제
            const draftKey = isEditMode 
                ? `announcement_edit_draft_${announcementId}`
                : `announcement_draft_${courseId}`;
            localStorage.removeItem(draftKey);
            
        } catch (error) {
            console.error('공지사항 처리 실패:', error);
            alert(`공지사항 ${isEditMode ? '수정' : '발행'} 중 오류가 발생했습니다. 다시 시도해주세요.`);
        } finally {
            setSaving(false);
        }
    };

    // 취소
    const handleCancel = () => {
        const hasAnyChanges = isEditMode ? hasChanges : (announcement.title || announcement.content);
        if (hasAnyChanges) {
            const confirmCancel = window.confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?');
            if (!confirmCancel) return;
        }
        
        if (isEditMode) {
            navigate(`/professor/announcement/${announcementId}`);
        } else {
            navigate(`/professor/course/${courseId}`);
        }
    };

    // 파일 첨부 핸들러
    const handleFileAttach = (event) => {
        const files = Array.from(event.target.files);
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
        
        const validFiles = files.filter(file => {
            if (file.size > maxSize) {
                alert(`${file.name}은 10MB를 초과합니다.`);
                return false;
            }
            if (!allowedTypes.some(type => file.type.startsWith(type))) {
                alert(`${file.name}은 지원하지 않는 파일 형식입니다.`);
                return false;
            }
            return true;
        });

        setAnnouncement(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...validFiles.map(file => ({
                id: Date.now() + Math.random(),
                name: file.name,
                size: file.size,
                type: file.type,
                file: file
            }))]
        }));
    };

    // 첨부파일 제거
    const removeAttachment = (attachmentId) => {
        setAnnouncement(prev => ({
            ...prev,
            attachments: prev.attachments.filter(att => att.id !== attachmentId)
        }));
    };

    // 파일 크기 포맷
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="ca-page">
                <Header username={userData?.name || '교수님'} role="교수" />
                <div className="ca-main-layout">
                    <ProfessorSidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        professorName={userData?.name || ''}
                        professorId={userData?.professorId || ''}
                        department={userData?.department || ''}
                    />
                    <main className="ca-main-content">
                        <div className="ca-loading-container">
                            <div className="ca-loading-spinner"></div>
                            <p>페이지를 불러오는 중입니다...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!courseData) {
        return (
            <div className="ca-page">
                <Header username={userData?.name || '교수님'} role="교수" />
                <div className="ca-main-layout">
                    <ProfessorSidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        professorName={userData?.name || ''}
                        professorId={userData?.professorId || ''}
                        department={userData?.department || ''}
                    />
                    <main className="ca-main-content">
                        <div className="ca-error-container">
                            <h2>강의를 찾을 수 없습니다.</h2>
                            <button className="ca-btn ca-btn-primary" onClick={() => navigate('/professor/courses')}>
                                강의 목록으로 이동
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="ca-page">
            <Header username={userData?.name || '교수님'} role="교수" />

            <div className="ca-main-layout">
                <ProfessorSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    professorName={userData?.name || ''}
                    professorId={userData?.professorId || ''}
                    department={userData?.department || ''}
                />

                <main className="ca-main-content">
                    {/* 헤더 영역 */}
                    <div className="ca-header">
                        <div className="ca-breadcrumb">
                            <span onClick={() => navigate('/professor/courses')} className="ca-breadcrumb-link">
                                강의 관리
                            </span>
                            <i className="fas fa-chevron-right"></i>
                            <span onClick={() => navigate(`/professor/course/${courseData.id}`)} className="ca-breadcrumb-link">
                                {courseData.name}
                            </span>
                            <i className="fas fa-chevron-right"></i>
                            {isEditMode ? (
                                <>
                                    <span onClick={() => navigate(`/professor/announcement/${announcementId}`)} className="ca-breadcrumb-link">
                                        공지사항
                                    </span>
                                    <i className="fas fa-chevron-right"></i>
                                    <span className="ca-breadcrumb-current">수정</span>
                                </>
                            ) : (
                                <span className="ca-breadcrumb-current">공지사항 작성</span>
                            )}
                        </div>
                        
                        <div className="ca-course-info">
                            <h1>{isEditMode ? '공지사항 수정' : '공지사항 작성'}</h1>
                            <div className="ca-course-meta">
                                <span className="ca-course-name">{courseData.name}</span>
                                <span className="ca-course-code">({courseData.id})</span>
                                <span className="ca-course-students">{courseData.enrolled}명 수강</span>
                                {isEditMode && hasChanges && <span className="ca-changes-indicator">• 수정됨</span>}
                            </div>
                        </div>
                    </div>

                    {/* 메인 컨텐츠 */}
                    <div className="ca-content">
                        <div className="ca-editor-container">
                            {/* 에디터 모드 탭 */}
                            <div className="ca-editor-tabs">
                                <button 
                                    className={`ca-tab ${!previewMode ? 'active' : ''}`}
                                    onClick={() => setPreviewMode(false)}
                                >
                                    <i className="fas fa-edit"></i> {isEditMode ? '수정' : '작성'}
                                </button>
                                <button 
                                    className={`ca-tab ${previewMode ? 'active' : ''}`}
                                    onClick={() => setPreviewMode(true)}
                                >
                                    <i className="fas fa-eye"></i> 미리보기
                                </button>
                            </div>

                            {/* 작성 모드 */}
                            {!previewMode && (
                                <div className="ca-editor">
                                    <div className="ca-form-group">
                                        <label htmlFor="title" className="ca-label">
                                            제목 <span className="ca-required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="title"
                                            className={`ca-input ${errors.title ? 'error' : ''}`}
                                            placeholder="공지사항 제목을 입력하세요"
                                            value={announcement.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            maxLength={100}
                                        />
                                        {errors.title && <div className="ca-error-message">{errors.title}</div>}
                                        <div className="ca-char-count">{announcement.title.length}/100</div>
                                    </div>

                                    <div className="ca-form-group">
                                        <label htmlFor="content" className="ca-label">
                                            내용 <span className="ca-required">*</span>
                                        </label>
                                        <textarea
                                            id="content"
                                            className={`ca-textarea ${errors.content ? 'error' : ''}`}
                                            placeholder="공지사항 내용을 입력하세요&#10;&#10;• 수강생들에게 전달하고 싶은 내용을 상세히 작성해주세요&#10;• 중요한 일정이나 변경사항이 있다면 명확히 기재해주세요&#10;• 문의사항이 있을 경우 연락 방법을 포함해주세요"
                                            rows="12"
                                            value={announcement.content}
                                            onChange={(e) => handleInputChange('content', e.target.value)}
                                        />
                                        {errors.content && <div className="ca-error-message">{errors.content}</div>}
                                        <div className="ca-char-count">{announcement.content.length}자</div>
                                    </div>

                                    {/* 첨부파일 */}
                                    <div className="ca-form-group">
                                        <label className="ca-label">첨부파일</label>
                                        <div className="ca-file-upload">
                                            <input
                                                type="file"
                                                id="file-upload"
                                                multiple
                                                onChange={handleFileAttach}
                                                className="ca-file-input"
                                                accept="image/*,.pdf,.doc,.docx,.hwp"
                                            />
                                            <label htmlFor="file-upload" className="ca-file-upload-btn">
                                                <i className="fas fa-paperclip"></i>
                                                파일 첨부
                                            </label>
                                            <span className="ca-file-help">
                                                이미지, PDF, 문서 파일 (최대 10MB)
                                            </span>
                                        </div>
                                        
                                        {announcement.attachments.length > 0 && (
                                            <div className="ca-attachments">
                                                {announcement.attachments.map(attachment => (
                                                    <div key={attachment.id} className="ca-attachment-item">
                                                        <div className="ca-attachment-info">
                                                            <i className="fas fa-file"></i>
                                                            <span className="ca-attachment-name">{attachment.name}</span>
                                                            <span className="ca-attachment-size">
                                                                ({formatFileSize(attachment.size)})
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="ca-attachment-remove"
                                                            onClick={() => removeAttachment(attachment.id)}
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* 옵션 설정 */}
                                    <div className="ca-options">
                                        <div className="ca-options-row">
                                        </div>

                                        <div className="ca-checkboxes">
                                            <label className="ca-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={announcement.isPinned}
                                                    onChange={(e) => handleInputChange('isPinned', e.target.checked)}
                                                />
                                                <span className="ca-checkbox-mark"></span>
                                                <span className="ca-checkbox-text">상단 고정</span>
                                            </label>

                                            <label className="ca-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={announcement.isUrgent}
                                                    onChange={(e) => handleInputChange('isUrgent', e.target.checked)}
                                                />
                                                <span className="ca-checkbox-mark"></span>
                                                <span className="ca-checkbox-text">긴급 공지</span>
                                            </label>

                                            <label className="ca-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={announcement.notifyStudents}
                                                    onChange={(e) => handleInputChange('notifyStudents', e.target.checked)}
                                                />
                                                <span className="ca-checkbox-mark"></span>
                                                <span className="ca-checkbox-text">학생 알림</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 미리보기 모드 */}
                            {previewMode && (
                                <div className="ca-preview">
                                    <div className="ca-preview-header">
                                        <div className="ca-preview-meta">
                                            <span className="ca-preview-course">{courseData.name}</span>
                                            <span className="ca-preview-date">
                                                {announcement.scheduledDate || new Date().toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="ca-preview-badges">
                                            {announcement.isPinned && <span className="ca-badge ca-badge-pinned">고정</span>}
                                            {announcement.isUrgent && <span className="ca-badge ca-badge-urgent">긴급</span>}
                                            {announcement.priority === 'important' && <span className="ca-badge ca-badge-important">중요</span>}
                                        </div>
                                    </div>
                                    
                                    <h2 className="ca-preview-title">
                                        {announcement.title || '제목을 입력해주세요'}
                                    </h2>
                                    
                                    <div className="ca-preview-content">
                                        {announcement.content ? (
                                            announcement.content.split('\n').map((line, index) => (
                                                <p key={index}>{line || '\u00A0'}</p>
                                            ))
                                        ) : (
                                            <p className="ca-preview-placeholder">내용을 입력해주세요</p>
                                        )}
                                    </div>

                                    {announcement.attachments.length > 0 && (
                                        <div className="ca-preview-attachments">
                                            <h4>첨부파일</h4>
                                            <ul>
                                                {announcement.attachments.map(attachment => (
                                                    <li key={attachment.id}>
                                                        <i className="fas fa-file"></i>
                                                        {attachment.name}
                                                        <span className="ca-file-size">({formatFileSize(attachment.size)})</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="ca-preview-footer">
                                        <span className="ca-preview-author">작성자: {userData.name}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 액션 버튼 */}
                        <div className="ca-actions">
                            <div className="ca-actions-left">
                                {isEditMode && (
                                    <button 
                                        type="button"
                                        className="ca-btn ca-btn-outline"
                                        onClick={handleReset}
                                        disabled={!hasChanges}
                                    >
                                        <i className="fas fa-undo"></i>
                                        원본으로 되돌리기
                                    </button>
                                )}
                            </div>
                            
                            <div className="ca-actions-right">
                                <button 
                                    type="button"
                                    className="ca-btn ca-btn-outline"
                                    onClick={handleCancel}
                                >
                                    취소
                                </button>
                                <button 
                                    type="button"
                                    className={`ca-btn ca-btn-primary ${isEditMode && !hasChanges ? 'ca-btn-disabled' : ''}`}
                                    onClick={handlePublish}
                                    disabled={saving || (isEditMode && !hasChanges)}
                                >
                                    {saving ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            {isEditMode ? '저장 중...' : '발행 중...'}
                                        </>
                                    ) : (
                                        <>
                                            <i className={`fas ${isEditMode ? 'fa-check' : 'fa-paper-plane'}`}></i>
                                            {isEditMode 
                                                ? '수정 완료'
                                                : '작성 완료'
                                            }
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CreateAnnouncementPage;