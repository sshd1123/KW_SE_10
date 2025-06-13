import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/ProfessorSchedulePage.css';

const ProfessorSchedulePage = () => {
    const [userData, setUserData] = useState(null);
    const [professorData, setProfessorData] = useState(null);
    const [activeTab, setActiveTab] = useState('schedule');
    const [loading, setLoading] = useState(true);
    const [selectedWeek, setSelectedWeek] = useState(0); // 0: 이번주, 1: 다음주, -1: 지난주
    const [viewMode, setViewMode] = useState('week'); // 'week' or 'list'
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
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

    // 교시 정보 정의
    const timeSlots = [
        { period: 1, time: "09:00-10:15", startTime: "09:00", endTime: "10:15" },
        { period: 2, time: "10:30-11:45", startTime: "10:30", endTime: "11:45" },
        { period: 3, time: "12:00-13:15", startTime: "12:00", endTime: "13:15" },
        { period: 4, time: "13:30-14:45", startTime: "13:30", endTime: "14:45" },
        { period: 5, time: "15:00-16:15", startTime: "15:00", endTime: "16:15" },
        { period: 6, time: "16:30-17:45", startTime: "16:30", endTime: "17:45" },
        { period: 7, time: "18:00-19:15", startTime: "18:00", endTime: "19:15" },
        { period: 8, time: "19:30-20:45", startTime: "19:30", endTime: "20:45" },
        { period: 9, time: "21:00-22:15", startTime: "21:00", endTime: "22:15" }
    ];

    const days = ['월', '화', '수', '목', '금', '토'];

    // 현재 주의 시작일 계산
    const getCurrentWeekStart = () => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0: 일요일, 1: 월요일, ...
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 월요일까지의 오프셋
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset + (selectedWeek * 7));
        return monday;
    };

    // 주의 날짜들 생성
    const getWeekDates = () => {
        const weekStart = getCurrentWeekStart();
        const dates = [];
        for (let i = 0; i < 6; i++) { // 월요일부터 토요일까지
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    // 시간표 데이터 생성
    const buildScheduleData = () => {
        const schedule = {};
        
        // 각 요일과 교시에 대해 초기화
        days.forEach(day => {
            schedule[day] = {};
            timeSlots.forEach(slot => {
                schedule[day][slot.period] = null;
            });
        });

        // 강의 시간표 데이터 추가
        if (professorData?.courses) {
            professorData.courses.forEach(course => {
                // course.time이 존재하는지 확인
                if (!course.time) {
                    console.warn('Course time is undefined for:', course);
                    return;
                }
                
                try {
                    // 시간 문자열 파싱 (예: "월 10:30-12:00, 수 10:30-12:00")
                    const timeSchedules = course.time.split(',').map(s => s.trim());
                    
                    timeSchedules.forEach(timeItem => {
                        const match = timeItem.match(/([월화수목금토])\s+(\d+:\d+)[-~](\d+:\d+)/);
                        if (match) {
                            const day = match[1];
                            const startTime = match[2];
                            
                            // 해당 시작 시간에 맞는 교시 찾기
                            const timeSlot = timeSlots.find(slot => slot.startTime === startTime);
                            if (timeSlot && schedule[day]) {
                                schedule[day][timeSlot.period] = {
                                    type: 'course',
                                    title: course.name || '강의명 미정',
                                    subtitle: course.room || '강의실 미정',
                                    courseId: course.id,
                                    time: timeItem,
                                    color: 'course'
                                };
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error parsing course time:', course, error);
                }
            });
        }

        // 추가 일정 데이터 (예: 회의, 상담 등)
        const additionalEvents = [
            {
                day: '화',
                period: 3,
                type: 'meeting',
                title: '교수회의',
                subtitle: '회의실 A',
                color: 'meeting'
            },
            {
                day: '수',
                period: 7,
                type: 'consultation',
                title: '학생상담',
                subtitle: '연구실',
                color: 'consultation'
            },
            {
                day: '목',
                period: 2,
                type: 'research',
                title: '연구시간',
                subtitle: '개인연구',
                color: 'research'
            }
        ];

        additionalEvents.forEach(event => {
            if (schedule[event.day] && !schedule[event.day][event.period]) {
                schedule[event.day][event.period] = event;
            }
        });

        return schedule;
    };

    // 이벤트 클릭 처리
    const handleEventClick = (event) => {
        if (event) {
            setSelectedEvent(event);
            setShowEventModal(true);
        }
    };

    // 빈 시간 슬롯 클릭 처리
    const handleEmptySlotClick = (day, period) => {
        setSelectedTimeSlot({ day, period });
        setShowCreateModal(true);
    };

    // 주 변경
    const changeWeek = (offset) => {
        setSelectedWeek(prev => prev + offset);
    };

    // 오늘로 이동
    const goToToday = () => {
        setSelectedWeek(0);
    };

    // 주 제목 생성
    const getWeekTitle = () => {
        const weekDates = getWeekDates();
        const startDate = weekDates[0];
        const endDate = weekDates[5];
        
        const formatDate = (date) => {
            return `${date.getMonth() + 1}/${date.getDate()}`;
        };

        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    };

    // 통계 계산
    const getStatistics = () => {
        const scheduleData = buildScheduleData();
        let totalClasses = 0;
        let totalHours = 0;
        let meetings = 0;
        let consultations = 0;

        days.forEach(day => {
            timeSlots.forEach(slot => {
                const event = scheduleData[day][slot.period];
                if (event) {
                    if (event.type === 'course') {
                        totalClasses++;
                        totalHours += 1.25; // 1교시 = 1시간 15분
                    } else if (event.type === 'meeting') {
                        meetings++;
                    } else if (event.type === 'consultation') {
                        consultations++;
                    }
                }
            });
        });

        return {
            totalClasses,
            totalHours: Math.round(totalHours * 10) / 10,
            meetings,
            consultations
        };
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>시간표를 불러오는 중입니다...</p>
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

    const scheduleData = buildScheduleData();
    const weekDates = getWeekDates();
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
                        <h2>강의 시간표</h2>
                        <p>{professorData.personal?.department || ''} / 사번: {userData?.professorId}</p>
                    </div>

                    {/* 통계 카드 */}
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-chalkboard-teacher"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.totalClasses}</div>
                                <div className="stat-label">주간 강의 수</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-clock"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.totalHours}h</div>
                                <div className="stat-label">주간 강의 시간</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-users"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.meetings}</div>
                                <div className="stat-label">회의 일정</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-user-graduate"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.consultations}</div>
                                <div className="stat-label">상담 일정</div>
                            </div>
                        </div>
                    </div>

                    {/* 시간표 메인 카드 */}
                    <div className="card schedule-card">
                        <div className="card-header">
                            <div className="schedule-header-left">
                                <h3>주간 시간표</h3>
                                <div className="week-navigation">
                                    <button 
                                        className="btn btn-outline btn-sm"
                                        onClick={() => changeWeek(-1)}
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                    </button>
                                    <span className="week-title">{getWeekTitle()}</span>
                                    <button 
                                        className="btn btn-outline btn-sm"
                                        onClick={() => changeWeek(1)}
                                    >
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                    <button 
                                        className="btn btn-primary btn-sm"
                                        onClick={goToToday}
                                    >
                                        오늘
                                    </button>
                                </div>
                            </div>
                            
                            <div className="schedule-header-right">
                                <div className="view-toggle">
                                    <button 
                                        className={`btn btn-sm ${viewMode === 'week' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setViewMode('week')}
                                    >
                                        <i className="fas fa-table"></i> 주간뷰
                                    </button>
                                    <button 
                                        className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <i className="fas fa-list"></i> 목록뷰
                                    </button>
                                </div>
                                <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    <i className="fas fa-plus"></i> 일정 추가
                                </button>
                            </div>
                        </div>

                        <div className="schedule-content">
                            {viewMode === 'week' ? (
                                <div className="schedule-table-container">
                                    <table className="schedule-table">
                                        <thead>
                                            <tr>
                                                <th className="time-header">교시</th>
                                                {days.map((day, index) => (
                                                    <th key={day} className="day-header">
                                                        <div className="day-name">{day}</div>
                                                        <div className="day-date">
                                                            {weekDates[index]?.getDate()}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {timeSlots.map(slot => (
                                                <tr key={slot.period} className="schedule-row">
                                                    <td className="time-cell">
                                                        <div className="period-number">{slot.period}교시</div>
                                                        <div className="period-time">{slot.time}</div>
                                                    </td>
                                                    {days.map(day => {
                                                        const event = scheduleData[day][slot.period];
                                                        return (
                                                            <td 
                                                                key={`${day}-${slot.period}`} 
                                                                className={`schedule-cell ${event ? 'has-event' : 'empty-cell'}`}
                                                                onClick={() => event ? handleEventClick(event) : handleEmptySlotClick(day, slot.period)}
                                                            >
                                                                {event && (
                                                                    <div className={`schedule-event ${event.color}`}>
                                                                        <div className="event-title">{event.title}</div>
                                                                        <div className="event-subtitle">{event.subtitle}</div>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="schedule-list">
                                    {days.map((day, dayIndex) => {
                                        const dayEvents = timeSlots
                                            .map(slot => ({
                                                ...slot,
                                                event: scheduleData[day][slot.period]
                                            }))
                                            .filter(item => item.event);

                                        if (dayEvents.length === 0) return null;

                                        return (
                                            <div key={day} className="schedule-day-section">
                                                <div className="day-section-header">
                                                    <h4>{day}요일</h4>
                                                    <span className="day-section-date">
                                                        {weekDates[dayIndex]?.getMonth() + 1}/{weekDates[dayIndex]?.getDate()}
                                                    </span>
                                                </div>
                                                <div className="day-events">
                                                    {dayEvents.map(({ period, time, event }) => (
                                                        <div 
                                                            key={period} 
                                                            className="schedule-list-item"
                                                            onClick={() => handleEventClick(event)}
                                                        >
                                                            <div className="event-time">
                                                                <div className="period">{period}교시</div>
                                                                <div className="time">{time}</div>
                                                            </div>
                                                            <div className={`event-content ${event.color}`}>
                                                                <div className="event-title">{event.title}</div>
                                                                <div className="event-subtitle">{event.subtitle}</div>
                                                                <div className="event-type">{event.type}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 범례 */}
                        <div className="schedule-legend">
                            <div className="legend-title">범례</div>
                            <div className="legend-items">
                                <div className="legend-item">
                                    <div className="legend-color course"></div>
                                    <span>강의</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color meeting"></div>
                                    <span>회의</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color consultation"></div>
                                    <span>상담</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color research"></div>
                                    <span>연구</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 이벤트 상세 모달 */}
            {showEventModal && selectedEvent && (
                <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>일정 상세</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowEventModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="event-detail">
                                <div className={`event-type-badge ${selectedEvent.color}`}>
                                    {selectedEvent.type === 'course' ? '강의' :
                                     selectedEvent.type === 'meeting' ? '회의' :
                                     selectedEvent.type === 'consultation' ? '상담' : '연구'}
                                </div>
                                <h4 className="event-detail-title">{selectedEvent.title}</h4>
                                <div className="event-detail-info">
                                    <p><i className="fas fa-map-marker-alt"></i> {selectedEvent.subtitle}</p>
                                    {selectedEvent.time && (
                                        <p><i className="fas fa-clock"></i> {selectedEvent.time}</p>
                                    )}
                                    {selectedEvent.courseId && (
                                        <p><i className="fas fa-code"></i> {selectedEvent.courseId}</p>
                                    )}
                                </div>
                                {selectedEvent.type === 'course' && (
                                    <div className="course-actions">
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => {
                                                setShowEventModal(false);
                                                navigate(`/professor/course/${selectedEvent.courseId}`);
                                            }}
                                        >
                                            강의 페이지로 이동
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-outline"
                                onClick={() => setShowEventModal(false)}
                            >
                                닫기
                            </button>
                            {selectedEvent.type !== 'course' && (
                                <button className="btn btn-primary">
                                    수정
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 일정 추가 모달 */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>새 일정 추가</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowCreateModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form className="event-form">
                                <div className="form-row">
                                    <div className="input-group">
                                        <label>일정 유형 *</label>
                                        <select required>
                                            <option value="">선택하세요</option>
                                            <option value="meeting">회의</option>
                                            <option value="consultation">상담</option>
                                            <option value="research">연구</option>
                                            <option value="other">기타</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>우선순위</label>
                                        <select>
                                            <option value="normal">보통</option>
                                            <option value="high">높음</option>
                                            <option value="low">낮음</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>제목 *</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="일정 제목을 입력하세요"
                                        defaultValue={selectedTimeSlot ? `${selectedTimeSlot.day}요일 일정` : ''}
                                    />
                                </div>

                                <div className="input-group">
                                    <label>장소</label>
                                    <input 
                                        type="text" 
                                        placeholder="장소를 입력하세요"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="input-group">
                                        <label>요일 *</label>
                                        <select required defaultValue={selectedTimeSlot?.day || ''}>
                                            <option value="">선택하세요</option>
                                            {days.map(day => (
                                                <option key={day} value={day}>{day}요일</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>교시 *</label>
                                        <select required defaultValue={selectedTimeSlot?.period || ''}>
                                            <option value="">선택하세요</option>
                                            {timeSlots.map(slot => (
                                                <option key={slot.period} value={slot.period}>
                                                    {slot.period}교시 ({slot.time})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>상세 내용</label>
                                    <textarea 
                                        rows="3"
                                        placeholder="일정에 대한 상세 내용을 입력하세요"
                                    ></textarea>
                                </div>

                                <div className="form-options">
                                    <label className="checkbox-label">
                                        <input type="checkbox" />
                                        <span>매주 반복</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input type="checkbox" />
                                        <span>알림 설정</span>
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
                                className="btn btn-primary"
                                onClick={() => {
                                    alert('일정이 추가되었습니다.');
                                    setShowCreateModal(false);
                                    setSelectedTimeSlot(null);
                                }}
                            >
                                추가
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessorSchedulePage;