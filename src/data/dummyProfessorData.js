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
                id: "I020-2-0123-01",
                name: "자바프로그래밍",
                professor: "김교수",
                credits: 3,
                schedule: [
                    { day: "월", startTime: "10:30", endTime: "12:00" },
                    { day: "수", startTime: "12:00", endTime: "13:15" }
                ],
                room: "새빛관 401호",
                enrolled: 42,
                capacity: 50
            },
            {
                id: "I020-2-0156-02",
                name: "데이터베이스",
                professor: "김교수",
                credits: 3,
                schedule: [
                    { day: "월", startTime: "12:00", endTime: "13:15" },
                    { day: "수", startTime: "10:30", endTime: "11:45" }
                ],
                room: "새빛관 302호",
                enrolled: 38,
                capacity: 45
            },
            {
                id: "I020-3-0187-01",
                name: "알고리즘",
                professor: "김교수",
                credits: 3,
                time: "월 15:00-16:30, 수 15:00-16:30",
                room: "새빛관 201호",
                enrolled: 35,
                capacity: 40
            }
        ],

        // 과제 관리 - 이 부분이 핵심!
        assignments: [
            {
                id: 1,
                courseId: "I020-2-0123-01",
                course: "자바프로그래밍",
                title: "프로젝트 제안서",
                description: "팀 프로젝트 제안서를 작성하여 제출하세요.",
                deadline: "2025-06-25",
                maxScore: 30,
                submissions: 12,
                authorId: "2015001", // professorId와 일치
                submissionType: "file",
                allowLateSubmission: false,
                latePenalty: 10,
                teamAssignment: false,
                maxTeamSize: 4,
                attachments: [],
                rubric: [
                    { criteria: '코드 품질', maxPoints: 10, description: '코드의 가독성, 효율성, 구조' },
                    { criteria: '기능 구현', maxPoints: 15, description: '요구사항 충족도' },
                    { criteria: '창의성', maxPoints: 5, description: '추가 기능, 개선사항' }
                ],
                status: "진행중"
            },
            {
                id: 2,
                courseId: "I020-2-0156-02",
                course: "데이터베이스",
                title: "ERD 설계",
                description: "주어진 요구사항에 맞는 ERD를 설계하고 정규화 과정을 설명하세요.",
                deadline: "2025-06-20",
                maxScore: 20,
                submissions: 8,
                authorId: "2015001",
                submissionType: "file",
                allowLateSubmission: true,
                latePenalty: 5,
                teamAssignment: false,
                maxTeamSize: 1,
                attachments: [],
                rubric: [
                    { criteria: 'ERD 설계', maxPoints: 10, description: 'ERD 다이어그램의 완성도' },
                    { criteria: '정규화', maxPoints: 10, description: '정규화 과정의 이해도' }
                ],
                status: "진행중"
            },
            {
                id: 3,
                courseId: "I020-3-0187-01",
                course: "알고리즘",
                title: "알고리즘 분석 보고서",
                description: "선택한 정렬 알고리즘의 시간 복잡도와 공간 복잡도를 분석하고 보고서를 제출하세요.",
                deadline: "2025-05-18",
                maxScore: 25,
                submissions: 5,
                authorId: "2015001",
                submissionType: "file",
                allowLateSubmission: false,
                latePenalty: 10,
                teamAssignment: false,
                maxTeamSize: 1,
                attachments: [],
                rubric: [
                    { criteria: '알고리즘 분석', maxPoints: 15, description: '시간/공간 복잡도 분석의 정확성' },
                    { criteria: '보고서 작성', maxPoints: 10, description: '보고서의 구성과 논리성' }
                ],
                status: "진행중"
            }
        ],

        // 학생 성적 관리
        students: [
            {
                id: "2023123456",
                name: "홍길동",
                department: "소프트웨어학과",
                courseId: "I020-2-0123-01",
                midterm: 85,
                final: null,
                assignments: [
                    { id: 1, title: "프로젝트 제안서", score: null, maxScore: 30 }
                ],
                attendance: 90
            },
            {
                id: "2022987654",
                name: "김철수",
                department: "경영학과",
                courseId: "I020-2-0123-01",
                midterm: 78,
                final: null,
                assignments: [
                    { id: 1, title: "프로젝트 제안서", score: null, maxScore: 30 }
                ],
                attendance: 95
            }
        ],

        // 공지사항 관리
        announcements: [
            {
                id: 1,
                courseId: "I020-2-0123-01",
                title: "프로젝트 제출 마감일 연장",
                content: "수강생 여러분, 프로젝트 제출 마감일이 5월 25일에서 5월 30일로 연장되었습니다.",
                date: "2025-05-15"
            },
            {
                id: 2,
                courseId: "I020-2-0156-02",
                title: "다음 주 수업 자료 사전 공지",
                content: "다음 주 수업에서는 정규화에 대해 다룰 예정입니다. 미리 공유된 자료를 읽어오시기 바랍니다.",
                date: "2025-05-12"
            }
        ],

        // 강의 자료 관리
        materials: [
            {
                id: 1,
                courseId: "I020-2-0123-01",
                title: "1주차 강의자료",
                content: "자바 프로그래밍 개요",
                uploadDate: "2025-03-02",
                fileUrl: "#"
            },
            {
                id: 2,
                courseId: "I020-2-0156-02",
                title: "1주차 강의자료",
                content: "데이터베이스 개론",
                uploadDate: "2025-03-02",
                fileUrl: "#"
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
                id: "I020-2-0123-01",
                name: "자바프로그래밍",
                department: "소프트웨어학과",
                professor: "김교수",
                semesterId: "2025-1",
                credits: 3,
                time: "월 10:30-12:00, 수 10:30-12:00",
                room: "새빛관 401호",
                enrolled: 42,
                capacity: 50,
                status: "개설"
            },
            {
                id: "I020-2-0156-02",
                name: "데이터베이스",
                department: "소프트웨어학과",
                professor: "김교수",
                semesterId: "2025-1",
                credits: 3,
                time: "월 12:00-13:15, 수 10:30-11:45",
                room: "새빛관 302호",
                enrolled: 38,
                capacity: 45,
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
            }
        ],

        // 관리자 기능 - 통계 데이터
        statistics: {
            studentsByDepartment: [
                { department: "컴퓨터공학과", count: 320 },
                { department: "경영학과", count: 280 },
                { department: "전자공학과", count: 290 }
            ],
            studentsByYear: [
                { year: 1, count: 350 },
                { year: 2, count: 330 },
                { year: 3, count: 320 },
                { year: 4, count: 310 }
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
        courses: [
            {
                id: "B030-3-0521-01",
                name: "경영전략",
                semesterId: "2025-1",
                credits: 3,
                time: "월 9:00-10:30, 수 9:00-10:30",
                room: "한울관 301호",
                enrolled: 38,
                capacity: 40
            }
        ],
        assignments: [
            {
                id: 4,
                courseId: "B030-3-0521-01",
                course: "경영전략",
                title: "사례 분석 보고서",
                description: "기업 사례를 분석하고 전략을 제안하세요.",
                deadline: "2025-05-30",
                maxScore: 40,
                submissions: 5,
                authorId: "2018043",
                submissionType: "file",
                status: "진행중"
            }
        ]
    }
};

export default professorData;