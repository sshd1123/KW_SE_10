// authUtils.js
import users from './dummyUsers';
import studentData from './dummyStudentData';
import professorData from './dummyProfessorData';
import announcementData from './dummyAnnouncementData';

// 개발 모드 설정 추가
const DEVELOPMENT_BYPASS = true;

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
    if (DEVELOPMENT_BYPASS && process.env.NODE_ENV === 'development') {
        const path = window.location.pathname;

        console.log('🚀 개발 모드: getCurrentUser 호출, 경로:', path);

        if (path.includes('/professor/')) {
            const user = {
                id: 'professor1',
                name: '개발교수',
                role: 'professor',
                professorId: 'prof001',
                department: '컴퓨터공학과',
                email: 'dev.professor@university.ac.kr'
            };
            console.log('👨‍🏫 교수 사용자 반환:', user);
            return user;
        } else {
            // 기본값: 학생
            const user = {
                id: 'student1',
                name: '개발학생',
                role: 'student',
                studentId: '2024000001',
                department: '컴퓨터공학과',
                year: 3,
                email: 'dev.student@university.ac.kr'
            };
            console.log('👨‍🎓 학생 사용자 반환:', user);
            return user;
        }
    }

    const userJson = localStorage.getItem('user');
    if (!userJson) return null;

    return JSON.parse(userJson);
};

// 사용자 역할에 따른 대시보드 데이터 가져오기
export const getDashboardData = () => {
    const user = getCurrentUser();
    if (!user) return null;

    // 개발 모드에서 더미 데이터 반환
    if (DEVELOPMENT_BYPASS && process.env.NODE_ENV === 'development') {
        console.log('🚀 개발 모드: 더미 대시보드 데이터 생성');

        if (user.role === 'professor') {
            // 교수용 더미 데이터
            const dummyProfessorData = {
                user: user,
                courses: [
                    {
                        id: "I020-2-0123-01",
                        name: "자바프로그래밍",
                        credits: 3,
                        schedule: [
                            { day: "월", startTime: "10:30", endTime: "12:00" },
                            { day: "수", startTime: "10:30", endTime: "12:00" }
                        ],
                        room: "새빛관 401호",
                        enrolled: 42,
                        capacity: 50
                    }
                ],
                announcements: [
                    {
                        id: "1",
                        title: "개발 모드 테스트 공지사항",
                        content: "이것은 개발 모드에서 생성된 테스트 공지사항입니다.",
                        courseId: "I020-2-0123-01",
                        course: "자바프로그래밍",
                        author: "개발교수",
                        date: new Date().toISOString().split('T')[0]
                    }
                ],
                assignments: [],
                students: []
            };
            console.log('👨‍🏫 교수용 더미 데이터 반환:', dummyProfessorData);
            return dummyProfessorData;
        } else {
            // 학생용 더미 데이터
            const dummyStudentData = {
                user: user,
                academic: {
                    year: 3,
                    semester: 1,
                    department: '컴퓨터공학과'
                },
                courses: [
                    {
                        id: "I020-3-0201-01",
                        name: "운영체제",
                        professor: "김시스템",
                        credits: 3,
                        schedule: [
                            { day: "화", startTime: "09:00", endTime: "10:30" },
                            { day: "목", startTime: "09:00", endTime: "10:30" }
                        ],
                        room: "새빛관 501호"
                    }
                ],
                announcements: [
                    {
                        id: "1",
                        title: "개발 모드 테스트 공지사항",
                        content: "이것은 개발 모드에서 생성된 테스트 공지사항입니다.",
                        courseId: "I020-3-0201-01",
                        course: "운영체제",
                        author: "김시스템",
                        date: new Date().toISOString().split('T')[0]
                    }
                ],
                assignments: [
                    {
                        id: 1,
                        title: "개발 모드 테스트 과제",
                        course: "운영체제",
                        deadline: "2025-12-31",
                        status: "진행중"
                    }
                ],
                grades: {
                    currentSemester: [
                        {
                            course: "운영체제",
                            credits: 3,
                            grade: "A+"
                        }
                    ],
                    previous: []
                }
            };
            console.log('👨‍🎓 학생용 더미 데이터 반환:', dummyStudentData);
            return dummyStudentData;
        }
    }

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