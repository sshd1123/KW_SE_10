require('dotenv').config();
const bcrypt = require('bcrypt');
const { query } = require('./config/database');

async function fixAdminPassword() {
    try {
        // 비밀번호 해싱
        const plainPassword = 'admin123';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        
        console.log('원본 비밀번호:', plainPassword);
        console.log('해싱된 비밀번호:', hashedPassword);
        
        console.log('데이터베이스에 연결중...');
        
        // 현재 admin 계정 확인
        const users = await query(
            'SELECT user_id, login_id, password_hash, role FROM tb_users WHERE login_id = ?',
            ['admin@example.com']
        );
        
        if (users.length > 0) {
            console.log('기존 admin 계정 발견:', {
                user_id: users[0].user_id,
                login_id: users[0].login_id,
                current_password_hash: users[0].password_hash,
                role: users[0].role
            });
            
            // 비밀번호가 이미 해싱되어 있는지 확인
            if (users[0].password_hash.startsWith('$2b$') || users[0].password_hash.startsWith('$2a$')) {
                console.log('⚠️ 비밀번호가 이미 bcrypt로 해싱되어 있습니다.');
                
                // 기존 해시와 비교 테스트
                const isCurrentValid = await bcrypt.compare(plainPassword, users[0].password_hash);
                console.log('🔍 현재 비밀번호 검증:', isCurrentValid ? '✅ admin123으로 로그인 가능' : '❌ admin123으로 로그인 불가');
                
                if (!isCurrentValid) {
                    console.log('현재 비밀번호를 admin123으로 변경합니다...');
                    // 비밀번호 업데이트
                    await query(
                        'UPDATE tb_users SET password_hash = ? WHERE login_id = ?',
                        [hashedPassword, 'admin@example.com']
                    );
                    console.log('✅ admin 계정의 비밀번호가 admin123으로 업데이트되었습니다.');
                }
            } else {
                console.log('🔄 평문 비밀번호를 해싱합니다...');
                // 비밀번호 업데이트
                await query(
                    'UPDATE tb_users SET password_hash = ? WHERE login_id = ?',
                    [hashedPassword, 'admin@example.com']
                );
                console.log('✅ admin 계정의 비밀번호가 해싱되어 업데이트되었습니다.');
            }
            
            // 업데이트 확인
            const updatedUsers = await query(
                'SELECT user_id, login_id, password_hash, role FROM tb_users WHERE login_id = ?',
                ['admin@example.com']
            );
            
            console.log('최종 admin 계정 상태:', {
                user_id: updatedUsers[0].user_id,
                login_id: updatedUsers[0].login_id,
                password_hash_length: updatedUsers[0].password_hash.length,
                password_hash_prefix: updatedUsers[0].password_hash.substring(0, 10) + '...',
                role: updatedUsers[0].role
            });
            
        } else {
            console.log('❌ admin@example.com 계정이 없습니다. 새로 생성합니다.');
            
            // 새 admin 계정 생성
            const result = await query(
                'INSERT INTO tb_users (login_id, password_hash, role) VALUES (?, ?, ?)',
                ['admin@example.com', hashedPassword, 'admin']
            );
            
            console.log('✅ 새 admin 계정이 생성되었습니다. ID:', result.insertId);
        }
        
        // bcrypt 검증 테스트
        const isValid = await bcrypt.compare(plainPassword, hashedPassword);
        console.log('🔍 bcrypt 검증 테스트:', isValid ? '✅ 성공' : '❌ 실패');
        
        console.log('✅ 스크립트 완료. 이제 admin@example.com / admin123 으로 로그인할 수 있습니다.');
        
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        console.error('전체 오류:', error);
    }
}

// 스크립트 실행
console.log('🔧 관리자 비밀번호 수정 스크립트 시작...');
fixAdminPassword(); 