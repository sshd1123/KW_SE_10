import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../dashboard/Header';
import Sidebar from '../dashboard/Sidebar';
import ProfessorSidebar from '../dashboard/ProfessorSidebar';
import { getDashboardData, getCurrentUser } from '../../data/authUtils';
import './AnnouncementDetailPage.css';

const AnnouncementDetailPage = () => {
    const [userData, setUserData] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [announcement, setAnnouncement] = useState(null);
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editedAnnouncement, setEditedAnnouncement] = useState(null);
    
    const { announcementId, courseId } = useParams();
    const navigate = useNavigate();

    // 사용자 역할 확인
    const isProfessor = userData?.role === '교수' || userData?.role === 'professor';
    const isStudent = userData?.role === '학생' || userData?.role === 'student';

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }

        const data = getDashboardData();
        if (!data) {
            navigate(isProfessor ? '/professor/dashboard' : '/student/dashboard');
            return;
        }

        setUserData(user);
        setDashboardData(data);

        // 공지사항 찾기 (여러 방식으로 시도)
        console.log('전체 데이터:', data);
        console.log('공지사항 목록:', data.announcements);
        console.log('찾는 announcementId:', announcementId);
        console.log('찾는 courseId:', courseId);
        
        let foundAnnouncement = null;
        
        if (data.announcements && Array.isArray(data.announcements)) {
            // 1. 정확한 ID 매칭
            foundAnnouncement = data.announcements.find(ann => ann.id === announcementId);
            
            // 2. 숫자로 변환해서 매칭
            if (!foundAnnouncement) {
                foundAnnouncement = data.announcements.find(ann => ann.id === parseInt(announcementId));
            }
            
            // 3. 문자열로 변환해서 매칭
            if (!foundAnnouncement) {
                foundAnnouncement = data.announcements.find(ann => String(ann.id) === String(announcementId));
            }
            
            // 4. courseId도 고려해서 매칭
            if (!foundAnnouncement && courseId) {
                foundAnnouncement = data.announcements.find(ann => 
                    (ann.id === announcementId || String(ann.id) === String(announcementId)) &&
                    (ann.courseId === courseId)
                );
            }
        }
        
        console.log('찾은 공지사항:', foundAnnouncement);
        
        if (!foundAnnouncement) {
            console.error('공지사항을 찾을 수 없습니다.');
            console.log('사용 가능한 공지사항 ID들:', data.announcements?.map(ann => ({ id: ann.id, courseId: ann.courseId, title: ann.title })));
            
            // 개발/테스트용: 임시 공지사항 생성
            if (process.env.NODE_ENV === 'development') {
                foundAnnouncement = {
                    id: announcementId,
                    title: "테스트 공지사항",
                    content: "이것은 개발 중에 생성된 임시 공지사항입니다.\n\n실제 데이터가 없어서 테스트용으로 표시되고 있습니다.",
                    courseId: courseId,
                    course: "테스트 강의",
                    author: "테스트 교수",
                    authorId: "test_prof",
                    createdAt: new Date().toISOString(),
                    date: new Date().toISOString().split('T')[0],
                    views: 0,
                    isPinned: false,
                    isUrgent: false,
                    priority: "normal",
                    allowComments: true,
                    attachments: []
                };
                console.log('임시 공지사항 생성:', foundAnnouncement);
            } else {
                // 더 친절한 에러 메시지
                const availableIds = data.announcements?.map(ann => ann.id).join(', ') || '없음';
                alert(`공지사항을 찾을 수 없습니다.\n찾는 ID: ${announcementId}\n사용 가능한 ID: ${availableIds}`);
                navigate(-1);
                return;
            }
        }

        // 강의 정보 찾기 (안전한 접근)
        const course = data.courses?.find(c => c.id === (courseId || foundAnnouncement?.courseId));
        if (course) {
            setCourseData(course);
        } else {
            // 강의 정보가 없어도 진행할 수 있도록 기본값 설정
            setCourseData({
                id: courseId || foundAnnouncement?.courseId || 'unknown',
                name: foundAnnouncement?.course || '알 수 없는 강의',
                enrolled: 0
            });
        }

        setAnnouncement(foundAnnouncement);
        
        // 조회수 증가 (실제로는 API 호출)
        if (foundAnnouncement) {
            const updatedAnnouncement = {
                ...foundAnnouncement,
                views: (foundAnnouncement.views || 0) + 1
            };
            setAnnouncement(updatedAnnouncement);
        }

        setLoading(false);
    }, [navigate, announcementId, courseId, isProfessor]);

    // 공지사항 수정 (수정 모드로 이동)
    const handleEditAnnouncement = () => {
        navigate(`/professor/course/${courseData?.id || announcement.courseId}/announcement/${announcement.id}/edit`);
    };

    // 수정 저장
    const handleSaveEdit = () => {
        if (!editedAnnouncement.title.trim() || !editedAnnouncement.content.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        setAnnouncement({
            ...editedAnnouncement,
            updatedAt: new Date().toISOString()
        });
        setShowEditModal(false);
        alert('공지사항이 수정되었습니다.');
    };

    // 공지사항 삭제
    const handleDeleteAnnouncement = () => {
        if (window.confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
            // 실제로는 API 호출
            alert('공지사항이 삭제되었습니다.');
            navigate(-1);
        }
    };

    // 파일 다운로드
    const handleFileDownload = (attachment) => {
        // 실제로는 파일 다운로드 로직
        alert(`${attachment.name} 다운로드를 시작합니다.`);
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

    // 파일 크기 포맷팅
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="ad-page">
                <Header username={userData?.name} role={userData?.role} />
                <div className="ad-main-layout">
                    {isProfessor ? (
                        <ProfessorSidebar
                            activeTab="announcements"
                            setActiveTab={() => {}}
                            professorName={userData?.name || ''}
                            professorId={userData?.professorId || ''}
                            department={userData?.department || ''}
                        />
                    ) : (
                        <Sidebar
                            activeTab="announcements"
                            setActiveTab={() => {}}
                            studentName={userData?.name || ''}
                            studentId={userData?.studentId || userData?.id || ''}
                            department={userData?.department || userData?.major || ''}
                        />
                    )}
                    <main className="ad-main-content">
                        <div className="ad-loading-container">
                            <div className="ad-loading-spinner"></div>
                            <p>공지사항을 불러오는 중입니다...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!announcement) {
        return (
            <div className="ad-page">
                <Header username={userData?.name} role={userData?.role} />
                <div className="ad-main-layout">
                    {isProfessor ? (
                        <ProfessorSidebar
                            activeTab="announcements"
                            setActiveTab={() => {}}
                            professorName={userData?.name || ''}
                            professorId={userData?.professorId || ''}
                            department={userData?.department || ''}
                        />
                    ) : (
                        <Sidebar
                            activeTab="announcements"
                            setActiveTab={() => {}}
                            studentName={userData?.name || ''}
                            studentId={userData?.studentId || userData?.id || ''}
                            department={userData?.department || userData?.major || ''}
                        />
                    )}
                    <main className="ad-main-content">
                        <div className="ad-error-container">
                            <h2>공지사항을 찾을 수 없습니다.</h2>
                            <button className="ad-btn ad-btn-primary" onClick={() => navigate(-1)}>
                                돌아가기
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="ad-page">
            <Header username={userData?.name} role={userData?.role} />

            <div className="ad-main-layout">
                {isProfessor ? (
                    <ProfessorSidebar
                        activeTab="announcements"
                        setActiveTab={() => {}}
                        professorName={userData?.name || ''}
                        professorId={userData?.professorId || ''}
                        department={userData?.department || ''}
                    />
                ) : (
                    <Sidebar
                        activeTab="announcements"
                        setActiveTab={() => {}}
                        studentName={userData?.name || ''}
                        studentId={userData?.studentId || userData?.id || ''}
                        department={userData?.department || userData?.major || ''}
                    />
                )}

                <main className="ad-main-content">
                    {/* 헤더 */}
                    <div className="ad-header">
                        <div className="ad-breadcrumb">
                            <span 
                                onClick={() => navigate(isProfessor ? '/professor/courses' : '/student/courses')} 
                                className="ad-breadcrumb-link"
                            >
                                {isProfessor ? '강의 관리' : '내 강의실'}
                            </span>
                            <i className="fas fa-chevron-right"></i>
                            {courseData && (
                                <>
                                    <span 
                                        onClick={() => navigate(isProfessor ? `/professor/course/${courseData.id}` : `/student/course/${courseData.id}`)} 
                                        className="ad-breadcrumb-link"
                                    >
                                        {courseData.name}
                                    </span>
                                    <i className="fas fa-chevron-right"></i>
                                </>
                            )}
                            <span className="ad-breadcrumb-current">공지사항</span>
                        </div>

                        <div className="ad-header-actions">
                            <button 
                                className="ad-btn ad-btn-outline"
                                onClick={() => navigate(-1)}
                            >
                                <i className="fas fa-arrow-left"></i> 목록으로
                            </button>
                            {isProfessor && announcement?.authorId === userData?.professorId && (
                                <div className="ad-author-actions">
                                    <button 
                                        className="ad-btn ad-btn-secondary"
                                        onClick={handleEditAnnouncement}
                                    >
                                        <i className="fas fa-edit"></i> 수정
                                    </button>
                                    <button 
                                        className="ad-btn ad-btn-danger"
                                        onClick={handleDeleteAnnouncement}
                                    >
                                        <i className="fas fa-trash"></i> 삭제
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 공지사항 내용 */}
                    <div className="ad-content">
                        <div className="ad-announcement">
                            <div className="ad-announcement-header">
                                <div className="ad-announcement-meta">
                                    <span className="ad-course-badge">{courseData?.name || announcement?.course || '알 수 없는 강의'}</span>
                                    <div className="ad-badges">
                                        {announcement?.isPinned && (
                                            <span className="ad-badge ad-badge-pinned">
                                                <i className="fas fa-thumbtack"></i> 고정
                                            </span>
                                        )}
                                        {announcement?.isUrgent && (
                                            <span className="ad-badge ad-badge-urgent">긴급</span>
                                        )}
                                        {announcement?.priority === 'important' && (
                                            <span className="ad-badge ad-badge-important">중요</span>
                                        )}
                                    </div>
                                </div>
                                
                                <h1 className="ad-announcement-title">{announcement?.title || '제목 없음'}</h1>
                                
                                <div className="ad-announcement-info">
                                    <div className="ad-info-left">
                                        <span className="ad-author">
                                            <i className="fas fa-user"></i> {announcement?.author || announcement?.authorName || '작성자 불명'}
                                        </span>
                                        <span className="ad-date">
                                            <i className="fas fa-calendar"></i> {formatDate(announcement?.createdAt || announcement?.date || new Date().toISOString())}
                                        </span>
                                        {announcement?.updatedAt && announcement?.updatedAt !== announcement?.createdAt && (
                                            <span className="ad-updated">
                                                <i className="fas fa-edit"></i> 수정됨: {formatDate(announcement.updatedAt)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="ad-info-right">
                                        <span className="ad-views">
                                            <i className="fas fa-eye"></i> {announcement?.views || 0}회 조회
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="ad-announcement-content">
                                {announcement?.content ? (
                                    announcement.content.split('\n').map((line, index) => (
                                        <p key={index}>{line || '\u00A0'}</p>
                                    ))
                                ) : (
                                    <p>내용이 없습니다.</p>
                                )}
                            </div>

                            {announcement?.attachments && announcement.attachments.length > 0 && (
                                <div className="ad-attachments">
                                    <h3>첨부파일</h3>
                                    <div className="ad-attachments-list">
                                        {announcement.attachments.map((attachment, index) => (
                                            <div key={index} className="ad-attachment-item">
                                                <div className="ad-attachment-info">
                                                    <i className="fas fa-file"></i>
                                                    <span className="ad-attachment-name">{attachment.name}</span>
                                                    <span className="ad-attachment-size">
                                                        ({formatFileSize(attachment.size)})
                                                    </span>
                                                </div>
                                                <button 
                                                    className="ad-btn ad-btn-sm ad-btn-outline"
                                                    onClick={() => handleFileDownload(attachment)}
                                                >
                                                    <i className="fas fa-download"></i> 다운로드
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 수정 모달 */}
                    {showEditModal && editedAnnouncement && (
                        <div className="ad-modal-overlay" onClick={() => setShowEditModal(false)}>
                            <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="ad-modal-header">
                                    <h3>공지사항 수정</h3>
                                    <button 
                                        className="ad-modal-close"
                                        onClick={() => setShowEditModal(false)}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                                <div className="ad-modal-body">
                                    <div className="ad-form-group">
                                        <label htmlFor="edit-title">제목</label>
                                        <input
                                            type="text"
                                            id="edit-title"
                                            className="ad-form-control"
                                            value={editedAnnouncement.title}
                                            onChange={(e) => setEditedAnnouncement({
                                                ...editedAnnouncement,
                                                title: e.target.value
                                            })}
                                        />
                                    </div>

                                    <div className="ad-form-group">
                                        <label htmlFor="edit-content">내용</label>
                                        <textarea
                                            id="edit-content"
                                            className="ad-form-control"
                                            rows="8"
                                            value={editedAnnouncement.content}
                                            onChange={(e) => setEditedAnnouncement({
                                                ...editedAnnouncement,
                                                content: e.target.value
                                            })}
                                        ></textarea>
                                    </div>

                                    <div className="ad-form-checkboxes">
                                        <label className="ad-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={editedAnnouncement.isPinned}
                                                onChange={(e) => setEditedAnnouncement({
                                                    ...editedAnnouncement,
                                                    isPinned: e.target.checked
                                                })}
                                            />
                                            <span className="ad-checkbox-text">상단 고정</span>
                                        </label>
                                        <label className="ad-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={editedAnnouncement.isUrgent}
                                                onChange={(e) => setEditedAnnouncement({
                                                    ...editedAnnouncement,
                                                    isUrgent: e.target.checked
                                                })}
                                            />
                                            <span className="ad-checkbox-text">긴급 공지</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="ad-modal-footer">
                                    <button 
                                        className="ad-btn ad-btn-secondary"
                                        onClick={() => setShowEditModal(false)}
                                    >
                                        취소
                                    </button>
                                    <button 
                                        className="ad-btn ad-btn-primary"
                                        onClick={handleSaveEdit}
                                    >
                                        수정 완료
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AnnouncementDetailPage;