import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/ProfessorAttendancePage.css';

const ProfessorAttendancePage = () => {
    const [userData, setUserData] = useState(null);
    const [professorData, setProfessorData] = useState(null);
    const [activeTab, setActiveTab] = useState('attendance');
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState('today'); // 'today', 'weekly', 'monthly'
    const [searchTerm, setSearchTerm] = useState('');
    const [showMarkModal, setShowMarkModal] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    const [showStatsModal, setShowStatsModal] = useState(false);
    const navigate = useNavigate();

    // 더미 출석 데이터
    const [attendanceRecords] = useState({
        'I020-2-0123-01': { // 자바프로그래밍
            '2025-06-05': {
                '2023123456': { status: 'present', checkTime: '10:35', note: '' },
                '2022987654': { status: 'late', checkTime: '10:45', note: '교통체증' },
                '2024111111': { status: 'absent', checkTime: null, note: '' },
                '2024222222': { status: 'present', checkTime: '10:30', note: '' }
            },
            '2025-06-03': {
                '2023123456': { status: 'present', checkTime: '10:32', note: '' },
                '2022987654': { status: 'present', checkTime: '10:35', note: '' },
                '2024111111': { status: 'late', checkTime: '10:50', note: '병원 진료' },
                '2024222222': { status: 'absent', checkTime: null, note: '' }
            }
        },
        'I020-4-0256-01': { // 고급 소프트웨어 설계
            '2025-06-05': {
                '2021333333': { status: 'present', checkTime: '15:05', note: '' },
                '2021444444': { status: 'present', checkTime: '15:02', note: '' }
            }
        }
    });

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
        
        // 출석 데이터 초기화
        const initData = {};
        dashboardData.courses?.forEach(course => {
            if (!initData[course.id]) {
                initData[course.id] = {};
            }
        });
        setAttendanceData(initData);
        
        setLoading(false);
    }, [navigate]);

    // 학생 목록 가져오기
    const getStudentsForCourse = (courseId) => {
        if (!professorData?.students) return [];
        if (courseId === 'all') return professorData.students;
        return professorData.students.filter(student => student.courseId === courseId);
    };

    // 필터링된 학생 목록
    const getFilteredStudents = () => {
        let students = getStudentsForCourse(selectedCourse);
        
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            students = students.filter(student =>
                student.name.toLowerCase().includes(term) ||
                student.id.toLowerCase().includes(term)
            );
        }
        
        return students;
    };

    // 출석 상태 변경
    const updateAttendanceStatus = (studentId, status, note = '') => {
        const courseId = selectedCourse === 'all' ? getStudentCourse(studentId) : selectedCourse;
        const checkTime = status === 'absent' ? null : new Date().toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });

        setAttendanceData(prev => ({
            ...prev,
            [courseId]: {
                ...prev[courseId],
                [selectedDate]: {
                    ...prev[courseId]?.[selectedDate],
                    [studentId]: { status, checkTime, note }
                }
            }
        }));
    };

    // 학생의 강의 찾기
    const getStudentCourse = (studentId) => {
        const student = professorData.students?.find(s => s.id === studentId);
        return student?.courseId || '';
    };

    // 출석 상태 가져오기
    const getAttendanceStatus = (studentId, date = selectedDate) => {
        const courseId = selectedCourse === 'all' ? getStudentCourse(studentId) : selectedCourse;
        
        // 실제 데이터에서 먼저 확인
        const realData = attendanceData[courseId]?.[date]?.[studentId];
        if (realData) return realData;
        
        // 더미 데이터에서 확인
        const dummyData = attendanceRecords[courseId]?.[date]?.[studentId];
        if (dummyData) return dummyData;
        
        return { status: 'unmarked', checkTime: null, note: '' };
    };

    // 출석률 계산
    const calculateAttendanceRate = (studentId) => {
        const courseId = selectedCourse === 'all' ? getStudentCourse(studentId) : selectedCourse;
        const student = professorData.students?.find(s => s.id === studentId);
        return student?.attendance || 0;
    };

    // 학생 선택 토글
    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    // 전체 선택/해제
    const toggleAllSelection = () => {
        const students = getFilteredStudents();
        const allSelected = students.every(student => selectedStudents.includes(student.id));
        
        if (allSelected) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(student => student.id));
        }
    };

    // 일괄 출석 처리
    const handleBulkAttendance = (status) => {
        if (selectedStudents.length === 0) {
            alert('선택된 학생이 없습니다.');
            return;
        }

        selectedStudents.forEach(studentId => {
            updateAttendanceStatus(studentId, status);
        });

        setSelectedStudents([]);
        alert(`${selectedStudents.length}명의 학생을 ${getStatusLabel(status)}로 처리했습니다.`);
    };

    // 상태 라벨 가져오기
    const getStatusLabel = (status) => {
        switch (status) {
            case 'present': return '출석';
            case 'late': return '지각';
            case 'absent': return '결석';
            case 'excused': return '공결';
            default: return '미체크';
        }
    };

    // 상태별 클래스명
    const getStatusClass = (status) => {
        switch (status) {
            case 'present': return 'status-present';
            case 'late': return 'status-late';
            case 'absent': return 'status-absent';
            case 'excused': return 'status-excused';
            default: return 'status-unmarked';
        }
    };

    // 출석 통계 계산
    const calculateStatistics = () => {
        const students = getFilteredStudents();
        const present = students.filter(s => getAttendanceStatus(s.id).status === 'present').length;
        const late = students.filter(s => getAttendanceStatus(s.id).status === 'late').length;
        const absent = students.filter(s => getAttendanceStatus(s.id).status === 'absent').length;
        const excused = students.filter(s => getAttendanceStatus(s.id).status === 'excused').length;
        const unmarked = students.filter(s => getAttendanceStatus(s.id).status === 'unmarked').length;
        
        return {
            total: students.length,
            present,
            late,
            absent,
            excused,
            unmarked,
            rate: students.length > 0 ? Math.round(((present + late + excused) / students.length) * 100) : 0
        };
    };

    // QR 코드 생성 (시뮬레이션)
    const generateQRCode = () => {
        alert('QR 코드가 생성되었습니다. 학생들이 스캔하여 출석체크할 수 있습니다.');
    };

    // 출석 데이터 내보내기
    const exportAttendance = () => {
        alert('출석 데이터를 Excel 파일로 내보냅니다.');
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>출석 정보를 불러오는 중입니다...</p>
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

    const filteredStudents = getFilteredStudents();
    const statistics = calculateStatistics();

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
                        <h2>출석 관리</h2>
                        <p>{professorData.personal?.department || ''} / 사번: {userData?.professorId}</p>
                    </div>

                    {/* 통계 카드 */}
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-users"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.total}</div>
                                <div className="stat-label">총 학생</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon present">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.present}</div>
                                <div className="stat-label">출석</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon late">
                                <i className="fas fa-clock"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.late}</div>
                                <div className="stat-label">지각</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon absent">
                                <i className="fas fa-times-circle"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.absent}</div>
                                <div className="stat-label">결석</div>
                            </div>
                        </div>
                    </div>

                    {/* 출석 관리 메인 카드 */}
                    <div className="card attendance-management-card">
                        <div className="card-header">
                            <h3>출석 체크</h3>
                            <div className="header-actions">
                                <button 
                                    className="btn btn-outline btn-sm"
                                    onClick={generateQRCode}
                                >
                                    <i className="fas fa-qrcode"></i> QR 출석
                                </button>
                                <button 
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setShowStatsModal(true)}
                                >
                                    <i className="fas fa-chart-bar"></i> 통계
                                </button>
                                <button 
                                    className="btn btn-outline btn-sm"
                                    onClick={exportAttendance}
                                >
                                    <i className="fas fa-download"></i> 내보내기
                                </button>
                            </div>
                        </div>

                        {/* 필터 및 검색 영역 */}
                        <div className="attendance-filters">
                            <div className="filter-row">
                                <div className="filter-group">
                                    <label>강의 선택:</label>
                                    <select 
                                        value={selectedCourse} 
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">전체 강의</option>
                                        {professorData.courses?.map(course => (
                                            <option key={course.id} value={course.id}>
                                                {course.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label>날짜 선택:</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="filter-select"
                                    />
                                </div>

                                <div className="filter-group">
                                    <label>보기 모드:</label>
                                    <select 
                                        value={viewMode} 
                                        onChange={(e) => setViewMode(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="today">오늘</option>
                                        <option value="weekly">주간</option>
                                        <option value="monthly">월간</option>
                                    </select>
                                </div>

                                <div className="search-group">
                                    <div className="search-container">
                                        <input
                                            type="text"
                                            placeholder="학생 이름, 학번으로 검색"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="search-input"
                                        />
                                        <i className="fas fa-search search-icon"></i>
                                    </div>
                                </div>
                            </div>

                            {/* 일괄 출석 처리 */}
                            <div className="bulk-attendance-actions">
                                <div className="bulk-info">
                                    <span className="attendance-rate-display">
                                        출석률: {statistics.rate}% ({statistics.present + statistics.late + statistics.excused}/{statistics.total})
                                    </span>
                                </div>
                                <div className="bulk-buttons">
                                    <button 
                                        className="btn btn-success btn-sm"
                                        onClick={() => handleBulkAttendance('present')}
                                        disabled={selectedStudents.length === 0}
                                    >
                                        <i className="fas fa-check"></i> 일괄 출석
                                    </button>
                                    <button 
                                        className="btn btn-warning btn-sm"
                                        onClick={() => handleBulkAttendance('late')}
                                        disabled={selectedStudents.length === 0}
                                    >
                                        <i className="fas fa-clock"></i> 일괄 지각
                                    </button>
                                    <button 
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleBulkAttendance('absent')}
                                        disabled={selectedStudents.length === 0}
                                    >
                                        <i className="fas fa-times"></i> 일괄 결석
                                    </button>
                                </div>
                            </div>

                            {/* 선택된 학생 정보 */}
                            {selectedStudents.length > 0 && (
                                <div className="selection-info">
                                    <span>{selectedStudents.length}명 선택됨</span>
                                    <button 
                                        className="btn btn-outline btn-sm"
                                        onClick={() => setSelectedStudents([])}
                                    >
                                        선택 해제
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 출석 테이블 */}
                        <div className="attendance-content">
                            {filteredStudents.length > 0 ? (
                                <div className="attendance-table-container">
                                    <table className="attendance-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    <input
                                                        type="checkbox"
                                                        checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.includes(s.id))}
                                                        onChange={toggleAllSelection}
                                                    />
                                                </th>
                                                <th>학번</th>
                                                <th>이름</th>
                                                <th>강의</th>
                                                <th>출석률</th>
                                                <th>출석 상태</th>
                                                <th>체크 시간</th>
                                                <th>비고</th>
                                                <th>출석 처리</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.map((student, index) => {
                                                const attendanceStatus = getAttendanceStatus(student.id);
                                                const attendanceRate = calculateAttendanceRate(student.id);
                                                const courseName = professorData.courses?.find(c => c.id === student.courseId)?.name || '-';
                                                
                                                return (
                                                    <tr key={index}>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedStudents.includes(student.id)}
                                                                onChange={() => toggleStudentSelection(student.id)}
                                                            />
                                                        </td>
                                                        <td>{student.id}</td>
                                                        <td className="student-name">{student.name}</td>
                                                        <td className="course-name">{courseName}</td>
                                                        <td>
                                                            <span className={`attendance-rate ${attendanceRate >= 90 ? 'excellent' : attendanceRate >= 80 ? 'good' : 'warning'}`}>
                                                                {attendanceRate}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`status-badge ${getStatusClass(attendanceStatus.status)}`}>
                                                                {getStatusLabel(attendanceStatus.status)}
                                                            </span>
                                                        </td>
                                                        <td className="check-time">
                                                            {attendanceStatus.checkTime || '-'}
                                                        </td>
                                                        <td className="note-cell">
                                                            <input
                                                                type="text"
                                                                value={attendanceStatus.note}
                                                                onChange={(e) => {
                                                                    const currentStatus = getAttendanceStatus(student.id);
                                                                    updateAttendanceStatus(student.id, currentStatus.status, e.target.value);
                                                                }}
                                                                placeholder="비고 입력"
                                                                className="note-input"
                                                            />
                                                        </td>
                                                        <td className="attendance-buttons">
                                                            <button
                                                                className={`attendance-btn present ${attendanceStatus.status === 'present' ? 'active' : ''}`}
                                                                onClick={() => updateAttendanceStatus(student.id, 'present')}
                                                                title="출석"
                                                            >
                                                                <i className="fas fa-check"></i>
                                                            </button>
                                                            <button
                                                                className={`attendance-btn late ${attendanceStatus.status === 'late' ? 'active' : ''}`}
                                                                onClick={() => updateAttendanceStatus(student.id, 'late')}
                                                                title="지각"
                                                            >
                                                                <i className="fas fa-clock"></i>
                                                            </button>
                                                            <button
                                                                className={`attendance-btn absent ${attendanceStatus.status === 'absent' ? 'active' : ''}`}
                                                                onClick={() => updateAttendanceStatus(student.id, 'absent')}
                                                                title="결석"
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                            <button
                                                                className={`attendance-btn excused ${attendanceStatus.status === 'excused' ? 'active' : ''}`}
                                                                onClick={() => updateAttendanceStatus(student.id, 'excused')}
                                                                title="공결"
                                                            >
                                                                <i className="fas fa-shield-alt"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="no-students-message">
                                    <p>조건에 맞는 학생이 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 출석 통계 모달 */}
            {showStatsModal && (
                <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
                    <div className="modal-content stats-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>출석 통계</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowStatsModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="stats-summary">
                                <div className="stats-overview">
                                    <h4>오늘 출석 현황</h4>
                                    <div className="stats-grid">
                                        <div className="stat-item present">
                                            <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
                                            <div className="stat-data">
                                                <div className="stat-number">{statistics.present}</div>
                                                <div className="stat-label">출석</div>
                                            </div>
                                        </div>
                                        <div className="stat-item late">
                                            <div className="stat-icon"><i className="fas fa-clock"></i></div>
                                            <div className="stat-data">
                                                <div className="stat-number">{statistics.late}</div>
                                                <div className="stat-label">지각</div>
                                            </div>
                                        </div>
                                        <div className="stat-item absent">
                                            <div className="stat-icon"><i className="fas fa-times-circle"></i></div>
                                            <div className="stat-data">
                                                <div className="stat-number">{statistics.absent}</div>
                                                <div className="stat-label">결석</div>
                                            </div>
                                        </div>
                                        <div className="stat-item excused">
                                            <div className="stat-icon"><i className="fas fa-shield-alt"></i></div>
                                            <div className="stat-data">
                                                <div className="stat-number">{statistics.excused}</div>
                                                <div className="stat-label">공결</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="attendance-rate-chart">
                                    <h4>출석률</h4>
                                    <div className="rate-display">
                                        <div className="rate-circle">
                                            <span className="rate-percentage">{statistics.rate}%</span>
                                        </div>
                                        <div className="rate-details">
                                            <p>총 {statistics.total}명 중 {statistics.present + statistics.late + statistics.excused}명 출석</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-outline"
                                onClick={() => setShowStatsModal(false)}
                            >
                                닫기
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={exportAttendance}
                            >
                                <i className="fas fa-download"></i> 통계 내보내기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessorAttendancePage;