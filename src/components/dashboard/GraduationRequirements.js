// GraduationRequirements.js (간단하게 수정)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/GraduationRequirements.css';

const GraduationRequirements = ({ studentData }) => {
    const navigate = useNavigate();
    const [requirements, setRequirements] = useState({
        majorCredits: { required: 36, completed: 28, percentage: 78 },
        generalCredits: { required: 30, completed: 24, percentage: 80 },
        electiveCredits: { required: 54, completed: 42, percentage: 78 },
        totalCredits: { required: 130, completed: 94, percentage: 78 },
        gpa: { required: 2.0, current: 3.2, status: 'pass' },
        capstoneProject: { required: true, completed: false, status: 'pending' },
    });

    // 졸업 요건 달성률 계산
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
        const averageCreditsPerSemester = 18;
        const remainingSemesters = Math.ceil(remainingCredits / averageCreditsPerSemester);
        
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        // 현재 학기 판단 (3-8월: 1학기, 9-2월: 2학기)
        const isFirstSemester = currentMonth >= 3 && currentMonth <= 8;
        let targetYear = currentYear;
        let targetSemester = isFirstSemester ? 1 : 2;
        
        // 남은 학기만큼 더하기
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

    const overallProgress = calculateOverallProgress();
    const remainingCredits = getRemainingCredits();
    const expectedGraduation = getExpectedGraduation();

    return (
        <div className="graduation-requirements-simple">
            {/* 원형 진행률 표시 */}
            <div className="graduation-progress-container">
                <div className="graduation-circle">
                    <div className="graduation-percentage">
                        {overallProgress}%
                    </div>
                    <div className="graduation-label">
                        졸업 요건 달성률
                    </div>
                </div>
            </div>
            
            {/* 요약 정보 */}
            <div className="graduation-info">
                <div className="graduation-info-item">
                    <i className="fas fa-clock"></i>
                    <span>졸업까지 <strong>{remainingCredits}학점</strong> 남았습니다</span>
                </div>
                <div className="graduation-info-item">
                    <i className="fas fa-calendar-alt"></i>
                    <span>예상 졸업: <strong>{expectedGraduation}</strong></span>
                </div>
            </div>
            
            {/* 상세보기 버튼 */}
            <div className="graduation-footer">
                <button 
                    className="graduation-btn"
                    onClick={() => navigate('/student/graduation')}
                >
                    <i className="fas fa-graduation-cap"></i>
                    상세 확인
                </button>
            </div>
        </div>
    );
};

export default GraduationRequirements;