import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './GradesChart.css';

const GradesChart = ({ grades }) => {
  const prepareGradeData = () => {
    if (!grades || !grades.previous) {
      return [];
    }

    const semesterGrades = {};

    grades.previous.forEach(course => {
      if (!semesterGrades[course.semester]) {
        semesterGrades[course.semester] = {
          semester: course.semester,
          totalPoints: 0,
          totalCredits: 0,
          courses: []
        };
      }
      const gradePoints = getGradePoints(course.grade);
      semesterGrades[course.semester].courses.push(course);
      semesterGrades[course.semester].totalPoints += gradePoints * course.credits;
      semesterGrades[course.semester].totalCredits += course.credits;
    });

    if (grades.currentSemester) {
      const currentSemester = 'Current';
      semesterGrades[currentSemester] = {
        semester: currentSemester,
        totalPoints: 0,
        totalCredits: 0,
        courses: []
      };
      grades.currentSemester.forEach(course => {
        if (course.grade) {
          const gradePoints = getGradePoints(course.grade);
          semesterGrades[currentSemester].courses.push(course);
          semesterGrades[currentSemester].totalPoints += gradePoints * course.credits;
          semesterGrades[currentSemester].totalCredits += course.credits;
        }
      });

      if (semesterGrades[currentSemester].courses.length === 0) {
        delete semesterGrades[currentSemester];
      }
    }

    return Object.values(semesterGrades).map(semester => {
      const gpa = semester.totalCredits > 0 ? (semester.totalPoints / semester.totalCredits).toFixed(2) : 0;
      return {
        name: formatSemesterName(semester.semester),
        GPA: parseFloat(gpa),
        credits: semester.totalCredits
      };
    }).sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  };

  const getGradePoints = (grade) => {
    const gradeMap = {
      'A+': 4.5, 'A0': 4.0, 'B+': 3.5, 'B0': 3.0,
      'C+': 2.5, 'C0': 2.0, 'D+': 1.5, 'D0': 1.0, 'F': 0.0
    };
    return gradeMap[grade] || 0;
  };

  const formatSemesterName = (semester) => {
    if (semester === 'Current') {
      return '현재 학기';
    }
    const parts = semester.split('-');
    if (parts.length === 2) {
      return `${parts[0]}년 ${parts[1]}학기`;
    }
    return semester;
  };

  const data = prepareGradeData();

  if (data.length === 0) {
    return (
      <div className="grades-chart-empty">
        성적 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="grades-chart-container">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 4.5]} />
          <Tooltip />
          <Legend />
          <Line type="linear" dataKey="GPA" stroke="#78222D" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GradesChart;
