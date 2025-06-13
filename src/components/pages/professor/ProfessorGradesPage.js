import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/ProfessorGradesPage.css';

const ProfessorGradesPage = () => {
    const [userData, setUserData] = useState(null);
    const [professorData, setProfessorData] = useState(null);
    const [activeTab, setActiveTab] = useState('grades');
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [gradeFilter, setGradeFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'statistics'
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [gradeDistribution, setGradeDistribution] = useState({});
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
        calculateGradeDistribution(dashboardData);
        setLoading(false);
    }, [navigate]);

    // 성적 분포 계산
    const calculateGradeDistribution = (data) => {
        if (!data.students) return;

        const distribution = {};
        data.courses?.forEach(course => {
            const courseStudents = data.students.filter(s => s.courseId === course.id);
            const grades = { 'A+': 0, 'A0': 0, 'B+': 0, 'B0': 0, 'C+': 0, 'C0': 0, 'D+': 0, 'D0': 0, 'F': 0 };
            
            courseStudents.forEach(student => {
                const totalScore = calculateTotalScore(student);
                const letterGrade = getLetterGrade(totalScore);
                if (letterGrade !== '-') {
                    grades[letterGrade] = (grades[letterGrade] || 0) + 1;
                }
            });

            distribution[course.id] = {
                courseName: course.name,
                grades,
                totalStudents: courseStudents.length,
                gradedStudents: courseStudents.filter(s => calculateTotalScore(s) !== '-').length
            };
        });

        setGradeDistribution(distribution);
    };

    // 총점 계산
    const calculateTotalScore = (student) => {
        if (!student.midterm && !student.final && !student.assignments?.[0]?.score) return '-';
        
        const midterm = student.midterm || 0;
        const final = student.final || 0;
        const assignment = student.assignments?.[0]?.score || 0;
        const attendance = (student.attendance || 0) * 0.1;
        
        // 중간 30%, 기말 40%, 과제 20%, 출석 10%
        const total = (midterm * 0.3) + (final * 0.4) + (assignment * 0.2) + attendance;
        return Math.round(total);
    };

    // 등급 계산
    const getLetterGrade = (score) => {
        if (score === '-') return '-';
        if (score >= 95) return 'A+';
        if (score >= 90) return 'A0';
        if (score >= 85) return 'B+';
        if (score >= 80) return 'B0';
        if (score >= 75) return 'C+';
        if (score >= 70) return 'C0';
        if (score >= 65) return 'D+';
        if (score >= 60) return 'D0';
        return 'F';
    };

    // 학생 목록 필터링 및 정렬
    const getFilteredStudents = () => {
        if (!professorData?.students) return [];

        let filteredStudents = [...professorData.students];

        // 강의별 필터링
        if (selectedCourse !== 'all') {
            filteredStudents = filteredStudents.filter(student => student.courseId === selectedCourse);
        }

        // 성적 상태별 필터링
        if (gradeFilter !== 'all') {
            filteredStudents = filteredStudents.filter(student => {
                const totalScore = calculateTotalScore(student);
                switch (gradeFilter) {
                    case 'graded':
                        return totalScore !== '-';
                    case 'ungraded':
                        return totalScore === '-';
                    case 'excellent':
                        return totalScore >= 90;
                    case 'good':
                        return totalScore >= 80 && totalScore < 90;
                    case 'average':
                        return totalScore >= 70 && totalScore < 80;
                    case 'poor':
                        return totalScore < 70 && totalScore !== '-';
                    default:
                        return true;
                }
            });
        }

        // 검색어 필터링
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            filteredStudents = filteredStudents.filter(student =>
                student.name.toLowerCase().includes(term) ||
                student.id.toLowerCase().includes(term) ||
                student.department.toLowerCase().includes(term)
            );
        }

        // 정렬
        filteredStudents.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'studentId':
                    return a.id.localeCompare(b.id);
                case 'totalScore':
                    const scoreA = calculateTotalScore(a);
                    const scoreB = calculateTotalScore(b);
                    if (scoreA === '-') return 1;
                    if (scoreB === '-') return -1;
                    return scoreB - scoreA;
                case 'midterm':
                    return (b.midterm || 0) - (a.midterm || 0);
                case 'final':
                    return (b.final || 0) - (a.final || 0);
                case 'attendance':
                    return b.attendance - a.attendance;
                default:
                    return 0;
            }
        });

        return filteredStudents;
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
        const filteredStudents = getFilteredStudents();
        const allSelected = filteredStudents.every(student => selectedStudents.includes(student.id));
        
        if (allSelected) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map(student => student.id));
        }
    };

    // 성적 입력 모달 열기
    const openGradeModal = (student) => {
        setSelectedStudent(student);
        setShowGradeModal(true);
    };

    // 일괄 성적 입력 모달 열기
    const openBulkModal = () => {
        if (selectedStudents.length === 0) {
            alert('선택된 학생이 없습니다.');
            return;
        }
        setShowBulkModal(true);
    };

    // 성적 저장
    const saveGrade = (gradeData) => {
        alert('성적이 저장되었습니다.');
        setShowGradeModal(false);
        setSelectedStudent(null);
    };

    // 일괄 성적 저장
    const saveBulkGrades = (gradeData) => {
        alert(`${selectedStudents.length}명의 성적이 저장되었습니다.`);
        setShowBulkModal(false);
        setSelectedStudents([]);
    };

    // 성적 내보내기
    const exportGrades = () => {
        const filteredStudents = getFilteredStudents();
        console.log('성적 내보내기:', filteredStudents);
        alert('성적이 Excel 파일로 내보내집니다.');
    };

    // 통계 계산
    const getStatistics = () => {
        const filteredStudents = getFilteredStudents();
        const totalStudents = filteredStudents.length;
        const gradedStudents = filteredStudents.filter(s => calculateTotalScore(s) !== '-').length;
        const avgScore = gradedStudents > 0 
            ? Math.round(filteredStudents
                .filter(s => calculateTotalScore(s) !== '-')
                .reduce((sum, s) => sum + calculateTotalScore(s), 0) / gradedStudents)
            : 0;
        const excellentStudents = filteredStudents.filter(s => calculateTotalScore(s) >= 90).length;

        return {
            total: totalStudents,
            graded: gradedStudents,
            ungraded: totalStudents - gradedStudents,
            avgScore,
            excellent: excellentStudents
        };
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>성적 정보를 불러오는 중입니다...</p>
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
                        <h2>성적 관리</h2>
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
                            <div className="stat-icon">
                                <i className="fas fa-clipboard-check"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.graded}</div>
                                <div className="stat-label">성적 입력 완료</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-chart-line"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.avgScore}</div>
                                <div className="stat-label">평균 점수</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-star"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.excellent}</div>
                                <div className="stat-label">우수학생 (90점 이상)</div>
                            </div>
                        </div>
                    </div>

                    {/* 성적 관리 메인 카드 */}
                    <div className="card grades-management-card">
                        <div className="card-header">
                            <h3>성적 관리</h3>
                            <div className="header-actions">
                                <div className="view-toggle">
                                    <button 
                                        className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setViewMode('table')}
                                    >
                                        <i className="fas fa-table"></i> 성적표
                                    </button>
                                    <button 
                                        className={`btn btn-sm ${viewMode === 'statistics' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setViewMode('statistics')}
                                    >
                                        <i className="fas fa-chart-bar"></i> 통계
                                    </button>
                                </div>
                                <button 
                                    className="btn btn-outline btn-sm"
                                    onClick={exportGrades}
                                >
                                    <i className="fas fa-download"></i> Excel 내보내기
                                </button>
                            </div>
                        </div>

                        {/* 필터 및 검색 영역 */}
                        <div className="grades-filters">
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
                                    <label>성적 필터:</label>
                                    <select 
                                        value={gradeFilter} 
                                        onChange={(e) => setGradeFilter(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">전체</option>
                                        <option value="graded">성적 입력됨</option>
                                        <option value="ungraded">성적 미입력</option>
                                        <option value="excellent">우수 (90점 이상)</option>
                                        <option value="good">양호 (80-89점)</option>
                                        <option value="average">보통 (70-79점)</option>
                                        <option value="poor">미흡 (70점 미만)</option>
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label>정렬 기준:</label>
                                    <select 
                                        value={sortBy} 
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="name">이름순</option>
                                        <option value="studentId">학번순</option>
                                        <option value="totalScore">총점순</option>
                                        <option value="midterm">중간고사순</option>
                                        <option value="final">기말고사순</option>
                                        <option value="attendance">출석률순</option>
                                    </select>
                                </div>

                                <div className="search-group">
                                    <div className="search-container">
                                        <input
                                            type="text"
                                            placeholder="이름, 학번으로 검색"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="search-input"
                                        />
                                        <i className="fas fa-search search-icon"></i>
                                    </div>
                                </div>
                            </div>

                            {/* 선택된 학생 일괄 작업 */}
                            {selectedStudents.length > 0 && (
                                <div className="bulk-actions">
                                    <span className="selected-count">
                                        {selectedStudents.length}명 선택됨
                                    </span>
                                    <div className="bulk-buttons">
                                        <button 
                                            className="btn btn-primary btn-sm"
                                            onClick={openBulkModal}
                                        >
                                            <i className="fas fa-edit"></i> 일괄 성적 입력
                                        </button>
                                        <button 
                                            className="btn btn-outline btn-sm"
                                            onClick={exportGrades}
                                        >
                                            <i className="fas fa-download"></i> 선택 내보내기
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 컨텐츠 영역 */}
                        <div className="grades-content">
                            {viewMode === 'table' ? (
                                // 성적표 뷰
                                <div className="grades-table-container">
                                    <table className="grades-table">
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
                                                <th>학과</th>
                                                <th>강의</th>
                                                <th>출석률</th>
                                                <th>중간고사</th>
                                                <th>기말고사</th>
                                                <th>과제</th>
                                                <th>총점</th>
                                                <th>등급</th>
                                                <th>작업</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.length > 0 ? (
                                                filteredStudents.map((student, index) => {
                                                    const totalScore = calculateTotalScore(student);
                                                    const letterGrade = getLetterGrade(totalScore);
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
                                                            <td>{student.department}</td>
                                                            <td className="course-name">{courseName}</td>
                                                            <td>
                                                                <span className={`attendance-rate ${student.attendance >= 90 ? 'excellent' : student.attendance >= 80 ? 'good' : 'warning'}`}>
                                                                    {student.attendance}%
                                                                </span>
                                                            </td>
                                                            <td className="score-cell">{student.midterm || '-'}</td>
                                                            <td className="score-cell">{student.final || '-'}</td>
                                                            <td className="score-cell">{student.assignments?.[0]?.score || '-'}</td>
                                                            <td className="total-score">{totalScore}</td>
                                                            <td>
                                                                <span className={`grade-badge grade-${letterGrade?.toLowerCase()?.replace('+', 'plus')}`}>
                                                                    {letterGrade}
                                                                </span>
                                                            </td>
                                                            <td className="action-buttons">
                                                                <button
                                                                    className="btn btn-primary btn-sm"
                                                                    onClick={() => openGradeModal(student)}
                                                                    title="성적 입력"
                                                                >
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="12" className="empty-message">
                                                        검색 조건에 맞는 학생이 없습니다.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                // 통계 뷰
                                <div className="statistics-view">
                                    <div className="statistics-grid">
                                        {Object.entries(gradeDistribution).map(([courseId, data]) => {
                                            if (selectedCourse !== 'all' && selectedCourse !== courseId) return null;
                                            
                                            return (
                                                <div key={courseId} className="statistics-card">
                                                    <div className="statistics-header">
                                                        <h4>{data.courseName}</h4>
                                                        <div className="statistics-summary">
                                                            <span>전체: {data.totalStudents}명</span>
                                                            <span>채점: {data.gradedStudents}명</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grade-distribution">
                                                        <div className="grade-chart">
                                                            {Object.entries(data.grades).map(([grade, count]) => (
                                                                <div key={grade} className="grade-bar-container">
                                                                    <div className="grade-label">{grade}</div>
                                                                    <div className="grade-bar-wrapper">
                                                                        <div 
                                                                            className={`grade-bar grade-${grade.toLowerCase().replace('+', 'plus')}`}
                                                                            style={{ 
                                                                                width: data.gradedStudents > 0 ? `${(count / data.gradedStudents) * 100}%` : '0%' 
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                    <div className="grade-count">{count}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="statistics-footer">
                                                        <div className="avg-info">
                                                            평균: {data.gradedStudents > 0 
                                                                ? Math.round(Object.entries(data.grades).reduce((sum, [grade, count]) => {
                                                                    const gradePoint = {'A+': 95, 'A0': 92, 'B+': 87, 'B0': 82, 'C+': 77, 'C0': 72, 'D+': 67, 'D0': 62, 'F': 50}[grade] || 0;
                                                                    return sum + (gradePoint * count);
                                                                }, 0) / data.gradedStudents)
                                                                : 0}점
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 개별 성적 입력 모달 */}
            {showGradeModal && selectedStudent && (
                <div className="modal-overlay" onClick={() => setShowGradeModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedStudent.name} 성적 입력</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowGradeModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="grade-form">
                                <div className="student-info">
                                    <p><strong>학번:</strong> {selectedStudent.id}</p>
                                    <p><strong>이름:</strong> {selectedStudent.name}</p>
                                    <p><strong>학과:</strong> {selectedStudent.department}</p>
                                    <p><strong>강의:</strong> {professorData.courses?.find(c => c.id === selectedStudent.courseId)?.name}</p>
                                </div>
                                
                                <div className="grade-inputs">
                                    <div className="input-group">
                                        <label>중간고사 (30%)</label>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            max="100"
                                            defaultValue={selectedStudent.midterm || ''}
                                            placeholder="점수 입력"
                                            id="midterm-score"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>기말고사 (40%)</label>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            max="100"
                                            defaultValue={selectedStudent.final || ''}
                                            placeholder="점수 입력"
                                            id="final-score"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>과제 (20%)</label>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            max="100"
                                            defaultValue={selectedStudent.assignments?.[0]?.score || ''}
                                            placeholder="점수 입력"
                                            id="assignment-score"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>출석률 (10%)</label>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            max="100"
                                            defaultValue={selectedStudent.attendance || ''}
                                            placeholder="출석률 입력"
                                            id="attendance-rate"
                                        />
                                    </div>
                                </div>
                                
                                <div className="grade-preview">
                                    <h4>성적 미리보기</h4>
                                    <div className="preview-info">
                                        <p>총점: <span className="preview-score">{calculateTotalScore(selectedStudent)}</span></p>
                                        <p>등급: <span className="preview-grade">{getLetterGrade(calculateTotalScore(selectedStudent))}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-outline"
                                onClick={() => setShowGradeModal(false)}
                            >
                                취소
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={() => saveGrade({})}
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 일괄 성적 입력 모달 */}
            {showBulkModal && (
                <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>일괄 성적 입력</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowBulkModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="bulk-grade-form">
                                <p>{selectedStudents.length}명의 학생에게 동일한 성적을 입력합니다.</p>
                                
                                <div className="grade-inputs">
                                    <div className="input-group">
                                        <label>중간고사</label>
                                    </div>
                                    <div className="input-group">
                                        <label>기말고사</label>
                                        <input type="number" min="0" max="100" placeholder="점수 입력" />
                                    </div>
                                    <div className="input-group">
                                        <label>과제</label>
                                        <input type="number" min="0" max="100" placeholder="점수 입력" />
                                    </div>
                                    <div className="input-group">
                                        <label>출석률</label>
                                        <input type="number" min="0" max="100" placeholder="출석률 입력" />
                                    </div>
                                </div>
                                
                                <div className="bulk-options">
                                    <label className="checkbox-label">
                                        <input type="checkbox" />
                                        <span>빈 값만 업데이트 (기존 값 유지)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn btn-outline"
                                onClick={() => setShowBulkModal(false)}
                            >
                                취소
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={() => saveBulkGrades({})}
                            >
                                일괄 저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessorGradesPage;