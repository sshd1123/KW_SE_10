const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const { asyncErrorCatcher } = require('../middlewares/error');
const AppError = require('../utils/AppError');
const Board = require('../models/Board');

// ============= 학사공지사항 관리 =============

// 모든 학사공지사항 조회 (관리자만)
router.get('/announcements', requireAuth, requireAdmin, asyncErrorCatcher(async (req, res) => {
  const { page = 1, limit = 10, search = '', dept_id = null } = req.query;
  
  const result = await Board.findAllNotices(
    parseInt(page), 
    parseInt(limit), 
    search,
    dept_id ? parseInt(dept_id) : null
  );
  
  res.json({
    success: true,
    message: '학사공지사항 목록 조회 성공',
    data: {
      announcements: result.notices,
      pagination: {
        current_page: parseInt(page),
        total_items: result.total,
        total_pages: Math.ceil(result.total / parseInt(limit)),
        limit: parseInt(limit)
      }
    }
  });
}));

// 특정 학사공지사항 조회 (관리자만)
router.get('/announcements/:id', requireAuth, requireAdmin, asyncErrorCatcher(async (req, res, next) => {
  const boardId = parseInt(req.params.id);
  
  if (isNaN(boardId)) {
    return next(new AppError('유효하지 않은 공지사항 ID입니다.', 400));
  }
  
  const announcement = await Board.findNoticeById(boardId);
  
  if (!announcement) {
    return next(new AppError('공지사항을 찾을 수 없습니다.', 404));
  }
  
  res.json({
    success: true,
    message: '학사공지사항 조회 성공',
    data: { announcement }
  });
}));

// 학사공지사항 생성 (관리자만)
router.post('/announcements', requireAuth, requireAdmin, asyncErrorCatcher(async (req, res, next) => {
  const { title, content, is_important = false, dept_id = null } = req.body;
  const creator_id = req.user.id;
  
  if (!title || !content) {
    return next(new AppError('제목과 내용은 필수 입력 항목입니다.', 400));
  }
  
  const boardId = await Board.createNotice({
    title,
    content,
    creator_id,
    dept_id: dept_id ? parseInt(dept_id) : null,
    is_important: Boolean(is_important)
  });
  
  res.status(201).json({
    success: true,
    message: '학사공지사항이 성공적으로 생성되었습니다.',
    data: { board_id: boardId }
  });
}));

// 학사공지사항 수정 (관리자만)
router.put('/announcements/:id', requireAuth, requireAdmin, asyncErrorCatcher(async (req, res, next) => {
  const boardId = parseInt(req.params.id);
  const { title, content, is_important, dept_id } = req.body;
  
  if (isNaN(boardId)) {
    return next(new AppError('유효하지 않은 공지사항 ID입니다.', 400));
  }
  
  if (!title || !content) {
    return next(new AppError('제목과 내용은 필수 입력 항목입니다.', 400));
  }
  
  const success = await Board.updateNotice(boardId, {
    title,
    content,
    is_important: Boolean(is_important),
    dept_id: dept_id ? parseInt(dept_id) : null
  });
  
  if (!success) {
    return next(new AppError('공지사항을 찾을 수 없습니다.', 404));
  }
  
  res.json({
    success: true,
    message: '학사공지사항이 성공적으로 수정되었습니다.'
  });
}));

// 학사공지사항 삭제 (관리자만)
router.delete('/announcements/:id', requireAuth, requireAdmin, asyncErrorCatcher(async (req, res, next) => {
  const boardId = parseInt(req.params.id);
  
  if (isNaN(boardId)) {
    return next(new AppError('유효하지 않은 공지사항 ID입니다.', 400));
  }
  
  const success = await Board.deleteNotice(boardId);
  
  if (!success) {
    return next(new AppError('공지사항을 찾을 수 없습니다.', 404));
  }
  
  res.json({
    success: true,
    message: '학사공지사항이 성공적으로 삭제되었습니다.'
  });
}));

// ============= 사용자 관리 =============

// 모든 사용자 목록 조회 (테이블 구조 자동 감지, 관리자만)
router.get('/users', requireAuth, requireAdmin, asyncErrorCatcher(async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // 먼저 tb_users 테이블 구조 확인
    let tableStructure = [];
    try {
      tableStructure = await req.db.query(`DESCRIBE tb_users`);
      console.log('tb_users 테이블 구조:', tableStructure.map(col => col.Field));
    } catch (error) {
      console.error('테이블 구조 확인 실패:', error.message);
      return res.status(500).json({
        success: false,
        message: 'tb_users 테이블에 접근할 수 없습니다.',
        error: error.message
      });
    }
    
    // 사용 가능한 컬럼 확인
    const columns = tableStructure.map(col => col.Field);
    const nameColumn = columns.includes('username') ? 'username' : 
                     columns.includes('name') ? 'name' :
                     columns.includes('user_name') ? 'user_name' : 'login_id';
    
    // 기본 사용자 정보만 조회 (동적 컬럼 사용)
    let selectColumns = ['user_id', 'login_id'];
    if (columns.includes(nameColumn) && nameColumn !== 'login_id') {
      selectColumns.push(`${nameColumn} as username`);
    }
    if (columns.includes('role')) selectColumns.push('role');
    if (columns.includes('is_approved')) selectColumns.push('is_approved');
    if (columns.includes('created_at')) selectColumns.push('created_at');
    if (columns.includes('updated_at')) selectColumns.push('updated_at');
    
    let sql = `SELECT ${selectColumns.join(', ')} FROM tb_users WHERE 1=1`;
    let params = [];
    
    // 검색 조건 추가
    if (search) {
      sql += ` AND (login_id LIKE ? OR ${nameColumn} LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // 역할 필터 추가
    if (role && columns.includes('role')) {
      sql += ` AND role = ?`;
      params.push(role);
    }
    
    sql += ` ORDER BY ${columns.includes('created_at') ? 'created_at' : 'user_id'} DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const users = await req.db.query(sql, params);
    
    // 전체 개수 조회
    let countSql = `SELECT COUNT(*) as total FROM tb_users WHERE 1=1`;
    let countParams = [];
    
    if (search) {
      countSql += ` AND (login_id LIKE ? OR ${nameColumn} LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (role && columns.includes('role')) {
      countSql += ` AND role = ?`;
      countParams.push(role);
    }
    
    const [{ total }] = await req.db.query(countSql, countParams);
    
    // 학과 목록 조회 (안전하게)
    let departments = [];
    try {
      // 먼저 tb_departments 테이블 구조 확인
      const deptStructure = await req.db.query(`DESCRIBE tb_departments`);
      const deptColumns = deptStructure.map(col => col.Field);
      
      const nameCol = deptColumns.includes('department_name') ? 'department_name' :
                     deptColumns.includes('dept_name') ? 'dept_name' :
                     deptColumns.includes('name') ? 'name' : 'dept_id';
      
      departments = await req.db.query(`
        SELECT dept_id, ${nameCol} as department_name FROM tb_departments ORDER BY ${nameCol}
      `);
    } catch (error) {
      console.log('tb_departments 테이블 조회 실패:', error.message);
      departments = [];
    }
    
    res.json({
      success: true,
      message: '사용자 목록 조회 성공',
      data: {
        users,
        departments,
        table_info: {
          available_columns: columns,
          name_column_used: nameColumn
        },
        pagination: {
          current_page: parseInt(page),
          total_items: total,
          total_pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 목록 조회 실패',
      error: error.message,
      sql_details: error.sql || '쿼리 정보 없음'
    });
  }
}));

// 사용자 강제 탈퇴 (관련 데이터 포함, 관리자만)
router.delete('/users/:id', requireAuth, requireAdmin, asyncErrorCatcher(async (req, res, next) => {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return next(new AppError('유효하지 않은 사용자 ID입니다.', 400));
  }
  
  // 본인 계정은 삭제할 수 없음
  if (req.user.id === userId) {
    return next(new AppError('본인 계정은 삭제할 수 없습니다.', 400));
  }
  
  // 사용자 존재 여부 확인 (안전한 쿼리)
  const [existingUser] = await req.db.query(`
    SELECT user_id, login_id, role FROM tb_users WHERE user_id = ?
  `, [userId]);
  
  if (!existingUser) {
    return next(new AppError('존재하지 않는 사용자입니다.', 404));
  }
  
  // 트랜잭션 헬퍼 함수 사용
  const { transaction } = require('../config/database');
  
  try {
    const result = await transaction(async (connection) => {
      let deletedTables = [];
      
      // 학생 정보가 있는지 확인 (안전하게)
      let studentId = null;
      try {
        const [student] = await connection.execute(
          'SELECT student_id FROM tb_students WHERE user_id = ?', 
          [userId]
        );
        if (student) {
          studentId = student.student_id;
        }
      } catch (error) {
        console.log('tb_students 테이블 조회 실패:', error.message);
      }
      
      // 학생인 경우 관련 데이터 삭제 (안전하게)
      if (studentId) {
        // 1. 졸업 진도 삭제
        try {
          await connection.execute('DELETE FROM tb_graduation_progress WHERE student_id = ?', [studentId]);
          deletedTables.push('tb_graduation_progress');
        } catch (error) {
          console.log('tb_graduation_progress 삭제 실패:', error.message);
        }
        
        // 2. 수강 신청 삭제
        try {
          await connection.execute('DELETE FROM tb_enrollments WHERE student_id = ?', [studentId]);
          deletedTables.push('tb_enrollments');
        } catch (error) {
          console.log('tb_enrollments 삭제 실패:', error.message);
        }
        
        // 3. 학생 정보 삭제
        try {
          await connection.execute('DELETE FROM tb_students WHERE student_id = ?', [studentId]);
          deletedTables.push('tb_students');
        } catch (error) {
          console.log('tb_students 삭제 실패:', error.message);
        }
      }
      
      // 4. 사용자 삭제 (필수)
      await connection.execute('DELETE FROM tb_users WHERE user_id = ?', [userId]);
      deletedTables.push('tb_users');
      
      return { deletedTables, studentId };
    });
    
    res.json({
      success: true,
      message: `사용자 '${existingUser.login_id}'가 관련 데이터와 함께 성공적으로 삭제되었습니다.`,
      data: {
        deleted_user_id: userId,
        deleted_user_login_id: existingUser.login_id,
        deleted_student_id: result.studentId,
        deleted_from_tables: result.deletedTables
      }
    });
  } catch (error) {
    console.error('사용자 삭제 중 오류:', error);
    return next(new AppError('사용자 삭제 중 오류가 발생했습니다.', 500));
  }
}));

// 사용자 역할 변경 (관리자만)
router.patch('/users/:id/role', requireAuth, requireAdmin, asyncErrorCatcher(async (req, res, next) => {
  const userId = parseInt(req.params.id);
  const { role } = req.body;
  
  if (isNaN(userId)) {
    return next(new AppError('유효하지 않은 사용자 ID입니다.', 400));
  }
  
  // 허용된 역할인지 확인
  const allowedRoles = ['student', 'professor', 'admin'];
  if (!allowedRoles.includes(role)) {
    return next(new AppError('유효하지 않은 역할입니다. (student, professor, admin)', 400));
  }
  
  // 본인의 역할은 변경할 수 없음
  if (req.user.id === userId) {
    return next(new AppError('본인의 역할은 변경할 수 없습니다.', 400));
  }
  
  // 사용자 존재 여부 확인
  const [existingUser] = await req.db.query(
    'SELECT user_id, login_id, role FROM tb_users WHERE user_id = ?', 
    [userId]
  );
  
  if (!existingUser) {
    return next(new AppError('존재하지 않는 사용자입니다.', 404));
  }
  
  // 역할 변경
  await req.db.query('UPDATE tb_users SET role = ? WHERE user_id = ?', [role, userId]);
  
  res.json({
    success: true,
    message: `사용자 '${existingUser.login_id}'의 역할이 '${existingUser.role}'에서 '${role}'로 변경되었습니다.`,
    data: {
      user_id: userId,
      old_role: existingUser.role,
      new_role: role
    }
  });
}));

// ============= 졸업 요건 관리 =============

// 졸업 조건 목록 조회 (관리자만)
router.get('/graduation-conditions', requireAuth, requireAdmin, asyncErrorCatcher(async (req, res) => {
  const { dept_id } = req.query;
  
  let sql = `
    SELECT 
      gc.condition_id,
      gc.condition_name,
      gc.condition_type,
      gc.description,
      gc.is_active,
      d.department_name,
      d.dept_id,
      COUNT(gp.student_id) as total_students,
      SUM(CASE WHEN gp.is_met = TRUE THEN 1 ELSE 0 END) as completed_students
    FROM tb_graduation_conditions gc
    LEFT JOIN tb_departments d ON gc.dept_id = d.dept_id
    LEFT JOIN tb_graduation_progress gp ON gc.condition_id = gp.condition_id
  `;
  
  let params = [];
  if (dept_id) {
    sql += ` WHERE gc.dept_id = ?`;
    params.push(dept_id);
  }
  
  sql += ` GROUP BY gc.condition_id ORDER BY d.department_name, gc.condition_name`;
  
  const conditions = await req.db.query(sql, params);
  
  // 학과 목록
  const departments = await req.db.query(`
    SELECT dept_id, department_name FROM tb_departments ORDER BY department_name
  `);
  
  res.json({
    success: true,
    message: '졸업 조건 목록 조회 성공',
    data: {
      conditions,
      departments
    }
  });
}));

// 졸업 조건 생성 (관리자만)
router.post('/graduation-conditions', requireAuth, requireAdmin, asyncErrorCatcher(async (req, res, next) => {
  const { condition_name, condition_type, description, dept_id, is_active = true } = req.body;
  
  if (!condition_name || !condition_type || !dept_id) {
    return next(new AppError('졸업 조건명, 조건 유형, 학과는 필수 입력 항목입니다.', 400));
  }
  
  const validTypes = ['credit', 'non_credit'];
  if (!validTypes.includes(condition_type)) {
    return next(new AppError('유효하지 않은 조건 유형입니다. (credit, non_credit)', 400));
  }
  
  // 졸업 조건 생성
  const result = await req.db.query(`
    INSERT INTO tb_graduation_conditions (condition_name, condition_type, description, dept_id, is_active)
    VALUES (?, ?, ?, ?, ?)
  `, [condition_name, condition_type, description, dept_id, is_active]);
  
  res.status(201).json({
    success: true,
    message: '졸업 조건이 성공적으로 생성되었습니다.',
    data: {
      condition_id: result.insertId,
      condition_name,
      condition_type,
      dept_id
    }
  });
}));

// 졸업 요건 목록 조회 (관리자만)
router.get('/graduation-requirements', requireAuth, requireAdmin, asyncErrorCatcher(async (req, res) => {
  const { condition_id, dept_id } = req.query;
  
  let sql = `
    SELECT 
      gr.requirement_id,
      gr.condition_id,
      gr.required_credits,
      gr.course_category,
      gr.specific_course_id,
      gc.condition_name,
      gc.condition_type,
      d.department_name,
      c.course_name,
      c.course_code
    FROM tb_graduation_requirements gr
    LEFT JOIN tb_graduation_conditions gc ON gr.condition_id = gc.condition_id
    LEFT JOIN tb_departments d ON gc.dept_id = d.dept_id
    LEFT JOIN tb_course c ON gr.specific_course_id = c.course_id
    WHERE 1=1
  `;
  
  let params = [];
  if (condition_id) {
    sql += ` AND gr.condition_id = ?`;
    params.push(condition_id);
  }
  
  if (dept_id) {
    sql += ` AND gc.dept_id = ?`;
    params.push(dept_id);
  }
  
  sql += ` ORDER BY d.department_name, gc.condition_name, gr.course_category`;
  
  const requirements = await req.db.query(sql, params);
  
  res.json({
    success: true,
    message: '졸업 요건 목록 조회 성공',
    data: {
      requirements
    }
  });
}));

// 학생 졸업 진도 조회 (관리자만)
router.get('/graduation-progress/:student_id', requireAuth, requireAdmin, asyncErrorCatcher(async (req, res, next) => {
  const student_id = req.params.student_id;
  
  if (!student_id) {
    return next(new AppError('학생 ID가 필요합니다.', 400));
  }
  
  // 학생 기본 정보
  const [student] = await req.db.query(`
    SELECT 
      s.student_id,
      s.admission_year,
      s.grade,
      u.username,
      d.department_name
    FROM tb_students s
    JOIN tb_users u ON s.user_id = u.user_id
    JOIN tb_departments d ON s.dept_id = d.dept_id
    WHERE s.student_id = ?
  `, [student_id]);
  
  if (!student) {
    return next(new AppError('학생을 찾을 수 없습니다.', 404));
  }
  
  // 졸업 진도 조회
  const progress = await req.db.query(`
    SELECT 
      gp.condition_id,
      gp.is_met,
      gp.completion_date,
      gp.notes,
      gc.condition_name,
      gc.condition_type,
      gc.description
    FROM tb_graduation_progress gp
    JOIN tb_graduation_conditions gc ON gp.condition_id = gc.condition_id
    WHERE gp.student_id = ?
    ORDER BY gc.condition_type, gc.condition_name
  `, [student_id]);
  
  // 학점 이수 현황 (학점 조건에 대해)
  const creditStatus = await req.db.query(`
    SELECT 
      gc.condition_id,
      gc.condition_name,
      SUM(c.credits) as earned_credits,
      gr.required_credits,
      gr.course_category
    FROM tb_graduation_conditions gc
    JOIN tb_graduation_requirements gr ON gc.condition_id = gr.condition_id
    LEFT JOIN tb_enrollments e ON e.student_id = ?
    LEFT JOIN tb_course c ON e.course_id = c.course_id AND 
      (gr.course_category IS NULL OR c.course_category = gr.course_category)
    WHERE gc.condition_type = 'credit'
    GROUP BY gc.condition_id, gr.requirement_id
  `, [student_id]);
  
  res.json({
    success: true,
    message: '학생 졸업 진도 조회 성공',
    data: {
      student,
      progress,
      credit_status: creditStatus
    }
  });
}));

// 학생 졸업 진도 업데이트 (관리자만)
router.patch('/graduation-progress/:student_id/:condition_id', requireAuth, requireAdmin, asyncErrorCatcher(async (req, res, next) => {
  const { student_id, condition_id } = req.params;
  const { is_met, notes } = req.body;
  
  if (!student_id || !condition_id) {
    return next(new AppError('학생 ID와 조건 ID가 필요합니다.', 400));
  }
  
  // 졸업 진도 업데이트
  const result = await req.db.query(`
    UPDATE tb_graduation_progress 
    SET 
      is_met = ?, 
      completion_date = CASE WHEN ? = TRUE THEN NOW() ELSE NULL END,
      notes = ?,
      updated_at = NOW()
    WHERE student_id = ? AND condition_id = ?
  `, [is_met, is_met, notes, student_id, condition_id]);
  
  if (result.affectedRows === 0) {
    return next(new AppError('해당 졸업 진도 정보를 찾을 수 없습니다.', 404));
  }
  
  res.json({
    success: true,
    message: '졸업 진도가 성공적으로 업데이트되었습니다.',
    data: {
      student_id,
      condition_id,
      is_met,
      notes
    }
  });
}));

// ============= 시스템 통계 =============

// 관리자 대시보드 통계 (관리자만)
router.get('/dashboard', requireAuth, requireAdmin, asyncErrorCatcher(async (req, res) => {
  try {
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
      const [users] = await req.db.query(`
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
      const [students] = await req.db.query(`SELECT COUNT(*) as total_students FROM tb_students`);
      stats.students = { ...stats.students, ...students };
      
      // 수강 중인 학생 수
      const [enrolled] = await req.db.query(`
        SELECT COUNT(DISTINCT student_id) as enrolled_students FROM tb_enrollments
      `);
      stats.students.enrolled_students = enrolled.enrolled_students || 0;
    } catch (error) {
      console.log('tb_students 조회 실패:', error.message);
    }

    // 3. 강의 통계
    try {
      const [courses] = await req.db.query(`SELECT COUNT(*) as total_courses FROM tb_course`);
      stats.courses = { ...stats.courses, ...courses };
      
      // 현재 학기 강의 수
      const currentYear = new Date().getFullYear();
      const [active] = await req.db.query(`
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
      const [announcements] = await req.db.query(`
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

    // 5. 졸업 요건 통계
    try {
      const [conditions] = await req.db.query(`SELECT COUNT(*) as total_conditions FROM tb_graduation_conditions`);
      stats.graduation.total_conditions = conditions.total_conditions || 0;
      
      const [requirements] = await req.db.query(`SELECT COUNT(*) as total_requirements FROM tb_graduation_requirements`);
      stats.graduation.total_requirements = requirements.total_requirements || 0;
    } catch (error) {
      console.log('졸업 요건 테이블 조회 실패:', error.message);
    }

    // 6. 학과 통계
    try {
      const [departments] = await req.db.query(`SELECT COUNT(*) as total_departments FROM tb_departments`);
      stats.departments = { ...stats.departments, ...departments };
    } catch (error) {
      console.log('tb_departments 조회 실패:', error.message);
    }

    // 7. 테이블 존재 여부 확인
    const tableInfo = {};
    const tables = ['tb_users', 'tb_students', 'tb_course', 'tb_board', 'tb_departments', 
                   'tb_graduation_conditions', 'tb_graduation_requirements', 'tb_enrollments'];
    
    for (const table of tables) {
      try {
        await req.db.query(`SELECT 1 FROM ${table} LIMIT 1`);
        tableInfo[table] = 'EXISTS';
      } catch {
        tableInfo[table] = 'NOT_EXISTS';
      }
    }

    res.json({
      success: true,
      message: '관리자 대시보드 통계',
      data: {
        ...stats,
        table_status: tableInfo,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('대시보드 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '대시보드 통계 조회 실패',
      error: error.message
    });
  }
}));

module.exports = router; 