import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import Sidebar from '../../dashboard/Sidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/GraduationRequirementsPage.css';

const GraduationRequirementsPage = () => {
    const [userData, setUserData] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [activeTab, setActiveTab] = useState('graduation');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [requirements, setRequirements] = useState({
        majorCredits: { required: 36, completed: 28, percentage: 78 },
        generalCredits: { required: 30, completed: 24, percentage: 80 },
        electiveCredits: { required: 54, completed: 42, percentage: 78 },
        totalCredits: { required: 120, completed: 94, percentage: 78 },
        gpa: { required: 2.0, current: 3.45, status: 'pass' },
        capstoneProject: { required: true, completed: false, status: 'pending' },
    });

    useEffect(() => {
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
        setLoading(false);
    }, [navigate]);

    // 전체 졸업 요건 달성률 계산
    const calculateOverallProgress = () => {
        const creditProgress = requirements.totalCredits.percentage;
        const gpaStatus = requirements.gpa.status === 'pass' ? 100 : 0;
        const capstoneStatus = requirements.capstoneProject.status === 'pass' ? 100 : 0;

        return Math.round((creditProgress + gpaStatus + capstoneStatus) / 3);
    };

    // 남은 학점 계산
    const getRemainingCredits = () => {
        return requirements.totalCredits.required - requirements.totalCredits.completed;
    };

    // 예상 졸업 시기 계산
    const getExpectedGraduation = () => {
        const remainingCredits = getRemainingCredits();
        if (remainingCredits <= 0) return '졸업 가능';

        const averageCreditsPerSemester = 18;
        const remainingSemesters = Math.ceil(remainingCredits / averageCreditsPerSemester);

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        const isFirstSemester = currentMonth >= 3 && currentMonth <= 8;
        let targetYear = currentYear;
        let targetSemester = isFirstSemester ? 1 : 2;

        for (let i = 0; i < remainingSemesters; i++) {
            if (targetSemester === 1) {
                targetSemester = 2;
            } else {
                targetSemester = 1;
                targetYear++;
            }
        }

        return `${targetYear}년 ${targetSemester}학기`;
    };

    // 상태별 클래스 이름
    const getStatusClass = (status) => {
        switch (status) {
            case 'pass': return 'graduation-status-pass';
            case 'pending': return 'graduation-status-pending';
            case 'fail': return 'graduation-status-fail';
            default: return 'graduation-status-pending';
        }
    };

    // 진행률별 클래스 이름
    const getProgressClass = (percentage) => {
        if (percentage >= 100) return 'graduation-progress-complete';
        if (percentage >= 80) return 'graduation-progress-good';
        if (percentage >= 50) return 'graduation-progress-medium';
        return 'graduation-progress-low';
    };

    if (loading) {
        return (
            <div className="graduation-loading-container">
                <div className="graduation-loading-spinner"></div>
                <p>졸업 요건 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

    if (!studentData) {
        return (
            <div className="graduation-error-container">
                <p>학생 데이터를 불러올 수 없습니다. 다시 로그인해주세요.</p>
                <button onClick={() => navigate('/login')}>로그인 페이지로 이동</button>
            </div>
        );
    }

    const overallProgress = calculateOverallProgress();
    const remainingCredits = getRemainingCredits();
    const expectedGraduation = getExpectedGraduation();

    return (
        <div className="graduation-dashboard">
            <Header username={userData?.name || '사용자'} role="학생" />

            <div className="graduation-main">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    studentName={userData?.name || ''}
                    studentId={userData?.studentId || ''}
                    department={userData?.department || ''}
                />

                <div className="graduation-content">
                    <div className="graduation-banner">
                        <h2>졸업 요건 확인</h2>
                        <p>{studentData.academic?.year || ''}학년 {studentData.academic?.semester || ''}학기 / 학번: {userData?.studentId || ''}</p>
                    </div>

                    {/* 졸업 요건 요약 섹션 */}
                    <div className="graduation-summary-section">
                        <div className="graduation-summary-card graduation-overall-progress">
                            <div className="graduation-summary-icon">
                                <i className="fas fa-graduation-cap"></i>
                            </div>
                            <div className="graduation-summary-content">
                                <div className="graduation-summary-title">전체 진행률</div>
                                <div className={`graduation-summary-value ${getProgressClass(overallProgress)}`}>
                                    {overallProgress}%
                                </div>
                                <div className="graduation-progress-bar">
                                    <div
                                        className={`graduation-progress-fill ${getProgressClass(overallProgress)}`}
                                        style={{ width: `${overallProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="graduation-summary-card graduation-remaining-credits">
                            <div className="graduation-summary-icon">
                                <i className="fas fa-clock"></i>
                            </div>
                            <div className="graduation-summary-content">
                                <div className="graduation-summary-title">남은 학점</div>
                                <div className="graduation-summary-value">{remainingCredits}학점</div>
                                <div className="graduation-summary-subtitle">
                                    예상 졸업: {expectedGraduation}
                                </div>
                            </div>
                        </div>

                        <div className="graduation-summary-card graduation-gpa-status">
                            <div className="graduation-summary-icon">
                                <i className="fas fa-chart-line"></i>
                            </div>
                            <div className="graduation-summary-content">
                                <div className="graduation-summary-title">평점 평균</div>
                                <div className={`graduation-summary-value ${getStatusClass(requirements.gpa.status)}`}>
                                    {requirements.gpa.current}
                                </div>
                                <div className="graduation-summary-subtitle">
                                    기준: {requirements.gpa.required} 이상
                                </div>
                            </div>
                        </div>

                        <div className="graduation-summary-card graduation-completion-status">
                            <div className="graduation-summary-icon">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <div className="graduation-summary-content">
                                <div className="graduation-summary-title">졸업 가능 여부</div>
                                <div className={`graduation-summary-value ${overallProgress >= 100 ? 'graduation-status-pass' : 'graduation-status-pending'}`}>
                                    {overallProgress >= 100 ? '졸업 가능' : '요건 미충족'}
                                </div>
                                <div className="graduation-summary-subtitle">
                                    {overallProgress >= 100 ? '모든 요건 충족' : `${100 - overallProgress}% 부족`}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 상세 요건 확인 섹션 */}
                    <div className="graduation-details-section">
                        <div className="graduation-details-header">
                            <h3>상세 졸업 요건</h3>
                            <div className="graduation-category-filter">
                                <button
                                    className={`graduation-filter-btn ${selectedCategory === 'all' ? 'graduation-filter-active' : ''}`}
                                    onClick={() => setSelectedCategory('all')}
                                >
                                    전체
                                </button>
                                <button
                                    className={`graduation-filter-btn ${selectedCategory === 'credits' ? 'graduation-filter-active' : ''}`}
                                    onClick={() => setSelectedCategory('credits')}
                                >
                                    학점
                                </button>
                                <button
                                    className={`graduation-filter-btn ${selectedCategory === 'others' ? 'graduation-filter-active' : ''}`}
                                    onClick={() => setSelectedCategory('others')}
                                >
                                    기타
                                </button>
                            </div>
                        </div>

                        <div className="graduation-requirements-list">
                            {/* 학점 요건 */}
                            {(selectedCategory === 'all' || selectedCategory === 'credits') && (
                                <div className="graduation-category-section">
                                    <h4 className="graduation-category-title">
                                        <i className="fas fa-book-open"></i>
                                        학점 요건
                                    </h4>

                                    <div className="graduation-requirement-item">
                                        <div className="graduation-requirement-header">
                                            <div className="graduation-requirement-title">
                                                <i className="fas fa-book"></i>
                                                전공 학점
                                            </div>
                                            <div className={`graduation-requirement-status ${getProgressClass(requirements.majorCredits.percentage)}`}>
                                                {requirements.majorCredits.completed}/{requirements.majorCredits.required}학점
                                            </div>
                                        </div>
                                        <div className="graduation-requirement-progress">
                                            <div className="graduation-progress-bar">
                                                <div
                                                    className={`graduation-progress-fill ${getProgressClass(requirements.majorCredits.percentage)}`}
                                                    style={{ width: `${requirements.majorCredits.percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="graduation-progress-text">{requirements.majorCredits.percentage}%</span>
                                        </div>
                                    </div>

                                    <div className="graduation-requirement-item">
                                        <div className="graduation-requirement-header">
                                            <div className="graduation-requirement-title">
                                                <i className="fas fa-globe"></i>
                                                교양 학점
                                            </div>
                                            <div className={`graduation-requirement-status ${getProgressClass(requirements.generalCredits.percentage)}`}>
                                                {requirements.generalCredits.completed}/{requirements.generalCredits.required}학점
                                            </div>
                                        </div>
                                        <div className="graduation-requirement-progress">
                                            <div className="graduation-progress-bar">
                                                <div
                                                    className={`graduation-progress-fill ${getProgressClass(requirements.generalCredits.percentage)}`}
                                                    style={{ width: `${requirements.generalCredits.percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="graduation-progress-text">{requirements.generalCredits.percentage}%</span>
                                        </div>
                                    </div>

                                    <div className="graduation-requirement-item">
                                        <div className="graduation-requirement-header">
                                            <div className="graduation-requirement-title">
                                                <i className="fas fa-plus"></i>
                                                선택 학점
                                            </div>
                                            <div className={`graduation-requirement-status ${getProgressClass(requirements.electiveCredits.percentage)}`}>
                                                {requirements.electiveCredits.completed}/{requirements.electiveCredits.required}학점
                                            </div>
                                        </div>
                                        <div className="graduation-requirement-progress">
                                            <div className="graduation-progress-bar">
                                                <div
                                                    className={`graduation-progress-fill ${getProgressClass(requirements.electiveCredits.percentage)}`}
                                                    style={{ width: `${requirements.electiveCredits.percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="graduation-progress-text">{requirements.electiveCredits.percentage}%</span>
                                        </div>
                                    </div>

                                    <div className="graduation-requirement-item graduation-total-credits">
                                        <div className="graduation-requirement-header">
                                            <div className="graduation-requirement-title">
                                                <i className="fas fa-calculator"></i>
                                                총 이수 학점
                                            </div>
                                            <div className={`graduation-requirement-status ${getProgressClass(requirements.totalCredits.percentage)}`}>
                                                {requirements.totalCredits.completed}/{requirements.totalCredits.required}학점
                                            </div>
                                        </div>
                                        <div className="graduation-requirement-progress">
                                            <div className="graduation-progress-bar">
                                                <div
                                                    className={`graduation-progress-fill ${getProgressClass(requirements.totalCredits.percentage)}`}
                                                    style={{ width: `${requirements.totalCredits.percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="graduation-progress-text">{requirements.totalCredits.percentage}%</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 기타 요건 */}
                            {(selectedCategory === 'all' || selectedCategory === 'others') && (
                                <div className="graduation-category-section">
                                    <h4 className="graduation-category-title">
                                        <i className="fas fa-list-check"></i>
                                        기타 요건
                                    </h4>

                                    <div className="graduation-requirement-item">
                                        <div className="graduation-requirement-header">
                                            <div className="graduation-requirement-title">
                                                <i className="fas fa-project-diagram"></i>
                                                졸업 작품/논문
                                            </div>
                                            <div className={`graduation-requirement-badge ${getStatusClass(requirements.capstoneProject.status)}`}>
                                                {requirements.capstoneProject.status === 'pass' ? '완료' :
                                                    requirements.capstoneProject.status === 'pending' ? '진행중' : '미착수'}
                                            </div>
                                        </div>
                                        <div className="graduation-requirement-description">
                                            캡스톤 프로젝트 또는 졸업논문 제출 및 발표 (4학년 2학기 필수)
                                        </div>
                                    </div>


                                </div>
                            )}
                        </div>
                    </div>

                    {/* 액션 버튼 섹션 */}
                    <div className="graduation-actions-section">
                        <div className="graduation-actions-container">
                            <button className="graduation-btn graduation-btn-outline">
                                <i className="fas fa-download"></i>
                                졸업사정표 출력
                            </button>
                            <button className="graduation-btn graduation-btn-secondary">
                                <i className="fas fa-file-alt"></i>
                                이수계획서 작성
                            </button>
                            <button
                                className={`graduation-btn ${overallProgress >= 100 ? 'graduation-btn-primary' : 'graduation-btn-disabled'}`}
                                disabled={overallProgress < 100}
                            >
                                <i className="fas fa-calendar-check"></i>
                                졸업신청 하기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GraduationRequirementsPage;