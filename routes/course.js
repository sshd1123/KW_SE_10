const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middlewares/auth');
const { asyncErrorCatcher } = require('../middlewares/error');
const AppError = require('../utils/AppError'); // 커스텀 에러 클래스

// 강의계획서 검색
// GET /api/courses/search?keyword=...&semester=...&dept_name=...
router.get('/search', requireAuth, asyncErrorCatcher(async (req, res) => {
    const { keyword, semester, dept_name } = req.query;
    
    let baseQuery = `
        SELECT 
            c.course_id, c.course_code, c.course_name, c.professor_name, 
            c.semester, c.dept_name, c.course_type, c.credits, c.hours, 
            c.lecture_time, c.remarks
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
// GET /api/courses/:courseId
router.get('/:courseId', requireAuth, asyncErrorCatcher(async (req, res, next) => {
    const { courseId } = req.params;
    if (isNaN(parseInt(courseId))) {
        return next(new AppError('유효하지 않은 강의 ID입니다.', 400));
    }

    const courseQuery = `SELECT * FROM tb_course WHERE course_id = ?`; // 테이블명 tb_course로 수정
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
        course_code, course_name, semester, dept_name,
        course_type, credits, hours, lecture_time, remarks,
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

    // 담당 교수 이름은 현재 로그인한 사용자 정보에서 가져옴
    // 관리자의 경우 별도로 교수명을 입력받을 수 있도록 수정
    let professor_name;
    if (req.user.role === 'admin' && req.body.professor_name) {
      professor_name = req.body.professor_name;
    } else {
      professor_name = req.user.name && req.user.name ? req.user.name : null;
    }

    const insertQuery = `
        INSERT INTO tb_course (
            course_code, course_name, professor_name, semester, dept_name,
            course_type, credits, hours, lecture_time, remarks
            -- dept_id, college_id 등
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const queryParams = [
        course_code, course_name, professor_name, semester, dept_name || null,
        course_type || null, credits ? parseInt(credits) : null, hours ? parseInt(hours) : null,
        lecture_time || null, remarks || null
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

    // 관련 데이터 정리 (필요시)
    // TODO: 강의 삭제 시 관련 공지사항, 수강신청 등도 함께 처리할지 결정
    
    // 강의 삭제
    const result = await req.db.query('DELETE FROM tb_course WHERE course_id = ?', [courseId]);

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
    if (req.user.role !== 'admin' && 
        req.user.role !== 'professor') {
        return next(new AppError('강의를 수정할 권한이 없습니다.', 403));
    }

    // 교수의 경우 본인 강의만 수정 가능 (TODO: 실제 교수 매칭 로직 구현 필요)
    if (req.user.role === 'professor' && 
        existingCourse.professor_name !== req.user.name) {
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

// --- 강의 공지사항 관련 API ---

// 특정 강의의 모든 공지사항 조회 (학생, 교수 모두 가능)
// TODO: tb_course_announcement 테이블 생성
// GET /api/courses/:courseId/announcements
router.get('/:courseId/announcements', requireAuth, asyncErrorCatcher(async (req, res, next) => {
    const { courseId } = req.params;
    if (isNaN(parseInt(courseId))) {
        return next(new AppError('유효하지 않은 강의 ID입니다.', 400));
    }

    // 해당 강의가 존재하는지 확인
    const [courseExists] = await req.db.query('SELECT course_id FROM tb_course WHERE course_id = ?', [courseId]);
    if (!courseExists) {
        return next(new AppError('해당 강의를 찾을 수 없습니다.', 404));
    }

    const announcements = await req.db.query(
        `SELECT ca.*, u.username as professor_name 
         FROM tb_course_announcements ca
         JOIN tb_users u ON ca.professor_id = u.user_id
         WHERE ca.course_id = ? 
         ORDER BY ca.created_at DESC`,
        [courseId]
    );

    res.json({
        success: true,
        message: '강의 공지사항 목록입니다.',
        data: { announcements }
    });
}));

// 강의 공지사항 작성 (교수만 가능)
// POST /api/courses/:courseId/announcements
router.post('/:courseId/announcements', requireAuth, requireRole('professor'), asyncErrorCatcher(async (req, res, next) => {
    const { courseId } = req.params;
    const { title, content } = req.body;
    const professorId = req.user.id;

    if (isNaN(parseInt(courseId))) {
        return next(new AppError('유효하지 않은 강의 ID입니다.', 400));
    }
    if (!title || !content) {
        return next(new AppError('제목과 내용은 필수 입력 항목입니다.', 400));
    }

    // 해당 강의가 존재하는지 확인
    const [courseExists] = await req.db.query('SELECT course_id FROM tb_course WHERE course_id = ?', [courseId]);
    if (!courseExists) {
        return next(new AppError('공지사항을 작성할 강의를 찾을 수 없습니다.', 404));
    }

    const result = await req.db.query(
        'INSERT INTO tb_course_announcements (course_id, professor_id, title, content) VALUES (?, ?, ?, ?)',
        [courseId, professorId, title, content]
    );

    res.status(201).json({
        success: true,
        message: '강의 공지사항이 성공적으로 작성되었습니다.',
        data: { announcement_id: result.insertId }
    });
}));

module.exports = router;