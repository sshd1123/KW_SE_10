import React from 'react';
import './GradesSummary.css';

const GradesSummary = ({ grades }) => {
  const gpaPercentage = (grades.gpa / 4.5) * 100;

  const gradeDetails = [
    { label: '평균 학점', value: grades.gpa + '/4.5' },
    { label: '취득 학점', value: grades.totalCredits + '학점' },
    { label: '학년', value: grades.year + '학년' },
    { label: '학기', value: grades.semester + '학기' },
    { label: '학적 상태', value: grades.status },
    { label: '지도교수', value: grades.advisor }
  ];

  return (
    <div className="grades-summary">
      <div className="grade-chart-container">
        <div className="grade-chart">
          <div className="grade-value">{grades.gpa}</div>
        </div>
      </div>
      <div className="grades-summary-brief">
        {gradeDetails.map((detail, index) => (
          <div key={index} className="grade-stat-item">
            <div className="grade-stat-label">{detail.label}</div>
            <div className="grade-stat-value">{detail.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GradesSummary;
