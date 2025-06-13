// dummyProfessorData.js
const professorData = {
    "professor1": {
        // 개인 정보
        personal: {
            name: "김교수",
            professorId: "2015001",
            department: "컴퓨터공학과",
            email: "professor1@example.ac.kr",
            phone: "010-9876-5432",
            office: "공학관 501호",
            officeHours: "월, 수 14:00-16:00",
            position: "정교수",
            joinDate: "2015-03-01"
        },

        // 교수 기능 - 강의 관리
        courses: [
            {
                id: "I020-2-0123-01", // 인공지능융합대학 2학년 대상 과목
                name: "자바프로그래밍",
                semesterId: "2025-1",
                credits: 3,
                time: "월 10:30-12:00, 수 10:30-12:00",
                room: "새빛관 401호",
                enrolled: 42,
                capacity: 50
            },
            {
                id: "I020-4-0256-01", // 인공지능융합대학 4학년 대상 과목
                name: "고급 소프트웨어 설계",
                semesterId: "2025-1",
                credits: 3,
                time: "화 15:00-16:30, 목 15:00-16:30",
                room: "새빛관 402호",
                enrolled: 28,
                capacity: 30
            }
        ],

        // 학생 성적 관리
        students: [
            {
                id: "2023123456",
                name: "홍길동",
                department: "소프트웨어학과",
                courseId: "I020-2-0123-01", // 수정된 과목 코드
                midterm: 85,
                final: null,
                assignments: [
                    { id: 1, title: "GUI 프로그래밍 과제", score: null, maxScore: 30 }
                ],
                attendance: 90
            },
            {
                id: "2022987654",
                name: "김철수",
                department: "경영학과",
                courseId: "I020-2-0123-01", // 수정된 과목 코드
                midterm: 78,
                final: null,
                assignments: [
                    { id: 1, title: "GUI 프로그래밍 과제", score: null, maxScore: 30 }
                ],
                attendance: 95
            }
        ],

        // 공지사항 관리
        announcements: [
            {
                id: 1,
                courseId: "I020-2-0123-01", // 수정된 과목 코드
                title: "프로젝트 제출 마감일 연장",
                content: "수강생 여러분, 프로젝트 제출 마감일이 5월 25일에서 5월 30일로 연장되었습니다.",
                date: "2025-05-15"
            },
            {
                id: 2,
                courseId: "I020-4-0256-01", // 수정된 과목 코드
                title: "다음 주 수업 자료 사전 공지",
                content: "다음 주 수업에서는 디자인 패턴에 대해 다룰 예정입니다. 미리 공유된 자료를 읽어오시기 바랍니다.",
                date: "2025-05-12"
            }
        ],

        // 강의 자료 관리
        materials: [
            {
                id: 1,
                courseId: "I020-2-0123-01", // 수정된 과목 코드
                title: "1주차 강의자료",
                content: "자바 프로그래밍 개요",
                uploadDate: "2025-03-02",
                fileUrl: "#"
            },
            {
                id: 2,
                courseId: "I020-2-0123-01", // 수정된 과목 코드
                title: "2주차 강의자료",
                content: "객체지향 프로그래밍 기초",
                uploadDate: "2025-03-09",
                fileUrl: "#"
            }
        ],

        // 과제 관리
        assignments: [
            {
                id: 1,
                courseId: "I020-2-0123-01", // 수정된 과목 코드
                title: "GUI 프로그래밍 과제",
                description: "Swing을 이용한 GUI 프로그램을 작성하여 제출하세요. 양식은 강의 자료실에 업로드되어 있습니다.",
                deadline: "2025-05-25",
                maxScore: 30,
                submissions: 12
            },
            {
                id: 2,
                courseId: "I020-4-0256-01", // 수정된 과목 코드
                title: "아키텍처 설계 보고서",
                description: "주어진 요구사항에 맞는 소프트웨어 아키텍처를 설계하고 보고서를 제출하세요.",
                deadline: "2025-05-20",
                maxScore: 40,
                submissions: 8
            }
        ],

        // 관리자 기능 - 학생 관리
        allStudents: [
            {
                id: "2025000111",
                name: "홍길동",
                department: "컴퓨터공학과",
                status: "재학",
                year: 3,
                email: "student1@example.ac.kr",
                phone: "010-1234-5678",
                advisor: "김교수",
                admissionDate: "2023-03-02"
            },
            {
                id: "2025000222",
                name: "김철수",
                department: "경영학과",
                status: "재학",
                year: 4,
                email: "student2@example.ac.kr",
                phone: "010-2345-6789",
                advisor: "이교수",
                admissionDate: "2022-03-02"
            }
        ],

        // 관리자 기능 - 강의 개설 관리
        allCourses: [
            {
                id: "I020-2-0123-01", // 수정된 과목 코드
                name: "자바프로그래밍",
                department: "소프트웨어학과",
                professor: "이교수",
                semesterId: "2025-1",
                credits: 3,
                time: "월 10:30-12:00, 수 10:30-12:00",
                room: "새빛관 401호",
                enrolled: 42,
                capacity: 50,
                status: "개설"
            },
            {
                id: "B030-3-0521-01", // 수정된 과목 코드
                name: "경영전략",
                department: "경영학과",
                professor: "박교수",
                semesterId: "2025-1",
                credits: 3,
                time: "월 9:00-10:30, 수 9:00-10:30",
                room: "한울관 301호",
                enrolled: 38,
                capacity: 40,
                status: "개설"
            }
        ],

        // 관리자 기능 - 학사 일정 관리
        academicCalendar: [
            {
                id: 1,
                title: "2025년 1학기 중간고사",
                start: "2025-04-20",
                end: "2025-04-26",
                category: "시험"
            },
            {
                id: 2,
                title: "2025년 1학기 기말고사",
                start: "2025-06-15",
                end: "2025-06-21",
                category: "시험"
            },
            {
                id: 3,
                title: "여름방학",
                start: "2025-06-22",
                end: "2025-08-31",
                category: "방학"
            },
            {
                id: 4,
                title: "2025-2학기 수강신청",
                start: "2025-07-15",
                end: "2025-07-20",
                category: "학사"
            }
        ],

        // 관리자 기능 - 통계 데이터
        statistics: {
            studentsByDepartment: [
                { department: "컴퓨터공학과", count: 320 },
                { department: "경영학과", count: 280 },
                { department: "전자공학과", count: 290 },
                { department: "기계공학과", count: 260 },
                { department: "화학공학과", count: 240 }
            ],
            studentsByYear: [
                { year: 1, count: 350 },
                { year: 2, count: 330 },
                { year: 3, count: 320 },
                { year: 4, count: 310 }
            ],
            gpaByDepartment: [
                { department: "컴퓨터공학과", gpa: 3.5 },
                { department: "경영학과", gpa: 3.7 },
                { department: "전자공학과", gpa: 3.4 },
                { department: "기계공학과", gpa: 3.3 },
                { department: "화학공학과", gpa: 3.6 }
            ]
        }
    },

    "professor2": {
        // 이교수 데이터 (유사한 구조)
        personal: {
            name: "이교수",
            professorId: "2018043",
            department: "경영학과",
            email: "professor2@example.ac.kr",
            position: "부교수"
        },
        // 나머지 데이터 유사한 구조로 구성
        courses: [
            {
                id: "B030-3-0521-01", // 수정된 과목 코드
                name: "경영전략",
                semesterId: "2025-1",
                credits: 3,
                time: "월 9:00-10:30, 수 9:00-10:30",
                room: "한울관 301호",
                enrolled: 38,
                capacity: 40
            }
        ]
        // 기타 교수/관리자 데이터 생략
    }
};

export default professorData;