const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { asyncErrorCatcher } = require('../middlewares/error');
const AppError = require('../utils/AppError');

// Multer 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 게시글 목록 조회 (board_type으로 필터링)
// 예: GET /api/board?board_type=general_notice
router.get('/', requireAuth, asyncErrorCatcher(async (req, res, next) => {
    const { board_type, keyword, dept_id } = req.query;

    if (!board_type) {
        return next(new AppError('조회할 게시판 종류(board_type)를 지정해야 합니다.', 400));
    }
    
    let baseQuery = `
        SELECT 
            b.board_id, b.title, b.content, b.board_type, b.dept_id, 
            b.created_at, b.updated_at, b.file_name, 
            u.user_id as creator_id, u.login_id as creator_login_id 
        FROM tb_board b
        JOIN tb_users u ON b.creator_id = u.user_id
        WHERE b.board_type = ?
    `;
    const queryParams = [board_type];
    let conditions = "";

    if (keyword) {
        conditions += ' AND (b.title LIKE ? OR b.content LIKE ?)';
        const searchTerm = `%${keyword}%`;
        queryParams.push(searchTerm, searchTerm);
    }
    if (dept_id) {
        conditions += ' AND b.dept_id = ?';
        queryParams.push(parseInt(dept_id));
    }

    const finalQuery = baseQuery + conditions + ' ORDER BY b.created_at DESC';
    const posts = await req.db.query(finalQuery, queryParams);

    res.json({
        success: true,
        message: `'${board_type}' 게시글 목록입니다.`,
        data: { posts }
    });
}));

// 특정 게시글 상세 조회
// GET /api/board/:boardId
router.get('/:boardId', requireAuth, asyncErrorCatcher(async (req, res, next) => {
    const boardId = parseInt(req.params.boardId);

    if (isNaN(boardId)) {
        return next(new AppError('유효하지 않은 게시글 ID입니다.', 400));
    }

    const postQuery = `
        SELECT 
            b.*, 
            u.user_id as creator_id, u.login_id as creator_login_id 
        FROM tb_board b
        JOIN tb_users u ON b.creator_id = u.user_id
        WHERE b.board_id = ?
    `;
    const [post] = await req.db.query(postQuery, [boardId]);

    if (!post) {
        return next(new AppError('해당 게시글을 찾을 수 없습니다.', 404));
    }

    res.json({
        success: true,
        message: '게시글 상세 정보입니다.',
        data: { post }
    });
}));

// 새 게시글 작성 (파일 업로드 포함)
// POST /api/board
router.post('/', requireAuth, upload.single('file'), asyncErrorCatcher(async (req, res, next) => {
    const { title, content, board_type, dept_id, course_id: assignmentCourseIdInput } = req.body; // course_id를 assignmentCourseIdInput으로 받음
    const creator_id = req.user.id;
    let fileName = null;
    let filePath = null;

    if (req.file) {
        fileName = req.file.originalname;
        filePath = req.file.path;
    }

    if (!title || !content || !board_type) {
        return next(new AppError('제목, 내용, 게시판 종류는 필수입니다.', 400));
    }

    // board_type에 따른 권한 검사
    if (board_type === 'notice' && req.user.role !== 'admin') { // 일반 공지사항은 관리자만
        return next(new AppError('일반 공지사항은 관리자만 작성할 수 있습니다.', 403));
    }
    if (board_type === 'resource' && !['professor', 'admin'].includes(req.user.role)) { // 자료실은 교수 또는 관리자만
        return next(new AppError('자료실 게시글은 교수 또는 관리자만 작성할 수 있습니다.', 403));
    }
    if (board_type === 'assignment') {
        if (!['student', 'professor'].includes(req.user.role)) { // 과제는 학생 또는 교수만
            return next(new AppError('과제는 학생 또는 교수만 작성할 수 있습니다.', 403));
        }
        // 학생이 과제 제출 시, 수강 중인 강의인지 확인
        if (req.user.role === 'student') {
            if (!assignmentCourseIdInput) {
                return next(new AppError('과제 제출 시 강의 ID(course_id)는 필수입니다.', 400));
            }
            const courseIdForCheck = parseInt(assignmentCourseIdInput);
            if (isNaN(courseIdForCheck)) {
                return next(new AppError('유효하지 않은 강의 ID입니다.', 400));
            }

            const [studentInfo] = await req.db.query('SELECT student_id FROM tb_students WHERE user_id = ?', [creator_id]);
            if (!studentInfo) {
                return next(new AppError('학생 정보를 찾을 수 없습니다. (과제 제출자)', 404));
            }
            const student_id = studentInfo.student_id;

            const [enrollment] = await req.db.query(
                'SELECT enrollment_id FROM tb_enrollments WHERE student_id = ? AND course_id = ? AND status = "enrolled"',
                [student_id, courseIdForCheck]
            );
            if (!enrollment) {
                return next(new AppError('수강 중인 강의에 대해서만 과제를 제출할 수 있습니다.', 403));
            }
        }
    }


    if (dept_id && isNaN(parseInt(dept_id))) {
        return next(new AppError('학과 ID는 숫자여야 합니다.', 400));
    }

    const insertQuery = `
        INSERT INTO tb_board (
            title, content, board_type, creator_id, dept_id, file_name, file_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const queryParams = [
        title, content, board_type, creator_id, dept_id ? parseInt(dept_id) : null,
        fileName, filePath
    ];

    const result = await req.db.query(insertQuery, queryParams);
    const newBoardId = result.insertId;
    const boardTitle = title;
    const creatorRole = req.user.role;

    // 알림 생성 로직
    try {
        if (board_type === 'notice' && (creatorRole === 'admin' || creatorRole === 'professor')) { // 관리자 또는 교수가 작성한 공지사항
            const students = await req.db.query("SELECT user_id FROM tb_users WHERE role = 'student'");
            if (students.length > 0) {
                const notificationMessage = `새로운 공지사항이 등록되었습니다: ${boardTitle}`;
                const notificationLink = `/board/${newBoardId}`; // TODO: 프론트엔드 라우팅에 맞게 수정 필요
                
                const notificationPromises = students.map(student => {
                    return req.db.query(
                        'INSERT INTO tb_notifications (user_id, message, link_url) VALUES (?, ?, ?)',
                        [student.user_id, notificationMessage, notificationLink]
                    );
                });
                await Promise.all(notificationPromises);
                console.log(`[Notification] '${boardTitle}' 공지사항 알림 ${students.length}명에게 발송 완료`);
            }
        } else if (board_type === 'assignment' && creatorRole === 'professor') { 
            const assignmentCourseId = assignmentCourseIdInput ? parseInt(assignmentCourseIdInput) : null;

            if (assignmentCourseId) {
                const [courseInfo] = await req.db.query('SELECT course_name FROM tb_course WHERE course_id = ?', [assignmentCourseId]);
                const courseName = courseInfo ? courseInfo.course_name : '특정 강의'; // courseInfo가 없을 경우

                const enrolledStudents = await req.db.query(
                    `SELECT s.user_id 
                     FROM tb_enrollments e
                     JOIN tb_students s ON e.student_id = s.student_id
                     WHERE e.course_id = ? AND e.status = 'enrolled'`,
                    [assignmentCourseId]
                );

                if (enrolledStudents.length > 0) {
                    const notificationMessage = `${courseName}에 새로운 과제가 등록되었습니다: ${boardTitle}`;
                    const notificationLink = `/board/${newBoardId}`;

                    const notificationPromises = enrolledStudents.map(student => {
                        return req.db.query(
                            'INSERT INTO tb_notifications (user_id, message, link_url) VALUES (?, ?, ?)',
                            [student.user_id, notificationMessage, notificationLink]
                        );
                    });
                    await Promise.all(notificationPromises);
                    console.log(`[Notification] '${boardTitle}' 과제(${courseName}) 알림 ${enrolledStudents.length}명에게 발송 완료`);
                }
            } else { // 교수가 course_id 없이 과제를 등록한 경우, 모든 학생에게 알림
                const students = await req.db.query("SELECT user_id FROM tb_users WHERE role = 'student'");
                if (students.length > 0) {
                    const notificationMessage = `새로운 과제가 등록되었습니다: ${boardTitle}`;
                    const notificationLink = `/board/${newBoardId}`;
                    
                    const notificationPromises = students.map(student => {
                        return req.db.query(
                            'INSERT INTO tb_notifications (user_id, message, link_url) VALUES (?, ?, ?)',
                            [student.user_id, notificationMessage, notificationLink]
                        );
                    });
                    await Promise.all(notificationPromises);
                    console.log(`[Notification] '${boardTitle}' (일반)과제 알림 ${students.length}명에게 발송 완료`);
                }
                // console.log('[Notification] 교수가 과제 등록 시 course_id가 없어 특정 수강생에게 알림을 보내지 않았습니다.'); // 기존 로그 제거
            }
        }
    } catch (notificationError) {
        console.error('[Notification] 알림 생성 중 오류 발생 (게시글 등록은 성공):', notificationError);
        // 알림 실패가 주 기능의 성공/실패에 영향을 주지 않도록 처리
    }

    res.status(201).json({
        success: true,
        message: `'${board_type}' 게시글이 성공적으로 추가되었습니다.`,
        data: {
            board_id: newBoardId,
            creator_login_id: req.user.email, // 세션의 email (login_id) 사용
            file_name: fileName
        }
    });
}));

// 게시글 수정 (파일 변경 가능)
// PUT /api/board/:boardId
router.put('/:boardId', requireAuth, upload.single('file'), asyncErrorCatcher(async (req, res, next) => {
    const boardId = parseInt(req.params.boardId);
    const { title, content, board_type, dept_id, delete_existing_file } = req.body; // board_type은 수정 시 전달받지 않으면 기존 값 유지
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    if (isNaN(boardId)) {
        return next(new AppError('유효하지 않은 게시글 ID입니다.', 400));
    }

    const [existingPost] = await req.db.query('SELECT creator_id, file_path, board_type as current_board_type FROM tb_board WHERE board_id = ?', [boardId]);
    if (!existingPost) {
        return next(new AppError('수정할 게시글을 찾을 수 없습니다.', 404));
    }

    // 권한 확인: 작성자 본인 또는 관리자
    const newBoardType = board_type || existingPost.current_board_type;

    // 1. 'notice' 타입은 관리자만 수정 가능
    if (newBoardType === 'notice' && currentUserRole !== 'admin') {
         return next(new AppError('일반 공지사항은 관리자만 수정할 수 있습니다.', 403));
    }

    // 2. 'resource' 타입은 작성자 본인이거나 관리자만 수정 가능
    // 또한, 교수가 다른 교수의 글을 수정하지 못하도록 함 (관리자는 가능)
    if (newBoardType === 'resource') {
        if (currentUserRole !== 'admin' && existingPost.creator_id !== currentUserId) {
            return next(new AppError('본인이 작성한 글만 수정할 수 있습니다.', 403));
        }
    }
    // 3. 'assignment' 타입은 작성자 본인만 수정 가능 (관리자도 타인의 과제 수정 불가 - 정책에 따라 변경 가능)
    if (newBoardType === 'assignment' && existingPost.creator_id !== currentUserId) {
        return next(new AppError('본인이 작성한 과제만 수정할 수 있습니다.', 403));
    }

    const updates = [];
    const queryParams = [];
    let newFileName = existingPost.file_name; 
    let newFilePath = existingPost.file_path; 

    if (title !== undefined) { updates.push('title = ?'); queryParams.push(title); }
    if (content !== undefined) { updates.push('content = ?'); queryParams.push(content); }
    if (board_type !== undefined) { updates.push('board_type = ?'); queryParams.push(board_type); } // board_type 변경 허용
    if (dept_id !== undefined) { updates.push('dept_id = ?'); queryParams.push(dept_id ? parseInt(dept_id) : null); }

    // 파일 처리
    if (req.file) { 
        if (existingPost.file_path) {
            fs.unlink(path.join(__dirname, '..', existingPost.file_path), err => {
                if (err) console.error("기존 파일 삭제 실패(수정 시):", err);
            });
        }
        newFileName = req.file.originalname;
        newFilePath = req.file.path;
        updates.push('file_name = ?'); queryParams.push(newFileName);
        updates.push('file_path = ?'); queryParams.push(newFilePath);
    } else if (delete_existing_file === 'true' && existingPost.file_path) { 
        fs.unlink(path.join(__dirname, '..', existingPost.file_path), err => {
            if (err) console.error("기존 파일 삭제 실패(삭제 요청 시):", err);
        });
        newFileName = null;
        newFilePath = null;
        updates.push('file_name = ?'); queryParams.push(null);
        updates.push('file_path = ?'); queryParams.push(null);
    }
    
    if (updates.length === 0 && !req.file && delete_existing_file !== 'true') {
        return next(new AppError('수정할 내용이 없습니다.', 400));
    }
    
    if (updates.length > 0) { // 업데이트할 텍스트 필드가 있거나, 파일 관련 변경이 있을 때만 쿼리 실행
        queryParams.push(boardId);
        const updateQuery = `UPDATE tb_board SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE board_id = ?`;
        await req.db.query(updateQuery, queryParams);
    }


    res.json({
        success: true,
        message: '게시글이 성공적으로 수정되었습니다.',
        data: { board_id: boardId, file_name: newFileName }
    });
}));

// 게시글 삭제 (파일도 함께 삭제)
// DELETE /api/board/:boardId
router.delete('/:boardId', requireAuth, asyncErrorCatcher(async (req, res, next) => {
    const boardId = parseInt(req.params.boardId);
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    if (isNaN(boardId)) {
        return next(new AppError('유효하지 않은 게시글 ID입니다.', 400));
    }

    const [existingPost] = await req.db.query('SELECT creator_id, file_path, board_type FROM tb_board WHERE board_id = ?', [boardId]);
    if (!existingPost) {
        return next(new AppError('삭제할 게시글을 찾을 수 없습니다.', 404));
    }

    // 1. 'notice' 타입은 관리자만 삭제 가능
    if (existingPost.board_type === 'notice' && currentUserRole !== 'admin') {
         return next(new AppError('일반 공지사항은 관리자만 삭제할 수 있습니다.', 403));
    }

    // 2. 'resource' 타입은 작성자 본인이거나 관리자만 삭제 가능
    //    또한, 교수가 다른 교수의 글을 삭제하지 못하도록 함 (관리자는 가능)
    if (existingPost.board_type === 'resource') {
        if (currentUserRole !== 'admin' && existingPost.creator_id !== currentUserId) {
            return next(new AppError('본인이 작성한 글만 삭제할 수 있습니다.', 403));
        }
    }
    // 3. 'assignment' 타입은 작성자 본인만 삭제 가능
    if (existingPost.board_type === 'assignment' && existingPost.creator_id !== currentUserId) {
        return next(new AppError('본인이 작성한 과제만 삭제할 수 있습니다.', 403));
    }

    await req.db.query('DELETE FROM tb_board WHERE board_id = ?', [boardId]);

    if (existingPost.file_path) {
        fs.unlink(path.join(__dirname, '..', existingPost.file_path), err => {
            if (err) console.error("첨부 파일 삭제 실패(게시글 삭제 시):", err);
        });
    }

    res.json({
        success: true,
        message: '게시글이 성공적으로 삭제되었습니다.'
    });
}));

// 파일 다운로드 라우트
// GET /api/board/download/:boardId
router.get('/download/:boardId', requireAuth, asyncErrorCatcher(async (req, res, next) => {
    const boardId = parseInt(req.params.boardId);
    if (isNaN(boardId)) {
        return next(new AppError('유효하지 않은 게시글 ID입니다.', 400));
    }

    const [post] = await req.db.query('SELECT file_name, file_path FROM tb_board WHERE board_id = ?', [boardId]);

    if (!post || !post.file_path) {
        return next(new AppError('다운로드할 파일이 없거나 게시글을 찾을 수 없습니다.', 404));
    }

    const filePath = path.join(__dirname, '..', post.file_path);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath, post.file_name, (err) => {
            if (err) {
                console.error("파일 다운로드 중 에러:", err);
                if (!res.headersSent) {
                    next(new AppError('파일 다운로드 중 오류가 발생했습니다.', 500));
                }
            }
        });
    } else {
        return next(new AppError('서버에서 파일을 찾을 수 없습니다. 관리자에게 문의하세요.', 404));
    }
}));

module.exports = router;
