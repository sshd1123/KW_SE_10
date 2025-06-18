const { query, transaction } = require('../config/database');

class Board {
  // 게시글 생성 (학사공지사항)
  static async createNotice(boardData) {
    const { title, content, creator_id, dept_id = null, is_important = false } = boardData;
    
    // 중요 공지사항인 경우 제목에 [중요] 표시 추가
    const finalTitle = is_important ? `[중요] ${title}` : title;
    
    const sql = `
      INSERT INTO tb_board (title, content, board_type, creator_id, dept_id, created_at, updated_at) 
      VALUES (?, ?, 'notice', ?, ?, NOW(), NOW())
    `;
    
    const result = await query(sql, [finalTitle, content, creator_id, dept_id]);
    return result.insertId;
  }

  // 모든 학사공지사항 조회 (페이징 지원) - 안전한 버전
  static async findAllNotices(page = 1, limit = 10, searchKeyword = '', deptId = null) {
    try {
      const offset = (page - 1) * limit;
      
      // 기본 공지사항 정보만 조회 (안전한 쿼리)
      let sql = `
        SELECT 
          board_id,
          title,
          content,
          creator_id,
          dept_id,
          created_at,
          updated_at
        FROM tb_board 
        WHERE board_type = 'notice'
      `;
      let params = [];
      
      // 검색 조건 추가
      if (searchKeyword) {
        sql += ` AND (title LIKE ? OR content LIKE ?)`;
        params.push(`%${searchKeyword}%`, `%${searchKeyword}%`);
      }
      
      // 학과 필터 추가
      if (deptId) {
        sql += ` AND (dept_id = ? OR dept_id IS NULL)`;
        params.push(deptId);
      }
      
      // 중요 공지사항을 먼저 정렬
      sql += ` ORDER BY 
        CASE WHEN title LIKE '[중요]%' THEN 0 ELSE 1 END, 
        created_at DESC 
        LIMIT ${limit} OFFSET ${offset}`;
      // params.push(limit, offset); // 직접 값 삽입으로 변경
      
      const notices = await query(sql, params);
      
      // 전체 개수 조회
      let countSql = `SELECT COUNT(*) as total FROM tb_board WHERE board_type = 'notice'`;
      let countParams = [];
      
      if (searchKeyword) {
        countSql += ` AND (title LIKE ? OR content LIKE ?)`;
        countParams.push(`%${searchKeyword}%`, `%${searchKeyword}%`);
      }
      
      if (deptId) {
        countSql += ` AND (dept_id = ? OR dept_id IS NULL)`;
        countParams.push(deptId);
      }
      
      const [{ total }] = await query(countSql, countParams);
      
      // 작성자 정보와 학과 정보를 안전하게 추가
      const processedNotices = await Promise.all(notices.map(async (notice) => {
        let author_name = '알 수 없음';
        let author_email = '';
        let department_name = '';
        
        // 작성자 정보 조회 (안전하게)
        try {
          if (notice.creator_id) {
            const [author] = await query('SELECT login_id FROM tb_users WHERE user_id = ?', [notice.creator_id]);
            if (author) {
              author_name = author.login_id || '알 수 없음';
              author_email = author.login_id || '';
            }
          }
        } catch (error) {
          console.log('작성자 정보 조회 실패:', error.message);
        }
        
        // 학과 정보 조회 (안전하게)
        try {
          if (notice.dept_id) {
            const [dept] = await query('SELECT department_name FROM tb_departments WHERE dept_id = ?', [notice.dept_id]);
            if (dept) {
              department_name = dept.department_name || '';
            }
          }
        } catch (error) {
          console.log('학과 정보 조회 실패:', error.message);
        }
        
        return {
          ...notice,
          author_name,
          author_email,
          department_name,
          is_important: notice.title.startsWith('[중요]'),
          original_title: notice.title.replace(/^\[중요\]\s*/, '')
        };
      }));
      
      return { notices: processedNotices, total };
    } catch (error) {
      console.error('공지사항 조회 오류:', error);
      throw error;
    }
  }

  // ID로 학사공지사항 찾기
  static async findNoticeById(id) {
    const sql = `
      SELECT b.*, u.username as author_name, u.login_id as author_email, d.department_name
      FROM tb_board b
      LEFT JOIN tb_users u ON b.creator_id = u.user_id
      LEFT JOIN tb_departments d ON b.dept_id = d.dept_id
      WHERE b.board_id = ? AND b.board_type = 'notice'
    `;
    const notices = await query(sql, [id]);
    
    if (notices[0]) {
      const notice = notices[0];
      return {
        ...notice,
        is_important: notice.title.startsWith('[중요]'),
        original_title: notice.title.replace(/^\[중요\]\s*/, '')
      };
    }
    
    return null;
  }

  // 학사공지사항 수정
  static async updateNotice(id, updateData) {
    const { title, content, is_important, dept_id } = updateData;
    
    // 중요 공지사항 처리
    const finalTitle = is_important ? `[중요] ${title}` : title;
    
    const sql = `
      UPDATE tb_board 
      SET title = ?, content = ?, dept_id = ?, updated_at = NOW()
      WHERE board_id = ? AND board_type = 'notice'
    `;
    
    const result = await query(sql, [finalTitle, content, dept_id, id]);
    return result.affectedRows > 0;
  }

  // 학사공지사항 삭제
  static async deleteNotice(id) {
    const sql = 'DELETE FROM tb_board WHERE board_id = ? AND board_type = "notice"';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }

  // 중요 공지사항 조회
  static async findImportantNotices(deptId = null) {
    let sql = `
      SELECT b.*, u.username as author_name, d.department_name
      FROM tb_board b
      LEFT JOIN tb_users u ON b.creator_id = u.user_id
      LEFT JOIN tb_departments d ON b.dept_id = d.dept_id
      WHERE b.board_type = 'notice' AND b.title LIKE '[중요]%'
    `;
    let params = [];
    
    if (deptId) {
      sql += ` AND (b.dept_id = ? OR b.dept_id IS NULL)`;
      params.push(deptId);
    }
    
    sql += ` ORDER BY b.created_at DESC`;
    
    const notices = await query(sql, params);
    
    return notices.map(notice => ({
      ...notice,
      is_important: true,
      original_title: notice.title.replace(/^\[중요\]\s*/, '')
    }));
  }

  // 학과별 공지사항 조회
  static async findNoticesByDept(deptId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT b.*, u.username as author_name, d.department_name
      FROM tb_board b
      LEFT JOIN tb_users u ON b.creator_id = u.user_id
      LEFT JOIN tb_departments d ON b.dept_id = d.dept_id
      WHERE b.board_type = 'notice' AND (b.dept_id = ? OR b.dept_id IS NULL)
      ORDER BY 
        CASE WHEN b.title LIKE '[중요]%' THEN 0 ELSE 1 END,
        b.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const notices = await query(sql, [deptId]);
    
    return notices.map(notice => ({
      ...notice,
      is_important: notice.title.startsWith('[중요]'),
      original_title: notice.title.replace(/^\[중요\]\s*/, '')
    }));
  }

  // 전체 학사공지사항 (학과 구분 없이)
  static async findGlobalNotices(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT b.*, u.username as author_name
      FROM tb_board b
      LEFT JOIN tb_users u ON b.creator_id = u.user_id
      WHERE b.board_type = 'notice' AND b.dept_id IS NULL
      ORDER BY 
        CASE WHEN b.title LIKE '[중요]%' THEN 0 ELSE 1 END,
        b.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const notices = await query(sql, []);
    
    return notices.map(notice => ({
      ...notice,
      is_important: notice.title.startsWith('[중요]'),
      original_title: notice.title.replace(/^\[중요\]\s*/, '')
    }));
  }
}

module.exports = Board; 