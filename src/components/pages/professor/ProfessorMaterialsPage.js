import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getDashboardData, getCurrentUser } from '../../../data/authUtils';
import '../../styles/ProfessorMaterialsPage.css';

const ProfessorMaterialsPage = () => {
    const [userData, setUserData] = useState(null);
    const [professorData, setProfessorData] = useState(null);
    const [activeTab, setActiveTab] = useState('materials');
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [currentFolder, setCurrentFolder] = useState('root');
    const [materialType, setMaterialType] = useState('all');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();

    // 더미 강의자료 데이터
    const [materials, setMaterials] = useState([
        {
            id: 1,
            name: '1주차 강의자료 - 프로그래밍 개요',
            type: 'pdf',
            size: 2048576, // 2MB
            courseId: 'I020-2-0123-01',
            courseName: '자바프로그래밍',
            uploadDate: '2025-03-02',
            downloads: 42,
            folder: 'root',
            description: '프로그래밍의 기본 개념과 자바 언어 소개',
            visibility: 'public',
            category: 'lecture'
        },
        {
            id: 2,
            name: '실습 예제 파일들',
            type: 'zip',
            size: 5242880, // 5MB
            courseId: 'I020-2-0123-01',
            courseName: '자바프로그래밍',
            uploadDate: '2025-03-05',
            downloads: 38,
            folder: 'root',
            description: '1-3주차 실습용 예제 소스코드',
            visibility: 'public',
            category: 'practice'
        },
        {
            id: 3,
            name: '과제 1 안내서',
            type: 'docx',
            size: 512000, // 512KB
            courseId: 'I020-2-0123-01',
            courseName: '자바프로그래밍',
            uploadDate: '2025-03-08',
            downloads: 45,
            folder: 'assignments',
            description: '첫 번째 과제에 대한 상세 안내',
            visibility: 'public',
            category: 'assignment'
        },
        {
            id: 4,
            name: '중간고사 대비 정리자료',
            type: 'pdf',
            size: 3145728, // 3MB
            courseId: 'I020-2-0123-01',
            courseName: '자바프로그래밍',
            uploadDate: '2025-04-10',
            downloads: 52,
            folder: 'exams',
            description: '중간고사 범위 및 핵심 정리',
            visibility: 'public',
            category: 'exam'
        },
        {
            id: 5,
            name: '소프트웨어 설계 패턴',
            type: 'pptx',
            size: 4194304, // 4MB
            courseId: 'I020-4-0256-01',
            courseName: '고급 소프트웨어 설계',
            uploadDate: '2025-03-15',
            downloads: 28,
            folder: 'root',
            description: '디자인 패턴의 종류와 적용 방법',
            visibility: 'public',
            category: 'lecture'
        },
        {
            id: 6,
            name: '참고 동영상 링크 모음',
            type: 'txt',
            size: 8192, // 8KB
            courseId: 'I020-4-0256-01',
            courseName: '고급 소프트웨어 설계',
            uploadDate: '2025-03-20',
            downloads: 15,
            folder: 'references',
            description: '추천 동영상 강의 링크 및 설명',
            visibility: 'public',
            category: 'reference'
        }
    ]);

    // 폴더 구조
    const folders = [
        { id: 'root', name: '루트', parent: null },
        { id: 'assignments', name: '과제자료', parent: 'root' },
        { id: 'exams', name: '시험자료', parent: 'root' },
        { id: 'references', name: '참고자료', parent: 'root' },
        { id: 'videos', name: '동영상', parent: 'root' }
    ];

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
        setLoading(false);
    }, [navigate]);

    // 필터링된 자료 목록 가져오기
    const getFilteredMaterials = () => {
        let filteredMaterials = materials.filter(material => material.folder === currentFolder);

        // 강의별 필터링
        if (selectedCourse !== 'all') {
            filteredMaterials = filteredMaterials.filter(material => material.courseId === selectedCourse);
        }

        // 자료 유형 필터링
        if (materialType !== 'all') {
            filteredMaterials = filteredMaterials.filter(material => material.category === materialType);
        }

        // 검색어 필터링
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            filteredMaterials = filteredMaterials.filter(material =>
                material.name.toLowerCase().includes(term) ||
                material.description.toLowerCase().includes(term) ||
                material.courseName.toLowerCase().includes(term)
            );
        }

        // 정렬
        filteredMaterials.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.uploadDate) - new Date(a.uploadDate);
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'size':
                    return b.size - a.size;
                case 'downloads':
                    return b.downloads - a.downloads;
                case 'course':
                    return a.courseName.localeCompare(b.courseName);
                default:
                    return 0;
            }
        });

        return filteredMaterials;
    };

    // 파일 크기 포맷팅
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    };

    // 파일 타입별 아이콘
    const getFileIcon = (type) => {
        switch (type.toLowerCase()) {
            case 'pdf':
                return 'fas fa-file-pdf';
            case 'doc':
            case 'docx':
                return 'fas fa-file-word';
            case 'ppt':
            case 'pptx':
                return 'fas fa-file-powerpoint';
            case 'xls':
            case 'xlsx':
                return 'fas fa-file-excel';
            case 'zip':
            case 'rar':
                return 'fas fa-file-archive';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return 'fas fa-file-image';
            case 'mp4':
            case 'avi':
            case 'mov':
                return 'fas fa-file-video';
            case 'mp3':
            case 'wav':
                return 'fas fa-file-audio';
            case 'txt':
                return 'fas fa-file-alt';
            default:
                return 'fas fa-file';
        }
    };

    // 자료 선택 토글
    const toggleMaterialSelection = (materialId) => {
        setSelectedMaterials(prev =>
            prev.includes(materialId)
                ? prev.filter(id => id !== materialId)
                : [...prev, materialId]
        );
    };

    // 전체 선택/해제
    const toggleAllSelection = () => {
        const filteredMaterials = getFilteredMaterials();
        const allSelected = filteredMaterials.every(material => selectedMaterials.includes(material.id));

        if (allSelected) {
            setSelectedMaterials([]);
        } else {
            setSelectedMaterials(filteredMaterials.map(material => material.id));
        }
    };

    // 파일 업로드 처리
    const handleFileUpload = (files) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);

        // 업로드 시뮬레이션
        const uploadSimulation = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(uploadSimulation);
                    setIsUploading(false);
                    setShowUploadModal(false);

                    // 새 파일을 자료 목록에 추가 (시뮬레이션)
                    const newMaterials = Array.from(files).map((file, index) => ({
                        id: materials.length + index + 1,
                        name: file.name,
                        type: file.name.split('.').pop().toLowerCase(),
                        size: file.size,
                        courseId: selectedCourse !== 'all' ? selectedCourse : professorData.courses[0]?.id,
                        courseName: selectedCourse !== 'all'
                            ? professorData.courses.find(c => c.id === selectedCourse)?.name
                            : professorData.courses[0]?.name,
                        uploadDate: new Date().toISOString().split('T')[0],
                        downloads: 0,
                        folder: currentFolder,
                        description: '새로 업로드된 자료',
                        visibility: 'public',
                        category: 'lecture'
                    }));

                    setMaterials(prev => [...prev, ...newMaterials]);
                    alert(`${files.length}개 파일이 업로드되었습니다.`);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);
    };

    // 자료 삭제
    const deleteMaterials = (materialIds) => {
        if (window.confirm(`선택한 ${materialIds.length}개 자료를 삭제하시겠습니까?`)) {
            setMaterials(prev => prev.filter(material => !materialIds.includes(material.id)));
            setSelectedMaterials([]);
            alert('선택한 자료가 삭제되었습니다.');
        }
    };

    // 자료 다운로드
    const downloadMaterial = (materialId) => {
        const material = materials.find(m => m.id === materialId);
        if (material) {
            // 다운로드 수 증가
            setMaterials(prev => prev.map(m =>
                m.id === materialId
                    ? { ...m, downloads: m.downloads + 1 }
                    : m
            ));
            alert(`${material.name} 다운로드가 시작됩니다.`);
        }
    };

    // 폴더 이동
    const navigateToFolder = (folderId) => {
        setCurrentFolder(folderId);
        setSelectedMaterials([]);
    };

    // 현재 폴더 정보 가져오기
    const getCurrentFolder = () => {
        return folders.find(folder => folder.id === currentFolder);
    };

    // 상위 폴더로 이동
    const goToParentFolder = () => {
        const current = getCurrentFolder();
        if (current && current.parent) {
            navigateToFolder(current.parent);
        }
    };

    // 통계 계산
    const getStatistics = () => {
        const totalMaterials = materials.length;
        const totalSize = materials.reduce((sum, material) => sum + material.size, 0);
        const totalDownloads = materials.reduce((sum, material) => sum + material.downloads, 0);
        const recentUploads = materials.filter(material => {
            const uploadDate = new Date(material.uploadDate);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return uploadDate > weekAgo;
        }).length;

        return {
            total: totalMaterials,
            totalSize: formatFileSize(totalSize),
            totalDownloads,
            recent: recentUploads
        };
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>강의 자료를 불러오는 중입니다...</p>
            </div>
        );
    }

    if (!professorData) {
        return (
            <div className="error-container">
                <p>교수 데이터를 불러올 수 없습니다. 다시 로그인해주세요.</p>
                <button onClick={() => navigate('/login')}>로그인 페이지로 이동</button>
            </div>
        );
    }

    const filteredMaterials = getFilteredMaterials();
    const statistics = getStatistics();

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
                    <div className="welcome-banner">
                        <h2>강의 자료 관리</h2>
                        <p>{professorData.personal?.department || ''} / 사번: {userData?.professorId}</p>
                    </div>

                    {/* 통계 카드 */}
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-file"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.total}</div>
                                <div className="stat-label">총 자료 수</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-hdd"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.totalSize}</div>
                                <div className="stat-label">총 용량</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-download"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.totalDownloads}</div>
                                <div className="stat-label">총 다운로드</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-clock"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{statistics.recent}</div>
                                <div className="stat-label">최근 업로드</div>
                            </div>
                        </div>
                    </div>

                    {/* 자료 관리 메인 카드 */}
                    <div className="card materials-management-card">
                        <div className="card-header">
                            <div className="materials-header-left">
                                <h3>강의 자료</h3>
                                {/* 폴더 네비게이션 */}
                                <div className="folder-navigation">
                                    {currentFolder !== 'root' && (
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={goToParentFolder}
                                        >
                                            <i className="fas fa-arrow-left"></i> 상위 폴더
                                        </button>
                                    )}
                                    <span className="current-folder">
                                        <i className="fas fa-folder"></i> {getCurrentFolder()?.name}
                                    </span>
                                </div>
                            </div>

                            <div className="materials-header-right">
                                <div className="view-toggle">
                                    <button
                                        className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <i className="fas fa-th"></i>
                                    </button>
                                    <button
                                        className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <i className="fas fa-list"></i>
                                    </button>
                                </div>
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setShowCreateFolderModal(true)}
                                >
                                    <i className="fas fa-folder-plus"></i> 폴더 생성
                                </button>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setShowUploadModal(true)}
                                >
                                    <i className="fas fa-upload"></i> 자료 업로드
                                </button>
                            </div>
                        </div>

                        {/* 필터 및 검색 영역 */}
                        <div className="materials-filters">
                            <div className="filter-row">
                                <div className="filter-group">
                                    <label>강의 선택:</label>
                                    <select
                                        value={selectedCourse}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">전체 강의</option>
                                        {professorData.courses?.map(course => (
                                            <option key={course.id} value={course.id}>
                                                {course.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label>자료 유형:</label>
                                    <select
                                        value={materialType}
                                        onChange={(e) => setMaterialType(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">전체</option>
                                        <option value="lecture">강의자료</option>
                                        <option value="assignment">과제</option>
                                        <option value="exam">시험</option>
                                        <option value="reference">참고자료</option>
                                        <option value="practice">실습</option>
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label>정렬 기준:</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="date">업로드일순</option>
                                        <option value="name">이름순</option>
                                        <option value="size">크기순</option>
                                        <option value="downloads">다운로드순</option>
                                        <option value="course">강의순</option>
                                    </select>
                                </div>

                                <div className="search-group">
                                    <div className="search-container">
                                        <input
                                            type="text"
                                            placeholder="파일명, 설명으로 검색"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="search-input"
                                        />
                                        <i className="fas fa-search search-icon"></i>
                                    </div>
                                </div>
                            </div>

                            {/* 선택된 자료 일괄 작업 */}
                            {selectedMaterials.length > 0 && (
                                <div className="bulk-actions">
                                    <span className="selected-count">
                                        {selectedMaterials.length}개 선택됨
                                    </span>
                                    <div className="bulk-buttons">
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={() => {
                                                selectedMaterials.forEach(id => downloadMaterial(id));
                                                setSelectedMaterials([]);
                                            }}
                                        >
                                            <i className="fas fa-download"></i> 다운로드
                                        </button>
                                        <button
                                            className="btn btn-outline btn-sm text-danger"
                                            onClick={() => deleteMaterials(selectedMaterials)}
                                        >
                                            <i className="fas fa-trash"></i> 삭제
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 자료 목록 */}
                        <div className="materials-content">
                            {filteredMaterials.length > 0 ? (
                                viewMode === 'grid' ? (
                                    <div className="materials-grid">
                                        {filteredMaterials.map(material => (
                                            <div key={material.id} className="material-card">
                                                <div className="material-card-header">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMaterials.includes(material.id)}
                                                        onChange={() => toggleMaterialSelection(material.id)}
                                                        className="material-checkbox"
                                                    />
                                                    <div className="material-type-badge">
                                                        {material.category}
                                                    </div>
                                                </div>

                                                <div className="material-card-body">
                                                    <div className="material-icon">
                                                        <i className={getFileIcon(material.type)}></i>
                                                    </div>
                                                    <h4 className="material-title">{material.name}</h4>
                                                    <p className="material-description">{material.description}</p>

                                                    <div className="material-meta">
                                                        <div className="meta-item">
                                                            <i className="fas fa-book"></i>
                                                            <span>{material.courseName}</span>
                                                        </div>
                                                        <div className="meta-item">
                                                            <i className="fas fa-calendar"></i>
                                                            <span>{material.uploadDate}</span>
                                                        </div>
                                                        <div className="meta-item">
                                                            <i className="fas fa-download"></i>
                                                            <span>{material.downloads}회</span>
                                                        </div>
                                                        <div className="meta-item">
                                                            <i className="fas fa-hdd"></i>
                                                            <span>{formatFileSize(material.size)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="material-card-footer">
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => downloadMaterial(material.id)}
                                                    >
                                                        <i className="fas fa-download"></i> 다운로드
                                                    </button>
                                                    <div className="material-actions">
                                                        <button className="btn btn-outline btn-sm">
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-outline btn-sm text-danger"
                                                            onClick={() => deleteMaterials([material.id])}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="materials-table-container">
                                        <table className="materials-table">
                                            <thead>
                                                <tr>
                                                    <th>
                                                        <input
                                                            type="checkbox"
                                                            checked={filteredMaterials.length > 0 && filteredMaterials.every(m => selectedMaterials.includes(m.id))}
                                                            onChange={toggleAllSelection}
                                                        />
                                                    </th>
                                                    <th>파일명</th>
                                                    <th>강의</th>
                                                    <th>유형</th>
                                                    <th>크기</th>
                                                    <th>업로드일</th>
                                                    <th>다운로드</th>
                                                    <th>작업</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredMaterials.map(material => (
                                                    <tr key={material.id}>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedMaterials.includes(material.id)}
                                                                onChange={() => toggleMaterialSelection(material.id)}
                                                            />
                                                        </td>
                                                        <td className="material-name-cell">
                                                            <div className="material-name-wrapper">
                                                                <i className={getFileIcon(material.type)}></i>
                                                                <div className="material-name-info">
                                                                    <div className="material-name">{material.name}</div>
                                                                    <div className="material-description">{material.description}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>{material.courseName}</td>
                                                        <td>
                                                            <span className={`type-badge type-${material.category}`}>
                                                                {material.category}
                                                            </span>
                                                        </td>
                                                        <td>{formatFileSize(material.size)}</td>
                                                        <td>{material.uploadDate}</td>
                                                        <td>{material.downloads}회</td>
                                                        <td className="action-buttons">
                                                            <button
                                                                className="btn btn-primary btn-sm"
                                                                onClick={() => downloadMaterial(material.id)}
                                                            >
                                                                <i className="fas fa-download"></i>
                                                            </button>
                                                            <button className="btn btn-outline btn-sm">
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-outline btn-sm text-danger"
                                                                onClick={() => deleteMaterials([material.id])}
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            ) : (
                                <div className="no-materials-message">
                                    <p>자료가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfessorMaterialsPage;