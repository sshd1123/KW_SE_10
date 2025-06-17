import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getCurrentUser } from '../../../data/authUtils';
import { ArchiveAPI, CourseAPI } from '../../../services/api';
import { formatFileSize, validateFile, getFileIcon } from '../../utils/fileUtils';
import '../../styles/CreateArchivePage.css';

const CreateArchivePage = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [courses, setCourses] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [activeTab, setActiveTab] = useState('materials');

    // 파일 업로드 관련 상태
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});
    const [dragOver, setDragOver] = useState(false);

    // 폼 데이터
    const [formData, setFormData] = useState({
        courseId: '',
        description: '',
        category: 'lecture',
        visibility: 'public',
        folder: 'root'
    });

    const navigate = useNavigate();
    const { courseId, archiveId } = useParams();
    const isEditMode = !!archiveId;

    // 카테고리 옵션
    const categoryOptions = [
        { value: 'lecture', label: '강의자료', icon: '📚' },
        { value: 'assignment', label: '과제자료', icon: '📝' },
        { value: 'exam', label: '시험자료', icon: '📊' },
        { value: 'reference', label: '참고자료', icon: '📖' },
        { value: 'video', label: '동영상', icon: '🎥' },
        { value: 'other', label: '기타', icon: '📎' }
    ];

    // 폴더 옵션
    const folderOptions = [
        { value: 'root', label: '📁 루트 폴더' },
        { value: 'lecture', label: '📚 강의자료' },
        { value: 'assignment', label: '📝 과제자료' },
        { value: 'exam', label: '📊 시험자료' },
        { value: 'reference', label: '📖 참고자료' },
        { value: 'video', label: '🎥 동영상' }
    ];

    useEffect(() => {
        const user = getCurrentUser();
        if (!user || user.role !== 'professor') {
            navigate('/login');
            return;
        }
        setUserData(user);
        loadProfessorCourses();

        // URL에 courseId가 있으면 설정
        if (courseId) {
            setFormData(prev => ({ ...prev, courseId }));
        }

        if (isEditMode) {
            loadExistingArchive();
        }
    }, [navigate, courseId, archiveId, isEditMode]);

    // 교수의 담당 강의 목록 로드
    const loadProfessorCourses = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await CourseAPI.searchCourses({
                professorId: userData?.id || userData?.professorId,
                semester: '2025-1'
            });

            if (response.success) {
                setCourses(response.data.courses || []);
            } else {
                setError(response.message || '담당 강의 목록을 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('담당 강의 목록 로드 실패:', error);
            setError('담당 강의 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 기존 자료 로드 (수정 모드)
    const loadExistingArchive = async () => {
        if (!courseId || !archiveId) return;

        try {
            setLoading(true);
            const response = await ArchiveAPI.getArchive(courseId, archiveId);
            
            if (response.success) {
                const archive = response.data;
                setFormData({
                    courseId: courseId,
                    description: archive.description || '',
                    category: archive.category || 'lecture',
                    visibility: archive.visibility || 'public',
                    folder: archive.folder || 'root'
                });
            } else {
                setError(response.message || '자료를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('자료 로드 실패:', error);
            setError('자료를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 파일 선택 핸들러
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        addFiles(files);
        e.target.value = ''; // 같은 파일 재선택 가능하도록
    };

    // 드래그 앤 드롭 핸들러
    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        addFiles(files);
    };

    // 파일 추가
    const addFiles = (files) => {
        const validFiles = [];
        const errors = [];

        files.forEach(file => {
            const validation = validateFile(file, 100 * 1024 * 1024); // 100MB 제한
            if (validation.length === 0) {
                const fileWithId = {
                    ...file,
                    id: Date.now() + Math.random(),
                    preview: URL.createObjectURL(file)
                };
                validFiles.push(fileWithId);
            } else {
                errors.push(`${file.name}: ${validation.join(', ')}`);
            }
        });

        if (errors.length > 0) {
            setError('다음 파일에 문제가 있습니다:\n' + errors.join('\n'));
        }

        if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles]);
            setError(null);
        }
    };

    // 파일 제거
    const removeFile = (fileId) => {
        setSelectedFiles(prev => {
            const updated = prev.filter(file => file.id !== fileId);
            // 메모리 정리
            const removedFile = prev.find(file => file.id === fileId);
            if (removedFile?.preview) {
                URL.revokeObjectURL(removedFile.preview);
            }
            return updated;
        });
    };

    // 폼 입력 핸들러
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    // 폼 검증
    const validateForm = () => {
        if (!formData.courseId) {
            setError('강의를 선택해주세요.');
            return false;
        }
        if (!isEditMode && selectedFiles.length === 0) {
            setError('업로드할 파일을 선택해주세요.');
            return false;
        }
        return true;
    };

    // 파일 업로드 처리
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setUploading(true);
            setError(null);
            setSuccess(null);

            if (isEditMode) {
                // 자료 정보 수정 (파일은 변경 불가)
                const response = await ArchiveAPI.updateArchive(courseId, archiveId, {
                    description: formData.description.trim(),
                    category: formData.category,
                    visibility: formData.visibility,
                    folder: formData.folder
                });

                if (response.success) {
                    setSuccess('자료 정보가 수정되었습니다.');
                    setTimeout(() => {
                        navigate(`/professor/course/${courseId}/archive/${archiveId}`);
                    }, 2000);
                } else {
                    setError(response.message || '자료 수정에 실패했습니다.');
                }
            } else {
                // 새 파일 업로드
                let successCount = 0;
                let errorCount = 0;

                for (const file of selectedFiles) {
                    try {
                        const formDataToSend = new FormData();
                        formDataToSend.append('file', file);
                        formDataToSend.append('description', formData.description.trim());
                        formDataToSend.append('category', formData.category);
                        formDataToSend.append('visibility', formData.visibility);
                        formDataToSend.append('folder', formData.folder);

                        // 개별 파일 업로드 진행률 추적
                        setUploadProgress(prev => ({ ...prev, [file.id]: 0 }));

                        const response = await ArchiveAPI.uploadArchive(formData.courseId, formDataToSend, {
                            onUploadProgress: (progressEvent) => {
                                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                                setUploadProgress(prev => ({ ...prev, [file.id]: progress }));
                            }
                        });

                        if (response.success) {
                            successCount++;
                        } else {
                            errorCount++;
                        }

                        // 진행률에서 제거
                        setUploadProgress(prev => {
                            const newProgress = { ...prev };
                            delete newProgress[file.id];
                            return newProgress;
                        });

                    } catch (error) {
                        console.error(`파일 업로드 실패: ${file.name}`, error);
                        errorCount++;
                    }
                }

                if (successCount > 0) {
                    setSuccess(`${successCount}개 파일이 업로드되었습니다.${errorCount > 0 ? ` (${errorCount}개 실패)` : ''}`);
                    
                    // 성공한 경우 폼 초기화
                    setSelectedFiles([]);
                    setFormData(prev => ({
                        ...prev,
                        description: ''
                    }));

                    setTimeout(() => {
                        navigate(`/professor/course/${formData.courseId}`, { state: { activeTab: '자료실' } });
                    }, 2000);
                } else {
                    setError('모든 파일 업로드에 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('업로드 처리 오류:', error);
            setError('업로드 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
            setUploadProgress({});
        }
    };

    // 컴포넌트 언마운트 시 메모리 정리
    useEffect(() => {
        return () => {
            selectedFiles.forEach(file => {
                if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                }
            });
        };
    }, [selectedFiles]);

    return (
        <div className="cap-page">
            <Header userData={userData} activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="cap-main-layout">
                <ProfessorSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <main className="cap-main-content">
                    <div className="cap-container">
                        {/* 헤더 */}
                        <div className="cap-header">
                            <div className="cap-header-left">
                                <h1>{isEditMode ? '📝 자료 정보 수정' : '📤 강의자료 업로드'}</h1>
                                <p>
                                    {isEditMode 
                                        ? '자료의 정보를 수정할 수 있습니다.'
                                        : '수업에 필요한 자료를 업로드하세요.'
                                    }
                                </p>
                            </div>
                            <div className="cap-header-actions">
                                <button
                                    onClick={() => navigate(`/professor/course/${courseId}`)}
                                    className="cap-cancel-button"
                                >
                                    취소
                                </button>
                            </div>
                        </div>

                        {/* 메인 폼 */}
                        <div className="cap-form-container">
                            <form onSubmit={handleSubmit} className="cap-upload-form">
                                {/* 기본 정보 */}
                                <div className="cap-form-section">
                                    <h3>📋 기본 정보</h3>
                                    <div className="cap-form-row">
                                        <div className="cap-form-group">
                                            <label>강의 선택 *</label>
                                            <select
                                                name="courseId"
                                                value={formData.courseId}
                                                onChange={handleInputChange}
                                                required
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
                                        <div className="cap-form-group">
                                            <label>카테고리</label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                            >
                                                {categoryOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.icon} {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="cap-form-row">
                                        <div className="cap-form-group">
                                            <label>폴더</label>
                                            <select
                                                name="folder"
                                                value={formData.folder}
                                                onChange={handleInputChange}
                                            >
                                                {folderOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="cap-form-group">
                                            <label>접근 권한</label>
                                            <select
                                                name="visibility"
                                                value={formData.visibility}
                                                onChange={handleInputChange}
                                            >
                                                <option value="public">🌐 전체 공개</option>
                                                <option value="private">🔒 제한된 접근</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="cap-form-group">
                                        <label>설명</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                            placeholder="자료에 대한 설명을 입력하세요..."
                                        />
                                    </div>
                                </div>

                                {/* 파일 업로드 섹션 (새 업로드시에만) */}
                                {!isEditMode && (
                                    <div className="cap-form-section">
                                        <h3>📁 파일 업로드</h3>
                                        
                                        {/* 드래그 앤 드롭 영역 */}
                                        <div 
                                            className={`cap-drop-zone ${dragOver ? 'drag-over' : ''}`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => document.getElementById('file-input').click()}
                                        >
                                            <div className="cap-drop-content">
                                                <div className="cap-drop-icon">📁</div>
                                                <h4>파일을 드래그하거나 클릭하여 선택</h4>
                                                <p>최대 100MB까지 업로드 가능합니다.</p>
                                                <p>지원 형식: PDF, DOC, PPT, XLS, ZIP, 이미지, 동영상 등</p>
                                            </div>
                                            <input
                                                id="file-input"
                                                type="file"
                                                multiple
                                                onChange={handleFileSelect}
                                                style={{ display: 'none' }}
                                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.jpg,.jpeg,.png,.gif,.mp4,.avi,.txt"
                                            />
                                        </div>

                                        {/* 선택된 파일 목록 */}
                                        {selectedFiles.length > 0 && (
                                            <div className="cap-selected-files">
                                                <h4>선택된 파일 ({selectedFiles.length}개)</h4>
                                                <div className="cap-file-list">
                                                    {selectedFiles.map(file => (
                                                        <div key={file.id} className="cap-file-item">
                                                            <div className="cap-file-info">
                                                                <div className="cap-file-icon">
                                                                    {getFileIcon(file.type)}
                                                                </div>
                                                                <div className="cap-file-details">
                                                                    <div className="cap-file-name">{file.name}</div>
                                                                    <div className="cap-file-size">
                                                                        {formatFileSize(file.size)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* 업로드 진행률 */}
                                                            {uploadProgress[file.id] !== undefined && (
                                                                <div className="cap-progress-container">
                                                                    <div className="cap-progress-bar">
                                                                        <div 
                                                                            className="cap-progress-fill"
                                                                            style={{ width: `${uploadProgress[file.id]}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="cap-progress-text">
                                                                        {uploadProgress[file.id]}%
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <button
                                                                type="button"
                                                                onClick={() => removeFile(file.id)}
                                                                className="cap-remove-file"
                                                                disabled={uploading}
                                                            >
                                                                ✖
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 상태 메시지 */}
                                {error && (
                                    <div className="cap-alert cap-alert-error">
                                        <span>⚠️ {error}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setError(null)}
                                            className="cap-alert-close"
                                        >
                                            ✖
                                        </button>
                                    </div>
                                )}

                                {success && (
                                    <div className="cap-alert cap-alert-success">
                                        <span>✅ {success}</span>
                                    </div>
                                )}

                                {/* 액션 버튼 */}
                                <div className="cap-form-actions">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/professor/course/${courseId}`)}
                                        className="cap-cancel-button"
                                        disabled={uploading}
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        className="cap-submit-button"
                                        disabled={uploading || loading}
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="cap-loading-spinner"></div>
                                                {isEditMode ? '수정 중...' : '업로드 중...'}
                                            </>
                                        ) : (
                                            <>
                                                {isEditMode ? '💾 수정 완료' : '📤 업로드'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CreateArchivePage;