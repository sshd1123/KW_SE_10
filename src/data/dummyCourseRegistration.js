// dummyCourseRegistration.js - 수강 신청 가능한 강의 더미 데이터
const availableCourses = [
    // 전공 과목 (컴퓨터공학과)
    {
        id: "I020-3-0201-01",
        name: "운영체제",
        professor: "김시스템",
        department: "컴퓨터공학과",
        year: 3,
        semester: 1,
        credits: 3,
        type: "전공필수",
        schedule: [
            { day: "화", startTime: "09:00", endTime: "10:30" },
            { day: "목", startTime: "09:00", endTime: "10:30" }
        ],
        room: "새빛관 501호",
        capacity: 40,
        enrolled: 28,
        description: "운영체제의 기본 개념과 구조를 학습하고, 프로세스 관리, 메모리 관리, 파일 시스템 등을 다룹니다.",
        prerequisites: ["자료구조", "시스템프로그래밍"],
        syllabus: "1주차: 운영체제 개론, 2주차: 프로세스와 스레드...",
        grading: "중간고사 30%, 기말고사 30%, 과제 30%, 출석 10%"
    },
    {
        id: "I020-3-0202-01",
        name: "컴퓨터네트워크",
        professor: "박네트워크",
        department: "컴퓨터공학과",
        year: 3,
        semester: 1,
        credits: 3,
        type: "전공선택",
        schedule: [
            { day: "월", startTime: "13:30", endTime: "15:00" },
            { day: "수", startTime: "13:30", endTime: "15:00" }
        ],
        room: "새빛관 502호",
        capacity: 35,
        enrolled: 22,
        description: "네트워크 프로토콜, OSI 7계층, TCP/IP 등 컴퓨터 네트워크의 기본 원리를 학습합니다.",
        prerequisites: ["자료구조"],
        syllabus: "1주차: 네트워크 개론, 2주차: 물리계층...",
        grading: "중간고사 35%, 기말고사 35%, 과제 20%, 출석 10%"
    },
    {
        id: "I020-2-0203-01",
        name: "웹프로그래밍",
        professor: "이웹개발",
        department: "컴퓨터공학과",
        year: 2,
        semester: 1,
        credits: 3,
        type: "전공선택",
        schedule: [
            { day: "화", startTime: "15:00", endTime: "16:30" },
            { day: "목", startTime: "15:00", endTime: "16:30" }
        ],
        room: "새빛관 401호",
        capacity: 50,
        enrolled: 45,
        description: "HTML, CSS, JavaScript를 이용한 웹 개발과 Node.js를 이용한 서버 개발을 학습합니다.",
        prerequisites: ["프로그래밍기초"],
        syllabus: "1주차: HTML/CSS 기초, 2주차: JavaScript...",
        grading: "중간고사 25%, 기말고사 25%, 프로젝트 40%, 출석 10%"
    },
    {
        id: "I020-4-0204-01",
        name: "인공지능",
        professor: "최인공지능",
        department: "컴퓨터공학과",
        year: 4,
        semester: 1,
        credits: 3,
        type: "전공선택",
        schedule: [
            { day: "월", startTime: "10:30", endTime: "12:00" },
            { day: "수", startTime: "10:30", endTime: "12:00" }
        ],
        room: "새빛관 601호",
        capacity: 30,
        enrolled: 18,
        description: "머신러닝, 딥러닝의 기본 개념과 알고리즘을 학습하고 실습을 통해 응용 능력을 기릅니다.",
        prerequisites: ["자료구조", "알고리즘", "확률통계"],
        syllabus: "1주차: AI 개론, 2주차: 머신러닝 기초...",
        grading: "중간고사 30%, 기말고사 30%, 프로젝트 30%, 출석 10%"
    },
    {
        id: "I020-3-0205-01",
        name: "소프트웨어공학",
        professor: "정소프트웨어",
        department: "컴퓨터공학과",
        year: 3,
        semester: 1,
        credits: 3,
        type: "전공필수",
        schedule: [
            { day: "화", startTime: "10:30", endTime: "12:00" },
            { day: "목", startTime: "10:30", endTime: "12:00" }
        ],
        room: "새빛관 503호",
        capacity: 45,
        enrolled: 32,
        description: "소프트웨어 개발 생명주기, 요구사항 분석, 설계, 테스팅 등 소프트웨어 개발 방법론을 학습합니다.",
        prerequisites: ["자료구조", "자바프로그래밍"],
        syllabus: "1주차: 소프트웨어공학 개론, 2주차: 요구사항 분석...",
        grading: "중간고사 30%, 기말고사 30%, 팀프로젝트 30%, 출석 10%"
    },

    // 교양 과목
    {
        id: "0000-1-5301-01",
        name: "창의적사고와글쓰기",
        professor: "한창의",
        department: "교양학부",
        year: 1,
        semester: 1,
        credits: 2,
        type: "교양필수",
        schedule: [
            { day: "금", startTime: "13:00", endTime: "15:00" }
        ],
        room: "한울관 301호",
        capacity: 30,
        enrolled: 25,
        description: "창의적 사고 능력을 기르고 논리적 글쓰기 능력을 향상시킵니다.",
        prerequisites: [],
        syllabus: "1주차: 창의적 사고란?, 2주차: 논리적 글쓰기...",
        grading: "중간고사 30%, 기말고사 30%, 과제 30%, 출석 10%"
    },
    {
        id: "0000-1-5302-01",
        name: "현대사회와윤리",
        professor: "윤윤리",
        department: "교양학부",
        year: 1,
        semester: 1,
        credits: 2,
        type: "교양선택",
        schedule: [
            { day: "수", startTime: "16:30", endTime: "18:30" }
        ],
        room: "한울관 202호",
        capacity: 40,
        enrolled: 15,
        description: "현대 사회의 다양한 윤리적 문제들을 탐구하고 올바른 가치관을 형성합니다.",
        prerequisites: [],
        syllabus: "1주차: 윤리학 개론, 2주차: 개인윤리...",
        grading: "중간고사 40%, 기말고사 40%, 출석 20%"
    },
    {
        id: "0000-2-5303-01",
        name: "경제학원론",
        professor: "경제학",
        department: "교양학부",
        year: 2,
        semester: 1,
        credits: 3,
        type: "교양선택",
        schedule: [
            { day: "월", startTime: "16:30", endTime: "18:00" },
            { day: "수", startTime: "16:30", endTime: "18:00" }
        ],
        room: "한울관 401호",
        capacity: 60,
        enrolled: 42,
        description: "미시경제학과 거시경제학의 기본 원리를 학습하여 경제 현상을 이해합니다.",
        prerequisites: [],
        syllabus: "1주차: 경제학 기초, 2주차: 수요와 공급...",
        grading: "중간고사 35%, 기말고사 35%, 과제 20%, 출석 10%"
    },

    // 다른 학과 전공 (타과생도 수강 가능)
    {
        id: "B030-2-0401-01",
        name: "마케팅원론",
        professor: "마케팅",
        department: "경영학과",
        year: 2,
        semester: 1,
        credits: 3,
        type: "타과전공",
        schedule: [
            { day: "화", startTime: "13:30", endTime: "15:00" },
            { day: "목", startTime: "13:30", endTime: "15:00" }
        ],
        room: "한울관 501호",
        capacity: 40,
        enrolled: 35,
        description: "마케팅의 기본 개념과 전략을 학습하고 실무 사례를 분석합니다.",
        prerequisites: [],
        syllabus: "1주차: 마케팅 개론, 2주차: 소비자 행동...",
        grading: "중간고사 30%, 기말고사 30%, 프로젝트 30%, 출석 10%"
    },
    {
        id: "S040-2-0501-01",
        name: "통계학",
        professor: "통계학",
        department: "수학과",
        year: 2,
        semester: 1,
        credits: 3,
        type: "타과전공",
        schedule: [
            { day: "월", startTime: "15:00", endTime: "16:30" },
            { day: "수", startTime: "15:00", endTime: "16:30" }
        ],
        room: "자연관 301호",
        capacity: 50,
        enrolled: 28,
        description: "확률과 통계의 기본 개념을 학습하고 데이터 분석 방법을 익힙니다.",
        prerequisites: ["미적분학"],
        syllabus: "1주차: 확률 기초, 2주차: 확률분포...",
        grading: "중간고사 40%, 기말고사 40%, 과제 15%, 출석 5%"
    },

    // 시간 충돌되는 강의들 (테스트용)
    {
        id: "I020-3-0206-01",
        name: "데이터베이스시스템",
        professor: "데이터베이스",
        department: "컴퓨터공학과",
        year: 3,
        semester: 1,
        credits: 3,
        type: "전공선택",
        schedule: [
            { day: "화", startTime: "09:00", endTime: "10:30" },  // 운영체제와 시간 충돌
            { day: "목", startTime: "09:00", endTime: "10:30" }
        ],
        room: "새빛관 504호",
        capacity: 40,
        enrolled: 35,
        description: "관계형 데이터베이스의 설계와 구현, SQL, 트랜잭션 처리 등을 학습합니다.",
        prerequisites: ["자료구조"],
        syllabus: "1주차: 데이터베이스 개론, 2주차: 관계모델...",
        grading: "중간고사 30%, 기말고사 30%, 프로젝트 30%, 출석 10%"
    },
    {
        id: "0000-1-5304-01",
        name: "체육",
        professor: "체육학",
        department: "교양학부",
        year: 1,
        semester: 1,
        credits: 1,
        type: "교양필수",
        schedule: [
            { day: "금", startTime: "13:00", endTime: "15:00" }  // 창의적사고와글쓰기와 시간 충돌
        ],
        room: "체육관",
        capacity: 25,
        enrolled: 20,
        description: "다양한 스포츠 활동을 통해 체력을 증진하고 협동심을 기릅니다.",
        prerequisites: [],
        syllabus: "1주차: 체력측정, 2주차: 기초체력 운동...",
        grading: "실기평가 70%, 출석 30%"
    }
];

// 수강 신청 기간 정보
const registrationPeriod = {
    isOpen: true,
    startDate: "2025-01-15",
    endDate: "2025-01-25",
    phases: [
        {
            phase: "1차",
            startDate: "2025-01-15",
            endDate: "2025-01-18",
            targetStudents: "4학년",
            description: "4학년 우선 수강신청"
        },
        {
            phase: "2차",
            startDate: "2025-01-19",
            endDate: "2025-01-22",
            targetStudents: "3학년",
            description: "3학년 우선 수강신청"
        },
        {
            phase: "3차",
            startDate: "2025-01-23",
            endDate: "2025-01-25",
            targetStudents: "전체",
            description: "전체 학년 수강신청"
        }
    ],
    currentPhase: "3차",
    maxCredits: 19, // 최대 신청 가능 학점
    minCredits: 12  // 최소 신청 학점
};

export { availableCourses, registrationPeriod };