const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middlewares/auth');
const { asyncErrorCatcher } = require('../middlewares/error');
const AppError = require('../utils/AppError');

// 교수 전용 미들웨어
const requireProfessor = requireRole('professor');

// 교수 대시보드 - 종합 정보
router.get('/dashboard', requireAuth, requireProfessor, asyncErrorCatcher(async (req, res) => {
  const professorUserId = req.user.id;
  
  try {
    // 1. 교수 기본 정보 조회
    let professorInfo = [];
    try {
      professorInfo = await req.db.query(`
        SELECT p.professor_id, p.name, d.department_name
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
      const userInfo = await req.db.query(`
        SELECT user_id, login_id as name FROM tb_users WHERE user_id = ?
      `, [professorUserId]);
      
      if (userInfo.length > 0) {
        professor = {
          professor_id: userInfo[0].user_id,
          name: userInfo[0].name,
          department_name: '미지정'
        };
      }
    }

    if (!professor) {
      return res.status(404).json({
        success: false,
        message: '교수 정보를 찾을 수 없습니다.'
      });
    }

    // 2. 담당 강의 목록 조회
    const myCourses = await req.db.query(`
      SELECT 
        c.course_id,
        c.course_code,
        c.course_name,
        c.semester,
        c.credits,
        c.course_time,
        c.classroom,
        c.dept_name,
        c.course_type,
        COUNT(e.student_id) as enrolled_count
      FROM tb_course c
      LEFT JOIN tb_enrollments e ON c.course_id = e.course_id AND e.status = 'enrolled'
      WHERE c.professor_name = ? OR c.professor_name LIKE ?
      GROUP BY c.course_id
      ORDER BY c.semester DESC, c.course_name ASC
    `, [professor.name, `%${professor.name}%`]);

    // 3. 최근 강의 공지사항 (본인이 작성한 것)
    let myAnnouncements = [];
    try {
      myAnnouncements = await req.db.query(`
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
    const announcements = await req.db.query(`
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

    res.json({
      success: true,
      data: {
        professor: {
          professorId: professor.professor_id,
          name: professor.name,
          department: professor.department_name
        },
        myCourses: myCourses.map(course => ({
          courseId: course.course_id,
          courseCode: course.course_code,
          courseName: course.course_name,
          semester: course.semester,
          credits: course.credits,
          time: course.course_time,
          classroom: course.classroom,
          department: course.dept_name,
          courseType: course.course_type,
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
      }
    });

  } catch (error) {
    console.error('교수 대시보드 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '대시보드 정보를 불러오는 중 오류가 발생했습니다.'
    });
  }
}));

// 내 강의 목록 API (상세)
router.get('/my-courses', requireAuth, requireProfessor, asyncErrorCatcher(async (req, res) => {
  const professorUserId = req.user.id;
  
  // 교수 이름 조회
  let professorName = req.user.name;
  try {
    const professorInfo = await req.db.query(`
      SELECT name FROM tb_professors WHERE user_id = ?
    `, [professorUserId]);
    
    if (professorInfo.length > 0) {
      professorName = professorInfo[0].name;
    }
  } catch (error) {
    console.log('tb_professors 테이블에서 이름 조회 실패, 사용자 이름 사용');
  }

  // 담당 강의 목록 조회
  const courses = await req.db.query(`
    SELECT 
      c.course_id,
      c.course_code,
      c.course_name,
      c.semester,
      c.credits,
      c.hours,
      c.course_time,
      c.classroom,
      c.dept_name,
      c.course_type,
      c.remarks,
      COUNT(e.student_id) as enrolled_count,
      c.lecture_time
    FROM tb_course c
    LEFT JOIN tb_enrollments e ON c.course_id = e.course_id AND e.status = 'enrolled'
    WHERE c.professor_name = ? OR c.professor_name LIKE ?
    GROUP BY c.course_id
    ORDER BY c.semester DESC, c.course_name ASC
  `, [professorName, `%${professorName}%`]);

  res.json({
    success: true,
    data: {
      professorName,
      courses: courses.map(course => ({
        courseId: course.course_id,
        courseCode: course.course_code,
        courseName: course.course_name,
        semester: course.semester,
        credits: course.credits,
        hours: course.hours,
        time: course.course_time || course.lecture_time,
        classroom: course.classroom,
        department: course.dept_name,
        courseType: course.course_type,
        remarks: course.remarks,
        enrolledCount: course.enrolled_count || 0
      }))
    }
  });
}));

// 특정 강의 수강생 목록 조회 (교수만)
router.get('/courses/:courseId/students', requireAuth, requireProfessor, asyncErrorCatcher(async (req, res, next) => {
  const { courseId } = req.params;
  const professorUserId = req.user.id;
  
  if (isNaN(parseInt(courseId))) {
    return next(new AppError('유효하지 않은 강의 ID입니다.', 400));
  }

  // 교수 권한 확인 (본인 강의인지)
  const [course] = await req.db.query(`
    SELECT course_id, professor_name, course_name FROM tb_course WHERE course_id = ?
  `, [courseId]);

  if (!course) {
    return next(new AppError('존재하지 않는 강의입니다.', 404));
  }

  // 교수 이름 확인
  let professorName = req.user.name;
  try {
    const professorInfo = await req.db.query(`
      SELECT name FROM tb_professors WHERE user_id = ?
    `, [professorUserId]);
    
    if (professorInfo.length > 0) {
      professorName = professorInfo[0].name;
    }
  } catch (error) {
    console.log('tb_professors 테이블에서 이름 조회 실패');
  }

  if (course.professor_name !== professorName && !course.professor_name.includes(professorName)) {
    return next(new AppError('본인이 담당하는 강의만 조회할 수 있습니다.', 403));
  }

  // 수강생 목록 조회
  const students = await req.db.query(`
    SELECT 
      s.student_id,
      s.name as student_name,
      s.admission_year,
      d.department_name,
      e.enrollment_date,
      e.status,
      u.login_id
    FROM tb_enrollments e
    JOIN tb_students s ON e.student_id = s.student_id
    LEFT JOIN tb_departments d ON s.dept_id = d.dept_id
    LEFT JOIN tb_users u ON s.user_id = u.user_id
    WHERE e.course_id = ?
    ORDER BY s.student_id ASC
  `, [courseId]);

  res.json({
    success: true,
    data: {
      course: {
        courseId: course.course_id,
        courseName: course.course_name,
        professorName: course.professor_name
      },
      students: students.map(student => ({
        studentId: student.student_id,
        name: student.student_name,
        loginId: student.login_id,
        admissionYear: student.admission_year,
        department: student.department_name,
        enrollmentDate: student.enrollment_date,
        status: student.status
      })),
      totalCount: students.length
    }
  });
}));

module.exports = router; 