const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middlewares/auth');
const { asyncErrorCatcher } = require('../middlewares/error');
const AppError = require('../utils/AppError');

// 교수가 특정 강의의 특정 학생에게 성적 입력/수정
// POST /api/grades
router.post('/', requireAuth, requireRole('professor'), asyncErrorCatcher(async (req, res, next) => {
    const { course_id, student_id, grade } = req.body;
    const professor_id = req.user.id; // 현재 로그인한 교수 ID

    if (!course_id || !student_id || !grade) {
        return next(new AppError('강의 ID, 학생 ID, 성적은 모두 필수입니다.', 400));
    }

    // 유효한 성적 값인지 확인 (예: A+, A, A-, B+, ..., F)
    const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'P', 'NP']; // 학교 정책에 맞게 수정
    if (!validGrades.includes(grade.toUpperCase())) {
        return next(new AppError(`유효하지 않은 성적 값입니다: ${grade}`, 400));
    }

    // 해당 학생이 해당 강의에 수강 신청했는지 확인하고 enrollment_id 가져오기
    const [enrollment] = await req.db.query(
        'SELECT enrollment_id FROM tb_enrollments WHERE student_id = ? AND course_id = ? AND status = "enrolled"',
        [student_id, course_id]
    );

    if (!enrollment) {
        return next(new AppError('해당 학생은 이 강의에 수강 신청하지 않았거나 철회했습니다.', 404));
    }

    const enrollment_id = enrollment.enrollment_id;

    // 3. 이미 성적이 입력되어 있는지 확인
    const [existingGrade] = await req.db.query(
        'SELECT grade_id FROM tb_grades WHERE enrollment_id = ?',
        [enrollment_id]
    );

    let result;
    if (existingGrade) {
        // 이미 성적이 존재하면 UPDATE
        result = await req.db.query(
            'UPDATE tb_grades SET grade = ? WHERE enrollment_id = ?',
            [grade.toUpperCase(), enrollment_id]
        );
        res.json({
            success: true,
            message: '성적이 성공적으로 수정되었습니다.',
            data: { enrollment_id, grade: grade.toUpperCase() }
        });
    } else {
        // 성적이 없으면 INSERT
        result = await req.db.query(
            'INSERT INTO tb_grades (enrollment_id, grade) VALUES (?, ?)',
            [enrollment_id, grade.toUpperCase()]
        );
        res.status(201).json({
            success: true,
            message: '성적이 성공적으로 입력되었습니다.',
            data: { grade_id: result.insertId, enrollment_id, grade: grade.toUpperCase() }
        });
    }
}));

// 학생이 자신의 성적 조회
// GET /api/grades/me
router.get('/me', requireAuth, requireRole('student'), asyncErrorCatcher(async (req, res, next) => {
    const studentUserId = req.user.id; // 현재 로그인한 학생의 user_id

    // tb_users와 tb_students 테이블이 user_id로 연결되어 있다고 가정
    // 학생의 user_id를 사용하여 tb_students의 student_id를 찾습니다.
    const [student] = await req.db.query('SELECT student_id FROM tb_students WHERE user_id = ?', [studentUserId]);

    if (!student) {
        // user_id는 존재하지만 tb_students에 매핑되지 않은 경우 (예: 관리자 계정으로 잘못 접근)
        // requireRole('student')에서 이미 걸러지지만, 혹시 모를 경우를 대비
         return next(new AppError('학생 계정으로만 성적을 조회할 수 있습니다.', 403));
    }

    const student_id = student.student_id;

    // 해당 학생의 수강 신청 및 성적 정보 조회
    const grades = await req.db.query(
        `SELECT 
            e.enrollment_id, e.status as enrollment_status,
            c.course_id, c.course_code, c.course_name, c.semester, c.professor_name,
            g.grade_id, g.grade
         FROM tb_enrollments e
         JOIN tb_course c ON e.course_id = c.course_id
         LEFT JOIN tb_grades g ON e.enrollment_id = g.enrollment_id
         WHERE e.student_id = ?
         ORDER BY c.semester DESC, c.course_name ASC`,
        [student_id]
    );

    res.json({ success: true, message: '성적 조회 결과입니다.', data: { grades } });
}));

module.exports = router;
