// dummyStudentData.js
const studentData = {
    "student1": {
        academic: {
            year: 3,
            semester: 1,
            status: "재학",
            advisor: "김교수",
            totalCredits: 11,
            gpa: 3.8
        },
        courses: [
            {
                id: "I020-2-0123-01", // 인공지능융합대학 2학년 대상 과목
                name: "자바프로그래밍",
                professor: "이교수",
                credits: 3,
                schedule: [ // 새로운 형식
                    { day: "월", startTime: "10:30", endTime: "12:00" },
                    { day: "수", startTime: "12:00", endTime: "13:15" }
                ],
                room: "새빛관 401호"
            },
            {
                id: "I020-2-0156-02", // 인공지능융합대학 2학년 대상 과목
                name: "데이터베이스",
                professor: "박교수",
                credits: 3,
                schedule: [ // 새로운 형식
                    { day: "월", startTime: "12:00", endTime: "13:15" },
                    { day: "수", startTime: "10:30", endTime: "11:45" }
                ],
                room: "새빛관 302호"
            },
            {
                id: "I020-3-0187-01", // 인공지능융합대학 3학년 대상 과목
                name: "알고리즘",
                professor: "최교수",
                credits: 3,
                time: "월 15:00-16:30, 수 15:00-16:30",
                room: "새빛관 201호"
            },
            {
                id: "0000-1-5234-05", // 교양 1학년 대상 과목
                name: "대학영어",
                professor: "김교수",
                credits: 2,
                time: "금 09:00-11:00",
                room: "한울관 202호"
            },
            // {
            //     id: "0000-1-5234-04", // 교양 1학년 대상 과목
            //     name: "대학수학",
            //     professor: "김교수",
            //     credits: 2,
            //     time: "금 21:20~22:05",
            //     room: "한울관 202호"
            // },
        ],
        announcements: [
            {
                id: 1,
                course: "소프트웨어공학",
                title: "프로젝트 제출 마감일 연장",
                content: "수강생 여러분, 프로젝트 제출 마감일이 5월 25일에서 5월 30일로 연장되었습니다.",
                date: "2025-05-15",
                isNew: true
            },
            {
                id: 2,
                course: "학사공지",
                title: "2025년 1학기 장학금 신청 안내",
                content: "2025년 1학기 장학금 신청 기간은 5월 20일부터 6월 5일까지입니다.",
                date: "2025-05-10",
                isNew: true
            },
            {
                id: 3,
                course: "데이터베이스",
                title: "중간고사 시험 장소 안내",
                content: "데이터베이스 중간고사는 공학관 301호에서 실시됩니다.",
                date: "2025-05-08",
                isNew: false
            }
        ],
        assignments: [
            {
                id: 1,
                course: "소프트웨어공학",
                title: "프로젝트 제안서",
                description: "팀 프로젝트 제안서를 작성하여 제출하세요.",
                deadline: "2025-06-25",
                status: "진행중",
                submissionType: "파일 업로드",
                maxScore: 30
            },
            {
                id: 2,
                course: "데이터베이스",
                title: "ERD 설계",
                description: "주어진 요구사항에 맞는 ERD를 설계하고 정규화 과정을 설명하세요.",
                deadline: "2025-06-20",
                status: "진행중",
                submissionType: "파일 업로드",
                maxScore: 20
            },
            {
                id: 3,
                course: "알고리즘",
                title: "알고리즘 분석 보고서",
                description: "선택한 정렬 알고리즘의 시간 복잡도와 공간 복잡도를 분석하고 보고서를 제출하세요.",
                deadline: "2025-05-18",
                status: "진행중",
                submissionType: "파일 업로드",
                maxScore: 25
            }
        ],
        grades: {
            currentSemester: [
                { courseId: "I020-2-0123-01", courseName: "자바프로그래밍", credits: 3, grade: null },
                { courseId: "I020-2-0156-02", courseName: "데이터베이스", credits: 3, grade: null },
                { courseId: "I020-3-0187-01", courseName: "알고리즘", credits: 3, grade: null },
                { courseId: "0000-1-5234-05", courseName: "대학영어", credits: 2, grade: null }
            ],
            previous: [
                { semester: "2024-2", courseId: "I020-1-0001-01", courseName: "컴퓨터개론", credits: 3, grade: "A+" },
                { semester: "2024-2", courseId: "I020-2-0124-02", courseName: "자료구조", credits: 3, grade: "A0" },
                { semester: "2024-2", courseId: "0000-1-5102-03", courseName: "글쓰기", credits: 2, grade: "B+" },
                { semester: "2024-1", courseId: "S040-1-2051-04", courseName: "미적분학", credits: 3, grade: "A+" },
                { semester: "2024-2", courseId: "I020-1-0001-01", courseName: "컴퓨터개론", credits: 3, grade: "A+" },
                { semester: "2023-2", courseId: "I020-2-0124-02", courseName: "자료구조", credits: 3, grade: "A0" },
                { semester: "2023-2", courseId: "0000-1-5102-03", courseName: "글쓰기", credits: 2, grade: "B+" },
                { semester: "2023-2", courseId: "I020-1-0001-01", courseName: "컴퓨터개론", credits: 3, grade: "A+" },
                { semester: "2023-2", courseId: "I020-2-0124-02", courseName: "자료구조", credits: 3, grade: "A0" },
                { semester: "2023-1", courseId: "0000-1-5102-03", courseName: "글쓰기", credits: 2, grade: "A+" },
                { semester: "2023-1", courseId: "I020-1-0001-01", courseName: "컴퓨터개론", credits: 3, grade: "A+" },
                { semester: "2023-1", courseId: "I020-2-0124-02", courseName: "자료구조", credits: 3, grade: "A0" },
                { semester: "2023-1", courseId: "0000-1-5102-03", courseName: "글쓰기", credits: 2, grade: "A+" },
                { semester: "2023-1", courseId: "0000-1-5102-03", courseName: "글쓰기", credits: 2, grade: "A+" },
                { semester: "2022-2", courseId: "I020-1-0001-01", courseName: "컴퓨터개론", credits: 3, grade: "C+" },
                { semester: "2022-2", courseId: "I020-2-0124-02", courseName: "자료구조", credits: 3, grade: "C0" },
                { semester: "2022-2", courseId: "0000-1-5102-03", courseName: "글쓰기", credits: 2, grade: "C+" },
                { semester: "2022-1", courseId: "0000-1-5102-03", courseName: "글쓰기", credits: 2, grade: "A+" },
                { semester: "2022-1", courseId: "I020-1-0001-01", courseName: "컴퓨터개론", credits: 3, grade: "C+" },
                { semester: "2022-1", courseId: "I020-2-0124-02", courseName: "자료구조", credits: 3, grade: "C0" },
                { semester: "2022-1", courseId: "0000-1-5102-03", courseName: "글쓰기", credits: 2, grade: "C+" },
            ]
        },
    },

    "student2": {
        // 김철수 학생 데이터
        academic: {
            year: 4,
            semester: 1,
            status: "재학",
            advisor: "이교수",
            totalCredits: 105,
            gpa: 4.2
        },
        courses: [
            {
                id: "B030-3-0521-01", // 경영대학 3학년 대상 과목 (B030은 경영대학 코드로 가정)
                name: "경영전략",
                professor: "박교수",
                credits: 3,
                time: "월 9:00-10:30, 수 9:00-10:30",
                room: "한울관 301호"
            },
            {
                id: "B030-3-0532-02", // 경영대학 3학년 대상 과목
                name: "재무관리",
                professor: "최교수",
                credits: 3,
                time: "화 10:30-12:00, 목 10:30-12:00",
                room: "한울관 201호"
            },
            {
                id: "B030-3-0543-01", // 경영대학 3학년 대상 과목
                name: "마케팅연구",
                professor: "정교수",
                credits: 3,
                time: "금 13:00-16:00",
                room: "한울관 203호"
            }
        ],
        announcements: [
            {
                id: 1,
                course: "경영전략",
                title: "기말고사 안내",
                content: "기말고사는 6월 15일에 실시됩니다.",
                date: "2025-05-15",
                isNew: true
            }
        ],
        assignments: [
            {
                id: 1,
                course: "경영전략",
                title: "사례 분석 보고서",
                deadline: "2025-05-30",
                status: "진행중"
            }
        ],
        grades: {
            currentSemester: [
                { courseId: "B030-3-0521-01", courseName: "경영전략", credits: 3, grade: null }
            ],
            previous: [
                { semester: "2024-2", courseId: "B030-2-0501-01", courseName: "마케팅원론", credits: 3, grade: "A+" }
            ]
        }
    }
};

export default studentData;