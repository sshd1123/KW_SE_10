import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import { AnnouncementAPI, ArchiveAPI } from '../../../services/api';
import '../../styles/ProfessorCourseDetailPage.css';

const ProfessorCourseDetailPage = () => {
    const [userData, setUserData] = useState(null);
    const [professorData, setProfessorData] = useState(null);
    const [activeTab, setActiveTab] = useState('courses');
    const [activeSection, setActiveSection] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [courseData, setCourseData] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
    const [showAddAnnouncementModal, setShowAddAnnouncementModal] = useState(false);

    // 공지사항 관련 상태 추가
    const [announcements, setAnnouncements] = useState([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(false);

    const [showUploadModal, setShowUploadModal] = useState(false);

    const [materials, setMaterials] = useState([]);
    const [materialsLoading, setMaterialsLoading] = useState(false);
    const [selectedMaterials, setSelectedMaterials] = useState(new Set());

    const navigate = useNavigate();
    const { courseId } = useParams();

    // 공지사항 삭제 완료 후 콜백
    const handleAnnouncementDeleted = (deletedAnnouncementId) => {
        setAnnouncements(prev =>
            prev.filter(announcement => announcement.id !== deletedAnnouncementId)
        );
    };

    // 공지사항 액션 컴포넌트
    const AnnouncementActions = ({ announcementItem }) => {
        const [isDeleting, setIsDeleting] = useState(false);

        const handleEdit = () => {
            navigate(`/professor/announcement/edit/${courseId}/${announcementItem.id}`);
        };

        const handleDelete = async () => {
            const isConfirmed = window.confirm(
                `'${announcementItem.title}' 공지사항을 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
            );

            if (!isConfirmed) return;

            try {
                setIsDeleting(true);
                console.log('공지사항 삭제 요청:', courseId, announcementItem.id);

                const response = await AnnouncementAPI.deleteAnnouncement(courseId, announcementItem.id);

                if (response.success) {
                    alert('공지사항이 삭제되었습니다.');
                    handleAnnouncementDeleted(announcementItem.id);
                } else {
                    alert(response.message || '공지사항 삭제에 실패했습니다.');
                }
            } catch (error) {
                console.error('공지사항 삭제 오류:', error);
                let errorMessage = '공지사항 삭제 중 오류가 발생했습니다.';
                if (error.message.includes('403')) {
                    errorMessage = '삭제 권한이 없습니다.';
                } else if (error.message.includes('404')) {
                    errorMessage = '삭제할 공지사항을 찾을 수 없습니다.';
                }
                alert(errorMessage);
            } finally {
                setIsDeleting(false);
            }
        };

        return (
            <div className="announcement-actions">
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleEdit}
                >
                    <i className="fas fa-edit"></i> 수정
                </button>
                <button
                    className="btn btn-danger btn-sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                >
                    <i className="fas fa-trash"></i> {isDeleting ? '삭제중...' : '삭제'}
                </button>
            </div>
        );
    };

    // 공지사항 목록 로드
    const loadAnnouncements = async () => {
        try {
            setAnnouncementsLoading(true);

            const response = await AnnouncementAPI.getAnnouncements(courseId, {
                page: 1,
                limit: 20,
                orderBy: 'createdAt',
                order: 'DESC'
            });

            if (response.success) {
                setAnnouncements(response.data.announcements || []);
            } else {
                console.warn('공지사항 로드 실패:', response.message);
                // 로컬 데이터 사용
                const localAnnouncements = getAnnouncementsForCourse(courseId);
                setAnnouncements(localAnnouncements);
            }
        } catch (error) {
            console.error('공지사항 로드 오류:', error);
            // 오류 시 로컬 데이터 사용
            const localAnnouncements = getAnnouncementsForCourse(courseId);
            setAnnouncements(localAnnouncements);
        } finally {
            setAnnouncementsLoading(false);
        }
    };

    // 자료 목록 로드
    const loadMaterials = async () => {
        try {
            setMaterialsLoading(true);

            const response = await ArchiveAPI.getArchives(courseId, {
                page: 1,
                limit: 20,
                orderBy: 'createdAt',
                order: 'DESC'
            });

            if (response && response.success) {
                setMaterials(response.data.archives || []);
            }
        } catch (error) {
            console.warn('자료실 로드 실패 (무시):', error);
            // 에러 무시 - 로컬 데이터나 빈 배열 유지
        } finally {
            setMaterialsLoading(false);
        }
    };

    // 자료 삭제 (교수용)
    const handleDeleteMaterial = async (materialId, materialName) => {
        if (!window.confirm(`'${materialName}' 자료를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        try {
            const response = await ArchiveAPI.deleteArchive(courseId, materialId);

            if (response.success) {
                alert('자료가 삭제되었습니다.');
                loadMaterials(); // 목록 새로고침
            } else {
                alert(response.message || '자료 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('자료 삭제 실패:', error);
            alert('자료 삭제 중 오류가 발생했습니다.');
        }
    };

    // 자료 선택 토글
    const toggleMaterialSelection = (materialId) => {
        const newSelected = new Set(selectedMaterials);
        if (newSelected.has(materialId)) {
            newSelected.delete(materialId);
        } else {
            newSelected.add(materialId);
        }
        setSelectedMaterials(newSelected);
    };

    // 전체 선택/해제
    const toggleSelectAllMaterials = () => {
        if (selectedMaterials.size === materials.length) {
            setSelectedMaterials(new Set());
        } else {
            setSelectedMaterials(new Set(materials.map(material => material.id)));
        }
    };

    // 다중 삭제
    const handleBulkDeleteMaterials = async () => {
        if (selectedMaterials.size === 0) {
            alert('삭제할 자료를 선택해주세요.');
            return;
        }

        if (!window.confirm(`선택한 ${selectedMaterials.size}개의 자료를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        try {
            const response = await ArchiveAPI.bulkDeleteArchives(courseId, Array.from(selectedMaterials));

            if (response.success) {
                alert('선택한 자료들이 삭제되었습니다.');
                setSelectedMaterials(new Set());
                loadMaterials(); // 목록 새로고침
            } else {
                alert(response.message || '자료 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('다중 자료 삭제 실패:', error);
            alert('자료 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleMaterialDownload = async (materialId, materialName) => {
        try {
            console.log('자료 다운로드 요청:', { materialId, materialName });

            // ArchiveAPI를 통한 다운로드 요청
            await ArchiveAPI.downloadArchive(courseId, materialId);

            // 다운로드 성공 시 선택적으로 알림 표시 (사용자 경험에 따라 제거 가능)
            // console.log(`${materialName} 다운로드가 시작되었습니다.`);

        } catch (error) {
            console.error('자료 다운로드 실패:', error);

            // 사용자에게 친화적인 오류 메시지 표시
            let errorMessage = '파일 다운로드에 실패했습니다.';

            if (error.message.includes('404')) {
                errorMessage = '파일을 찾을 수 없습니다.';
            } else if (error.message.includes('403')) {
                errorMessage = '파일에 접근할 권한이 없습니다.';
            } else if (error.message.includes('Network Error')) {
                errorMessage = '네트워크 연결을 확인해주세요.';
            }

            alert(errorMessage);
        }
    };

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }

        const dashboardData = getDashboardData();
        if (!dashboardData) {
            navigate('/professor/dashboard');
            return;
        }

        setUserData(user);
        setProfessorData(dashboardData);

        // URL에서 courseId로 해당 강의 찾기
        const course = dashboardData.courses?.find(c => c.id === decodeURIComponent(courseId));
        if (!course) {
            navigate('/professor/courses');
            return;
        }

        setCourseData(course);
        setLoading(false);

        // 공지사항 로드
        loadAnnouncements();
    }, [navigate, courseId]);

    // activeSection이 announcements로 변경될 때도 로드
    useEffect(() => {
        if (professorData) {
            if (activeSection === 'announcements' && announcements.length === 0) {
                loadAnnouncements();
            }
            if (activeSection === 'materials' && materials.length === 0) {
                loadMaterials();
            }
            if (activeSection === 'materials') {
                loadMaterials();
            }
        }
    }, [activeSection, professorData]);

    useEffect(() => {
        if (professorData && courseData) {
            loadAnnouncements();
            loadMaterials(); // 추가
        }
    }, [professorData, courseData]);

    const getStudentsForCourse = (courseId) => {
        if (!professorData.students) return [];
        return professorData.students.filter(student => student.courseId === courseId);
    };

    const getAssignmentsForCourse = (courseId) => {
        if (!professorData.assignments) return [];
        return professorData.assignments.filter(assignment => assignment.courseId === courseId);
    };

    const getAnnouncementsForCourse = (courseId) => {
        if (!professorData?.announcements) return [];
        return professorData.announcements.filter(announcement => announcement.courseId === courseId);
    };

    const getMaterialsForCourse = (courseId) => {
        if (!professorData.materials) return [];
        return professorData.materials.filter(material => material.courseId === courseId);
    };

    const getAttendanceStats = (students) => {
        if (!students.length) return { excellent: 0, good: 0, warning: 0 };

        const stats = { excellent: 0, good: 0, warning: 0 };
        students.forEach(student => {
            if (student.attendance >= 90) stats.excellent++;
            else if (student.attendance >= 80) stats.good++;
            else stats.warning++;
        });

        return stats;
    };

    const getGradeDistribution = (students) => {
        if (!students.length) return {};

        const distribution = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
        students.forEach(student => {
            if (student.midterm) {
                const grade = student.midterm >= 90 ? 'A' :
                    student.midterm >= 80 ? 'B' :
                        student.midterm >= 70 ? 'C' :
                            student.midterm >= 60 ? 'D' : 'F';
                distribution[grade]++;
            }
        });

        return distribution;
    };

    const handleCreateAnnouncement = () => {
        navigate(`/professor/course/${courseData.id}/announcement/create`);
    };

    const renderOverviewSection = () => {
        if (!courseData) return null;

        const students = getStudentsForCourse(courseData.id);
        const assignments = getAssignmentsForCourse(courseData.id);
        const localAnnouncements = getAnnouncementsForCourse(courseData.id);
        const materials = getMaterialsForCourse(courseData.id);
        const attendanceStats = getAttendanceStats(students);
        const gradeDistribution = getGradeDistribution(students);

        return (
            <div className="course-overview-section">
                {/* 강의 기본 정보 */}
                <div className="course-info-banner">
                    <div className="course-info-content">
                        <div className="course-title-section">
                            <h1>{courseData.name}</h1>
                            <span className="course-code-badge">{courseData.id}</span>
                        </div>
                        <div className="course-basic-info">
                            <div className="info-grid">
                                <div className="info-item">
                                    <i className="fas fa-clock"></i>
                                    <span>{courseData.time}</span>
                                </div>
                                <div className="info-item">
                                    <i className="fas fa-map-marker-alt"></i>
                                    <span>{courseData.room}</span>
                                </div>
                                <div className="info-item">
                                    <i className="fas fa-credit-card"></i>
                                    <span>{courseData.credits}학점</span>
                                </div>
                                <div className="info-item">
                                    <i className="fas fa-users"></i>
                                    <span>{courseData.enrolled}/{courseData.capacity}명</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="course-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowEditModal(true)}
                        >
                            <i className="fas fa-edit"></i> 강의 정보 수정
                        </button>
                        <button className="btn btn-primary">
                            <i className="fas fa-download"></i> 출석부 다운로드
                        </button>
                    </div>
                </div>

                {/* 통계 카드 */}
                <div className="stats-grid">
                    <div className="stat-card primary">
                        <div className="stat-icon">
                            <i className="fas fa-users"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{students.length}</h3>
                            <p>총 수강생</p>
                            <div className="stat-detail">
                                수강률: {Math.round((courseData.enrolled / courseData.capacity) * 100)}%
                            </div>
                        </div>
                    </div>

                    <div className="stat-card success">
                        <div className="stat-icon">
                            <i className="fas fa-tasks"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{assignments.length}</h3>
                            <p>등록된 과제</p>
                            <div className="stat-detail">
                                진행 중: {assignments.filter(a => new Date(a.deadline) > new Date()).length}개
                            </div>
                        </div>
                    </div>

                    <div className="stat-card warning">
                        <div className="stat-icon">
                            <i className="fas fa-bullhorn"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{announcements.length}</h3>
                            <p>공지사항</p>
                            <div className="stat-detail">
                                이번 주: {announcements.filter(a => {
                                    const diff = Math.ceil((new Date() - new Date(a.date || a.createdAt)) / (1000 * 60 * 60 * 24));
                                    return diff <= 7;
                                }).length}개
                            </div>
                        </div>
                    </div>

                    <div className="stat-card info">
                        <div className="stat-icon">
                            <i className="fas fa-folder"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{materials.length}</h3>
                            <p>강의 자료</p>
                            <div className="stat-detail">
                                최근 업로드: {materials.length > 0 ? '3일 전' : '없음'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 상세 분석 */}
                <div className="analysis-grid">
                    <div className="analysis-card">
                        <div className="card-header">
                            <h3>출석률 분석</h3>
                        </div>
                        <div className="card-body">
                            <div className="attendance-chart">
                                <div className="attendance-item excellent">
                                    <div className="attendance-bar" style={{ width: `${students.length > 0 ? (attendanceStats.excellent / students.length) * 100 : 0}%` }}></div>
                                    <span>우수 (90% 이상): {attendanceStats.excellent}명</span>
                                </div>
                                <div className="attendance-item good">
                                    <div className="attendance-bar" style={{ width: `${students.length > 0 ? (attendanceStats.good / students.length) * 100 : 0}%` }}></div>
                                    <span>양호 (80-89%): {attendanceStats.good}명</span>
                                </div>
                                <div className="attendance-item warning">
                                    <div className="attendance-bar" style={{ width: `${students.length > 0 ? (attendanceStats.warning / students.length) * 100 : 0}%` }}></div>
                                    <span>주의 (80% 미만): {attendanceStats.warning}명</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="analysis-card">
                        <div className="card-header">
                            <h3>성적 분포</h3>
                        </div>
                        <div className="card-body">
                            <div className="grade-distribution">
                                {Object.entries(gradeDistribution).map(([grade, count]) => (
                                    <div key={grade} className="grade-item">
                                        <div className="grade-label">{grade}</div>
                                        <div className="grade-bar">
                                            <div
                                                className="grade-fill"
                                                style={{ width: `${students.length > 0 ? (count / students.length) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                        <div className="grade-count">{count}명</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="analysis-card">
                        <div className="card-header">
                            <h3>최근 활동</h3>
                        </div>
                        <div className="card-body">
                            <div className="recent-activities">
                                <div className="activity-item">
                                    <i className="fas fa-upload"></i>
                                    <div>
                                        <span>새로운 강의 자료 업로드</span>
                                        <small>3시간 전</small>
                                    </div>
                                </div>
                                <div className="activity-item">
                                    <i className="fas fa-tasks"></i>
                                    <div>
                                        <span>과제 제출 마감일 연장</span>
                                        <small>1일 전</small>
                                    </div>
                                </div>
                                <div className="activity-item">
                                    <i className="fas fa-bullhorn"></i>
                                    <div>
                                        <span>새로운 공지사항 게시</span>
                                        <small>2일 전</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStudentsSection = () => {
        const students = getStudentsForCourse(courseData.id);

        return (
            <div className="students-management-section">
                <div className="section-header">
                    <h3>수강생 관리</h3>
                    <div className="section-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowAddStudentModal(true)}
                        >
                            <i className="fas fa-user-plus"></i> 학생 추가
                        </button>
                        <button className="btn btn-primary">
                            <i className="fas fa-download"></i> 명단 다운로드
                        </button>
                    </div>
                </div>

                <div className="students-table-container">
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>학번</th>
                                <th>이름</th>
                                <th>학과</th>
                                <th>출석률</th>
                                <th>중간고사</th>
                                <th>기말고사</th>
                                <th>총점</th>
                                <th>등급</th>
                                <th>액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => {
                                const total = (student.midterm || 0) + (student.final || 0);
                                const grade = total >= 90 ? 'A' : total >= 80 ? 'B' : total >= 70 ? 'C' : total >= 60 ? 'D' : 'F';

                                return (
                                    <tr key={student.id}>
                                        <td>{student.id}</td>
                                        <td className="student-name">{student.name}</td>
                                        <td>{student.department}</td>
                                        <td>
                                            <span className={`attendance-badge ${student.attendance >= 90 ? 'excellent' :
                                                student.attendance >= 80 ? 'good' : 'warning'
                                                }`}>
                                                {student.attendance}%
                                            </span>
                                        </td>
                                        <td>{student.midterm || '-'}</td>
                                        <td>{student.final || '-'}</td>
                                        <td className="total-score">{total}</td>
                                        <td>
                                            <span className={`grade-badge grade-${grade.toLowerCase()}`}>
                                                {grade}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn btn-sm btn-secondary">
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button className="btn btn-sm btn-primary">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderAssignmentsSection = () => {
        const assignments = getAssignmentsForCourse(courseData.id);

        return (
            <div className="assignments-management-section">
                <div className="section-header">
                    <h3>과제 관리</h3>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate(`/professor/course/${courseData.id}/assignment/create`)}
                    >
                        <i className="fas fa-plus"></i> 새 과제 등록
                    </button>
                </div>

                <div className="assignments-grid">
                    {assignments.map(assignment => (
                        <div
                            key={assignment.id}
                            className="assignment-card"
                            onClick={() => navigate(`/professor/course/assignment/${assignment.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="assignment-header">
                                <h4>{assignment.title}</h4>
                                <span className="assignment-score">{assignment.maxScore}점</span>
                            </div>
                            <p className="assignment-description">{assignment.description}</p>

                            <div className="assignment-meta">
                                <div className="assignment-deadline">
                                    <i className="fas fa-calendar"></i>
                                    마감: {new Date(assignment.deadline).toLocaleDateString()}
                                </div>
                                <div className="assignment-submissions">
                                    <i className="fas fa-users"></i>
                                    제출: {assignment.submissions}명
                                </div>
                            </div>

                            <div className="assignment-progress">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${(assignment.submissions / courseData.enrolled) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="progress-text">
                                    {assignment.submissions}/{courseData.enrolled}
                                    ({Math.round((assignment.submissions / courseData.enrolled) * 100)}%)
                                </span>
                            </div>

                            <div className="assignment-actions">
                                <button className="btn btn-secondary btn-sm">
                                    <i className="fas fa-eye"></i> 제출물 보기
                                </button>
                                <button className="btn btn-primary btn-sm">
                                    <i className="fas fa-edit"></i> 수정
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // 공지사항 섹션 렌더링 수정
    const renderAnnouncementsSection = () => {
        return (
            <div className="announcements-section">
                <div className="section-header">
                    <h3>공지사항</h3>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/professor/announcement/create/${courseId}`)}
                    >
                        <i className="fas fa-plus"></i> 새 공지
                    </button>
                </div>

                {announcementsLoading ? (
                    <div className="loading">공지사항을 불러오고 있습니다...</div>
                ) : announcements.length > 0 ? (
                    <div className="announcements-list">
                        {announcements.map(announcementItem => (
                            <div key={announcementItem.id} className="announcement-item">
                                <div className="announcement-header">
                                    <h4>
                                        {announcementItem.isUrgent && <span className="urgent-badge">🔥 긴급</span>}
                                        {announcementItem.isPinned && <span className="pinned-badge">📌 고정</span>}
                                        {announcementItem.title}
                                    </h4>
                                    <span className="announcement-date">
                                        {new Date(announcementItem.createdAt || announcementItem.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="announcement-content">
                                    {announcementItem.content?.substring(0, 150)}...
                                </p>
                                <div className="announcement-footer">
                                    <div className="announcement-meta">
                                        <span className="views">👁️ {announcementItem.views || 0}</span>
                                        <span className="author">✍️ {announcementItem.author || userData?.name}</span>
                                    </div>
                                    <AnnouncementActions announcementItem={announcementItem} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>등록된 공지사항이 없습니다.</p>
                        <button
                            onClick={() => navigate(`/professor/announcement/create/${courseId}`)}
                            className="btn btn-primary"
                        >
                            첫 공지사항 작성하기
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderMaterialsSection = () => {
        return (
            <div className="materials-section">
                {/* 자료실 헤더 */}
                <div className="materials-header">
                    <div className="materials-header-left">
                        <h3>📁 강의자료</h3>
                        <p>수업에 필요한 자료를 업로드하고 관리하세요.</p>
                    </div>
                    <div className="materials-header-actions">
                        <button
                            onClick={handleUploadMaterial}
                            className="upload-material-btn"
                        >
                            📤 자료 업로드
                        </button>
                        {selectedMaterials.size > 0 && (
                            <button
                                onClick={handleBulkDeleteMaterials}
                                className="bulk-delete-btn"
                            >
                                🗑️ 선택 삭제 ({selectedMaterials.size})
                            </button>
                        )}
                    </div>
                </div>

                {materialsLoading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>자료를 불러오고 있습니다...</p>
                    </div>
                ) : materials.length > 0 ? (
                    <div className="materials-content">
                        {/* 자료 목록 헤더 */}
                        <div className="materials-list-header">
                            <div className="materials-header-row">
                                <div className="col-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedMaterials.size === materials.length && materials.length > 0}
                                        onChange={toggleSelectAllMaterials}
                                    />
                                </div>
                                <div className="col-icon"></div>
                                <div className="col-name">파일명</div>
                                <div className="col-category">카테고리</div>
                                <div className="col-size">크기</div>
                                <div className="col-date">업로드일</div>
                                <div className="col-downloads">다운로드</div>
                                <div className="col-actions">작업</div>
                            </div>
                        </div>

                        {/* 자료 목록 */}
                        <div className="materials-list">
                            {materials.map(material => (
                                <div
                                    key={material.id}
                                    className="material-item"
                                    onClick={() => handleMaterialClick(material.id)}
                                >
                                    <div className="material-row">
                                        <div className="col-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={selectedMaterials.has(material.id)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    toggleMaterialSelection(material.id);
                                                }}
                                            />
                                        </div>
                                        <div className="col-icon">
                                            <span
                                                className="material-icon"
                                                style={{ color: getFileTypeColor(material.name) }}
                                            >
                                                {getFileIcon(material.type)}
                                            </span>
                                        </div>
                                        <div className="col-name">
                                            <div className="material-name">{material.name}</div>
                                            {material.description && (
                                                <div className="material-description">{material.description}</div>
                                            )}
                                        </div>
                                        <div className="col-category">
                                            <span className={`category-badge category-${material.category}`}>
                                                {material.category === 'lecture' ? '강의자료' :
                                                    material.category === 'assignment' ? '과제자료' :
                                                        material.category === 'exam' ? '시험자료' :
                                                            material.category === 'reference' ? '참고자료' :
                                                                material.category || '기타'}
                                            </span>
                                        </div>
                                        <div className="col-size">
                                            {formatFileSize(material.size)}
                                        </div>
                                        <div className="col-date">
                                            {new Date(material.uploadDate || material.createdAt).toLocaleDateString('ko-KR')}
                                        </div>
                                        <div className="col-downloads">
                                            {material.downloads || 0}회
                                        </div>
                                        <div className="col-actions">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMaterialDownload(material.id, material.name);
                                                }}
                                                className="action-btn download-btn"
                                                title="다운로드"
                                            >
                                                💾
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/professor/course/${courseId}/archive/${material.id}/edit`);
                                                }}
                                                className="action-btn edit-btn"
                                                title="수정"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteMaterial(material.id, material.name);
                                                }}
                                                className="action-btn delete-btn"
                                                title="삭제"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">📁</div>
                        <h3>등록된 자료가 없습니다</h3>
                        <p>수업에 필요한 자료를 업로드해보세요.</p>
                        <button
                            onClick={handleUploadMaterial}
                            className="upload-material-btn-primary"
                        >
                            첫 번째 자료 업로드하기
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // 자료 클릭 핸들러 추가
    const handleMaterialClick = (materialId) => {
        navigate(`/professor/course/${courseId}/archive/${materialId}`);
    };

    // 자료 업로드 버튼 클릭 핸들러
    const handleUploadMaterial = () => {
        navigate(`/professor/course/${courseId}/archive/upload`);
    };

    const getFileTypeColor = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        const colorMap = {
            'pdf': '#f44336',
            'doc': '#2196f3',
            'docx': '#2196f3',
            'ppt': '#ff9800',
            'pptx': '#ff9800',
            'xls': '#4caf50',
            'xlsx': '#4caf50',
            'zip': '#9c27b0',
            'rar': '#9c27b0',
            'jpg': '#e91e63',
            'jpeg': '#e91e63',
            'png': '#e91e63',
            'mp4': '#3f51b5',
            'avi': '#3f51b5',
            'txt': '#795548'
        };
        return colorMap[extension] || '#607d8b';
    };

    const getFileIcon = (fileType) => {
        const iconMap = {
            'application/pdf': '📄',
            'application/msword': '📝',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
            'application/vnd.ms-excel': '📊',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
            'application/vnd.ms-powerpoint': '📽️',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📽️',
            'image/jpeg': '🖼️',
            'image/jpg': '🖼️',
            'image/png': '🖼️',
            'image/gif': '🖼️',
            'application/zip': '🗜️',
            'application/x-rar-compressed': '🗜️',
            'video/mp4': '🎥',
            'video/avi': '🎥',
            'text/plain': '📄'
        };
        return iconMap[fileType] || '📎';
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>강의 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

    if (!courseData) {
        return (
            <div className="error-container">
                <p>강의를 찾을 수 없습니다.</p>
                <button onClick={() => navigate('/professor/courses')}>
                    강의 목록으로 돌아가기
                </button>
            </div>
        );
    }

    return (
        <div className="professor-dashboard">
            <Header username={userData?.name || '교수님'} role="교수" />

            <div className="dashboard-main">
                <ProfessorSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    professorName={userData?.name || ''}
                    professorId={userData?.professorId || ''}
                    department={userData?.department || ''}
                />

                <div className="dashboard-content">
                    <div className="breadcrumb">
                        <span onClick={() => navigate('/professor/courses')} className="breadcrumb-link">
                            강의 관리
                        </span>
                        <i className="fas fa-chevron-right"></i>
                        <span className="breadcrumb-current">{courseData.name}</span>
                    </div>

                    <div className="course-detail-container">
                        {/* 탭 네비게이션 */}
                        <div className="course-detail-tabs">
                            <button
                                className={`tab-button ${activeSection === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveSection('overview')}
                            >
                                <i className="fas fa-chart-pie"></i> 개요
                            </button>
                            <button
                                className={`tab-button ${activeSection === 'students' ? 'active' : ''}`}
                                onClick={() => setActiveSection('students')}
                            >
                                <i className="fas fa-users"></i> 수강생
                            </button>
                            <button
                                className={`tab-button ${activeSection === 'assignments' ? 'active' : ''}`}
                                onClick={() => setActiveSection('assignments')}
                            >
                                <i className="fas fa-tasks"></i> 과제
                            </button>
                            <button
                                className={`tab-button ${activeSection === 'announcements' ? 'active' : ''}`}
                                onClick={() => setActiveSection('announcements')}
                            >
                                <i className="fas fa-bullhorn"></i> 공지사항
                            </button>
                            <button
                                className={`tab-button ${activeSection === 'materials' ? 'active' : ''}`}
                                onClick={() => setActiveSection('materials')}
                            >
                                <i className="fas fa-folder"></i> 강의자료
                            </button>
                        </div>

                        {/* 탭 콘텐츠 */}
                        <div className="course-detail-content">
                            {activeSection === 'overview' && renderOverviewSection()}
                            {activeSection === 'students' && renderStudentsSection()}
                            {activeSection === 'assignments' && renderAssignmentsSection()}
                            {activeSection === 'announcements' && renderAnnouncementsSection()}
                            {activeSection === 'materials' && renderMaterialsSection()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfessorCourseDetailPage;