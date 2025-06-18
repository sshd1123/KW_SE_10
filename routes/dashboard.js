const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const { asyncErrorCatcher } = require('../middlewares/error');

// 통합 대시보드 - 역할별 자동 분기
router.get('/', requireAuth, asyncErrorCatcher(async (req, res) => {
  const userRole = req.user.role;
  const userId = req.user.id;

  try {
    switch (userRole) {
      case 'student':
        // 학생 대시보드 데이터
        const studentData = await getStudentDashboard(req.db, userId);
        res.json({
          success: true,
          role: 'student',
          data: studentData
        });
        break;

      case 'professor':
        // 교수 대시보드 데이터
        const professorData = await getProfessorDashboard(req.db, userId, req.user.name);
        res.json({
          success: true,
          role: 'professor',
          data: professorData
        });
        break;

      case 'admin':
        // 관리자 대시보드 데이터
        const adminData = await getAdminDashboard(req.db);
        res.json({
          success: true,
          role: 'admin',
          data: adminData
        });
        break;

      default:
        res.status(403).json({
          success: false,
          message: '알 수 없는 사용자 역할입니다.'
        });
    }
  } catch (error) {
    console.error('통합 대시보드 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '대시보드 정보를 불러오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

// 학생 대시보드 데이터 조회 함수
async function getStudentDashboard(db, studentUserId) {
  // 1. 학생 기본 정보 조회
  const studentInfo = await db.query(`
    SELECT s.student_id, s.student_name, d.dept_name, s.birth_date
    FROM tb_students s
    LEFT JOIN tb_departments d ON s.dept_id = d.dept_id
    WHERE s.user_id = ?
  `, [studentUserId]);

  if (studentInfo.length === 0) {
    throw new Error('학생 정보를 찾을 수 없습니다.');
  }

  const student = studentInfo[0];

  // 2. 현재 수강 강의 (시간표용)
  const currentCourses = await db.query(`
    SELECT 
      c.course_id,
      c.course_name,
      c.credits,
      c.lecture_time,
      c.remarks,
      c.professor_name
    FROM tb_enrollments e
    JOIN tb_course c ON e.course_id = c.course_id
    WHERE e.student_id = ? AND e.status = 'enrolled'
    ORDER BY c.course_name
  `, [student.student_id]);

  // 3. 최근 학사 공지사항 (5개)
  const announcements = await db.query(`
    SELECT 
      board_id,
      title,
      created_at
    FROM tb_board 
    WHERE board_type = 'notice'
    ORDER BY created_at DESC 
    LIMIT 5
  `);

  // 4. 졸업요건 요약 정보
  const graduationSummary = await getGraduationSummary(db, student.student_id, null);

  return {
    student: {
      studentId: student.student_id,
      name: student.student_name,
      department: student.dept_name,
      birthDate: student.birth_date
    },
    timetable: currentCourses.map(course => ({
      courseId: course.course_id,
      courseName: course.course_name,
      credits: course.credits,
      time: course.lecture_time,
      classroom: course.remarks,
      professor: course.professor_name
    })),
    announcements: announcements.map(ann => ({
      id: ann.board_id,
      title: ann.title,
      date: ann.created_at
    })),
    graduationSummary
  };
}

// 교수 대시보드 데이터 조회 함수
async function getProfessorDashboard(db, professorUserId, userName) {
  // 1. 교수 기본 정보 조회
  let professorInfo = [];
  try {
    professorInfo = await db.query(`
      SELECT p.professor_id, p.professor_name, d.dept_name
      FROM tb_professors p
      LEFT JOIN tb_departments d ON p.dept_id = d.dept_id
      WHERE p.user_id = ?
    `, [professorUserId]);
  } catch (error) {
    console.log('tb_professors 테이블이 없거나 데이터가 없습니다:', error.message);
  }

  let professor = null;
  if (professorInfo.length > 0) {
    professor = professorInfo[0];
  } else {
    // tb_professors 테이블이 없는 경우 tb_users에서 정보 가져오기
    const userInfo = await db.query(`
      SELECT user_id, login_id as name FROM tb_users WHERE user_id = ?
    `, [professorUserId]);
    
    if (userInfo.length > 0) {
      professor = {
        professor_id: userInfo[0].user_id,
        professor_name: userName || userInfo[0].name,
        dept_name: '미지정'
      };
    }
  }

  if (!professor) {
    throw new Error('교수 정보를 찾을 수 없습니다.');
  }

  // 2. 담당 강의 목록 조회
  const myCourses = await db.query(`
    SELECT 
      c.course_id,
      c.course_code,
      c.course_name,
      c.semester,
      c.credits,
      c.lecture_time,
      c.remarks,
      c.dept_name,
      COUNT(e.student_id) as enrolled_count
    FROM tb_course c
    LEFT JOIN tb_enrollments e ON c.course_id = e.course_id AND e.status = 'enrolled'
    WHERE c.professor_name = ? OR c.professor_name LIKE ?
    GROUP BY c.course_id
    ORDER BY c.semester DESC, c.course_name ASC
    LIMIT 10
  `, [professor.professor_name, `%${professor.professor_name}%`]);

  // 3. 최근 강의 공지사항 (본인이 작성한 것)
  let myAnnouncements = [];
  try {
    myAnnouncements = await db.query(`
      SELECT 
        ca.announcement_id,
        ca.course_id,
        ca.title,
        ca.created_at,
        c.course_name
      FROM tb_course_announcements ca
      JOIN tb_course c ON ca.course_id = c.course_id
      WHERE ca.professor_id = ?
      ORDER BY ca.created_at DESC
      LIMIT 5
    `, [professorUserId]);
  } catch (error) {
    console.log('강의 공지사항 테이블이 없습니다:', error.message);
  }

  // 4. 최근 학사 공지사항 (전체)
  const announcements = await db.query(`
    SELECT 
      board_id,
      title,
      created_at
    FROM tb_board 
    WHERE board_type = 'notice'
    ORDER BY created_at DESC 
    LIMIT 5
  `);

  // 5. 이번 학기 통계
  const currentYear = new Date().getFullYear();
  const currentSemester = `${currentYear}-${Math.ceil((new Date().getMonth() + 1) / 6)}`;
  
  const semesterStats = {
    totalCourses: myCourses.filter(c => c.semester === currentSemester).length,
    totalStudents: myCourses
      .filter(c => c.semester === currentSemester)
      .reduce((sum, c) => sum + (c.enrolled_count || 0), 0),
    totalCredits: myCourses
      .filter(c => c.semester === currentSemester)
      .reduce((sum, c) => sum + (c.credits || 0), 0)
  };

  return {
    professor: {
      professorId: professor.professor_id,
      name: professor.professor_name,
      department: professor.dept_name
    },
    myCourses: myCourses.map(course => ({
      courseId: course.course_id,
      courseCode: course.course_code,
      courseName: course.course_name,
      semester: course.semester,
      credits: course.credits,
      time: course.lecture_time,
      classroom: course.remarks,
      department: course.dept_name,
      enrolledCount: course.enrolled_count || 0
    })),
    myAnnouncements: myAnnouncements.map(ann => ({
      id: ann.announcement_id,
      courseId: ann.course_id,
      courseName: ann.course_name,
      title: ann.title,
      date: ann.created_at
    })),
    announcements: announcements.map(ann => ({
      id: ann.board_id,
      title: ann.title,
      date: ann.created_at
    })),
    semesterStats,
    currentSemester
  };
}

// 관리자 대시보드 데이터 조회 함수
async function getAdminDashboard(db) {
  let stats = {
    users: { total_users: 0, student_count: 0, professor_count: 0, admin_count: 0, approved_count: 0 },
    students: { total_students: 0, enrolled_students: 0 },
    courses: { total_courses: 0, active_courses: 0 },
    announcements: { total_announcements: 0, important_announcements: 0 },
    graduation: { total_conditions: 0, total_requirements: 0 },
    departments: { total_departments: 0 }
  };

  // 1. 사용자 통계
  try {
    const [users] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as student_count,
        SUM(CASE WHEN role = 'professor' THEN 1 ELSE 0 END) as professor_count,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN is_approved = TRUE THEN 1 ELSE 0 END) as approved_count
      FROM tb_users
    `);
    stats.users = { ...stats.users, ...users };
  } catch (error) {
    console.log('tb_users 조회 실패:', error.message);
  }

  // 2. 학생 통계
  try {
    const [students] = await db.query(`SELECT COUNT(*) as total_students FROM tb_students`);
    stats.students = { ...stats.students, ...students };
    
    const [enrolled] = await db.query(`
      SELECT COUNT(DISTINCT student_id) as enrolled_students FROM tb_enrollments
    `);
    stats.students.enrolled_students = enrolled.enrolled_students || 0;
  } catch (error) {
    console.log('tb_students 조회 실패:', error.message);
  }

  // 3. 강의 통계
  try {
    const [courses] = await db.query(`SELECT COUNT(*) as total_courses FROM tb_course`);
    stats.courses = { ...stats.courses, ...courses };
    
    const currentYear = new Date().getFullYear();
    const [active] = await db.query(`
      SELECT COUNT(*) as active_courses 
      FROM tb_course 
      WHERE semester LIKE ?
    `, [`${currentYear}%`]);
    stats.courses.active_courses = active.active_courses || 0;
  } catch (error) {
    console.log('tb_course 조회 실패:', error.message);
  }

  // 4. 공지사항 통계
  try {
    const [announcements] = await db.query(`
      SELECT 
        COUNT(*) as total_announcements,
        SUM(CASE WHEN title LIKE '[중요]%' THEN 1 ELSE 0 END) as important_announcements
      FROM tb_board 
      WHERE board_type = 'notice'
    `);
    stats.announcements = { ...stats.announcements, ...announcements };
  } catch (error) {
    console.log('tb_board 조회 실패:', error.message);
  }

  // 5. 최근 활동 (최근 가입 사용자)
  let recentUsers = [];
  try {
    recentUsers = await db.query(`
      SELECT user_id, login_id, role, created_at
      FROM tb_users
      ORDER BY created_at DESC
      LIMIT 5
    `);
  } catch (error) {
    console.log('최근 사용자 조회 실패:', error.message);
  }

  return {
    ...stats,
    recentUsers: recentUsers.map(user => ({
      userId: user.user_id,
      loginId: user.login_id,
      role: user.role,
      createdAt: user.created_at
    })),
    generated_at: new Date().toISOString()
  };
}

// 졸업요건 요약 정보 계산 (학생용)
async function getGraduationSummary(db, studentId, admissionYear) {
  try {
    const requirements = {
      totalCredits: 130,
      majorCredits: 54,
      generalCredits: 30,
      electiveCredits: 46,
      minGPA: 2.0
    };

    let completedCredits = {
      total: 0,
      major: 0,
      general: 0,
      elective: 0
    };

    try {
      const enrolledCredits = await db.query(`
        SELECT 
          SUM(c.credits) as total_credits
        FROM tb_enrollments e
        JOIN tb_course c ON e.course_id = c.course_id
        WHERE e.student_id = ? AND e.status = 'enrolled'
      `, [studentId]);

      if (enrolledCredits.length > 0) {
        completedCredits.total = enrolledCredits[0].total_credits || 0;
      }
    } catch (error) {
      console.log('학점 계산 실패:', error.message);
    }

    const progress = Math.min((completedCredits.total / requirements.totalCredits) * 100, 100);
    const remainingCredits = Math.max(requirements.totalCredits - completedCredits.total, 0);

    return {
      requirements,
      completed: completedCredits,
      currentGPA: 0,
      progress: Math.round(progress * 10) / 10,
      remainingCredits,
      isEligible: completedCredits.total >= requirements.totalCredits
    };

  } catch (error) {
    console.error('졸업요건 요약 계산 오류:', error);
    return {
      requirements: { totalCredits: 130, majorCredits: 54, generalCredits: 30, electiveCredits: 46, minGPA: 2.0 },
      completed: { total: 0, major: 0, general: 0, elective: 0 },
      currentGPA: 0,
      progress: 0,
      remainingCredits: 130,
      isEligible: false
    };
  }
}

module.exports = router; 