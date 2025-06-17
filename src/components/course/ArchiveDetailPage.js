import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../dashboard/Header';
import Sidebar from '../dashboard/Sidebar';
import ProfessorSidebar from '../dashboard/ProfessorSidebar';
import { getCurrentUser } from '../../data/authUtils';
import { ArchiveAPI, CourseAPI } from '../../services/api';
import { formatFileSize, getFileIcon } from '../utils/fileUtils';
import '../styles/ArchiveDetailPage.css';

const ArchiveDetailPage = () => {
    const [userData, setUserData] = useState(null);
    const [courseData, setCourseData] = useState(null);
    const [archive, setArchive] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('courses');

    // 수정 관련 상태 (교수용)
    const [showEditModal, setShowEditModal] = useState(false);
    const [editedArchive, setEditedArchive] = useState({
        name: '',
        description: '',
        visibility: 'public'
    });

    const { courseId, archiveId } = useParams();
    const navigate = useNavigate();

    const isProfessor = userData?.role === 'professor';

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }
        setUserData(user);
        loadCourseData();
        loadArchiveDetail();
    }, [courseId, archiveId, navigate]);

    // 강의 정보 로드
    const loadCourseData = async () => {
        try {
            const response = await CourseAPI.getCourse(courseId);
            if (response.success) {
                setCourseData(response.data);
            }
        } catch (error) {
            console.error('강의 정보 로드 실패:', error);
        }
    };

    // 자료 상세 정보 로드
    const loadArchiveDetail = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await ArchiveAPI.getArchive(courseId, archiveId);

            if (response.success) {
                setArchive(response.data);
                setEditedArchive({
                    name: response.data.name || '',
                    description: response.data.description || '',
                    visibility: response.data.visibility || 'public'
                });
            } else {
                setError(response.message || '자료를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('자료 상세 정보 로드 실패:', error);
            setError('자료를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 파일 다운로드
    const handleDownload = async () => {
        try {
            setDownloading(true);
            await ArchiveAPI.downloadArchive(courseId, archiveId);
            
            // 다운로드 카운트 증가 (로컬 상태 업데이트)
            setArchive(prev => ({
                ...prev,
                downloads: (prev.downloads || 0) + 1
            }));
        } catch (error) {
            console.error('다운로드 실패:', error);
            alert('파일 다운로드에 실패했습니다.');
        } finally {
            setDownloading(false);
        }
    };

    // 자료 정보 수정 (교수용)
    const handleSaveEdit = async (e) => {
        e.preventDefault();

        if (!editedArchive.name.trim()) {
            alert('파일명을 입력해주세요.');
            return;
        }

        try {
            const response = await ArchiveAPI.updateArchive(courseId, archiveId, {
                name: editedArchive.name.trim(),
                description: editedArchive.description.trim(),
                visibility: editedArchive.visibility
            });

            if (response.success) {
                setArchive(prev => ({
                    ...prev,
                    name: editedArchive.name.trim(),
                    description: editedArchive.description.trim(),
                    visibility: editedArchive.visibility,
                    updatedAt: new Date().toISOString()
                }));
                setShowEditModal(false);
                alert('자료 정보가 수정되었습니다.');
            } else {
                alert(response.message || '수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('자료 수정 실패:', error);
            alert('자료 수정 중 오류가 발생했습니다.');
        }
    };

    // 자료 삭제 (교수용)
    const handleDelete = async () => {
        if (!window.confirm('정말로 이 자료를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
            return;
        }

        try {
            const response = await ArchiveAPI.deleteArchive(courseId, archiveId);
            
            if (response.success) {
                alert('자료가 삭제되었습니다.');
                navigate(`/course/${courseId}`, { state: { activeTab: '자료실' } });
            } else {
                alert(response.message || '삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('자료 삭제 실패:', error);
            alert('자료 삭제 중 오류가 발생했습니다.');
        }
    };

    // 뒤로가기
    const handleBack = () => {
        navigate(`/course/${courseId}`, { state: { activeTab: '자료실' } });
    };

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 파일 종류별 색상
    const getFileTypeColor = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        const colorMap = {
            'pdf': '#f44336',
            'doc': '#2196f3',
            'docx': '#2196f3',
            'ppt': '#ff9800',
            'pptx': '#ff9800',
            'xls': '#4caf50',
            'xlsx': '#4caf50',
            'zip': '#9c27b0',
            'rar': '#9c27b0',
            'jpg': '#e91e63',
            'jpeg': '#e91e63',
            'png': '#e91e63',
            'mp4': '#3f51b5',
            'avi': '#3f51b5',
            'txt': '#795548'
        };
        return colorMap[extension] || '#607d8b';
    };

    if (loading) {
        return (
            <div className="adf-page">
                <Header userData={userData} activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="adf-main-layout">
                    {isProfessor ? (
                        <ProfessorSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                    ) : (
                        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                    )}
                    <main className="adf-main-content">
                        <div className="adf-loading-container">
                            <div className="adf-loading-spinner"></div>
                            <p>자료를 불러오는 중입니다...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (error || !archive) {
        return (
            <div className="adf-page">
                <Header userData={userData} activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="adf-main-layout">
                    {isProfessor ? (
                        <ProfessorSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                    ) : (
                        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                    )}
                    <main className="adf-main-content">
                        <div className="adf-error-container">
                            <h2>자료를 찾을 수 없습니다</h2>
                            <p>{error || '요청한 자료가 존재하지 않습니다.'}</p>
                            <button onClick={handleBack} className="adf-back-button">
                                자료실로 돌아가기
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="adf-page">
            <Header userData={userData} activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="adf-main-layout">
                {isProfessor ? (
                    <ProfessorSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                ) : (
                    <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                )}
                <main className="adf-main-content">
                    <div className="adf-archive-detail-container">
                        {/* 네비게이션 */}
                        <div className="adf-archive-navigation">
                            <button onClick={handleBack} className="adf-back-button">
                                <i className="fas fa-arrow-left"></i> 자료실로 돌아가기
                            </button>
                        </div>

                        {/* 자료 상세 카드 */}
                        <div className="adf-archive-detail-card">
                            <div className="adf-card-header">
                                <div className="adf-archive-title-section">
                                    <div className="adf-file-icon-large" style={{ color: getFileTypeColor(archive.name) }}>
                                        {getFileIcon(archive.type)}
                                    </div>
                                    <div className="adf-title-info">
                                        <h1 className="adf-archive-title">{archive.name}</h1>
                                        <div className="adf-archive-meta">
                                            <span className="adf-course-info">
                                                {courseData?.name} ({courseData?.code})
                                            </span>
                                            <span className="adf-file-size">
                                                {formatFileSize(archive.size)}
                                            </span>
                                            <span className="adf-upload-date">
                                                {formatDate(archive.uploadDate || archive.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="adf-action-buttons">
                                    <button
                                        onClick={handleDownload}
                                        disabled={downloading}
                                        className="adf-download-button"
                                    >
                                        <i className="fas fa-download"></i>
                                        {downloading ? '다운로드 중...' : '다운로드'}
                                    </button>
                                    {isProfessor && (
                                        <>
                                            <button
                                                onClick={() => setShowEditModal(true)}
                                                className="adf-edit-button"
                                            >
                                                <i className="fas fa-edit"></i> 수정
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                className="adf-delete-button"
                                            >
                                                <i className="fas fa-trash"></i> 삭제
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="adf-card-body">
                                {/* 자료 설명 */}
                                <div className="adf-description-section">
                                    <h3>자료 설명</h3>
                                    <div className="adf-description-content">
                                        {archive.description ? (
                                            <p>{archive.description}</p>
                                        ) : (
                                            <p className="adf-no-description">자료 설명이 없습니다.</p>
                                        )}
                                    </div>
                                </div>

                                {/* 자료 정보 */}
                                <div className="adf-info-section">
                                    <h3>파일 정보</h3>
                                    <div className="adf-info-grid">
                                        <div className="adf-info-item">
                                            <span className="adf-info-label">파일명:</span>
                                            <span className="adf-info-value">{archive.name}</span>
                                        </div>
                                        <div className="adf-info-item">
                                            <span className="adf-info-label">파일 크기:</span>
                                            <span className="adf-info-value">{formatFileSize(archive.size)}</span>
                                        </div>
                                        <div className="adf-info-item">
                                            <span className="adf-info-label">파일 형식:</span>
                                            <span className="adf-info-value">{archive.type || '알 수 없음'}</span>
                                        </div>
                                        <div className="adf-info-item">
                                            <span className="adf-info-label">업로드일:</span>
                                            <span className="adf-info-value">{formatDate(archive.uploadDate || archive.createdAt)}</span>
                                        </div>
                                        <div className="adf-info-item">
                                            <span className="adf-info-label">다운로드 수:</span>
                                            <span className="adf-info-value">{archive.downloads || 0}회</span>
                                        </div>
                                        <div className="adf-info-item">
                                            <span className="adf-info-label">접근 권한:</span>
                                            <span className="adf-info-value">
                                                {archive.visibility === 'public' ? '전체 공개' : '제한된 접근'}
                                            </span>
                                        </div>
                                        {archive.uploadedBy && (
                                            <div className="adf-info-item">
                                                <span className="adf-info-label">업로드한 사람:</span>
                                                <span className="adf-info-value">{archive.uploadedBy}</span>
                                            </div>
                                        )}
                                        {archive.updatedAt && archive.updatedAt !== archive.createdAt && (
                                            <div className="adf-info-item">
                                                <span className="adf-info-label">수정일:</span>
                                                <span className="adf-info-value">{formatDate(archive.updatedAt)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 카테고리 정보 */}
                                {archive.category && (
                                    <div className="adf-category-section">
                                        <h3>카테고리</h3>
                                        <span className={`adf-category-badge category-${archive.category}`}>
                                            {archive.category === 'lecture' ? '강의자료' :
                                             archive.category === 'assignment' ? '과제자료' :
                                             archive.category === 'exam' ? '시험자료' :
                                             archive.category === 'reference' ? '참고자료' :
                                             archive.category}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 다운로드 섹션 */}
                        <div className="adf-download-section">
                            <div className="adf-download-card">
                                <div className="adf-download-info">
                                    <h3>📥 파일 다운로드</h3>
                                    <p>아래 버튼을 클릭하여 파일을 다운로드하세요.</p>
                                    <div className="adf-download-meta">
                                        <span>크기: {formatFileSize(archive.size)}</span>
                                        <span>다운로드 횟수: {archive.downloads || 0}회</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDownload}
                                    disabled={downloading}
                                    className="adf-main-download-button"
                                >
                                    <i className="fas fa-download"></i>
                                    {downloading ? '다운로드 중...' : '파일 다운로드'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 수정 모달 (교수용) */}
                    {showEditModal && isProfessor && (
                        <div className="adf-modal-overlay">
                            <div className="adf-modal-content">
                                <div className="adf-modal-header">
                                    <h2>자료 정보 수정</h2>
                                    <button
                                        onClick={() => setShowEditModal(false)}
                                        className="adf-modal-close"
                                    >
                                        ✖
                                    </button>
                                </div>
                                <form onSubmit={handleSaveEdit} className="adf-edit-form">
                                    <div className="adf-form-group">
                                        <label>파일명 *</label>
                                        <input
                                            type="text"
                                            value={editedArchive.name}
                                            onChange={(e) => setEditedArchive(prev => ({ ...prev, name: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="adf-form-group">
                                        <label>설명</label>
                                        <textarea
                                            value={editedArchive.description}
                                            onChange={(e) => setEditedArchive(prev => ({ ...prev, description: e.target.value }))}
                                            rows="4"
                                            placeholder="자료에 대한 설명을 입력하세요..."
                                        />
                                    </div>
                                    <div className="adf-form-group">
                                        <label>접근 권한</label>
                                        <select
                                            value={editedArchive.visibility}
                                            onChange={(e) => setEditedArchive(prev => ({ ...prev, visibility: e.target.value }))}
                                        >
                                            <option value="public">전체 공개</option>
                                            <option value="private">제한된 접근</option>
                                        </select>
                                    </div>
                                    <div className="adf-form-actions">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditModal(false)}
                                            className="adf-cancel-button"
                                        >
                                            취소
                                        </button>
                                        <button type="submit" className="adf-save-button">
                                            저장
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ArchiveDetailPage;