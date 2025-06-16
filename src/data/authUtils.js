// authUtils.js
import users from './dummyUsers';
import studentData from './dummyStudentData';
import professorData from './dummyProfessorData';
import announcementData from './dummyAnnouncementData';

// 로그인 처리 함수
export const login = (username, password) => {
    const user = users.find(user => (user.studentId === username || user.professorId === username) && user.password === password);

    if (!user) {
        throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
    }

    // 사용자 개인정보 필터링 (비밀번호 제거)
    const { password: _, ...userInfo } = user;

    // 토큰 생성 (실제로는 JWT를 사용하겠지만, 여기서는 간단히 처리)
    const token = btoa(JSON.stringify({ userId: user.id, role: user.role, timestamp: Date.now() }));

    // 로컬 스토리지에 저장
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userInfo));

    return userInfo;
};

// 로그아웃 처리 함수
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

// 현재 로그인된 사용자 정보 가져오기
export const getCurrentUser = () => {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;

    return JSON.parse(userJson);
};

// 사용자 역할에 따른 대시보드 데이터 가져오기
export const getDashboardData = () => {
    const user = getCurrentUser();
    if (!user) return null;

    let baseData = null;
    
    switch (user.role) {
        case 'student':
            baseData = studentData[user.id] || null;
            break;
        case 'professor':
            baseData = professorData[user.id] || null;
            break;
        default:
            return null;
    }

    if (!baseData) return null;

    // 공지사항 데이터 병합
    const mergedData = {
        ...baseData,
        announcements: []
    };

    // 사용자 역할에 따라 공지사항 필터링
    if (user.role === 'student') {
        // 학생: 수강 중인 강의의 공지사항만
        const enrolledCourseIds = baseData.courses?.map(course => course.id) || [];
        mergedData.announcements = announcementData.filter(announcement => 
            enrolledCourseIds.includes(announcement.courseId)
        );
    } else if (user.role === 'professor') {
        // 교수: 담당 강의의 공지사항만
        const teachingCourseIds = baseData.courses?.map(course => course.id) || [];
        mergedData.announcements = announcementData.filter(announcement => 
            teachingCourseIds.includes(announcement.courseId)
        );
    }

    return mergedData;
};

// 특정 강의의 공지사항 가져오기
export const getCourseAnnouncements = (courseId) => {
    return announcementData.filter(announcement => announcement.courseId === courseId);
};

// 특정 공지사항 가져오기
export const getAnnouncement = (announcementId) => {
    return announcementData.find(announcement => 
        announcement.id === announcementId || 
        String(announcement.id) === String(announcementId)
    );
};

// 공지사항 생성/수정/삭제 함수들
export const createAnnouncement = (announcementData) => {
    // 실제로는 API 호출이지만, 여기서는 로컬 데이터 조작
    const newAnnouncement = {
        ...announcementData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0
    };
    
    // 실제 구현에서는 서버로 전송
    console.log('새 공지사항 생성:', newAnnouncement);
    return newAnnouncement;
};

export const updateAnnouncement = (announcementId, updates) => {
    // 실제로는 API 호출
    const updatedAnnouncement = {
        ...updates,
        id: announcementId,
        updatedAt: new Date().toISOString()
    };
    
    console.log('공지사항 수정:', updatedAnnouncement);
    return updatedAnnouncement;
};

export const deleteAnnouncement = (announcementId) => {
    // 실제로는 API 호출
    console.log('공지사항 삭제:', announcementId);
    return true;
};