import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import Sidebar from '../../dashboard/Sidebar';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/AssignmentSubmissionPage.css';

const AssignmentDetailPage = () => {
    const [userData, setUserData] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [assignment, setAssignment] = useState(null);
    const [course, setCourse] = useState(null);
    const [activeTab, setActiveTab] = useState('assignments');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [file, setFile] = useState(null);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [userRole, setUserRole] = useState('student'); // 'student' 또는 'professor'
    const [courseId, setCourseId] = useState(null);

    const { assignmentId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        // 사용자 정보 및 과제 데이터 로드
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }

        const data = getDashboardData();
        if (!data) {
            navigate('/dashboard');
            return;
        }

        setUserData(user);
        setDashboardData(data);

        // 사용자 역할 확인
        const role = user.role || (user.studentId ? 'student' : 'professor');
        setUserRole(role);

        // 과제 ID에 해당하는 과제 정보 찾기
        const foundAssignment = data.assignments.find(a => a.id === parseInt(assignmentId));
        if (!foundAssignment) {
            setError('과제를 찾을 수 없습니다.');
            setLoading(false);
            return;
        }

        // 마감일 체크 (학생인 경우에만)
        if (role === 'student') {
            const today = new Date();
            const deadlineDate = new Date(foundAssignment.deadline);
            if (deadlineDate < today) {
                setIsExpired(true);
                if (foundAssignment.status !== '완료') {
                    foundAssignment.status = '마감';
                }
            }
        }

        setAssignment(foundAssignment);

        // 과제가 속한 강의 정보 찾기
        const foundCourse = data.courses.find(c => c.name === foundAssignment.course);
        if (foundCourse) {
            setCourse(foundCourse);
        }

        setLoading(false);
    }, [assignmentId, navigate]);

    const getCourseIdFromAssignment = (assignment, dashboardData) => {
        if (assignment.courseId) {
            return assignment.courseId;
        }

        // 2. course 이름으로 찾기 (fallback)
        if (assignment.course && dashboardData?.courses) {
            const foundCourse = dashboardData.courses.find(c => c.name === assignment.course);
            return foundCourse?.id || null;
        }

        return null;
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // 파일 크기 제한 (10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                alert("파일 크기는 10MB를 초과할 수 없습니다.");
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleCommentChange = (e) => {
        setComment(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file && userRole === 'student') {
            alert("파일을 선택해주세요.");
            return;
        }

        setSubmitting(true);

        try {
            // 실제 제출 로직은 여기에 구현
            await new Promise(resolve => setTimeout(resolve, 2000)); // 가상의 제출 시간

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate(userRole === 'student' ? '/student/courses' : '/professor/courses');
            }, 1500);

        } catch (error) {
            console.error('제출 중 오류 발생:', error);
            alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setSubmitting(false);
        }
    };

    // 교수용 수정 버튼 핸들러
    const handleEditAssignment = () => {
        navigate(`/professor/assignment/${assignmentId}/edit`);
    };

    // 교수용 제출물 다운로드 핸들러
    const handleDownloadSubmissions = () => {
        // 제출물 다운로드 로직
        alert('제출물을 다운로드합니다.');
    };

    const getDeadlineStatus = () => {
        if (!assignment) return 'normal';

        const today = new Date();
        const deadline = new Date(assignment.deadline);
        const timeDiff = deadline.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff < 0) return 'expired';
        if (daysDiff <= 1) return 'urgent';
        if (daysDiff <= 3) return 'warning';
        return 'normal';
    };

    if (loading) {
        return (
            <div className="assp-page">
                <Header userData={userData} />
                <div className="assp-main-layout">
                    {userRole === 'student' ?
                        <Sidebar activeTab={activeTab} /> :
                        <ProfessorSidebar activeTab={activeTab} />
                    }
                    <div className="assp-main-content">
                        <div className="assp-assignment-submission-container">
                            <div className="assp-card">
                                <div className="assp-card-body">
                                    <div>로딩 중...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="assp-page">
                <Header userData={userData} />
                <div className="assp-main-layout">
                    {userRole === 'student' ?
                        <Sidebar activeTab={activeTab} /> :
                        <ProfessorSidebar activeTab={activeTab} />
                    }
                    <div className="assp-main-content">
                        <div className="assp-assignment-submission-container">
                            <div className="assp-card">
                                <div className="assp-card-body">
                                    <div>{error}</div>
                                    <button
                                        className="assp-btn assp-btn-primary"
                                        onClick={() => navigate(userRole === 'student' ? '/student/courses' : '/professor/courses')}
                                    >
                                        목록으로 돌아가기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (submitSuccess) {
        return (
            <div className="assp-page">
                <Header userData={userData} />
                <div className="assp-main-layout">
                    {userRole === 'student' ?
                        <Sidebar activeTab={activeTab} /> :
                        <ProfessorSidebar activeTab={activeTab} />
                    }
                    <div className="assp-main-content">
                        <div className="assp-submission-success">
                            <div className="assp-success-icon">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <h2>과제가 성공적으로 제출되었습니다!</h2>
                            <p>제출한 과제는 담당 교수님께서 검토 후 피드백을 제공할 예정입니다.</p>
                            <div className="assp-success-actions">
                                <button
                                    className="assp-btn assp-btn-primary"
                                    onClick={() => navigate(userRole === 'student' ? '/student/courses' : '/professor/courses')}
                                >
                                    과제 목록으로
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleDeleteAssignment = () => {
        // 삭제 확인 대화상자
        const confirmDelete = window.confirm(
            `"${assignment?.title}" 과제를 정말 삭제하시겠습니까?\n\n` +
            `⚠️ 주의사항:\n` +
            `• 과제와 관련된 모든 제출물이 삭제됩니다\n` +
            `• 학생들의 제출 기록도 함께 삭제됩니다\n` +
            `• 이 작업은 되돌릴 수 없습니다\n\n` +
            `삭제하려면 "확인"을 클릭하세요.`
        );

        if (!confirmDelete) {
            return;
        }

        // 한 번 더 확인 (중요한 작업이므로)
        const doubleConfirm = window.confirm(
            `정말로 "${assignment?.title}" 과제를 삭제하시겠습니까?\n` +
            `이 작업은 되돌릴 수 없습니다!`
        );

        if (!doubleConfirm) {
            return;
        }

        try {
            // 실제 삭제 로직 (API 호출 등)
            console.log('과제 삭제:', {
                assignmentId: assignmentId,
                courseId: courseId,
                title: assignment?.title
            });

            // 여기에 실제 삭제 API 호출
            // await deleteAssignment(assignmentId);

            alert('과제가 성공적으로 삭제되었습니다.');

            // 삭제 후 과제 목록 페이지로 이동
            navigate('/professor/courses');

        } catch (error) {
            console.error('과제 삭제 중 오류 발생:', error);
            alert('과제 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <div className="assp-page">
            <Header userData={userData} />
            <div className="assp-main-layout">
                {userRole === 'student' ?
                    <Sidebar activeTab={activeTab} /> :
                    <ProfessorSidebar activeTab={activeTab} />
                }
                <div className="assp-main-content">
                    <div className="assp-assignment-submission-container">
                        {/* 브레드크럼 */}
                        <div className="assp-breadcrumb">
                            <span
                                onClick={() => navigate(userRole === 'student' ? '/student/dashboard' : '/professor/dashboard')}
                                style={{ cursor: 'pointer', color: 'var(--assp-primary-color)' }}
                            >
                                {userRole === 'student' ? '학생 대시보드' : '교수 대시보드'}
                            </span>
                            {' > '}
                            <span
                                onClick={() => navigate(userRole === 'student' ? '/student/courses' : '/professor/courses')}
                                style={{ cursor: 'pointer', color: 'var(--assp-primary-color)' }}
                            >
                                과제 목록
                            </span>
                            {' > '}
                            <span>{assignment?.title}</span>
                        </div>

                        {/* 과제 정보 카드 */}
                        <div className="assp-card assp-assignment-info-card">
                            <div className="assp-card-header">
                                <h3>과제 정보</h3>
                                {/* 교수인 경우 수정 버튼 표시 */}
                                {userRole === 'professor' && (
                                    <div className="assp-professor-actions">
                                        <button
                                            className="assp-btn assp-btn-outline"
                                            onClick={handleEditAssignment}
                                            style={{ marginRight: '0.5rem' }}
                                        >
                                            <i className="fas fa-edit"></i> 수정
                                        </button>
                                        <button
                                            className="assp-btn assp-btn-danger"
                                            onClick={handleDeleteAssignment}
                                            title="과제 삭제 (되돌릴 수 없음)"
                                        >
                                            <i className="fas fa-trash-alt"></i> 삭제
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="assp-card-body assp-assignment-card-body">
                                <div className="assp-assignment-details">
                                    <div className="assp-assignment-header">
                                        <h2 className="assp-assignment-title">{assignment?.title}</h2>
                                        <div className={`assp-assignment-deadline assp-${getDeadlineStatus()}`}>
                                            {assignment?.deadline ?
                                                new Date(assignment.deadline).toLocaleDateString('ko-KR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) :
                                                '마감일 미정'
                                            }
                                        </div>
                                    </div>

                                    <div className="assp-assignment-description">
                                        <p>{assignment?.description}</p>
                                    </div>

                                    <div className="assp-assignment-meta">
                                        <div className="assp-meta-item">
                                            <div className="assp-meta-label">과목</div>
                                            <div className="assp-meta-value">{assignment?.course}</div>
                                        </div>
                                        <div className="assp-meta-item">
                                            <div className="assp-meta-label">배점</div>
                                            <div className="assp-meta-value">{assignment?.maxScore}점</div>
                                        </div>
                                        <div className="assp-meta-item">
                                            <div className="assp-meta-label">상태</div>
                                            <div className="assp-meta-value">{assignment?.status}</div>
                                        </div>
                                        <div className="assp-meta-item">
                                            <div className="assp-meta-label">과제 유형</div>
                                            <div className="assp-meta-value">개인 과제</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 학생인 경우에만 제출 카드 표시 */}
                        {userRole === 'student' && (
                            <>
                                {/* 마감된 과제 알림 */}
                                {isExpired && (
                                    <div className="assp-expired-notice">
                                        <i className="fas fa-exclamation-triangle"></i>
                                        <div>
                                            <strong>과제 마감</strong><br />
                                            이 과제는 마감되어 더 이상 제출할 수 없습니다.
                                        </div>
                                    </div>
                                )}

                                {/* 과제 제출 카드 */}
                                <div className="assp-card assp-submission-card">
                                    <div className="assp-card-header">
                                        <h3>과제 제출</h3>
                                    </div>
                                    <div className="assp-card-body">
                                        <form onSubmit={handleSubmit} className="assp-submission-form">
                                            <div className="assp-form-group">
                                                <label htmlFor="file">파일 선택 *</label>
                                                <div className="assp-file-upload-container">
                                                    <input
                                                        type="file"
                                                        id="file"
                                                        accept=".pdf,.doc,.docx,.hwp,.zip,.rar"
                                                        onChange={handleFileChange}
                                                        disabled={isExpired}
                                                    />
                                                    {file ? (
                                                        <div className="assp-selected-file">
                                                            <i className="fas fa-file-alt"></i>
                                                            <span>{file.name}</span>
                                                            <div className="assp-file-size">
                                                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="assp-upload-placeholder">
                                                            <i className="fas fa-cloud-upload-alt"></i>
                                                            <span>파일을 선택하거나 여기에 드래그하세요</span>
                                                            <div className="assp-file-formats">
                                                                지원 형식: PDF, DOC, DOCX, HWP, ZIP, RAR (최대 10MB)
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="assp-form-group">
                                                <label htmlFor="comment">제출 메모 (선택사항)</label>
                                                <textarea
                                                    id="comment"
                                                    rows="4"
                                                    placeholder="과제에 대한 추가 설명이나 메모를 입력하세요..."
                                                    value={comment}
                                                    onChange={handleCommentChange}
                                                    disabled={isExpired}
                                                />
                                            </div>

                                            <div className="assp-form-actions">
                                                <button
                                                    type="button"
                                                    className="assp-btn assp-btn-outline"
                                                    onClick={() => navigate('/student/courses')}
                                                >
                                                    취소
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="assp-btn assp-btn-primary"
                                                    disabled={submitting || isExpired}
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <div className="assp-spinner-border"></div>
                                                            제출 중...
                                                        </>
                                                    ) : (
                                                        '과제 제출'
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentDetailPage;