import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import Sidebar from '../../dashboard/Sidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/AssignmentSubmissionPage.css';

const AssignmentSubmissionPage = () => {
    const [userData, setUserData] = useState(null);
    const [studentData, setStudentData] = useState(null);
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
    const { assignmentId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        // 사용자 정보 및 과제 데이터 로드
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }

        const dashboardData = getDashboardData();
        if (!dashboardData) {
            navigate('/student/dashboard');
            return;
        }

        setUserData(user);
        setStudentData(dashboardData);

        // 과제 ID에 해당하는 과제 정보 찾기
        const foundAssignment = dashboardData.assignments.find(a => a.id === parseInt(assignmentId));
        if (!foundAssignment) {
            setError('과제를 찾을 수 없습니다.');
            setLoading(false);
            return;
        }

        // 마감일 체크
        const today = new Date();
        const deadlineDate = new Date(foundAssignment.deadline);
        if (deadlineDate < today) {
            // 마감일이 지난 경우
            setIsExpired(true);
            // 마감 상태로 업데이트
            if (foundAssignment.status !== '완료') {
                foundAssignment.status = '마감';
            }
        }

        setAssignment(foundAssignment);

        // 과제가 속한 강의 정보 찾기
        const foundCourse = dashboardData.courses.find(c => c.name === foundAssignment.course);
        if (foundCourse) {
            setCourse(foundCourse);
        }

        setLoading(false);
    }, [assignmentId, navigate]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // 파일 크기 제한 (10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                alert("파일 크기는 10MB를 초과할 수 없습니다.");
                e.target.value = '';
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleCommentChange = (e) => {
        setComment(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // 마감일이 지난 경우 제출 불가
        if (isExpired) {
            alert("마감된 과제는 제출할 수 없습니다.");
            return;
        }

        // 파일이 필요한 경우 체크
        if (assignment.submissionType === '파일 업로드' && !file) {
            alert("제출할 파일을 선택해주세요.");
            return;
        }

        setSubmitting(true);

        // 실제 환경에서는 API 호출 등으로 변경
        setTimeout(() => {
            // 제출 성공 처리
            setSubmitSuccess(true);
            setSubmitting(false);
        }, 1500);
    };

    const formatDeadline = (deadlineStr) => {
        const deadline = new Date(deadlineStr);
        const now = new Date();
        const diff = deadline - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days < 0) {
            return `기간 만료 (${deadlineStr})`;
        } else if (days === 0) {
            return `오늘 마감 (${deadlineStr})`;
        } else {
            return `${days}일 남음 (${deadlineStr})`;
        }
    };

    const getRemainingTimeStyle = (deadlineStr) => {
        const deadline = new Date(deadlineStr);
        const now = new Date();
        const diff = deadline - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days < 0) {
            return 'assp-expired';
        } else if (days <= 1) {
            return 'assp-urgent';
        } else if (days <= 3) {
            return 'assp-warning';
        } else {
            return 'assp-normal';
        }
    };

    if (loading) {
        return (
            <div className="assp-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="assp-main-layout">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department || userData?.major}
                    />
                    <main className="assp-main-content">
                        <div className="assp-loading-container">
                            <div className="assp-loading-spinner"></div>
                            <p>과제 정보를 불러오는 중입니다...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="assp-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="assp-main-layout">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department || userData?.major}
                    />
                    <main className="assp-main-content">
                        <div className="assp-error-container">
                            <h2>{error}</h2>
                            <p>과제를 찾을 수 없습니다.</p>
                            <button className="assp-btn assp-btn-primary" onClick={() => navigate('/student/assignments')}>
                                과제 목록으로 돌아가기
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (submitSuccess) {
        return (
            <div className="assp-page">
                <Header
                    username={userData?.name}
                    role={userData?.role || '학생'}
                />
                <div className="assp-main-layout">
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        studentName={userData?.name}
                        studentId={userData?.studentId || userData?.id}
                        department={userData?.department || userData?.major}
                    />
                    <main className="assp-main-content">
                        <div className="assp-submission-success">
                            <div className="assp-success-icon">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <h2>과제 제출 완료</h2>
                            <p>성공적으로 과제가 제출되었습니다.</p>
                            <div className="assp-success-actions">
                                <button className="assp-btn assp-btn-primary" onClick={() => navigate('/student/assignments')}>
                                    과제 목록으로 돌아가기
                                </button>
                                <button className="assp-btn assp-btn-outline" onClick={() => navigate('/student/dashboard')}>
                                    대시보드로 이동
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="assp-page">
            <Header
                username={userData?.name}
                role={userData?.role || '학생'}
            />
            <div className="assp-main-layout">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    studentName={userData?.name}
                    studentId={userData?.studentId || userData?.id}
                    department={userData?.department || userData?.major}
                />
                <main className="assp-main-content">
                    <div className="assp-assignment-submission-container">
                        {/* 과제 정보 카드 */}
                        <div className="assp-card assp-assignment-info-card">
                            <div className="assp-card-header">
                                <h3>과제 정보</h3>
                                <div className="assp-breadcrumb">
                                    {course?.name} / {assignment.title}
                                </div>
                            </div>
                            <div className="assp-card-body assp-assignment-card-body">
                                {isExpired && (
                                    <div className="assp-expired-notice">
                                        <i className="fas fa-exclamation-triangle"></i>
                                        <p>이 과제는 마감되었습니다. 제출이 불가능합니다.</p>
                                    </div>
                                )}

                                <div className="assp-assignment-details">
                                    <div className="assp-assignment-header">
                                        <h4 className="assp-assignment-title">{assignment.title}</h4>
                                        <span className={`assp-assignment-deadline ${getRemainingTimeStyle(assignment.deadline)}`}>
                                            {formatDeadline(assignment.deadline)}
                                        </span>
                                    </div>

                                    <div className="assp-assignment-description">
                                        <p>{assignment.description}</p>
                                    </div>

                                    <div className="assp-assignment-meta">
                                        <div className="assp-meta-item">
                                            <div className="assp-meta-label">과목</div>
                                            <div className="assp-meta-value">{assignment.course}</div>
                                        </div>
                                        <div className="assp-meta-item">
                                            <div className="assp-meta-label">마감일</div>
                                            <div className="assp-meta-value">{assignment.deadline}</div>
                                        </div>
                                        <div className="assp-meta-item">
                                            <div className="assp-meta-label">제출 방법</div>
                                            <div className="assp-meta-value">{assignment.submissionType || '파일 업로드'}</div>
                                        </div>
                                        <div className="assp-meta-item">
                                            <div className="assp-meta-label">현재 상태</div>
                                            <div className={`assp-meta-value ${isExpired ? 'assp-expired-status' : ''}`}>
                                                {assignment.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 제출 카드 */}
                        <div className="assp-card assp-submission-card">
                            <div className="assp-card-header">
                                <h3>과제 제출</h3>
                            </div>
                            <div className="assp-card-body">
                                <form className="assp-submission-form" onSubmit={handleSubmit}>
                                    {!isExpired && (
                                        <div className="assp-submission-notice">
                                            <p>
                                                <i className="fas fa-info-circle"></i>
                                                과제를 제출하기 전에 모든 요구사항을 확인해주세요.
                                            </p>
                                        </div>
                                    )}

                                    <div className="assp-form-group">
                                        <label htmlFor="file-upload">파일 업로드</label>
                                        <div className="assp-file-upload-container">
                                            <input
                                                type="file"
                                                id="file-upload"
                                                onChange={handleFileChange}
                                                disabled={isExpired}
                                                accept=".pdf,.doc,.docx,.hwp,.zip,.rar"
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
                                            onClick={() => navigate('/student/assignments')}
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
                                                    <span className="assp-spinner-border"></span>
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
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AssignmentSubmissionPage;
