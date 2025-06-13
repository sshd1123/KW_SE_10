import React from 'react';
import { Link } from 'react-router-dom';
import './CourseCard.css';

const CourseCard = ({ course }) => {
  const formatSchedule = () => {
    if (Array.isArray(course.schedule) && course.schedule.length > 0) {
      return course.schedule
        .map(s => `${s.day} ${s.startTime}-${s.endTime}`)
        .join(', ');
    }
    return course.time || '시간 미정';
  };

  return (
    <Link to={`/student/course/${course.id}`} className="course-card">
      <div className="course-card-header">
        <span className="course-id">{course.id}</span>
        <span className="course-credits">{course.credits}학점</span>
      </div>
      <h3 className="course-name">{course.name}</h3>
      <div className="course-details">
        <p><i className="fas fa-user"></i> {course.professor}</p>
        <p><i className="fas fa-clock"></i> {formatSchedule()}</p>
        <p><i className="fas fa-map-marker-alt"></i> {course.room}</p>
      </div>
    </Link>
  );
};

export default CourseCard;
