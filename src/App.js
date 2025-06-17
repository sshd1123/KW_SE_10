import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// pages
import LoginPage from './components/pages/LoginPage';
import StudentDashboard from './components/pages/student/Dashboard';
import CourseDetailPage from './components/pages/student/CourseDetailPage';
import GradesPage from './components/pages/student/GradesPage';
import CoursesPage from './components/pages/student/CoursesPage';
import AssignmentSubmissionPage from './components/pages/student/AssignmentSubmissionPage';
import AnnouncementsPage from './components/pages/student/AnnouncementsPage';
// import AnnouncementDetailPage from './components/pages/student/AnnouncementDetailPage';
import CourseRegistrationPage from './components/pages/student/CourseRegistrationPage';
import AccountSettingsPage from './components/pages/student/AccountSettingsPage';
import NotificationsPage from './components/pages/student/NotificationsPage';
import GraduationRequirementsPage from './components/pages/student/GraduationRequirementsPage';

import ProfessorDashboard from './components/pages/professor/Dashboard';
import ProfessorCoursesPage from './components/pages/professor/ProfessorCoursesPage';
import ProfessorStudentsPage from './components/pages/professor/ProfessorStudentsPage';
import ProfessorAssignmentsPage from './components/pages/professor/ProfessorAssignmentsPage';
import ProfessorGradesPage from './components/pages/professor/ProfessorGradesPage';
import ProfessorAnnouncementsPage from './components/pages/professor/ProfessorAnnouncementsPage';
import ProfessorSchedulePage from './components/pages/professor/ProfessorSchedulePage';
import ProfessorMaterialsPage from './components/pages/professor/ProfessorMaterialsPage';
import ProfessorAttendancePage from './components/pages/professor/ProfessorAttendancePage';
import ProfessorSettingsPage from './components/pages/professor/ProfessorSettingsPage';
import ProfessorCourseDetailPage from './components/pages/professor/ProfessorCourseDetailPage';
import ProfessorAssignmentDetailPage from './components/pages/professor/ProfessorAssignmentDetailPage';
import CreateAnnouncementPage from './components/pages/professor/CreateAnnouncementPage';
import CreateAssignmentPage from './components/pages/professor/CreateAssignmentPage';

import AssignmentDetailPage from './components/pages/student/AssingmentDetailPage';
import AnnouncementDetailPage from './components/pages/AnnouncementDetailPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import ArchiveDetailPage from './components/course/ArchiveDetailPage';
import CreateArchivePage from './components/pages/professor/CreateArchivePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* 학생 */}
        <Route path="/student/*" element={
          // <ProtectedRoute>
          <Routes>
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="course/:courseId" element={<CourseDetailPage />} />
            <Route path="grades" element={<GradesPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="course/:courseId/assignment/:assignmentId/submit" element={<AssignmentDetailPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="announcement/:announcementId" element={<AnnouncementDetailPage />} />
            <Route path="course/:courseId/announcement/:announcementId" element={<AnnouncementDetailPage />} />
            <Route path="registration" element={<CourseRegistrationPage />} />
            <Route path="settings" element={<AccountSettingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="graduation" element={<GraduationRequirementsPage />} />

            <Route path="course/:courseId/archive/:archiveId" element={<ArchiveDetailPage />} />
          </Routes>
          // </ProtectedRoute>
        } />

        {/* 교수 */}
        <Route path="/professor/*" element={
          // <ProtectedRoute>
          <Routes>
            <Route path="dashboard" element={<ProfessorDashboard />} />
            <Route path="courses" element={<ProfessorCoursesPage />} />
            <Route path="students" element={<ProfessorStudentsPage />} />
            <Route path="assignments" element={<ProfessorAssignmentsPage />} />
            <Route path="assignment/:assignmentId" element={<ProfessorAssignmentDetailPage />} />
            <Route path="grades" element={<ProfessorGradesPage />} />
            <Route path="announcements" element={<ProfessorAnnouncementsPage />} />
            <Route path="schedule" element={<ProfessorSchedulePage />} />
            <Route path="materials" element={<ProfessorMaterialsPage />} />
            <Route path="attendance" element={<ProfessorAttendancePage />} />
            <Route path="settings" element={<ProfessorSettingsPage />} />

            <Route path="course/:courseId" element={<ProfessorCourseDetailPage />} />
            <Route path="course/:courseId/announcement/create" element={<CreateAnnouncementPage />} />
            <Route path="announcement/:announcementId" element={<AnnouncementDetailPage />} />
            <Route path="announcement/create/:courseId" element={<CreateAnnouncementPage />} />
            <Route path="announcement/edit/:courseId/:announcementId" element={<CreateAnnouncementPage />} />

            <Route path="course/:courseId/assignment/create" element={<CreateAssignmentPage />} />
            <Route path="assignment/:assignmentId/edit" element={<CreateAssignmentPage />} />
            <Route path="course/assignment/:assignmentId" element={<AssignmentDetailPage />} />

            <Route path="course/:courseId/archive/:archiveId" element={<ArchiveDetailPage />} />
            <Route path="course/:courseId/archive/upload" element={<CreateArchivePage />} />
            <Route path="course/:courseId/archive/:archiveId/edit" element={<CreateArchivePage />} />
          </Routes>
          // </ProtectedRoute>
        } />

        {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
