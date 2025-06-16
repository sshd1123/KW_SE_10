// dummyAnnouncementData.js
const announcementData = [
    {
        id: "1",
        title: "첫 번째 강의 공지사항",
        content: `안녕하세요, 학생 여러분.

웹프로그래밍 강의와 관련된 중요한 안내사항을 전달드립니다.

• 다음 주부터 실습 과제가 시작됩니다
• 개발환경 설정을 미리 완료해주세요
• 질문사항은 언제든 연락주세요

감사합니다.`,
        courseId: "I020-2-0123-01",
        course: "웹프로그래밍",
        author: "김민수",
        authorId: "prof1",
        createdAt: "2025-06-17T09:00:00Z",
        updatedAt: "2025-06-17T09:00:00Z",
        date: "2025-06-17",
        views: 25,
        isPinned: false,
        isUrgent: false,
        priority: "normal",
        allowComments: true,
        attachments: []
    },
    {
        id: "2",
        title: "중간고사 안내",
        content: `중간고사 일정을 안내드립니다.

📅 일시: 2025년 7월 15일 (화) 오전 10:00 ~ 12:00
📍 장소: 공학관 101호
📝 범위: 1주차 ~ 8주차 강의 내용
📋 준비물: 신분증, 필기구

시험 관련 문의사항이 있으시면 언제든 연락주세요.

모두 좋은 결과 있기를 바랍니다.`,
        courseId: "I020-2-0123-01",
        course: "웹프로그래밍",
        author: "김민수",
        authorId: "prof1",
        createdAt: "2025-06-16T14:30:00Z",
        updatedAt: "2025-06-16T14:30:00Z",
        date: "2025-06-16",
        views: 45,
        isPinned: true,
        isUrgent: false,
        priority: "important",
        allowComments: true,
        attachments: [
            {
                id: 1,
                name: "중간고사_안내.pdf",
                size: 1024000,
                type: "application/pdf"
            }
        ]
    },
    {
        id: "3",
        title: "과제 제출 방법 안내",
        content: `과제 제출과 관련된 안내사항입니다.

제출 방법:
1. GitHub Repository에 코드 업로드
2. README.md 파일에 실행 방법 기술
3. 이메일로 Repository 링크 전송

제출 기한: 매주 일요일 23:59까지

늦은 제출은 감점 처리되니 유의해주세요.`,
        courseId: "I020-2-0123-01",
        course: "웹프로그래밍",
        author: "김민수",
        authorId: "prof1",
        createdAt: "2025-06-15T16:20:00Z",
        updatedAt: "2025-06-15T16:20:00Z",
        date: "2025-06-15",
        views: 32,
        isPinned: false,
        isUrgent: false,
        priority: "normal",
        allowComments: true,
        attachments: []
    },
    {
        id: "4",
        title: "긴급: 다음 주 휴강 안내",
        content: `긴급 안내사항입니다.

다음 주 화요일(6월 24일) 강의는 교수 출장으로 인해 휴강합니다.

대신 다음과 같이 진행됩니다:
• 온라인 강의 영상 제공 (LMS 업로드 예정)
• 실습 과제는 예정대로 진행
• 질문사항은 이메일로 문의

불편을 드려 죄송합니다.`,
        courseId: "I020-2-0123-01",
        course: "웹프로그래밍",
        author: "김민수",
        authorId: "prof1",
        createdAt: "2025-06-17T15:45:00Z",
        updatedAt: "2025-06-17T15:45:00Z",
        date: "2025-06-17",
        views: 67,
        isPinned: true,
        isUrgent: true,
        priority: "urgent",
        allowComments: true,
        attachments: []
    },
    {
        id: "5",
        title: "데이터베이스 설계 과제 안내",
        content: `데이터베이스 설계 강의 과제를 안내드립니다.

과제 내용:
- 온라인 쇼핑몰 데이터베이스 설계
- ER 다이어그램 작성
- 정규화 과정 설명

제출 기한: 2025년 7월 1일
제출 방법: LMS 과제 게시판

자세한 내용은 첨부파일을 참고해주세요.`,
        courseId: "I020-2-0124-01",
        course: "데이터베이스설계",
        author: "박영희",
        authorId: "prof2",
        createdAt: "2025-06-16T11:00:00Z",
        updatedAt: "2025-06-16T11:00:00Z",
        date: "2025-06-16",
        views: 28,
        isPinned: false,
        isUrgent: false,
        priority: "normal",
        allowComments: true,
        attachments: [
            {
                id: 2,
                name: "과제_안내서.pdf",
                size: 856000,
                type: "application/pdf"
            },
            {
                id: 3,
                name: "ER다이어그램_예시.png",
                size: 345000,
                type: "image/png"
            }
        ]
    },
    {
        id: "6",
        title: "기말 프로젝트 팀 구성 안내",
        content: `기말 프로젝트 팀 구성에 대해 안내드립니다.

팀 구성:
- 3-4명으로 구성
- 다음 주까지 팀 등록
- 팀장이 대표로 신청

프로젝트 주제:
- 웹 애플리케이션 개발
- 자유 주제 선택 가능
- 기술 스택 제한 없음

팀 등록은 이메일로 해주세요.`,
        courseId: "I020-2-0123-01",
        course: "웹프로그래밍",
        author: "김민수",
        authorId: "prof1",
        createdAt: "2025-06-14T13:15:00Z",
        updatedAt: "2025-06-14T13:15:00Z",
        date: "2025-06-14",
        views: 51,
        isPinned: false,
        isUrgent: false,
        priority: "important",
        allowComments: true,
        attachments: []
    }
];

export default announcementData;