import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/ProfessorAnnouncementsPage.css';

const ProfessorAnnouncementsPage = () => {
    const [userData, setUserData] = useState(null);
    const [professorData, setProfessorData] = useState(null);
    const [activeTab, setActiveTab] = useState('announcements');
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'card'
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const navigate = useNavigate();

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
        setLoading(false);
    }, [navigate]);

    // 공지사항 목록 필터링 및 정렬
    const getFilteredAnnouncements = () => {
        if (!professorData?.announcements) return [];

        let filteredAnnouncements = [...professorData.announcements];

        // 강의별 필터링
        if (selectedCourse !== 'all') {
            filteredAnnouncements = filteredAnnouncements.filter(announcement => 
                announcement.courseId === selectedCourse
            );
        }

        // 상태별 필터링
        if (filterStatus !== 'all') {
            const today = new Date();
            filteredAnnouncements = filteredAnnouncements.filter(announcement => {
                const announcementDate = new Date(announcement.date);
                const daysDiff = Math.ceil((today - announcementDate) / (1000 * 60 * 60 * 24));
                
                switch (filterStatus) {
                    case 'recent':
                        return daysDiff <= 7;
                    case 'old':
                        return daysDiff > 30;
                    case 'important':
                        return announcement.priority === 'high' || announcement.pinned;
                    default:
                        return true;
                }
            });
        }

        // 검색어 필터링
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            filteredAnnouncements = filteredAnnouncements.filter(announcement =>
                announcement.title.toLowerCase().includes(term) ||
                announcement.content.toLowerCase().includes(term)
            );
        }

        // 정렬
        filteredAnnouncements.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.date) - new Date(a.date);
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'course':
                    const courseA = professorData.courses?.find(c => c.id === a.courseId)?.name || '';
                    const courseB = professorData.courses?.find(c => c.id === b.courseId)?.name || '';
                    return courseA.localeCompare(courseB);
                case 'priority':
                    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                    return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
                default:
                    return 0;
            }
        });

        return filteredAnnouncements;
    };

    // 공지사항 생성/수정 모달 열기
    const openCreateModal = (announcement = null) => {
        setSelectedAnnouncement(announcement);
        setShowCreateModal(true);
    };

    // 공지사항 미리보기 모달 열기
    const openPreviewModal = (announcement) => {
        setSelectedAnnouncement(announcement);
        setShowPreviewModal(true);
    };

    // 공지사항 삭제
    const deleteAnnouncement = (announcementId) => {
        if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
            alert('공지사항이 삭제되었습니다.');
        }
    };

    // 공지사항 저장
    const saveAnnouncement = (announcementData) => {
        if (selectedAnnouncement) {
            alert('공지사항이 수정되었습니다.');
        } else {
            alert('새 공지사항이 등록되었습니다.');
        }
        setShowCreateModal(false);
        setSelectedAnnouncement(null);
    };

    // 공지사항 상태 정보
    const getAnnouncementStatus = (announcement) => {
        const today = new Date();
        const announcementDate = new Date(announcement.date);
        const daysDiff = Math.ceil((today - announcementDate) / (1000 * 60 * 60 * 24));

        if (announcement.pinned) {
            return { status: 'pinned', label: '고정됨', className: 'status-pinned' };
        } else if (daysDiff <= 1) {
            return { status: 'new', label: '새글', className: 'status-new' };
        } else if (daysDiff <= 7) {
            return { status: 'recent', label: '최근', className: 'status-recent' };
        } else {
            return { status: 'normal', label: '', className: '' };
        }
    };

    // 우선순위 색상
    const getPriorityClass = (priority) => {
        switch (priority) {
            case 'high':
                return 'priority-high';
            case 'medium':
                return 'priority-medium';
            case 'low':
                return 'priority-low';
            default:
                return 'priority-normal';
        }
    };

    // 통계 계산
    const getStatistics = () => {
        const announcements = getFilteredAnnouncements();
        const totalAnnouncements = announcements.length;
        const recentAnnouncements = announcements.filter(a => {
            const daysDiff = Math.ceil((new Date() - new Date(a.date)) / (1000 * 60 * 60 * 24));
            return daysDiff <= 7;
        }).length;
        const pinnedAnnouncements = announcements.filter(a => a.pinned).length;
        const importantAnnouncements = announcements.filter(a => a.priority === 'high').length;

        return {
            total: totalAnnouncements,
            recent: recentAnnouncements,
            pinned: pinnedAnnouncements,
            important: importantAnnouncements
        };
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>공지사항을 불러오는 중입니다...</p>
            </div>
        );
    }

    if (!professorData) {
        return (
            <div className="error-container">
                <p>교수 데이터를 불러올 수 없습니다. 다시 로그인해주세요.</p>
                <button onClick={() => navigate('/login')}>로그인 페이지로 이동</button>
            </div>
        );
    }

    const filteredAnnouncements = getFilteredAnnouncements();
    const statistics = getStatistics();

    return (
        <div className="professor-dashboard">
            <Header username={userData?.name || '교수님'} role="교수" />
            
            <div className="dashboard-main">
                <ProfessorSidebar 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab}
                    professorName={userData?.name || ''}
                    professorId={userData?.professorId || ''}
                    department={userData?.department || ''}
                />
                
                <div className="dashboard-content">
                    <div className="welcome-banner">
                        <h2>공지사항 관리</h2>
                        <p>{professorData.personal?.department || ''} / 사번: {userData?.professorId}</p>
                    </div>

                    {/* 통계 카드 */}
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-bullhorn"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.total}</div>
                                <div className="stat-label">총 공지사항</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-clock"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.recent}</div>
                                <div className="stat-label">최근 7일</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-thumbtack"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.pinned}</div>
                                <div className="stat-label">고정된 공지</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.important}</div>
                                <div className="stat-label">중요 공지</div>
                            </div>
                        </div>
                    </div>

                    {/* 공지사항 관리 메인 카드 */}
                    <div className="card announcements-management-card">
                        <div className="card-header">
                            <h3>공지사항 목록</h3>
                            <div className="header-actions">
                                <div className="view-toggle">
                                    <button 
                                        className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <i className="fas fa-list"></i>
                                    </button>
                                    <button 
                                        className={`btn btn-sm ${viewMode === 'card' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setViewMode('card')}
                                    >
                                        <i className="fas fa-th"></i>
                                    </button>
                                </div>
                                <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => openCreateModal()}
                                >
                                    <i className="fas fa-plus"></i> 새 공지사항 작성
                                </button>
                            </div>
                        </div>

                        {/* 필터 및 검색 영역 */}
                        <div className="announcements-filters">
                            <div className="filter-row">
                                <div className="filter-group">
                                    <label>강의 선택:</label>
                                    <select 
                                        value={selectedCourse} 
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">전체 강의</option>
                                        {professorData.courses?.map(course => (
                                            <option key={course.id} value={course.id}>
                                                {course.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label>상태 필터:</label>
                                    <select 
                                        value={filterStatus} 
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">전체</option>
                                        <option value="recent">최근 7일</option>
                                        <option value="old">30일 이전</option>
                                        <option value="important">중요 공지</option>
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label>정렬 기준:</label>
                                    <select 
                                        value={sortBy} 
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="date">최신순</option>
                                        <option value="title">제목순</option>
                                        <option value="course">강의순</option>
                                        <option value="priority">중요도순</option>
                                    </select>
                                </div>

                                <div className="search-group">
                                    <div className="search-container">
                                        <input
                                            type="text"
                                            placeholder="제목이나 내용으로 검색"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="search-input"
                                        />
                                        <i className="fas fa-search search-icon"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 공지사항 목록 */}
                        <div className="announcements-content">
                            {filteredAnnouncements.length > 0 ? (
                                viewMode === 'list' ? (
                                    <div className="announcements-table-container">
                                        <table className="announcements-table">
                                            <thead>
                                                <tr>
                                                    <th>제목</th>
                                                    <th>강의</th>
                                                    <th>작성일</th>
                                                    <th>우선순위</th>
                                                    <th>상태</th>
                                                    <th>작업</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredAnnouncements.map((announcement, index) => {
                                                    const statusInfo = getAnnouncementStatus(announcement);
                                                    const courseName = professorData.courses?.find(c => c.id === announcement.courseId)?.name || '전체';
                                                    
                                                    return (
                                                        <tr key={index}>
                                                            <td className="announcement-title-cell">
                                                                <div className="announcement-title-wrapper">
                                                                    {announcement.pinned && (
                                                                        <i className="fas fa-thumbtack pin-icon" title="고정된 공지"></i>
                                                                    )}
                                                                    <div className="announcement-title">{announcement.title}</div>
                                                                </div>
                                                                <div className="announcement-preview">{announcement.content.substring(0, 100)}...</div>
                                                            </td>
                                                            <td className="course-name">{courseName}</td>
                                                            <td className="date-cell">{announcement.date}</td>
                                                            <td>
                                                                <span className={`priority-badge ${getPriorityClass(announcement.priority)}`}>
                                                                    {announcement.priority === 'high' ? '높음' : 
                                                                     announcement.priority === 'medium' ? '보통' : '낮음'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {statusInfo.label && (
                                                                    <span className={`status-badge ${statusInfo.className}`}>
                                                                        {statusInfo.label}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="action-buttons">
                                                                <button
                                                                    className="btn btn-outline btn-sm"
                                                                    onClick={() => openPreviewModal(announcement)}
                                                                    title="미리보기"
                                                                >
                                                                    <i className="fas fa-eye"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline btn-sm"
                                                                    onClick={() => openCreateModal(announcement)}
                                                                    title="수정"
                                                                >
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline btn-sm text-danger"
                                                                    onClick={() => deleteAnnouncement(announcement.id)}
                                                                    title="삭제"
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="announcements-grid">
                                        {filteredAnnouncements.map((announcement, index) => {
                                            const statusInfo = getAnnouncementStatus(announcement);
                                            const courseName = professorData.courses?.find(c => c.id === announcement.courseId)?.name || '전체';
                                            
                                            return (
                                                <div key={index} className="announcement-card">
                                                    <div className="announcement-card-header">
                                                        <div className="announcement-card-title">
                                                            {announcement.pinned && (
                                                                <i className="fas fa-thumbtack pin-icon" title="고정된 공지"></i>
                                                            )}
                                                            {announcement.title}
                                                        </div>
                                                        <div className="announcement-card-badges">
                                                            <span className={`priority-badge ${getPriorityClass(announcement.priority)}`}>
                                                                {announcement.priority === 'high' ? '높음' : 
                                                                 announcement.priority === 'medium' ? '보통' : '낮음'}
                                                            </span>
                                                            {statusInfo.label && (
                                                                <span className={`status-badge ${statusInfo.className}`}>
                                                                    {statusInfo.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="announcement-card-body">
                                                        <div className="announcement-card-course">{courseName}</div>
                                                        <div className="announcement-card-content">{announcement.content}</div>
                                                        <div className="announcement-card-date">
                                                            <i className="far fa-calendar-alt"></i>
                                                            {announcement.date}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="announcement-card-footer">
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            onClick={() => openPreviewModal(announcement)}
                                                        >
                                                            <i className="fas fa-eye"></i> 미리보기
                                                        </button>
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            onClick={() => openCreateModal(announcement)}
                                                        >
                                                            <i className="fas fa-edit"></i> 수정
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                            ) : (
                                <div className="empty-announcements">
                                    <div className="empty-icon">
                                        <i className="fas fa-bullhorn"></i>
                                    </div>
                                    <p>조건에 맞는 공지사항이 없습니다.</p>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => openCreateModal()}
                                    >
                                        <i className="fas fa-plus"></i> 첫 번째 공지사항 작성
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 공지사항 생성/수정 모달 */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content create-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedAnnouncement ? '공지사항 수정' : '새 공지사항 작성'}</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowCreateModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form className="announcement-form">
                                <div className="form-row">
                                    <div className="input-group">
                                        <label>대상 강의 *</label>
                                        <select 
                                            required
                                            defaultValue={selectedAnnouncement?.courseId || ''}
                                        >
                                            <option value="">강의를 선택하세요</option>
                                            <option value="all">전체 강의</option>
                                            {professorData.courses?.map(course => (
                                                <option key={course.id} value={course.id}>
                                                    {course.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>우선순위</label>
                                        <select defaultValue={selectedAnnouncement?.priority || 'medium'}>
                                            <option value="low">낮음</option>
                                            <option value="medium">보통</option>
                                            <option value="high">높음</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>제목 *</label>
                                    <input 
                                        type="text" 
                                        required
                                        defaultValue={selectedAnnouncement?.title || ''}
                                        placeholder="공지사항 제목을 입력하세요"
                                    />
                                </div>

                                <div className="input-group">
                                    <label>내용 *</label>
                                    <div className="editor-container">
                                        <div className="editor-toolbar">
                                            <button type="button" className="editor-btn" title="굵게">
                                                <i className="fas fa-bold"></i>
                                            </button>
                                            <button type="button" className="editor-btn" title="기울임">
                                                <i className="fas fa-italic"></i>
                                            </button>
                                            <button type="button" className="editor-btn" title="밑줄">
                                                <i className="fas fa-underline"></i>
                                            </button>
                                            <div className="editor-divider"></div>
                                            <button type="button" className="editor-btn" title="글머리 기호">
                                                <i className="fas fa-list-ul"></i>
                                            </button>
                                            <button type="button" className="editor-btn" title="번호 목록">
                                                <i className="fas fa-list-ol"></i>
                                            </button>
                                            <div className="editor-divider"></div>
                                            <button type="button" className="editor-btn" title="링크">
                                                <i className="fas fa-link"></i>
                                            </button>
                                            <button type="button" className="editor-btn" title="이미지">
                                                <i className="fas fa-image"></i>
                                            </button>
                                        </div>
                                        <textarea 
                                            rows="10"
                                            required
                                            defaultValue={selectedAnnouncement?.content || ''}
                                            placeholder="공지사항 내용을 입력하세요"
                                            className="content-editor"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>첨부파일</label>
                                    <div className="file-upload-area">
                                        <input type="file" multiple />
                                        <div className="file-upload-text">
                                            <i className="fas fa-cloud-upload-alt"></i>
                                            <span>파일을 선택하거나 여기에 드래그하세요</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-options">
                                    <label className="checkbox-label">
                                        <input 
                                            type="checkbox" 
                                            defaultChecked={selectedAnnouncement?.pinned || false}
                                        />
                                        <span>상단 고정</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input 
                                            type="checkbox" 
                                            defaultChecked={selectedAnnouncement?.sendEmail || false}
                                        />
                                        <span>이메일 알림</span>
                                    </label>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-outline"
                                onClick={() => setShowCreateModal(false)}
                            >
                                취소
                            </button>
                            <button 
                                className="btn btn-outline"
                                onClick={() => {
                                    alert('미리보기 기능');
                                }}
                            >
                                미리보기
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={() => saveAnnouncement({})}
                            >
                                {selectedAnnouncement ? '수정' : '등록'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 공지사항 미리보기 모달 */}
            {showPreviewModal && selectedAnnouncement && (
                <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
                    <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>공지사항 미리보기</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowPreviewModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="preview-content">
                                <div className="preview-header">
                                    <div className="preview-title">
                                        {selectedAnnouncement.pinned && (
                                            <i className="fas fa-thumbtack pin-icon" title="고정된 공지"></i>
                                        )}
                                        {selectedAnnouncement.title}
                                    </div>
                                    <div className="preview-meta">
                                        <span className="preview-course">
                                            {professorData.courses?.find(c => c.id === selectedAnnouncement.courseId)?.name || '전체'}
                                        </span>
                                        <span className="preview-date">{selectedAnnouncement.date}</span>
                                        <span className={`priority-badge ${getPriorityClass(selectedAnnouncement.priority)}`}>
                                            {selectedAnnouncement.priority === 'high' ? '높음' : 
                                             selectedAnnouncement.priority === 'medium' ? '보통' : '낮음'}
                                        </span>
                                    </div>
                                </div>
                                <div className="preview-body">
                                    <div className="preview-text">
                                        {selectedAnnouncement.content}
                                    </div>
                                    {selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0 && (
                                        <div className="preview-attachments">
                                            <h4>첨부파일</h4>
                                            <ul className="attachments-list">
                                                {selectedAnnouncement.attachments.map((file, index) => (
                                                    <li key={index} className="attachment-item">
                                                        <i className="fas fa-file"></i>
                                                        <span>{file.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-outline"
                                onClick={() => setShowPreviewModal(false)}
                            >
                                닫기
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={() => {
                                    setShowPreviewModal(false);
                                    openCreateModal(selectedAnnouncement);
                                }}
                            >
                                수정
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessorAnnouncementsPage;