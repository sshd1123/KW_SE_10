// dummyUsers.js
const users = [
    // 학생 계정
    {
        id: "student1",
        password: "password123",
        role: "student",
        name: "홍길동",
        studentId: "2025000111",
        department: "컴퓨터공학과",
        email: "student1@example.ac.kr",
        phone: "010-1234-5678",
        admissionYear: 2023
    },
    {
        id: "student2",
        password: "password123",
        role: "student",
        name: "김철수",
        studentId: "2025000222",
        department: "경영학과",
        email: "student2@example.ac.kr",
        phone: "010-2345-6789",
        admissionYear: 2022
    },

    // 교수/관리자 계정
    {
        id: "professor1",
        password: "password123",
        role: "professor",  // 교수는 관리자 권한도 있음
        name: "김교수",
        professorId: "2015001",
        department: "컴퓨터공학과",
        email: "professor1@example.ac.kr",
        phone: "010-9876-5432",
        position: "정교수",
        isAdmin: true  // 관리자 권한 플래그
    },
    {
        id: "professor2",
        password: "password123",
        role: "professor",
        name: "이교수",
        professorId: "2018043",
        department: "경영학과",
        email: "professor2@example.ac.kr",
        phone: "010-8765-4321",
        position: "부교수",
        isAdmin: true  // 관리자 권한 플래그
    }
];

export default users;