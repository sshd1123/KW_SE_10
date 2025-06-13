import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import Sidebar from '../../dashboard/Sidebar';
import CourseCard from '../../dashboard/CourseCard';
import AnnouncementItem from '../../dashboard/AnnouncementItem';
import UpcomingAssignments from '../../dashboard/UpcomingAssignments';
import TimeTable from '../../dashboard/TimeTable';
import GradesChart from '../../dashboard/GradesChart';
import GraduationRequirements from '../../dashboard/GraduationRequirements';
import '../../styles/StudentDashboard.css'
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const user = getCurrentUser();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    const dashboardData = getDashboardData();
    
    if (user && dashboardData) {
      const updatedAssignments = dashboardData.assignments.map(assignment => {
        const today = new Date();
        const deadlineDate = new Date(assignment.deadline);
        
        if (deadlineDate < today && assignment.status !== '완료') {
          return { ...assignment, status: '마감' };
        }
        return assignment;
      });

      const updatedDashboardData = {
        ...dashboardData,
        assignments: updatedAssignments
      };
      
      setUserData(user);
      setStudentData(updatedDashboardData);
    } else {
      console.log("Failed to load data: user or dashboardData is null/undefined");
    }
    
    setLoading(false);
  }, [navigate]);

  const getUpcomingAssignments = () => {
    if (!studentData || !studentData.assignments) return [];
    
    const today = new Date();
    return studentData.assignments
      .filter(assignment => {
        const deadlineDate = new Date(assignment.deadline);
        return (
          assignment.status !== '완료' && 
          assignment.status !== '마감' && 
          deadlineDate >= today
        );
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 3);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!studentData || !userData) {
    return (
      <div className="student-dashboard">
        <Header 
          username={userData?.name} 
          role={userData?.role || '학생'} 
        />
        <div className="dashboard-main">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            studentName={userData?.name}
            studentId={userData?.studentId}
            department={userData?.department}
          />
          <main className="dashboard-content">
            <div className="error-container">
              <h2>데이터를 불러올 수 없습니다.</h2>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>
                로그인 페이지로 이동
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <Header 
        username={userData?.name} 
        role={userData?.role || '학생'} 
      />
      <div className="dashboard-main">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          studentName={userData?.name}
          studentId={userData?.studentId}
          department={userData?.department}
        />
        <main className="dashboard-content">
          <div className="welcome-banner">
            <h2>안녕하세요, {userData.name}님!</h2>
            <p>현재 {studentData.academic?.year || ''}학년 {studentData.academic?.semester || ''}학기 / 학번: {userData.studentId}</p>
          </div>

          <div className="dashboard-row">
            <div className="dashboard-col">
              <div className="card">
                <div className="card-header">
                  <h3>내 강의</h3>
                </div>
                <div className="card-body">
                  <div className="card-content">
                    <div className="courses-grid">
                      {studentData.courses && studentData.courses.length > 0 ? (
                        studentData.courses.map((course) => (
                          <CourseCard key={course.id} course={course} />
                        ))
                      ) : (
                        <div className="empty-message">
                          등록된 강의가 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <button 
                    className="btn btn-outline"
                    onClick={() => navigate('/student/courses')}
                  >
                    모든 강의 보기
                  </button>
                </div>
              </div>
            </div>

            <div className="dashboard-col">
              <div className="card">
                <div className="card-header">
                  <h3>최근 공지사항</h3>
                </div>
                <div className="card-body">
                  <div className="card-content">
                    {studentData.announcements && studentData.announcements.length > 0 ? (
                      studentData.announcements.slice(0, 5).map((announcement) => (
                        <AnnouncementItem key={announcement.id} announcement={announcement} />
                      ))
                    ) : (
                      <div className="empty-message">
                        공지사항이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
                <div className="card-footer">
                  <button 
                    className="btn btn-outline"
                    onClick={() => navigate('/student/announcements')}
                  >
                    모든 공지사항 보기
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-row">
            <div className="dashboard-col">
              <div className="card">
                <div className="card-header">
                  <h3>다가오는 과제</h3>
                </div>
                <div className="card-body">
                  <div className="card-content">
                    <UpcomingAssignments assignments={getUpcomingAssignments()} />
                  </div>
                </div>
                <div className="card-footer">
                  <button 
                    className="btn btn-outline"
                    onClick={() => navigate('/student/assignments')}
                  >
                    모든 과제 보기
                  </button>
                </div>
              </div>
            </div>

            <div className="dashboard-col">
              <div className="card">
                <div className="card-header">
                  <h3>성적 현황</h3>
                </div>
                <div className="card-body">
                  <div className="card-content">
                    {studentData.grades ? (
                      <GradesChart grades={studentData.grades} />
                    ) : (
                      <div className="empty-chart-message">
                        성적 정보가 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-row">
            <div className="dashboard-col">
              <div className="card">
                <div className="card-header">
                  <h3>시간표</h3>
                </div>
                <div className="card-body">
                  <div className="card-content">
                    <TimeTable courses={studentData.courses || []} />
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-col">
              <div className="card">
                <div className="card-header">
                  <h3>졸업 요건</h3>
                </div>
                <div className="card-body">
                  <div className="card-content">
                    <GraduationRequirements 
                      requirements={studentData.graduationRequirements} 
                      completedCredits={studentData.completedCredits}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
