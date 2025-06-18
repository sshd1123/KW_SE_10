const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middlewares/auth');
const { asyncErrorCatcher } = require('../middlewares/error');
const AppError = require('../utils/AppError'); // 커스텀 에러 클래스

// 강의계획서 검색
// GET /api/course/search?keyword=...&semester=...&dept_name=...
router.get('/search', requireAuth, asyncErrorCatcher(async (req, res) => {
    const { keyword, semester, dept_name } = req.query;
    
    let baseQuery = `
        SELECT 
            c.course_id, c.course_code, c.course_name, c.professor_name,
            c.semester, c.dept_name, c.dept_id, c.college_id, c.course_type, 
            c.credits, c.hours, c.lecture_time, c.remarks
        FROM tb_course c  -- 테이블명 tb_course로 수정
        WHERE 1=1
    `;
    const queryParams = [];
    let conditions = "";

    if (keyword) {
        // 검색 대상 필드: 강의명, 강의코드, 교수명, 비고(remarks)
        conditions += ' AND (c.course_name LIKE ? OR c.course_code LIKE ? OR c.professor_name LIKE ? OR c.remarks LIKE ?)';
        const searchTerm = `%${keyword}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (semester) {
        conditions += ' AND c.semester = ?';
        queryParams.push(semester);
    }
    if (dept_name) {
        conditions += ' AND c.dept_name LIKE ?';
        queryParams.push(`%${dept_name}%`);
    }

    const finalQuery = baseQuery + conditions + ' ORDER BY c.semester DESC, c.course_name ASC';
    const courses = await req.db.query(finalQuery, queryParams);

    res.json({
        success: true,
        message: '강의계획서 검색 결과입니다.',
        data: { courses }
    });
}));

// 특정 강의 정보 및 강의계획서 열람
// GET /api/course/:courseId
router.get('/:courseId', requireAuth, asyncErrorCatcher(async (req, res, next) => {
    const courseIdParam = req.params.courseId;
    const courseId = parseInt(courseIdParam);

    if (isNaN(courseId)) {
        return next(new AppError('유효하지 않은 강의 ID입니다.', 400));
    }

    const courseQuery = `SELECT * FROM tb_course WHERE course_id = ?`; // 테이블명 tb_course로 수정
    const [course] = await req.db.query(courseQuery, [courseId]); // courseId (number) 사용

    if (!course) {
        return next(new AppError('해당 강의를 찾을 수 없습니다.', 404));
    }

    res.json({
        success: true,
        message: '강의 상세 정보입니다.',
        data: { course }
    });
}));

// 강의계획서 추가 (교수만)
router.post('/', requireAuth, requireRole('professor'), asyncErrorCatcher(async (req, res, next) => {
    const {
        course_code, course_name, semester, dept_name, dept_id, college_id,
        course_type, credits, hours, lecture_time, remarks
    } = req.body;

    // 필수 필드 검증
    if (!course_code || !course_name || !semester) {
        return next(new AppError('강의 코드, 강의명, 학기는 필수 입력 항목입니다.', 400));
    }
    if (credits && isNaN(parseInt(credits))) {
        return next(new AppError('학점은 숫자여야 합니다.', 400));
    }
    if (hours && isNaN(parseInt(hours))) {
        return next(new AppError('수업 시간은 숫자여야 합니다.', 400));
    }
    if (dept_id && isNaN(parseInt(dept_id))) {
        return next(new AppError('학과 ID는 숫자여야 합니다.', 400));
    }
    if (college_id && isNaN(parseInt(college_id))) {
        return next(new AppError('단과대학 ID는 숫자여야 합니다.', 400));
    }

    // 담당 교수 이름은 현재 로그인한 교수 정보에서 가져옴
    const professor_name = req.user.name || null; // 간소화 및 req.user.name이 없을 경우 null 처리

    const insertQuery = `
        INSERT INTO tb_course (
            course_code, course_name, professor_name, semester, dept_name,
            dept_id, college_id, course_type, credits, hours, 
            lecture_time, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const queryParams = [
        course_code, course_name, professor_name, semester, dept_name || null,
        dept_id ? parseInt(dept_id) : null, college_id ? parseInt(college_id) : null,
        course_type || null, credits ? parseInt(credits) : null, 
        hours ? parseInt(hours) : null, lecture_time || null, remarks || null
    ];

    const result = await req.db.query(insertQuery, queryParams);

    res.status(201).json({
        success: true,
        message: '강의계획서가 성공적으로 추가되었습니다.',
        data: {
            course_id: result.insertId, // 새로 생성된 강의 ID
            professor_name // 담당 교수 이름 포함
        }
    });
}));

// 학생이 특정 강의 수강 신청
// POST /api/course/:courseId/enroll
router.post('/:courseId/enroll', requireAuth, requireRole('student'), asyncErrorCatcher(async (req, res, next) => {
    const courseIdParam = req.params.courseId;
    const courseId = parseInt(courseIdParam);
    const studentUserId = req.user.id; // 현재 로그인한 학생의 user_id

    if (isNaN(courseId)) {
        return next(new AppError('유효하지 않은 강의 ID입니다.', 400));
    }

    // 1. tb_students 테이블에서 학생의 student_id 가져오기
    const [student] = await req.db.query('SELECT student_id FROM tb_students WHERE user_id = ?', [studentUserId]);
    if (!student) {
        return next(new AppError('학생 정보를 찾을 수 없습니다. 관리자에게 문의하세요.', 404));
    }
    const student_id = student.student_id;

    // 2. 해당 강의가 존재하는지 확인
    const [targetCourse] = await req.db.query('SELECT course_id FROM tb_course WHERE course_id = ?', [courseId]);
    if (!targetCourse) {
        return next(new AppError('존재하지 않는 강의입니다.', 404));
    }

    // 3. 이미 수강 신청했는지 또는 철회 후 재신청인지 확인
    const [existingEnrollment] = await req.db.query(
        'SELECT enrollment_id, status FROM tb_enrollments WHERE student_id = ? AND course_id = ?',
        [student_id, courseId]
    );

    if (existingEnrollment) {
        if (existingEnrollment.status === 'enrolled') {
            return next(new AppError('이미 수강 신청한 강의입니다.', 409)); // 409 Conflict
        } else if (existingEnrollment.status === 'withdrawn') {
            // 철회했던 강의를 다시 신청하는 경우, 상태를 'enrolled'로 업데이트
            await req.db.query('UPDATE tb_enrollments SET status = "enrolled", enroll_date = CURRENT_TIMESTAMP WHERE enrollment_id = ?', [existingEnrollment.enrollment_id]);
            return res.json({ success: true, message: '철회했던 강의를 다시 수강 신청했습니다.', data: { enrollment_id: existingEnrollment.enrollment_id, course_id: courseId, student_id: student_id } });
        }
    }

    // 4. 새 수강 신청 정보 삽입
    const result = await req.db.query(
        'INSERT INTO tb_enrollments (student_id, course_id, status) VALUES (?, ?, "enrolled")',
        [student_id, courseId]
    );

    res.status(201).json({
        success: true,
        message: '강의 수강 신청이 완료되었습니다.',
        data: { enrollment_id: result.insertId, course_id: courseId, student_id: student_id }
    });
}));

module.exports = router;