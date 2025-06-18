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
        FROM tb_course c 
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

    const courseQuery = `SELECT * FROM tb_course WHERE course_id = ?`; 
    const [course] = await req.db.query(courseQuery, [courseId]); 

    if (!course) {
        return next(new AppError('해당 강의를 찾을 수 없습니다.', 404));
    }

    res.json({
        success: true,
        message: '강의 상세 정보입니다.',
        data: { course }
    });
}));

// 강의계획서 추가 (교수 또는 관리자만)
router.post('/', requireAuth, requireRole('professor', 'admin'), asyncErrorCatcher(async (req, res, next) => {
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

    // 담당 교수 이름은 현재 로그인한 사용자 정보에서 가져옴
    // 관리자의 경우 별도로 교수명을 입력받을 수 있도록 수정
    let professor_name;
    if (req.user.role === 'admin' && req.body.professor_name) {
      professor_name = req.body.professor_name;
    } else {
      professor_name = req.user.name || null; 
    }

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
            course_id: result.insertId, 
            professor_name 
        }
    });
}));

// 학생이 특정 강의 수강 신청
// POST /api/course/:courseId/enroll
router.post('/:courseId/enroll', requireAuth, requireRole('student'), asyncErrorCatcher(async (req, res, next) => {
    const courseIdParam = req.params.courseId;
    const courseId = parseInt(courseIdParam);
    const studentUserId = req.user.id; 

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
            return next(new AppError('이미 수강 신청한 강의입니다.', 409)); 
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

// 강의 삭제 (관리자만)
router.delete('/:courseId', requireAuth, requireRole('admin'), asyncErrorCatcher(async (req, res, next) => {
    const { courseId } = req.params;
    
    if (isNaN(parseInt(courseId))) {
        return next(new AppError('유효하지 않은 강의 ID입니다.', 400));
    }

    // 강의 존재 여부 확인
    const [existingCourse] = await req.db.query(
        'SELECT course_id, course_name, course_code FROM tb_course WHERE course_id = ?', 
        [courseId]
    );

    if (!existingCourse) {
        return next(new AppError('존재하지 않는 강의입니다.', 404));
    }

    // TODO: 강의 삭제 시 관련 공지사항, 수강신청 등도 함께 처리할지 결정 (현재 코드에는 주석으로만 처리됨)
    
    // 강의 삭제
    await req.db.query('DELETE FROM tb_course WHERE course_id = ?', [courseId]);

    res.json({
        success: true,
        message: `강의 '${existingCourse.course_name} (${existingCourse.course_code})'가 성공적으로 삭제되었습니다.`,
        data: {
            deleted_course_id: parseInt(courseId),
            deleted_course_name: existingCourse.course_name,
            deleted_course_code: existingCourse.course_code
        }
    });
}));

// 강의 수정 (교수 본인 또는 관리자만)
router.put('/:courseId', requireAuth, asyncErrorCatcher(async (req, res, next) => {
    const { courseId } = req.params;
    const {
        course_code, course_name, semester, dept_name,
        course_type, credits, hours, lecture_time, remarks, professor_name 
    } = req.body;

    if (isNaN(parseInt(courseId))) {
        return next(new AppError('유효하지 않은 강의 ID입니다.', 400));
    }

    // 필수 필드 검증
    if (!course_code || !course_name || !semester) {
        return next(new AppError('강의 코드, 강의명, 학기는 필수 입력 항목입니다.', 400));
    }

    // 강의 존재 여부 확인
    const [existingCourse] = await req.db.query(
        'SELECT course_id, professor_name FROM tb_course WHERE course_id = ?', 
        [courseId]
    );

    if (!existingCourse) {
        return next(new AppError('존재하지 않는 강의입니다.', 404));
    }

    // 권한 확인: 관리자이거나 해당 강의의 담당 교수인 경우만 수정 가능
    if (req.user.role !== 'admin' && req.user.role !== 'professor') {
        return next(new AppError('강의를 수정할 권한이 없습니다.', 403));
    }

    // 교수의 경우 본인 강의만 수정 가능 (TODO: 실제 교수 매칭 로직 구현 필요)
    // 현재는 req.user.name과 existingCourse.professor_name을 비교.
    // 실제 시스템에서는 professor_id를 이용해 tb_professors와 tb_users 테이블을 조인하여 확인할 수 있음.
    if (req.user.role === 'professor' && existingCourse.professor_name !== req.user.name) {
        return next(new AppError('본인이 담당하는 강의만 수정할 수 있습니다.', 403));
    }

    // 교수명 처리
    let finalProfessorName;
    if (req.user.role === 'admin' && professor_name) {
        finalProfessorName = professor_name;
    } else {
        finalProfessorName = req.user.name || existingCourse.professor_name;
    }

    const updateQuery = `
        UPDATE tb_course SET
            course_code = ?, course_name = ?, professor_name = ?, semester = ?, 
            dept_name = ?, course_type = ?, credits = ?, hours = ?, 
            lecture_time = ?, remarks = ?
        WHERE course_id = ?
    `;
    const queryParams = [
        course_code, course_name, finalProfessorName, semester, dept_name || null,
        course_type || null, credits ? parseInt(credits) : null, hours ? parseInt(hours) : null,
        lecture_time || null, remarks || null, courseId
    ];

    await req.db.query(updateQuery, queryParams);

    res.json({
        success: true,
        message: '강의 정보가 성공적으로 수정되었습니다.',
        data: {
            course_id: parseInt(courseId),
            updated_fields: {
                course_code, course_name, professor_name: finalProfessorName, semester
            }
        }
    });
}));

// 특정 강의의 모든 공지사항 조회
// GET /api/course/:courseId/announcements
router.get('/:courseId/announcements', requireAuth, asyncErrorCatcher(async (req, res, next) => {
    const { courseId } = req.params;

    if (isNaN(parseInt(courseId))) {
        return next(new AppError('유효하지 않은 강의 ID입니다.', 400));
    }

    // tb_board 테이블에서 해당 강의의 공지사항 (board_type이 'notice'인 경우)을 가져옴
    // tb_board 테이블의 creator_id가 tb_users의 user_id를 참조하므로, 조인하여 사용자 정보 가져올 수 있음
    const announcements = await req.db.query(
        `SELECT b.*, u.login_id as creator_login_id 
         FROM tb_board b
         JOIN tb_users u ON b.creator_id = u.user_id 
         WHERE b.board_type = 'notice' AND b.dept_id IS NULL AND b.title LIKE ? 
         ORDER BY b.created_at DESC`,
        [`%${courseId}%`] // courseId를 제목에 포함된 형태로 검색 (이 부분은 요구사항에 따라 수정 필요)
    );

    res.json({ success: true, message: '강의 공지사항 목록입니다.', data: { announcements } });
}));

module.exports = router;