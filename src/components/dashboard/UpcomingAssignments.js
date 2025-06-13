import React from 'react';
import './UpcomingAssignments.css';

const UpcomingAssignments = ({ assignments, maxItems = 4 }) => {
  const sortedAssignments = [...assignments]
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, maxItems);

  const getDaysRemaining = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusClassName = (status) => {
    switch(status) {
      case '완료': return 'status-completed';
      case '지연': return 'status-late';
      case '진행중': return 'status-in-progress';
      default: return 'status-pending';
    }
  };

  if (sortedAssignments.length === 0) {
    return <div className="assignment-empty-message">예정된 과제가 없습니다.</div>;
  }

  return (
    <div className="assignment-list">
      {sortedAssignments.map((assignment) => {
        const daysRemaining = getDaysRemaining(assignment.deadline);
        return (
          <div key={assignment.id} className="assignment-item">
            <div className="assignment-info">
              <div className="assignment-course">{assignment.course}</div>
              <div className="assignment-title">{assignment.title}</div>
              <div className="assignment-deadline">
                <i className="fas fa-clock"></i>
                {daysRemaining >= 0 ? `${daysRemaining}일 남음` : '마감됨'}
              </div>
            </div>
            <div className={`assignment-status ${getStatusClassName(assignment.status)}`}>
              {assignment.status}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UpcomingAssignments;
