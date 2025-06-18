const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middlewares/auth');
const { asyncErrorCatcher } = require('../middlewares/error');
const AppError = require('../utils/AppError');

// 졸업 요건 정의
const GRADUATION_REQUIREMENTS = {
  TOTAL_CREDITS: 100, // 학점 100
  BASIC_LIBERAL_ARTS_CREDITS: 30, // 기초교양 30학점
  TOPCIT_EXAM_REQUIRED: true, // TODO: 실제 TOPCIT 응시 여부 확인 로직 구현 시 이 값 사용
  GRADUATION_PROJECT_REQUIRED: true, // TODO: 실제 졸업 작품 발표 여부 확인 로직 구현 시 이 값 사용
};

// TODO: 학생 졸업 요건 열람 기능 구현
// TODO: 학생 졸업 요건 관련 DB 추가 (기초교양/세부전공 구분 컬럼, 탑싯/졸업작품 완료 여부 컬럼 등)

// 학생 전용 미들웨어
const requireStudent = requireRole('student');

// 학생 대시보드 - 종합 정보
router.get('/dashboard', requireAuth, requireStudent, asyncErrorCatcher(async (req, res) => {
  const studentUserId = req.user.id;
  
  try {
    // 1. 학생 기본 정보 조회
    const studentInfo = await req.db.query(`
      SELECT s.student_id, s.name, d.department_name, s.admission_year
      FROM tb_students s
      LEFT JOIN tb_departments d ON s.dept_id = d.dept_id
      WHERE s.user_id = ?
    `, [studentUserId]);

    if (studentInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: '학생 정보를 찾을 수 없습니다.'
      });
    }

    const student = studentInfo[0];

    // 2. 현재 수강 강의 (시간표용)
    const currentCourses = await req.db.query(`
      SELECT 
        c.course_id,
        c.course_name,
        c.credits,
        c.course_time,
        c.classroom,
        p.name as professor_name
      FROM tb_enrollments e
      JOIN tb_courses c ON e.course_id = c.course_id
      LEFT JOIN tb_professors p ON c.professor_id = p.professor_id
      WHERE e.student_id = ? AND e.status = 'enrolled'
      ORDER BY c.course_name
    `, [student.student_id]);

    // 3. 최근 학사 공지사항 (5개)
    const announcements = await req.db.query(`
      SELECT 
        board_id,
        title,
        created_at,
        author_id
      FROM tb_board 
      WHERE board_type = 'academic'
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    // 4. 졸업요건 요약 정보
    const graduationSummary = await getGraduationSummary(req.db, student.student_id, student.admission_year);

    // 5. 이번 학기 성적 (구현된 경우)
    let currentGrades = [];
    try {
      currentGrades = await req.db.query(`
        SELECT 
          c.course_name,
          g.grade,
          c.credits
        FROM tb_grades g
        JOIN tb_courses c ON g.course_id = c.course_id
        WHERE g.student_id = ? 
        ORDER BY g.semester DESC, g.year DESC
        LIMIT 5
      `, [student.student_id]);
    } catch (error) {
      console.log('성적 테이블이 없거나 데이터가 없습니다:', error.message);
    }

    res.json({
      success: true,
      data: {
        student: {
          studentId: student.student_id,
          name: student.name,
          department: student.department_name,
          admissionYear: student.admission_year
        },
        timetable: currentCourses.map(course => ({
          courseId: course.course_id,
          courseName: course.course_name,
          credits: course.credits,
          time: course.course_time,
          classroom: course.classroom,
          professor: course.professor_name
        })),
        myCourses: currentCourses.map(course => ({
          courseId: course.course_id,
          courseName: course.course_name,
          credits: course.credits,
          professor: course.professor_name,
          classroom: course.classroom
        })),
        announcements: announcements.map(ann => ({
          id: ann.board_id,
          title: ann.title,
          date: ann.created_at,
          authorId: ann.author_id
        })),
        graduationSummary: graduationSummary,
        recentGrades: currentGrades.map(grade => ({
          courseName: grade.course_name,
          grade: grade.grade,
          credits: grade.credits
        }))
      }
    });

  } catch (error) {
    console.error('학생 대시보드 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '대시보드 정보를 불러오는 중 오류가 발생했습니다.'
    });
  }
}));

// 시간표 전용 API
router.get('/timetable', requireAuth, requireStudent, asyncErrorCatcher(async (req, res) => {
  const studentUserId = req.user.id;
  
  // 학생 ID 조회
  const studentInfo = await req.db.query(
    'SELECT student_id FROM tb_students WHERE user_id = ?',
    [studentUserId]
  );

  if (studentInfo.length === 0) {
    return res.status(404).json({
      success: false,
      message: '학생 정보를 찾을 수 없습니다.'
    });
  }

  const studentId = studentInfo[0].student_id;

  // 시간표 데이터 조회
  const timetable = await req.db.query(`
    SELECT 
      c.course_id,
      c.course_name,
      c.credits,
      c.course_time,
      c.classroom,
      p.name as professor_name
    FROM tb_enrollments e
    JOIN tb_courses c ON e.course_id = c.course_id
    LEFT JOIN tb_professors p ON c.professor_id = p.professor_id
    WHERE e.student_id = ? AND e.status = 'enrolled'
    ORDER BY c.course_time
  `, [studentId]);

  res.json({
    success: true,
    data: {
      timetable: timetable.map(course => ({
        courseId: course.course_id,
        courseName: course.course_name,
        credits: course.credits,
        time: parseTimeSlot(course.course_time),
        classroom: course.classroom,
        professor: course.professor_name
      }))
    }
  });
}));

// 내 강의 목록 API
router.get('/my-courses', requireAuth, requireStudent, asyncErrorCatcher(async (req, res) => {
  const studentUserId = req.user.id;
  
  // 학생 ID 조회
  const studentInfo = await req.db.query(
    'SELECT student_id FROM tb_students WHERE user_id = ?',
    [studentUserId]
  );

  if (studentInfo.length === 0) {
    return res.status(404).json({
      success: false,
      message: '학생 정보를 찾을 수 없습니다.'
    });
  }

  const studentId = studentInfo[0].student_id;

  // 수강 강의 목록 조회
  const courses = await req.db.query(`
    SELECT 
      c.course_id,
      c.course_name,
      c.credits,
      c.course_time,
      c.classroom,
      c.max_students,
      p.name as professor_name,
      d.department_name,
      e.enrollment_date,
      e.status
    FROM tb_enrollments e
    JOIN tb_courses c ON e.course_id = c.course_id
    LEFT JOIN tb_professors p ON c.professor_id = p.professor_id
    LEFT JOIN tb_departments d ON c.dept_id = d.dept_id
    WHERE e.student_id = ?
    ORDER BY e.enrollment_date DESC
  `, [studentId]);

  res.json({
    success: true,
    data: {
      courses: courses.map(course => ({
        courseId: course.course_id,
        courseName: course.course_name,
        credits: course.credits,
        time: course.course_time,
        classroom: course.classroom,
        professor: course.professor_name,
        department: course.department_name,
        enrollmentDate: course.enrollment_date,
        status: course.status,
        maxStudents: course.max_students
      }))
    }
  });
}));

// 학생 개인 졸업 요건 조회 (학생만)
router.get('/graduation-requirements', requireAuth, requireStudent, asyncErrorCatcher(async (req, res) => {
  const studentUserId = req.user.id;
  
  // 학생 정보 조회
  const studentInfo = await req.db.query(`
    SELECT s.student_id, s.admission_year, d.department_name
    FROM tb_students s
    LEFT JOIN tb_departments d ON s.dept_id = d.dept_id
    WHERE s.user_id = ?
  `, [studentUserId]);

  if (studentInfo.length === 0) {
    return res.status(404).json({
      success: false,
      message: '학생 정보를 찾을 수 없습니다.'
    });
  }

  const student = studentInfo[0];
  const graduationData = await getDetailedGraduationRequirements(req.db, student.student_id, student.admission_year);

  res.json({
    success: true,
    data: {
      student: {
        studentId: student.student_id,
        admissionYear: student.admission_year,
        department: student.department_name
      },
      graduation: graduationData
    }
  });
}));

// 학생 개인 성적 조회 (학생만)
router.get('/grades', requireAuth, requireRole('student'), asyncErrorCatcher(async (req, res, next) => {
  const studentUserId = req.user.id;
  
  // 학생 정보 조회
  const [student] = await req.db.query(`
    SELECT student_id FROM tb_students WHERE user_id = ?
  `, [studentUserId]);
  
  if (!student) {
    return next(new AppError('학생 정보를 찾을 수 없습니다.', 404));
  }

  // 성적 조회
  const grades = await req.db.query(`
    SELECT 
      c.course_code,
      c.course_name,
      c.credits,
      c.course_type,
      c.semester,
      e.grade,
      e.status,
      e.enrollment_date
    FROM tb_enrollments e
    JOIN tb_course c ON e.course_id = c.course_id
    WHERE e.student_id = ?
    ORDER BY c.semester DESC, c.course_code
  `, [student.student_id]);

  res.json({
    success: true,
    message: '성적 조회 성공',
    data: {
      student_id: student.student_id,
      grades: grades
    }
  });
}));

// 헬퍼 함수들

// 졸업요건 요약 정보 계산
async function getGraduationSummary(db, studentId, admissionYear) {
  try {
    // 기본 졸업요건 설정 (입학년도별로 다를 수 있음)
    const requirements = {
      totalCredits: 130,
      majorCredits: 54,
      generalCredits: 30,
      electiveCredits: 46,
      minGPA: 2.0
    };

    // 이수한 학점 계산 (성적 테이블이 있는 경우)
    let completedCredits = {
      total: 0,
      major: 0,
      general: 0,
      elective: 0
    };

    try {
      const credits = await db.query(`
        SELECT 
          SUM(c.credits) as total_credits,
          SUM(CASE WHEN c.course_type = 'major' THEN c.credits ELSE 0 END) as major_credits,
          SUM(CASE WHEN c.course_type = 'general' THEN c.credits ELSE 0 END) as general_credits,
          SUM(CASE WHEN c.course_type = 'elective' THEN c.credits ELSE 0 END) as elective_credits
        FROM tb_grades g
        JOIN tb_courses c ON g.course_id = c.course_id
        WHERE g.student_id = ? AND g.grade NOT IN ('F', 'NP')
      `, [studentId]);

      if (credits.length > 0 && credits[0].total_credits) {
        completedCredits = {
          total: credits[0].total_credits || 0,
          major: credits[0].major_credits || 0,
          general: credits[0].general_credits || 0,
          elective: credits[0].elective_credits || 0
        };
      }
    } catch (error) {
      console.log('성적 데이터 없음, 수강신청 기준으로 계산합니다.');
      
      // 성적 테이블이 없으면 현재 수강신청 기준으로 계산
      const enrolledCredits = await db.query(`
        SELECT 
          SUM(c.credits) as total_credits
        FROM tb_enrollments e
        JOIN tb_courses c ON e.course_id = c.course_id
        WHERE e.student_id = ? AND e.status = 'enrolled'
      `, [studentId]);

      if (enrolledCredits.length > 0) {
        completedCredits.total = enrolledCredits[0].total_credits || 0;
      }
    }

    // GPA 계산
    let currentGPA = 0;
    try {
      const gpaResult = await db.query(`
        SELECT AVG(
          CASE g.grade
            WHEN 'A+' THEN 4.5
            WHEN 'A' THEN 4.0
            WHEN 'B+' THEN 3.5
            WHEN 'B' THEN 3.0
            WHEN 'C+' THEN 2.5
            WHEN 'C' THEN 2.0
            WHEN 'D+' THEN 1.5
            WHEN 'D' THEN 1.0
            ELSE 0
          END
        ) as gpa
        FROM tb_grades g
        WHERE g.student_id = ? AND g.grade NOT IN ('F', 'NP')
      `, [studentId]);

      currentGPA = gpaResult[0]?.gpa || 0;
    } catch (error) {
      console.log('GPA 계산 불가');
    }

    // 진행률 계산
    const progress = Math.min((completedCredits.total / requirements.totalCredits) * 100, 100);
    const remainingCredits = Math.max(requirements.totalCredits - completedCredits.total, 0);

    return {
      requirements,
      completed: completedCredits,
      currentGPA: Math.round(currentGPA * 100) / 100,
      progress: Math.round(progress * 10) / 10,
      remainingCredits,
      isEligible: completedCredits.total >= requirements.totalCredits && currentGPA >= requirements.minGPA
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

// 상세 졸업요건 조회
async function getDetailedGraduationRequirements(db, studentId, admissionYear) {
  const summary = await getGraduationSummary(db, studentId, admissionYear);
  
  // 상세 요건별 진행상황
  const detailedRequirements = [
    {
      category: '전체 이수학점',
      required: summary.requirements.totalCredits,
      completed: summary.completed.total,
      progress: Math.min((summary.completed.total / summary.requirements.totalCredits) * 100, 100)
    },
    {
      category: '전공 이수학점',
      required: summary.requirements.majorCredits,
      completed: summary.completed.major,
      progress: Math.min((summary.completed.major / summary.requirements.majorCredits) * 100, 100)
    },
    {
      category: '교양 이수학점',
      required: summary.requirements.generalCredits,
      completed: summary.completed.general,
      progress: Math.min((summary.completed.general / summary.requirements.generalCredits) * 100, 100)
    },
    {
      category: '선택 이수학점',
      required: summary.requirements.electiveCredits,
      completed: summary.completed.elective,
      progress: Math.min((summary.completed.elective / summary.requirements.electiveCredits) * 100, 100)
    },
    {
      category: '평점평균',
      required: summary.requirements.minGPA,
      completed: summary.currentGPA,
      progress: Math.min((summary.currentGPA / summary.requirements.minGPA) * 100, 100)
    }
  ];

  return {
    summary,
    detailedRequirements
  };
}

// 시간 파싱 함수 (예: "월1,2" -> {day: 1, periods: [1,2]})
function parseTimeSlot(timeString) {
  if (!timeString) return null;
  
  try {
    // 예시: "월1,2" 또는 "화3,4,5" 형태 파싱
    const dayMap = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 7 };
    const dayChar = timeString.charAt(0);
    const periodsStr = timeString.substring(1);
    
    return {
      day: dayMap[dayChar] || 1,
      periods: periodsStr.split(',').map(p => parseInt(p.trim())),
      original: timeString
    };
  } catch (error) {
    return { day: 1, periods: [], original: timeString };
  }
}

module.exports = router;