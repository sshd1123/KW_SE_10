import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/ProfessorStudentsPage.css';

const ProfessorStudentsPage = () => {
    const [userData, setUserData] = useState(null);
    const [professorData, setProfessorData] = useState(null);
    const [activeTab, setActiveTab] = useState('students');
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [gradeFilter, setGradeFilter] = useState('all');
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

    // 학생 목록 필터링 및 정렬
    const getFilteredStudents = () => {
        if (!professorData?.students) return [];

        let filteredStudents = [...professorData.students];

        // 강의별 필터링
        if (selectedCourse !== 'all') {
            filteredStudents = filteredStudents.filter(student => student.courseId === selectedCourse);
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

        // 성적 필터링
        if (gradeFilter !== 'all') {
            if (gradeFilter === 'graded') {
                filteredStudents = filteredStudents.filter(student => 
                    student.midterm !== null || student.final !== null
                );
            } else if (gradeFilter === 'ungraded') {
                filteredStudents = filteredStudents.filter(student => 
                    student.midterm === null && student.final === null
                );
            }
        }

        // 정렬
        filteredStudents.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'studentId':
                    return a.id.localeCompare(b.id);
                case 'department':
                    return a.department.localeCompare(b.department);
                case 'attendance':
                    return b.attendance - a.attendance;
                case 'midterm':
                    return (b.midterm || 0) - (a.midterm || 0);
                case 'final':
                    return (b.final || 0) - (a.final || 0);
                default:
                    return 0;
            }
        });

        return filteredStudents;
    };

    // 성적 계산
    const calculateTotalGrade = (student) => {
        if (!student.midterm && !student.final) return '-';
        
        const midterm = student.midterm || 0;
        const final = student.final || 0;
        const attendance = (student.attendance || 0) * 0.1; // 출석 10%
        const assignment = (student.assignments?.[0]?.score || 0); // 과제 점수
        
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
        setEditingStudent(student);
        setShowGradeModal(true);
    };

    // 일괄 작업 실행
    const handleBulkAction = (action) => {
        if (selectedStudents.length === 0) {
            alert('선택된 학생이 없습니다.');
            return;
        }

        switch (action) {
            case 'export':
                console.log('선택된 학생 데이터 내보내기:', selectedStudents);
                alert(`${selectedStudents.length}명의 학생 데이터를 내보냅니다.`);
                break;
            case 'grade':
                setShowGradeModal(true);
                break;
            case 'attendance':
                alert(`${selectedStudents.length}명의 출석을 일괄 처리합니다.`);
                break;
            default:
                break;
        }
    };

    // 통계 계산
    const getStatistics = () => {
        const filteredStudents = getFilteredStudents();
        const totalStudents = filteredStudents.length;
        const gradedStudents = filteredStudents.filter(s => s.midterm !== null || s.final !== null).length;
        const avgAttendance = totalStudents > 0 
            ? Math.round(filteredStudents.reduce((sum, s) => sum + s.attendance, 0) / totalStudents)
            : 0;
        const excellentAttendance = filteredStudents.filter(s => s.attendance >= 90).length;

        return {
            total: totalStudents,
            graded: gradedStudents,
            ungraded: totalStudents - gradedStudents,
            avgAttendance,
            excellentAttendance
        };
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>학생 정보를 불러오는 중입니다...</p>
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
                        <h2>학생 관리</h2>
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
                                <div className="stat-label">총 수강생</div>
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
                                <i className="fas fa-user-clock"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.avgAttendance}%</div>
                                <div className="stat-label">평균 출석률</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-star"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.excellentAttendance}</div>
                                <div className="stat-label">우수 출석자</div>
                            </div>
                        </div>
                    </div>

                    {/* 학생 관리 메인 카드 */}
                    <div className="card students-management-card">
                        <div className="card-header">
                            <h3>수강생 목록</h3>
                            <div className="header-actions">
                                <button className="btn btn-outline btn-sm">
                                    <i className="fas fa-download"></i> 전체 내보내기
                                </button>
                                <button className="btn btn-primary btn-sm">
                                    <i className="fas fa-user-plus"></i> 학생 추가
                                </button>
                            </div>
                        </div>

                        {/* 필터 및 검색 영역 */}
                        <div className="students-filters">
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
                                    <label>성적 상태:</label>
                                    <select 
                                        value={gradeFilter} 
                                        onChange={(e) => setGradeFilter(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">전체</option>
                                        <option value="graded">성적 입력됨</option>
                                        <option value="ungraded">성적 미입력</option>
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
                                        <option value="department">학과순</option>
                                        <option value="attendance">출석률순</option>
                                        <option value="midterm">중간고사순</option>
                                        <option value="final">기말고사순</option>
                                    </select>
                                </div>

                                <div className="search-group">
                                    <div className="search-container">
                                        <input
                                            type="text"
                                            placeholder="이름, 학번, 학과로 검색"
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
                                            className="btn btn-outline btn-sm"
                                            onClick={() => handleBulkAction('export')}
                                        >
                                            <i className="fas fa-download"></i> 내보내기
                                        </button>
                                        <button 
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleBulkAction('grade')}
                                        >
                                            <i className="fas fa-edit"></i> 일괄 성적 입력
                                        </button>
                                        <button 
                                            className="btn btn-outline btn-sm"
                                            onClick={() => handleBulkAction('attendance')}
                                        >
                                            <i className="fas fa-check"></i> 출석 처리
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 학생 테이블 */}
                        <div className="students-table-container">
                            <table className="students-table">
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
                                            const totalScore = calculateTotalGrade(student);
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
                                                    <td>{student.midterm || '-'}</td>
                                                    <td>{student.final || '-'}</td>
                                                    <td>{student.assignments?.[0]?.score || '-'}</td>
                                                    <td className="total-score">{totalScore}</td>
                                                    <td>
                                                        <span className={`grade-badge grade-${letterGrade?.toLowerCase()}`}>
                                                            {letterGrade}
                                                        </span>
                                                    </td>
                                                    <td className="action-buttons">
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            onClick={() => openGradeModal(student)}
                                                            title="성적 입력"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            title="상세 정보"
                                                        >
                                                            <i className="fas fa-info-circle"></i>
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
                    </div>
                </div>
            </div>

            {/* 성적 입력 모달 */}
            {showGradeModal && (
                <div className="modal-overlay" onClick={() => setShowGradeModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                {editingStudent ? `${editingStudent.name} 성적 입력` : '일괄 성적 입력'}
                            </h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowGradeModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            {editingStudent ? (
                                <div className="grade-form">
                                    <div className="student-info">
                                        <p><strong>학번:</strong> {editingStudent.id}</p>
                                        <p><strong>이름:</strong> {editingStudent.name}</p>
                                        <p><strong>학과:</strong> {editingStudent.department}</p>
                                    </div>
                                    
                                    <div className="grade-inputs">
                                        <div className="input-group">
                                            <label>중간고사 (30%)</label>
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max="100"
                                                defaultValue={editingStudent.midterm || ''}
                                                placeholder="점수 입력"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>기말고사 (40%)</label>
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max="100"
                                                defaultValue={editingStudent.final || ''}
                                                placeholder="점수 입력"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>과제 (20%)</label>
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max="100"
                                                defaultValue={editingStudent.assignments?.[0]?.score || ''}
                                                placeholder="점수 입력"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>출석률 (10%)</label>
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max="100"
                                                defaultValue={editingStudent.attendance || ''}
                                                placeholder="출석률 입력"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grade-preview">
                                        <h4>성적 미리보기</h4>
                                        <p>총점: <span className="preview-score">-</span></p>
                                        <p>등급: <span className="preview-grade">-</span></p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bulk-grade-form">
                                    <p>{selectedStudents.length}명의 학생에게 동일한 성적을 입력합니다.</p>
                                    <div className="grade-inputs">
                                        <div className="input-group">
                                            <label>중간고사</label>
                                            <input type="number" min="0" max="100" placeholder="점수 입력" />
                                        </div>
                                        <div className="input-group">
                                            <label>기말고사</label>
                                            <input type="number" min="0" max="100" placeholder="점수 입력" />
                                        </div>
                                        <div className="input-group">
                                            <label>과제</label>
                                            <input type="number" min="0" max="100" placeholder="점수 입력" />
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                onClick={() => {
                                    alert('성적이 저장되었습니다.');
                                    setShowGradeModal(false);
                                    setEditingStudent(null);
                                }}
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessorStudentsPage;