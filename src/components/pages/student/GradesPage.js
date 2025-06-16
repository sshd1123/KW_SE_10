import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import Sidebar from '../../dashboard/Sidebar';
import GradesChart from '../../dashboard/GradesChart'; // 성적 그래프 컴포넌트 추가
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/GradesPage.css';

const GradesPage = () => {
  const [userData, setUserData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [activeTab, setActiveTab] = useState('grades'); // 사이드바에서 '성적 조회' 탭 활성화
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('all'); // 학기 필터링을 위한 상태
  const navigate = useNavigate();

  // 학기별로 성적 정보 그룹화
  const groupBySemester = (grades) => {
    const grouped = {};
    
    if (!grades || !grades.previous) return grouped;
    
    // 현재 학기 성적
    if (grades.currentSemester && grades.currentSemester.length > 0) {
      grouped['현재 학기'] = grades.currentSemester;
    }
    
    // 이전 학기 성적
    grades.previous.forEach(grade => {
      if (!grouped[grade.semester]) {
        grouped[grade.semester] = [];
      }
      grouped[grade.semester].push(grade);
    });
    
    return grouped;
  };
  
  // 학기별 평점 계산
  const calculateSemesterGPA = (semesterGrades) => {
    if (!semesterGrades || semesterGrades.length === 0) return 0;
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    semesterGrades.forEach(course => {
      if (course.grade) {
        const gradePoints = getGradePoints(course.grade);
        totalPoints += gradePoints * course.credits;
        totalCredits += course.credits;
      }
    });
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
  };
  
  // 학점 변환 (A+ -> 4.5 등)
  const getGradePoints = (grade) => {
    const gradeMap = {
      'A+': 4.5,
      'A0': 4.0,
      'B+': 3.5,
      'B0': 3.0,
      'C+': 2.5,
      'C0': 2.0,
      'D+': 1.5,
      'D0': 1.0,
      'F': 0.0
    };
    
    return gradeMap[grade] || 0;
  };

  // 총 취득 학점 계산
  const calculateTotalCredits = (grades) => {
    let totalCredits = 0;
    
    // 현재 학기 (성적이 있는 과목만)
    if (grades.currentSemester) {
      grades.currentSemester.forEach(course => {
        if (course.grade) {
          totalCredits += course.credits;
        }
      });
    }
    
    // 이전 학기
    if (grades.previous) {
      grades.previous.forEach(course => {
        totalCredits += course.credits;
      });
    }
    
    return totalCredits;
  };

  // 종합 평점 계산
  const calculateOverallGPA = (grades) => {
    let totalPoints = 0;
    let totalCredits = 0;
    
    // 현재 학기 (성적이 있는 과목만)
    if (grades.currentSemester) {
      grades.currentSemester.forEach(course => {
        if (course.grade) {
          const gradePoints = getGradePoints(course.grade);
          totalPoints += gradePoints * course.credits;
          totalCredits += course.credits;
        }
      });
    }
    
    // 이전 학기
    if (grades.previous) {
      grades.previous.forEach(course => {
        const gradePoints = getGradePoints(course.grade);
        totalPoints += gradePoints * course.credits;
        totalCredits += course.credits;
      });
    }
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
  };

  useEffect(() => {
    // 사용자 정보 및 성적 데이터 로드
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>성적 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="error-container">
        <p>학생 데이터를 불러올 수 없습니다. 다시 로그인해주세요.</p>
        <button onClick={() => navigate('/login')}>로그인 페이지로 이동</button>
      </div>
    );
  }

  // 학기별로 성적 그룹화
  const semesterGrades = studentData.grades ? groupBySemester(studentData.grades) : {};
  
  // 학기 목록 (정렬)
  const semesters = Object.keys(semesterGrades).sort((a, b) => {
    if (a === '현재 학기') return -1; // 현재 학기를 맨 뒤로
    if (b === '현재 학기') return 1;
    return a.localeCompare(a); // 나머지는 오름차순
  });
  
  // 필터링된 학기
  const filteredSemesters = selectedSemester === 'all' 
    ? semesters 
    : semesters.filter(semester => semester === selectedSemester);
  
  // 총 취득 학점
  const totalCredits = studentData.grades ? calculateTotalCredits(studentData.grades) : 0;
  
  // 종합 평점
  const overallGPA = studentData.grades ? calculateOverallGPA(studentData.grades) : 0;
  
  return (
    <div className="student-dashboard">
      <Header username={userData?.name || '사용자'} role="학생" />
      
      <div className="dashboard-main">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          studentName={userData?.name || ''}
          studentId={userData?.studentId || ''}
          department={userData?.department || ''}
        />
        
        <div className="dashboard-content">
          <div className="welcome-banner">
            <h2>수강/성적 조회</h2>
            <p>현재 {studentData.academic?.year || ''}학년 {studentData.academic?.semester || ''}학기 / 학번: {userData?.studentId || ''}</p>
          </div>
          
          <div className="grades-container">
            {/* 성적 요약 패널 */}
            <div className="card">
              <div className="card-header">
                <h3>성적 요약</h3>
              </div>
              <div className="grade-card-body">
                <div className="grades-summary-panel">
                  <div className="grades-summary-item">
                    <div className="summary-label">종합 평점</div>
                    <div className="summary-value">{overallGPA}</div>
                    <div className="summary-subtext">/ 4.5</div>
                  </div>
                  <div className="grades-summary-item">
                    <div className="summary-label">취득 학점</div>
                    <div className="summary-value">{totalCredits}</div>
                    <div className="summary-subtext">학점</div>
                  </div>
                  <div className="grades-summary-item">
                    <div className="summary-label">학년/학기</div>
                    <div className="summary-value">{studentData.academic?.year}/{studentData.academic?.semester}</div>
                    <div className="summary-subtext">학년/학기</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 성적 추이 그래프 */}
            <div className="card">
              <div className="card-header">
                <h3>학기별 성적 추이</h3>
              </div>
              <div className="chart-card-body">
                {studentData.grades ? (
                  <div className="grades-chart-container-detailed">
                    <GradesChart grades={studentData.grades} />
                  </div>
                ) : (
                  <p className="empty-message">성적 데이터가 없습니다.</p>
                )}
              </div>
            </div>
            
            {/* 학기 필터 */}
            <div className="semester-filter">
              <label>학기 선택:</label>
              <select 
                value={selectedSemester} 
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="semester-select"
              >
                <option value="all">전체 학기</option>
                {semesters.map(semester => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
            </div>
            
            {/* 학기별 성적 테이블 */}
            {filteredSemesters.map((semester, index) => (
              <div key={index} className="card">
                <div className="card-header semester-card-header">
                  <h3>{semester}</h3>
                  <div className="semester-gpa">
                    평점: {calculateSemesterGPA(semesterGrades[semester])}
                  </div>
                </div>
                <div className="card-body semester-card-body">
                  <div className="grades-table-container">
                    <table className="grades-table">
                      <thead>
                        <tr>
                          <th>강의명</th>
                          <th>학점</th>
                          <th>중간고사</th>
                          <th>기말고사</th>
                          <th>과제</th>
                          <th>출석</th>
                          <th>학점</th>
                        </tr>
                      </thead>
                      <tbody>
                        {semesterGrades[semester].map((course, courseIndex) => (
                          <tr key={courseIndex}>
                            <td>{course.courseName}</td>
                            <td>{course.credits}</td>
                            <td>{course.midterm || '-'}</td>
                            <td>{course.final || '-'}</td>
                            <td>{course.assignments || '-'}</td>
                            <td>{course.attendance || '-'}</td>
                            <td className={`grade-cell ${course.grade ? '' : 'no-grade'}`}>
                              {course.grade || '미정'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
            
            {Object.keys(semesterGrades).length === 0 && (
              <div className="card">
                <div className="card-body">
                  <p className="empty-message">성적 정보가 없습니다.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradesPage;