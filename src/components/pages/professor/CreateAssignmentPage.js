import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import { AssignmentAPI, CourseAPI } from '../../../services/api';
import '../../styles/CreateAssignmentPage.css';

const CreateAssignmentPage = () => {
    const [userData, setUserData] = useState(null);
    const [courseData, setCourseData] = useState(null);
    const [originalAssignment, setOriginalAssignment] = useState(null);
    const [activeTab, setActiveTab] = useState('assignments');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [courses, setCourses] = useState([]);

    // 과제 폼 데이터
    const [assignment, setAssignment] = useState({
        title: '',
        description: '',
        instructions: '',
        maxScore: 100,
        deadline: '',
        submissionType: 'file',
        allowLateSubmission: false,
        latePenalty: 10,
        teamAssignment: false,
        maxTeamSize: 4,
        attachments: [],
    });

    const [errors, setErrors] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const { courseId, assignmentId } = useParams();
    const navigate = useNavigate();

    // 수정 모드인지 확인
    const isEditMode = !!assignmentId;

    const loadProfessorCourses = async () => {
        try {
            setLoading(true);

            const response = await CourseAPI.searchCourses({
                professorId: userData?.id || userData?.professorId,
                semester: '2025-1'
            });

            if (response.success) {
                setCourses(response.data.courses || []);

                if (courseId) {
                    const course = response.data.courses.find(c => c.id === courseId);
                    if (course) {
                        setCourseData(course);
                    }
                }
            } else {
                setError('담당 강의 목록을 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('담당 강의 목록 로드 실패:', error);
            setError('담당 강의 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const loadExistingAssignment = async () => {
        if (!isEditMode || !courseId || !assignmentId) return;

        try {
            setLoading(true);

            console.log('기존 과제 로드:', courseId, assignmentId);

            // API 호출 (GET /api/course/:courseId/assignment/:assignmentId)
            const response = await AssignmentAPI.getAssignment(courseId, assignmentId);

            if (response.success) {
                const assignment = response.data;

                setAssignment({
                    title: assignment.title || '',
                    description: assignment.description || '',
                    instructions: '',
                    maxScore: assignment.maxScore || 100,
                    deadline: assignment.deadline ?
                        new Date(assignment.deadline).toISOString().slice(0, 16) : '',
                    submissionType: assignment.submissionType || 'file',
                    allowLateSubmission: assignment.allowLateSubmission || false,
                    latePenalty: assignment.latePenalty || 10,
                    teamAssignment: false,
                    maxTeamSize: 4,
                    attachments: [],

                });

                console.log('기존 과제 로드 성공:', assignment);
            } else {
                setErrors(response.message || '과제를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('과제 로드 실패:', error);
            setErrors('과제를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 변경사항 감지
    useEffect(() => {
        if (!isEditMode || !originalAssignment) {
            setHasChanges(assignment.title.trim() !== '' || assignment.description.trim() !== '');
            return;
        }

        const hasChanged =
            assignment.title !== originalAssignment.title ||
            assignment.description !== originalAssignment.description ||
            assignment.instructions !== originalAssignment.instructions ||
            assignment.maxScore !== originalAssignment.maxScore ||
            assignment.deadline !== (originalAssignment.deadline ? originalAssignment.deadline.substring(0, 16) : '') ||
            assignment.submissionType !== originalAssignment.submissionType ||
            assignment.allowLateSubmission !== originalAssignment.allowLateSubmission ||
            assignment.teamAssignment !== originalAssignment.teamAssignment;

        setHasChanges(hasChanged);
    }, [assignment, originalAssignment, isEditMode]);

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
            if (isEditMode) {
                loadExistingAssignment();
            }
        }
    }, [userData, isEditMode, courseId, assignmentId]);

    // 폼 입력 핸들러
    const handleInputChange = (field, value) => {
        setAssignment(prev => ({
            ...prev,
            [field]: value
        }));

        // 개별 필드 에러 제거
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // 허용 파일 형식 변경 핸들러
    const handleFileTypesChange = (fileType) => {
        setAssignment(prev => ({
            ...prev,
            allowedFileTypes: prev.allowedFileTypes.includes(fileType)
                ? prev.allowedFileTypes.filter(type => type !== fileType)
                : [...prev.allowedFileTypes, fileType]
        }));
    };

    // 폼 유효성 검사
    const validateForm = () => {
        const newErrors = {};

        if (!assignment.title.trim()) {
            newErrors.title = '과제 제목을 입력해주세요.';
        } else if (assignment.title.length > 100) {
            newErrors.title = '제목은 100자 이내로 입력해주세요.';
        }

        if (!assignment.description.trim()) {
            newErrors.description = '과제 설명을 입력해주세요.';
        } else if (assignment.description.length < 20) {
            newErrors.description = '설명은 최소 20자 이상 입력해주세요.';
        }

        if (!assignment.deadline) {
            newErrors.deadline = '마감일을 설정해주세요.';
        } else {
            const deadlineDate = new Date(assignment.deadline);
            const now = new Date();
            if (deadlineDate <= now) {
                newErrors.deadline = '마감일은 현재 시간보다 미래여야 합니다.';
            }
        }

        if (assignment.maxScore < 1 || assignment.maxScore > 1000) {
            newErrors.maxScore = '배점은 1점 이상 1000점 이하로 설정해주세요.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 임시저장
    const handleSaveDraft = () => {
        const draftKey = isEditMode
            ? `assignment_edit_draft_${assignmentId}`
            : `assignment_draft_${courseId}`;
        localStorage.setItem(draftKey, JSON.stringify({
            ...assignment,
            savedAt: new Date().toISOString()
        }));
        alert('임시저장되었습니다.');
    };

    // 과제 출제/수정
    const handlePublish = async () => {
        if (!validateForm()) return;

        const targetCourseId = courseData?.id || courseId;

        try {
            setSaving(true);
            setErrors(null);
            // setSuccess(null);

            // API 요청 데이터 구성
            const submitData = {
                title: assignment.title.trim(),
                description: assignment.description.trim(),
                instructions: assignment.instructions.trim(),
                maxScore: assignment.maxScore,
                deadline: new Date(assignment.deadline).toISOString(),
                allowLateSubmission: assignment.allowLateSubmission,
                latePenalty: assignment.allowLateSubmission ? assignment.latePenalty : 0,
                submissionType: assignment.submissionType,
            };

            console.log(isEditMode ? '과제 수정 요청:' : '과제 작성 요청:', submitData);

            let response;

            if (isEditMode) {
                // 과제 수정 (PATCH /api/course/:courseId/assignment/:assignmentId)
                response = await AssignmentAPI.updateAssignment(
                    targetCourseId,
                    assignmentId,
                    submitData
                );
            } else {
                // 과제 작성 (POST /api/course/:courseId/assignment)
                response = await AssignmentAPI.createAssignment(
                    targetCourseId,
                    submitData
                );
            }

            if (response.success) {
                const successMessage = isEditMode ? '과제가 수정되었습니다.' : '과제가 등록되었습니다.';
                // setSuccess(successMessage);

                console.log(isEditMode ? '과제 수정 성공:' : '과제 작성 성공:', response.data);

                // 2초 후 강의 상세 페이지로 이동
                setTimeout(() => {
                    navigate(`/professor/course/${assignment.courseId}`);
                }, 2000);

            } else {
                setError(response.message || (isEditMode ? '과제 수정에 실패했습니다.' : '과제 등록에 실패했습니다.'));
            }

        } catch (error) {
            console.error(isEditMode ? '과제 수정 오류:' : '과제 작성 오류:', error);

            let errorMessage = isEditMode ? '과제 수정 중 오류가 발생했습니다.' : '과제 등록 중 오류가 발생했습니다.';
            if (error.message.includes('403')) {
                errorMessage = '해당 강의의 과제를 작성할 권한이 없습니다.';
            } else if (error.message.includes('404')) {
                errorMessage = isEditMode ? '수정할 과제를 찾을 수 없습니다.' : '강의를 찾을 수 없습니다.';
            }

            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isEditMode) return;

        if (!window.confirm('정말로 이 과제를 삭제하시겠습니까?\n제출된 모든 과제물도 함께 삭제됩니다.')) return;

        try {
            setSaving(true);
            setErrors(null);

            console.log('과제 삭제 요청:', courseId, assignmentId);

            // API 호출 (DELETE /api/course/:courseId/assignment/:assignmentId)
            const response = await AssignmentAPI.deleteAssignment(courseId, assignmentId);

            if (response.success) {
                alert('과제가 삭제되었습니다.');
                navigate(`/professor/course/${courseId}`);
            } else {
                setErrors(response.message || '과제 삭제에 실패했습니다.');
            }

        } catch (error) {
            console.error('과제 삭제 오류:', error);
            setErrors('과제 삭제 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // 취소
    const handleCancel = () => {
        const hasAnyChanges = isEditMode ? hasChanges : (assignment.title || assignment.description);
        if (hasAnyChanges) {
            const confirmCancel = window.confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?');
            if (!confirmCancel) return;
        }

        if (isEditMode) {
            navigate(`/professor/assignment/${assignmentId}`);
        } else {
            navigate(`/professor/course/${courseId}`);
        }
    };

    // 파일 첨부 핸들러
    const handleFileAttach = (event) => {
        const files = Array.from(event.target.files);
        const maxSize = 50 * 1024 * 1024; // 50MB

        const validFiles = files.filter(file => {
            if (file.size > maxSize) {
                alert(`${file.name}은 50MB를 초과합니다.`);
                return false;
            }
            return true;
        });

        setAssignment(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...validFiles.map(file => ({
                id: Date.now() + Math.random(),
                name: file.name,
                size: file.size,
                type: file.type,
                file: file,
                isNew: true
            }))]
        }));
    };

    // 첨부파일 제거
    const removeAttachment = (attachmentId) => {
        setAssignment(prev => ({
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
            <div className="cas-page">
                <Header username={userData?.name || '교수님'} role="교수" />
                <div className="cas-main-layout">
                    <ProfessorSidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        professorName={userData?.name || ''}
                        professorId={userData?.professorId || ''}
                        department={userData?.department || ''}
                    />
                    <main className="cas-main-content">
                        <div className="cas-loading-container">
                            <div className="cas-loading-spinner"></div>
                            <p>페이지를 불러오는 중입니다...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!courseData) {
        return (
            <div className="cas-page">
                <Header username={userData?.name || '교수님'} role="교수" />
                <div className="cas-main-layout">
                    <ProfessorSidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        professorName={userData?.name || ''}
                        professorId={userData?.professorId || ''}
                        department={userData?.department || ''}
                    />
                    <main className="cas-main-content">
                        <div className="cas-error-container">
                            <h2>강의를 찾을 수 없습니다.</h2>
                            <button className="cas-btn cas-btn-primary" onClick={() => navigate('/professor/courses')}>
                                강의 목록으로 이동
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="cas-page">
            <Header username={userData?.name || '교수님'} role="교수" />

            <div className="cas-main-layout">
                <ProfessorSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    professorName={userData?.name || ''}
                    professorId={userData?.professorId || ''}
                    department={userData?.department || ''}
                />

                <main className="cas-main-content">
                    {/* 헤더 영역 */}
                    <div className="cas-header">
                        <div className="cas-breadcrumb">
                            <span onClick={() => navigate('/professor/courses')} className="cas-breadcrumb-link">
                                강의 관리
                            </span>
                            <i className="fas fa-chevron-right"></i>
                            <span onClick={() => navigate(`/professor/course/${courseData.id}`)} className="cas-breadcrumb-link">
                                {courseData.name}
                            </span>
                            <i className="fas fa-chevron-right"></i>
                            {isEditMode ? (
                                <>
                                    <span onClick={() => navigate(`/professor/assignment/${assignmentId}`)} className="cas-breadcrumb-link">
                                        과제
                                    </span>
                                    <i className="fas fa-chevron-right"></i>
                                    <span className="cas-breadcrumb-current">수정</span>
                                </>
                            ) : (
                                <span className="cas-breadcrumb-current">과제 출제</span>
                            )}
                        </div>

                        <div className="cas-course-info">
                            <h1>{isEditMode ? '과제 수정' : '과제 출제'}</h1>
                            <div className="cas-course-meta">
                                <span className="cas-course-name">{courseData.name}</span>
                                <span className="cas-course-code">({courseData.id})</span>
                                <span className="cas-course-students">{courseData.enrolled}명 수강</span>
                                {isEditMode && hasChanges && <span className="cas-changes-indicator">• 수정됨</span>}
                            </div>
                        </div>
                    </div>

                    {/* 메인 컨텐츠 */}
                    <div className="cas-content">
                        <div className="cas-editor-container">
                            {/* 에디터 모드 탭 */}
                            <div className="cas-editor-tabs">
                                <button
                                    className={`cas-tab ${!previewMode ? 'active' : ''}`}
                                    onClick={() => setPreviewMode(false)}
                                >
                                    <i className="fas fa-edit"></i> {isEditMode ? '수정' : '작성'}
                                </button>
                            </div>

                            {/* 작성 모드 */}
                            {!previewMode && (
                                <div className="cas-editor">
                                    {/* 기본 정보 */}
                                    <div className="cas-section">
                                        <h3 className="cas-section-title">기본 정보</h3>

                                        <div className="cas-form-group">
                                            <label htmlFor="title" className="cas-label">
                                                과제 제목 <span className="cas-required">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="title"
                                                className={`cas-input ${errors.title ? 'error' : ''}`}
                                                placeholder="과제 제목을 입력하세요"
                                                value={assignment.title}
                                                onChange={(e) => handleInputChange('title', e.target.value)}
                                                maxLength={100}
                                            />
                                            {errors.title && <div className="cas-error-message">{errors.title}</div>}
                                            <div className="cas-char-count">{assignment.title.length}/100</div>
                                        </div>

                                        <div className="cas-form-group">
                                            <label htmlFor="description" className="cas-label">
                                                과제 설명 <span className="cas-required">*</span>
                                            </label>
                                            <textarea
                                                id="description"
                                                className={`cas-textarea ${errors.description ? 'error' : ''}`}
                                                placeholder="과제에 대한 전반적인 설명을 입력하세요"
                                                rows="4"
                                                value={assignment.description}
                                                onChange={(e) => handleInputChange('description', e.target.value)}
                                            />
                                            {errors.description && <div className="cas-error-message">{errors.description}</div>}
                                            <div className="cas-char-count">{assignment.description.length}자</div>
                                        </div>

                                        <div className="cas-form-group">
                                            <label htmlFor="instructions" className="cas-label">
                                                상세 지침
                                            </label>
                                            <textarea
                                                id="instructions"
                                                className="cas-textarea"
                                                placeholder="과제 수행을 위한 상세한 지침을 입력하세요"
                                                rows="6"
                                                value={assignment.instructions}
                                                onChange={(e) => handleInputChange('instructions', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* 제출 설정 */}
                                    <div className="cas-section">
                                        <h3 className="cas-section-title">제출 설정</h3>

                                        <div className="cas-form-row">
                                            <div className="cas-form-group">
                                                <label htmlFor="maxScore" className="cas-label">
                                                    배점 <span className="cas-required">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    id="maxScore"
                                                    className={`cas-input ${errors.maxScore ? 'error' : ''}`}
                                                    min="1"
                                                    max="1000"
                                                    value={assignment.maxScore}
                                                    onChange={(e) => handleInputChange('maxScore', parseInt(e.target.value))}
                                                />
                                                {errors.maxScore && <div className="cas-error-message">{errors.maxScore}</div>}
                                            </div>

                                            <div className="cas-form-group">
                                                <label htmlFor="deadline" className="cas-label">
                                                    마감일 <span className="cas-required">*</span>
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    id="deadline"
                                                    className={`cas-input ${errors.deadline ? 'error' : ''}`}
                                                    value={assignment.deadline}
                                                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                                                    min={new Date().toISOString().slice(0, 16)}
                                                />
                                                {errors.deadline && <div className="cas-error-message">{errors.deadline}</div>}
                                            </div>
                                        </div>

                                        <div className="cas-form-row">
                                            <div className="cas-form-group">
                                                <label htmlFor="submissionType" className="cas-label">제출 방식</label>
                                                <select
                                                    id="submissionType"
                                                    className="cas-select"
                                                    value={assignment.submissionType}
                                                    onChange={(e) => handleInputChange('submissionType', e.target.value)}
                                                >
                                                    <option value="file">파일 업로드</option>
                                                    <option value="text">텍스트 입력</option>
                                                    <option value="url">URL 제출</option>
                                                    <option value="both">파일 + 텍스트</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="cas-checkboxes">
                                            <label className="cas-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={assignment.allowLateSubmission}
                                                    onChange={(e) => handleInputChange('allowLateSubmission', e.target.checked)}
                                                />
                                                <span className="cas-checkbox-mark"></span>
                                                <span className="cas-checkbox-text">지각 제출 허용</span>
                                            </label>

                                            {assignment.allowLateSubmission && (
                                                <div className="cas-form-group">
                                                    <label htmlFor="latePenalty" className="cas-label">지각 제출 감점 (%)</label>
                                                    <input
                                                        type="number"
                                                        id="latePenalty"
                                                        className="cas-input"
                                                        min="0"
                                                        max="100"
                                                        value={assignment.latePenalty}
                                                        onChange={(e) => handleInputChange('latePenalty', parseInt(e.target.value))}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* 첨부파일 */}
                                    <div className="cas-section">
                                        <h3 className="cas-section-title">첨부파일</h3>

                                        <div className="cas-file-upload">
                                            <input
                                                type="file"
                                                id="file-upload"
                                                multiple
                                                onChange={handleFileAttach}
                                                className="cas-file-input"
                                            />
                                            <label htmlFor="file-upload" className="cas-file-upload-btn">
                                                <i className="fas fa-paperclip"></i>
                                                파일 첨부
                                            </label>
                                            <span className="cas-file-help">
                                                과제 관련 파일, 템플릿 등 (최대 50MB)
                                            </span>
                                        </div>

                                        {assignment.attachments.length > 0 && (
                                            <div className="cas-attachments">
                                                {assignment.attachments.map(attachment => (
                                                    <div key={attachment.id} className="cas-attachment-item">
                                                        <div className="cas-attachment-info">
                                                            <i className="fas fa-file"></i>
                                                            <span className="cas-attachment-name">{attachment.name}</span>
                                                            <span className="cas-attachment-size">
                                                                ({formatFileSize(attachment.size)})
                                                            </span>
                                                            {attachment.isNew && (
                                                                <span className="cas-new-badge">새 파일</span>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="cas-attachment-remove"
                                                            onClick={() => removeAttachment(attachment.id)}
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 액션 버튼 */}
                        <div className="cas-actions">
                            <div className="cas-actions-left">
                                <button
                                    type="button"
                                    className="cas-btn cas-btn-secondary"
                                    onClick={handleSaveDraft}
                                >
                                    <i className="fas fa-save"></i>
                                    임시저장
                                </button>
                                {isEditMode && originalAssignment && (
                                    <button
                                        type="button"
                                        className="cas-btn cas-btn-outline"
                                        onClick={() => {
                                            if (window.confirm('원본 내용으로 되돌리시겠습니까?')) {
                                                setAssignment({
                                                    title: originalAssignment.title || '',
                                                    description: originalAssignment.description || '',
                                                    instructions: originalAssignment.instructions || '',
                                                    maxScore: originalAssignment.maxScore || 100,
                                                    deadline: originalAssignment.deadline ? originalAssignment.deadline.substring(0, 16) : '',
                                                    submissionType: originalAssignment.submissionType || 'file',
                                                    allowLateSubmission: originalAssignment.allowLateSubmission || false,
                                                    latePenalty: originalAssignment.latePenalty || 10,
                                                    teamAssignment: originalAssignment.teamAssignment || false,
                                                    maxTeamSize: originalAssignment.maxTeamSize || 4,
                                                    attachments: originalAssignment.attachments || [],
                                                });
                                                setErrors({});
                                            }
                                        }}
                                        disabled={!hasChanges}
                                    >
                                        <i className="fas fa-undo"></i>
                                        원본으로 되돌리기
                                    </button>
                                )}
                            </div>

                            <div className="cas-actions-right">
                                <button
                                    type="button"
                                    className="cas-btn cas-btn-outline"
                                    onClick={handleCancel}
                                >
                                    취소
                                </button>
                                <button
                                    type="button"
                                    className={`cas-btn cas-btn-primary ${isEditMode && !hasChanges ? 'cas-btn-disabled' : ''}`}
                                    onClick={handlePublish}
                                    disabled={saving || (isEditMode && !hasChanges)}
                                >
                                    {saving ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            {isEditMode ? '저장 중...' : '출제 중...'}
                                        </>
                                    ) : (
                                        <>
                                            <i className={`fas ${isEditMode ? 'fa-check' : 'fa-paper-plane'}`}></i>
                                            {isEditMode ? '수정 완료' : '과제 출제'}
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

export default CreateAssignmentPage;