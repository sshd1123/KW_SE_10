import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TimeTable.css';

const TimeTable = ({ courses }) => {
  const navigate = useNavigate();
  const [showAllPeriods, setShowAllPeriods] = useState(false);

  const periods = [
    { period: 0, time: "08:00~08:50", startTime: "08:00" },
    { period: 1, time: "09:00~10:15", startTime: "09:00" },
    { period: 2, time: "10:30~11:45", startTime: "10:30" },
    { period: 3, time: "12:00~13:15", startTime: "12:00" },
    { period: 4, time: "13:00~14:30", startTime: "13:00" },
    { period: 5, time: "13:30~14:45", startTime: "13:30" },
    { period: 6, time: "15:00~16:15", startTime: "15:00" },
    { period: 7, time: "16:30~17:45", startTime: "16:30" },
    { period: 8, time: "18:00~18:45", startTime: "18:00" },
    { period: 9, time: "18:50~19:35", startTime: "18:50" },
    { period: 10, time: "19:40~20:25", startTime: "19:40" },
    { period: 11, time: "20:30~21:15", startTime: "20:30" },
    { period: 12, time: "21:20~22:05", startTime: "21:20" }
  ];

  const allDays = ['월', '화', '수', '목', '금', '토'];

  const processedCourses = courses.map(course => {
    if (course.schedule) {
      return course;
    }
    const schedule = [];
    const timeSchedules = course.time.split(',').map(s => s.trim());
    timeSchedules.forEach(timeItem => {
      const match = timeItem.match(/([월화수목금토])\s+(\d+:\d+)[-~](\d+:\d+)/);
      if (match) {
        schedule.push({
          day: match[1],
          startTime: match[2],
          endTime: match[3]
        });
      }
    });
    return { ...course, schedule: schedule };
  });

  const getDisplayDays = () => {
    const displayDays = ['월', '화', '수', '목', '금'];
    const hasSaturdayClass = processedCourses.some(course => 
      course.schedule.some(item => item.day === '토')
    );
    if (hasSaturdayClass) {
      displayDays.push('토');
    }
    return displayDays;
  };

  const days = getDisplayDays();

  const calculatePeriodRange = () => {
    if (showAllPeriods) {
      return periods;
    }
    let minPeriod = 1;
    let maxPeriod = 6;
    processedCourses.forEach(course => {
      course.schedule.forEach(scheduleItem => {
        const periodIndex = periods.findIndex(p => p.startTime === scheduleItem.startTime);
        if (periodIndex !== -1) {
          minPeriod = Math.min(minPeriod, periodIndex);
          maxPeriod = Math.max(maxPeriod, periodIndex);
        }
      });
    });
    return periods.slice(minPeriod, maxPeriod + 1);
  };

  const displayPeriods = calculatePeriodRange();

  const buildTimeTable = () => {
    const timetable = {};
    allDays.forEach(day => {
      timetable[day] = {};
      periods.forEach(p => {
        timetable[day][p.period] = null;
      });
    });
    processedCourses.forEach(course => {
      course.schedule.forEach(scheduleItem => {
        const { day, startTime } = scheduleItem;
        const periodIndex = periods.findIndex(p => p.startTime === startTime);
        if (periodIndex !== -1) {
          timetable[day][periodIndex] = course;
        }
      });
    });
    return timetable;
  };

  const timetable = buildTimeTable();

  const handleCourseClick = (course) => {
    if (course) {
      const encodedCourseId = encodeURIComponent(course.id);
      navigate(`/student/course/${encodedCourseId}`);
    }
  };

  const toggleAllPeriods = () => {
    setShowAllPeriods(!showAllPeriods);
  };

  return (
    <div className="timetable-container">
      <div className="timetable-controls">
        <button onClick={toggleAllPeriods} className="timetable-btn">
          {showAllPeriods ? '기본 시간표' : '전체 시간표'}
        </button>
      </div>
      
      <div className="timetable">
        <div className="timetable-header">
          <div className="timetable-time-label">교시</div>
          {days.map(day => (
            <div key={day} className="timetable-day-label">{day}</div>
          ))}
        </div>
        
        {displayPeriods.map(period => (
          <div key={period.period} className="timetable-row">
            <div className="timetable-time-label">
              <div className="period-number">{period.period}교시</div>
              <div className="period-time">{period.time}</div>
            </div>
            {days.map(day => {
              const course = timetable[day][period.period];
              return (
                <div 
                  key={`${day}-${period.period}`}
                  className={`timetable-cell ${course ? 'has-course' : ''}`}
                  onClick={() => handleCourseClick(course)}
                >
                  {course && (
                    <div className="timetable-course-info">
                      <div className="timetable-course-name">{course.name}</div>
                      <div className="timetable-course-room">{course.room}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeTable;
