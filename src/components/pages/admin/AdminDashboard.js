import React, { useState, useEffect } from 'react';
import Header from '../../dashboard/Header';
import AdminSidebar from '../../dashboard/AdminSidebar';

// 더미 데이터 (실제 환경에서는 API에서 가져옴)
const initialData = {
    // 학사 공지사항
    announcements: [
        {
            id: "1",
            title: "2025학년도 1학기 중간고사 일정 안내",
            content: "2025학년도 1학기 중간고사가 4월 20일부터 26일까지 진행됩니다. 자세한 시험 일정은 각 강의별로 별도 공지됩니다.",
            type: "학사공지",
            courseId: null,
            course: "학사공지",
            author: "학사관리팀",
            authorId: "admin",
            date: "2025-06-15",
            isPinned: true,
            isUrgent: false,
            priority: "important"
        },
        {
            id: "2",
            title: "2025학년도 하계 계절학기 신청 안내",
            content: "하계 계절학기 수강신청이 7월 1일부터 시작됩니다. 신청 방법과 개설 과목은 홈페이지를 참고하시기 바랍니다.",
            type: "학사공지",
            courseId: null,
            course: "학사공지",
            author: "학사관리팀",
            authorId: "admin",
            date: "2025-06-10",
            isPinned: false,
            isUrgent: false,
            priority: "normal"
        }
    ],

    // 강의 목록
    courses: [
        {
            id: "I020-2-0123-01",
            name: "자바프로그래밍",
            professor: "김교수",
            department: "컴퓨터공학과",
            credits: 3,
            year: 2,
            semester: "2025-1",
            type: "전공필수",
            schedule: "월 10:30-12:00, 수 10:30-12:00",
            room: "새빛관 401호",
            capacity: 50,
            enrolled: 42,
            status: "개설",
            syllabus: {
                description: "자바 프로그래밍의 기본 개념과 객체지향 프로그래밍을 학습합니다.",
                objectives: "자바 언어의 문법과 객체지향 프로그래밍 원리를 이해하고 활용할 수 있다.",
                grading: "중간고사 30%, 기말고사 30%, 과제 30%, 출석 10%",
                textbook: "Java: The Complete Reference",
                prerequisites: "프로그래밍 기초",
                weeklyPlan: "1주차: Java 소개, 2주차: 변수와 데이터타입, 3주차: 조건문과 반복문..."
            }
        },
        {
            id: "I020-2-0156-02",
            name: "데이터베이스",
            professor: "박교수",
            department: "컴퓨터공학과",
            credits: 3,
            year: 2,
            semester: "2025-1",
            type: "전공필수",
            schedule: "화 13:30-15:00, 목 13:30-15:00",
            room: "새빛관 302호",
            capacity: 45,
            enrolled: 38,
            status: "개설",
            syllabus: {
                description: "관계형 데이터베이스의 설계와 구현을 학습합니다.",
                objectives: "데이터베이스 설계 원리와 SQL을 활용한 데이터 조작을 마스터한다.",
                grading: "중간고사 35%, 기말고사 35%, 프로젝트 20%, 출석 10%",
                textbook: "Database System Concepts",
                prerequisites: "자료구조",
                weeklyPlan: "1주차: DB 개론, 2주차: 관계형 모델, 3주차: SQL 기초..."
            }
        }
    ],

    // 사용자 목록
    users: [
        {
            id: "2025000111",
            name: "홍길동",
            type: "학생",
            department: "컴퓨터공학과",
            email: "student1@example.ac.kr",
            phone: "010-1234-5678",
            status: "활성",
            joinDate: "2023-03-02",
            lastLogin: "2025-06-18"
        },
        {
            id: "2025000222",
            name: "김철수",
            type: "학생",
            department: "경영학과",
            email: "student2@example.ac.kr",
            phone: "010-2345-6789",
            status: "활성",
            joinDate: "2022-03-02",
            lastLogin: "2025-06-17"
        },
        {
            id: "2015001",
            name: "김교수",
            type: "교수",
            department: "컴퓨터공학과",
            email: "professor1@example.ac.kr",
            phone: "010-9876-5432",
            status: "활성",
            joinDate: "2015-03-01",
            lastLogin: "2025-06-18"
        },
        {
            id: "2018043",
            name: "박교수",
            type: "교수",
            department: "컴퓨터공학과",
            email: "professor2@example.ac.kr",
            phone: "010-8765-4321",
            status: "활성",
            joinDate: "2018-03-01",
            lastLogin: "2025-06-18"
        }
    ]
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('announcements');
    const [data, setData] = useState(initialData);

    // 모달 상태
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'add', 'edit', 'delete'
    const [selectedItem, setSelectedItem] = useState(null);

    // 폼 데이터
    const [formData, setFormData] = useState({});

    // 검색 및 필터
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('all');

    // 학과 목록
    const departments = ['컴퓨터공학과', '경영학과', '전자공학과', '기계공학과'];

    // 탭 목록
    const tabs = [
        { id: 'announcements', label: '학사 공지 관리', icon: '📢' },
        { id: 'courses', label: '강의 관리', icon: '📚' },
        { id: 'syllabus', label: '강의계획서 관리', icon: '📋' },
        { id: 'users', label: '사용자 관리', icon: '👥' }
    ];

    // 모달 열기
    const openModal = (type, item = null) => {
        setModalType(type);
        setSelectedItem(item);
        setShowModal(true);

        if (type === 'add') {
            if (activeTab === 'announcements') {
                setFormData({
                    title: '',
                    content: '',
                    type: '학사공지',
                    isPinned: false,
                    isUrgent: false,
                    priority: 'normal'
                });
            } else if (activeTab === 'courses') {
                setFormData({
                    name: '',
                    professor: '',
                    department: '',
                    credits: 3,
                    year: 1,
                    type: '전공필수',
                    schedule: '',
                    room: '',
                    capacity: 30
                });
            } else if (activeTab === 'syllabus') {
                setFormData({
                    courseId: '',
                    description: '',
                    objectives: '',
                    grading: '',
                    textbook: '',
                    prerequisites: '',
                    weeklyPlan: ''
                });
            }
        } else if (type === 'edit' && item) {
            if (activeTab === 'announcements') {
                setFormData({
                    title: item.title,
                    content: item.content,
                    type: item.type,
                    isPinned: item.isPinned,
                    isUrgent: item.isUrgent,
                    priority: item.priority
                });
            } else if (activeTab === 'courses') {
                setFormData({
                    name: item.name,
                    professor: item.professor,
                    department: item.department,
                    credits: item.credits,
                    year: item.year,
                    type: item.type,
                    schedule: item.schedule,
                    room: item.room,
                    capacity: item.capacity
                });
            } else if (activeTab === 'syllabus' && item.syllabus) {
                setFormData({
                    courseId: item.id,
                    description: item.syllabus.description,
                    objectives: item.syllabus.objectives,
                    grading: item.syllabus.grading,
                    textbook: item.syllabus.textbook,
                    prerequisites: item.syllabus.prerequisites,
                    weeklyPlan: item.syllabus.weeklyPlan
                });
            }
        }
    };

    // 모달 닫기
    const closeModal = () => {
        setShowModal(false);
        setModalType('');
        setSelectedItem(null);
        setFormData({});
    };

    // 데이터 추가/수정/삭제 함수들
    const handleSubmit = () => {
        if (modalType === 'add') {
            if (activeTab === 'announcements') {
                const newAnnouncement = {
                    ...formData,
                    id: Date.now().toString(),
                    author: "학사관리팀",
                    authorId: "admin",
                    date: new Date().toISOString().split('T')[0],
                    courseId: null,
                    course: "학사공지"
                };
                setData(prev => ({
                    ...prev,
                    announcements: [...prev.announcements, newAnnouncement]
                }));
            } else if (activeTab === 'courses') {
                const newCourse = {
                    ...formData,
                    id: `${formData.department.slice(0, 1)}${Date.now().toString().slice(-6)}`,
                    semester: "2025-1",
                    enrolled: 0,
                    status: "개설",
                    syllabus: {
                        description: "",
                        objectives: "",
                        grading: "",
                        textbook: "",
                        prerequisites: "",
                        weeklyPlan: ""
                    }
                };
                setData(prev => ({
                    ...prev,
                    courses: [...prev.courses, newCourse]
                }));
            }
        } else if (modalType === 'edit') {
            if (activeTab === 'announcements') {
                setData(prev => ({
                    ...prev,
                    announcements: prev.announcements.map(item =>
                        item.id === selectedItem.id ? { ...item, ...formData } : item
                    )
                }));
            } else if (activeTab === 'courses') {
                setData(prev => ({
                    ...prev,
                    courses: prev.courses.map(item =>
                        item.id === selectedItem.id ? { ...item, ...formData } : item
                    )
                }));
            } else if (activeTab === 'syllabus') {
                setData(prev => ({
                    ...prev,
                    courses: prev.courses.map(item =>
                        item.id === formData.courseId ? {
                            ...item,
                            syllabus: {
                                description: formData.description,
                                objectives: formData.objectives,
                                grading: formData.grading,
                                textbook: formData.textbook,
                                prerequisites: formData.prerequisites,
                                weeklyPlan: formData.weeklyPlan
                            }
                        } : item
                    )
                }));
            }
        } else if (modalType === 'delete') {
            if (activeTab === 'announcements') {
                setData(prev => ({
                    ...prev,
                    announcements: prev.announcements.filter(item => item.id !== selectedItem.id)
                }));
            } else if (activeTab === 'courses') {
                setData(prev => ({
                    ...prev,
                    courses: prev.courses.filter(item => item.id !== selectedItem.id)
                }));
            } else if (activeTab === 'users') {
                setData(prev => ({
                    ...prev,
                    users: prev.users.filter(item => item.id !== selectedItem.id)
                }));
            }
        }
        closeModal();
    };

    // 사용자 탈퇴 처리
    const handleUserWithdrawal = (user) => {
        setData(prev => ({
            ...prev,
            users: prev.users.map(item =>
                item.id === user.id ? { ...item, status: '탈퇴' } : item
            )
        }));
    };

    // 필터링된 데이터
    const getFilteredData = () => {
        let filtered = [];

        if (activeTab === 'announcements') {
            filtered = data.announcements.filter(item =>
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.content.toLowerCase().includes(searchTerm.toLowerCase())
            );
        } else if (activeTab === 'courses' || activeTab === 'syllabus') {
            filtered = data.courses.filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.professor.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesDepartment = filterDepartment === 'all' || item.department === filterDepartment;
                return matchesSearch && matchesDepartment;
            });
        } else if (activeTab === 'users') {
            filtered = data.users.filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.id.includes(searchTerm);
                const matchesDepartment = filterDepartment === 'all' || item.department === filterDepartment;
                return matchesSearch && matchesDepartment;
            });
        }

        return filtered;
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            {/* 헤더 */}
            <Header
                username={'김관리자'}
                role={'관리자'}
            />

            <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
                {/* 사이드바 */}
                {/* <aside style={{
                    width: '280px',
                    backgroundColor: 'white',
                    borderRight: '1px solid #e0e0e0',
                    padding: '2rem 0'
                }}>
                    <nav>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    width: '100%',
                                    padding: '1rem 2rem',
                                    border: 'none',
                                    backgroundColor: activeTab === tab.id ? '#f0f8ff' : 'transparent',
                                    color: activeTab === tab.id ? '#78222D' : '#666',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    borderLeft: activeTab === tab.id ? '4px solid #78222D' : '4px solid transparent',
                                    transition: 'all 0.2s ease',
                                    fontSize: '1rem',
                                    fontWeight: activeTab === tab.id ? '600' : '400'
                                }}
                            >
                                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </aside> */}
                <AdminSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    adminName={"김 관리자"}
                />

                {/* 메인 콘텐츠 */}
                <main style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
                    {/* 헤더와 액션 버튼 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ margin: 0, color: '#333', fontSize: '1.8rem' }}>
                            {tabs.find(tab => tab.id === activeTab)?.label}
                        </h2>
                        {activeTab !== 'users' && (
                            <button
                                onClick={() => openModal('add')}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#78222D',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '500'
                                }}
                            >
                                + 추가하기
                            </button>
                        )}
                    </div>

                    {/* 검색 및 필터 */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        marginBottom: '2rem'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                                    검색
                                </label>
                                <input
                                    type="text"
                                    placeholder="검색어를 입력하세요..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            {(activeTab === 'courses' || activeTab === 'syllabus' || activeTab === 'users') && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                                        학과
                                    </label>
                                    <select
                                        value={filterDepartment}
                                        onChange={(e) => setFilterDepartment(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        <option value="all">전체 학과</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterDepartment('all');
                                }}
                                style={{
                                    padding: '0.75rem 1rem',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                초기화
                            </button>
                        </div>
                    </div>

                    {/* 데이터 테이블 */}
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                                        {activeTab === 'announcements' && (
                                            <>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>제목</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>작성일</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>우선순위</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>상태</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>관리</th>
                                            </>
                                        )}
                                        {(activeTab === 'courses' || activeTab === 'syllabus') && (
                                            <>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>강의코드</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>강의명</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>담당교수</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>학과</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>수강인원</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>관리</th>
                                            </>
                                        )}
                                        {activeTab === 'users' && (
                                            <>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>ID</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>이름</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>유형</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>학과</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>상태</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>가입일</th>
                                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: '600' }}>관리</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {getFilteredData().map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                            {activeTab === 'announcements' && (
                                                <>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div>
                                                            <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{item.title}</div>
                                                            {item.isPinned && (
                                                                <span style={{
                                                                    padding: '0.2rem 0.5rem',
                                                                    backgroundColor: '#ffc107',
                                                                    color: 'white',
                                                                    borderRadius: '10px',
                                                                    fontSize: '0.7rem',
                                                                    marginRight: '0.5rem'
                                                                }}>
                                                                    고정
                                                                </span>
                                                            )}
                                                            {item.isUrgent && (
                                                                <span style={{
                                                                    padding: '0.2rem 0.5rem',
                                                                    backgroundColor: '#dc3545',
                                                                    color: 'white',
                                                                    borderRadius: '10px',
                                                                    fontSize: '0.7rem'
                                                                }}>
                                                                    긴급
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: '#666' }}>{item.date}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '12px',
                                                            fontSize: '0.8rem',
                                                            backgroundColor: item.priority === 'urgent' ? '#ffebee' : item.priority === 'important' ? '#fff3e0' : '#f3e5f5',
                                                            color: item.priority === 'urgent' ? '#c62828' : item.priority === 'important' ? '#ef6c00' : '#7b1fa2'
                                                        }}>
                                                            {item.priority === 'urgent' ? '긴급' : item.priority === 'important' ? '중요' : '일반'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '12px',
                                                            fontSize: '0.8rem',
                                                            backgroundColor: '#e8f5e8',
                                                            color: '#2e7d32'
                                                        }}>
                                                            게시중
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                onClick={() => openModal('edit', item)}
                                                                style={{
                                                                    padding: '0.25rem 0.75rem',
                                                                    backgroundColor: '#007bff',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.8rem',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                수정
                                                            </button>
                                                            <button
                                                                onClick={() => openModal('delete', item)}
                                                                style={{
                                                                    padding: '0.25rem 0.75rem',
                                                                    backgroundColor: '#dc3545',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.8rem',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                삭제
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                            {(activeTab === 'courses' || activeTab === 'syllabus') && (
                                                <>
                                                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>{item.id}</td>
                                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{item.name}</td>
                                                    <td style={{ padding: '1rem' }}>{item.professor}</td>
                                                    <td style={{ padding: '1rem' }}>{item.department}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            color: item.enrolled >= item.capacity * 0.9 ? '#d32f2f' : '#2e7d32'
                                                        }}>
                                                            {item.enrolled}/{item.capacity}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            {activeTab === 'courses' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => openModal('edit', item)}
                                                                        style={{
                                                                            padding: '0.25rem 0.75rem',
                                                                            backgroundColor: '#007bff',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            fontSize: '0.8rem',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        수정
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openModal('delete', item)}
                                                                        style={{
                                                                            padding: '0.25rem 0.75rem',
                                                                            backgroundColor: '#dc3545',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            fontSize: '0.8rem',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        삭제
                                                                    </button>
                                                                </>
                                                            )}
                                                            {activeTab === 'syllabus' && (
                                                                <button
                                                                    onClick={() => openModal('edit', item)}
                                                                    style={{
                                                                        padding: '0.25rem 0.75rem',
                                                                        backgroundColor: '#28a745',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.8rem',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    계획서 수정
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                            {activeTab === 'users' && (
                                                <>
                                                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{item.id}</td>
                                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{item.name}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '12px',
                                                            fontSize: '0.8rem',
                                                            backgroundColor: item.type === '학생' ? '#e3f2fd' : '#f3e5f5',
                                                            color: item.type === '학생' ? '#1976d2' : '#7b1fa2'
                                                        }}>
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>{item.department}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '12px',
                                                            fontSize: '0.8rem',
                                                            backgroundColor: item.status === '활성' ? '#e8f5e8' : '#ffebee',
                                                            color: item.status === '활성' ? '#2e7d32' : '#c62828'
                                                        }}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: '#666' }}>{item.joinDate}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            {item.status === '활성' && (
                                                                <button
                                                                    onClick={() => handleUserWithdrawal(item)}
                                                                    style={{
                                                                        padding: '0.25rem 0.75rem',
                                                                        backgroundColor: '#ffc107',
                                                                        color: 'black',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.8rem',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    탈퇴처리
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => openModal('delete', item)}
                                                                style={{
                                                                    padding: '0.25rem 0.75rem',
                                                                    backgroundColor: '#dc3545',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.8rem',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                삭제
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* 모달 */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: '#333' }}>
                                {modalType === 'add' ? '추가' : modalType === 'edit' ? '수정' : '삭제 확인'}
                            </h3>
                            <button
                                onClick={closeModal}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#999'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {modalType === 'delete' ? (
                            <div>
                                <p style={{ marginBottom: '1.5rem', color: '#666' }}>
                                    정말로 이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                </p>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={closeModal}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {/* 학사 공지 폼 */}
                                {activeTab === 'announcements' && (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>제목</label>
                                            <input
                                                type="text"
                                                value={formData.title || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>내용</label>
                                            <textarea
                                                value={formData.content || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                                rows="6"
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    resize: 'vertical'
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>우선순위</label>
                                                <select
                                                    value={formData.priority || 'normal'}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                                >
                                                    <option value="normal">일반</option>
                                                    <option value="important">중요</option>
                                                    <option value="urgent">긴급</option>
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isPinned || false}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                                                />
                                                <label>상단 고정</label>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isUrgent || false}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, isUrgent: e.target.checked }))}
                                                />
                                                <label>긴급 공지</label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 강의 관리 폼 */}
                                {activeTab === 'courses' && (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>강의명</label>
                                                <input
                                                    type="text"
                                                    value={formData.name || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>학점</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="4"
                                                    value={formData.credits || 3}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, credits: parseInt(e.target.value) }))}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>담당교수</label>
                                                <input
                                                    type="text"
                                                    value={formData.professor || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, professor: e.target.value }))}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>학과</label>
                                                <select
                                                    value={formData.department || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                                >
                                                    <option value="">학과 선택</option>
                                                    {departments.map(dept => (
                                                        <option key={dept} value={dept}>{dept}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>학년</label>
                                                <select
                                                    value={formData.year || 1}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                                >
                                                    <option value={1}>1학년</option>
                                                    <option value={2}>2학년</option>
                                                    <option value={3}>3학년</option>
                                                    <option value={4}>4학년</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>구분</label>
                                                <select
                                                    value={formData.type || '전공필수'}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                                >
                                                    <option value="전공필수">전공필수</option>
                                                    <option value="전공선택">전공선택</option>
                                                    <option value="교양필수">교양필수</option>
                                                    <option value="교양선택">교양선택</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>정원</label>
                                                <input
                                                    type="number"
                                                    min="10"
                                                    max="200"
                                                    value={formData.capacity || 30}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>시간표</label>
                                                <input
                                                    type="text"
                                                    placeholder="예: 월 10:30-12:00, 수 10:30-12:00"
                                                    value={formData.schedule || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>강의실</label>
                                                <input
                                                    type="text"
                                                    placeholder="예: 새빛관 401호"
                                                    value={formData.room || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 강의계획서 폼 */}
                                {activeTab === 'syllabus' && (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>강의</label>
                                            <select
                                                value={formData.courseId || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px'
                                                }}
                                            >
                                                <option value="">강의 선택</option>
                                                {data.courses.map(course => (
                                                    <option key={course.id} value={course.id}>
                                                        {course.name} ({course.professor})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>강의 개요</label>
                                            <textarea
                                                value={formData.description || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                rows="3"
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>학습 목표</label>
                                            <textarea
                                                value={formData.objectives || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                                                rows="3"
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>평가 방법</label>
                                                <input
                                                    type="text"
                                                    placeholder="예: 중간고사 30%, 기말고사 30%..."
                                                    value={formData.grading || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, grading: e.target.value }))}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>교재</label>
                                                <input
                                                    type="text"
                                                    value={formData.textbook || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, textbook: e.target.value }))}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>선수과목</label>
                                            <input
                                                type="text"
                                                placeholder="예: 프로그래밍기초, 자료구조"
                                                value={formData.prerequisites || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, prerequisites: e.target.value }))}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>주차별 계획</label>
                                            <textarea
                                                value={formData.weeklyPlan || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, weeklyPlan: e.target.value }))}
                                                rows="4"
                                                placeholder="예: 1주차: Java 소개, 2주차: 변수와 데이터타입..."
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                                    <button
                                        onClick={closeModal}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: '#78222D',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {modalType === 'add' ? '추가' : '수정'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;