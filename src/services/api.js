const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }

  // 토큰 업데이트 메서드
  updateToken(newToken) {
    this.token = newToken;
    if (newToken) {
      localStorage.setItem('authToken', newToken);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API 요청 실패:', error);
      throw error;
    }
  }

  // ✅ GET 메서드
  async get(endpoint) {
    return this.request(endpoint, {
      method: 'GET'
    });
  }

  // ✅ POST 메서드
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ✅ PATCH 메서드 (수정용)
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // ✅ PUT 메서드 (전체 교체용)
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // ✅ DELETE 메서드
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
}

// 강의 API
export const CourseAPI = {
  // 강의 검색
  searchCourses: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiService.get(queryString ? `/course/search?${queryString}` : '/course/search');
  },

  // 특정 강의 정보 조회
  getCourse: async (courseId) => {
    return apiService.get(`/course/${courseId}`);
  },

  // 수강신청 가능 강의 목록
  getAvailableCourses: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiService.get(queryString ? `/course/available?${queryString}` : '/course/available');
  },

  // 강의 생성 (관리자용)
  createCourse: async (courseData) => {
    return apiService.post('/course', courseData);
  },

  // 강의 정보 수정
  updateCourse: async (courseId, courseData) => {
    return apiService.patch(`/course/${courseId}`, courseData);
  },

  // 강의 삭제 (관리자용)
  deleteCourse: async (courseId) => {
    return apiService.delete(`/course/${courseId}`);
  }
};

// 수강신청 API
export const EnrollmentAPI = {
  // 내 강의 목록 조회
  getMyCourses: async () => {
    return apiService.get('/enrollment/my-courses');
  },

  // 수강신청
  enroll: async (enrollmentData) => {
    return apiService.post('/enrollment', enrollmentData);
  },

  // 수강철회
  dropCourse: async (enrollmentId) => {
    return apiService.delete(`/enrollment/${enrollmentId}`);
  },

  // 성적 입력 (교수용)
  updateGrade: async (enrollmentId, gradeData) => {
    return apiService.patch(`/enrollment/${enrollmentId}/grade`, gradeData);
  },

  // 성적 조회 (학생용)
  getGrades: async () => {
    return apiService.get('/enrollment/grades');
  },

  // 특정 강의의 수강생 목록 (교수용)
  getCourseEnrollments: async (courseId) => {
    return apiService.get(`/enrollment/course/${courseId}`);
  },

  // 특정 수강생의 성적 조회
  getStudentGrade: async (enrollmentId) => {
    return apiService.get(`/enrollment/${enrollmentId}/grade`);
  },

  // 강의별 전체 성적 조회 (교수용)
  getCourseGrades: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/course/${courseId}/grades?${queryString}`
      : `/course/${courseId}/grades`;
    return apiService.get(endpoint);
  },

  // 일괄 성적 입력 (교수용)
  bulkUpdateGrades: async (courseId, gradesData) => {
    return apiService.post(`/course/${courseId}/grades/bulk`, { grades: gradesData });
  },

  // 성적 통계 조회
  getGradeStatistics: async (courseId) => {
    return apiService.get(`/course/${courseId}/grades/statistics`);
  },

  // 성적표 내보내기 (엑셀)
  exportGrades: async (courseId, format = 'xlsx') => {
    const response = await fetch(`${apiService.baseURL}/course/${courseId}/grades/export?format=${format}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiService.token}` }
    });

    if (!response.ok) {
      throw new Error(`성적표 내보내기 실패: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grades_${courseId}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { success: true, message: '성적표 다운로드가 시작되었습니다.' };
  }
};

// 공지사항 API
export const AnnouncementAPI = {
  // 공지사항 목록 조회
  getAnnouncements: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/course/${courseId}/announcement?${queryString}`
      : `/course/${courseId}/announcement`;

    return apiService.get(endpoint);
  },

  // 특정 공지사항 조회
  getAnnouncement: async (courseId, announcementId) => {
    return apiService.get(`/course/${courseId}/announcement/${announcementId}`);
  },

  // 공지사항 작성
  createAnnouncement: async (courseId, announcementData) => {
    return apiService.post(`/course/${courseId}/announcement`, announcementData);
  },

  // 공지사항 수정
  updateAnnouncement: async (courseId, announcementId, announcementData) => {
    return apiService.patch(`/course/${courseId}/announcement/${announcementId}`, announcementData);
  },

  // 공지사항 삭제
  deleteAnnouncement: async (courseId, announcementId) => {
    return apiService.delete(`/course/${courseId}/announcement/${announcementId}`);
  },

  // 공지사항 조회수 증가
  incrementViews: async (courseId, announcementId) => {
    return apiService.patch(`/course/${courseId}/announcement/${announcementId}/views`);
  }
};

// 자료실 API
export const ArchiveAPI = {
  // 자료 목록 조회
  getArchives: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/course/${courseId}/archive?${queryString}`
      : `/course/${courseId}/archive`;

    return apiService.get(endpoint);
  },

  // 특정 자료 정보 조회
  getArchive: async (courseId, archiveId) => {
    return apiService.get(`/course/${courseId}/archive/${archiveId}`);
  },

  // 파일 업로드 (multipart/form-data)
  uploadArchive: async (courseId, formData, options = {}) => {
    const url = `${apiService.baseURL}/course/${courseId}/archive`;

    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiService.token}`
        // Content-Type은 FormData 사용 시 자동 설정됨
      },
      body: formData,
      ...options
    };

    // 업로드 진행률 콜백이 있는 경우
    if (options.onUploadProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded * 100) / e.total);
            options.onUploadProgress({ loaded: e.loaded, total: e.total, progress });
          }
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error'));

        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', `Bearer ${apiService.token}`);
        xhr.send(formData);
      });
    }

    // 일반 fetch 사용
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  },

  // 자료 정보 수정
  updateArchive: async (courseId, archiveId, archiveData) => {
    return apiService.patch(`/course/${courseId}/archive/${archiveId}`, archiveData);
  },

  // 자료 삭제
  deleteArchive: async (courseId, archiveId) => {
    return apiService.delete(`/course/${courseId}/archive/${archiveId}`);
  },

  // 자료 다운로드
  downloadArchive: async (courseId, archiveId) => {
    const response = await fetch(`${apiService.baseURL}/course/${courseId}/archive/${archiveId}/download`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiService.token}` }
    });

    if (!response.ok) {
      throw new Error(`다운로드 실패: ${response.status}`);
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('content-disposition');
    let filename = `archive_${archiveId}`;

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) filename = match[1];
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { success: true, message: '다운로드가 시작되었습니다.' };
  },

  // 다운로드 카운트 증가
  incrementDownloadCount: async (courseId, archiveId) => {
    return apiService.patch(`/course/${courseId}/archive/${archiveId}/download-count`);
  },

  // 폴더별 자료 조회
  getArchivesByFolder: async (courseId, folderId = 'root') => {
    return apiService.get(`/course/${courseId}/archive/folder/${folderId}`);
  },

  // 다중 자료 삭제
  bulkDeleteArchives: async (courseId, archiveIds) => {
    return apiService.delete(`/course/${courseId}/archive/bulk`, { archiveIds });
  }
};

// 과제 API
export const AssignmentAPI = {
  // 과제 목록 조회
  getAssignments: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/course/${courseId}/assignment?${queryString}`
      : `/course/${courseId}/assignment`;

    return apiService.get(endpoint);
  },

  // 특정 과제 조회
  getAssignment: async (courseId, assignmentId) => {
    return apiService.get(`/course/${courseId}/assignment/${assignmentId}`);
  },

  // 과제 생성
  createAssignment: async (courseId, assignmentData) => {
    return apiService.post(`/course/${courseId}/assignment`, assignmentData);
  },

  // 과제 수정
  updateAssignment: async (courseId, assignmentId, assignmentData) => {
    return apiService.patch(`/course/${courseId}/assignment/${assignmentId}`, assignmentData);
  },

  // 과제 삭제
  deleteAssignment: async (courseId, assignmentId) => {
    return apiService.delete(`/course/${courseId}/assignment/${assignmentId}`);
  },

  // 과제 제출
  submitAssignment: async (courseId, assignmentId, submissionData) => {
    return apiService.post(`/course/${courseId}/assignment/${assignmentId}/submit`, submissionData);
  },

  // 과제 제출 목록 조회 (교수용)
  getSubmissions: async (courseId, assignmentId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/course/${courseId}/assignment/${assignmentId}/submissions?${queryString}`
      : `/course/${courseId}/assignment/${assignmentId}/submissions`;

    return apiService.get(endpoint);
  },

  // 특정 제출물 조회
  getSubmission: async (courseId, assignmentId, submissionId) => {
    return apiService.get(`/course/${courseId}/assignment/${assignmentId}/submission/${submissionId}`);
  },

  // 제출물 평가
  gradeSubmission: async (courseId, assignmentId, submissionId, gradeData) => {
    return apiService.patch(`/course/${courseId}/assignment/${assignmentId}/submission/${submissionId}`, gradeData);
  }
};

// 인증 API
export const AuthAPI = {
  // 회원가입
  register: async (userData) => {
    return apiService.post('/auth/register', userData);
  },

  // 로그인
  login: async (credentials) => {
    const response = await apiService.post('/auth/login', credentials);

    // 성공 시 토큰 저장
    if (response.success && response.token) {
      apiService.updateToken(response.token);
      localStorage.setItem('userData', JSON.stringify(response.user));
    }

    return response;
  },

  // 로그아웃
  logout: async () => {
    const response = await apiService.post('/auth/logout');

    // 로컬 데이터 정리
    apiService.updateToken(null);
    localStorage.removeItem('userData');

    return response;
  },

  // 토큰 검증
  verifyToken: async () => {
    return apiService.get('/auth/verify');
  },

  // 비밀번호 변경
  changePassword: async (passwordData) => {
    return apiService.patch('/auth/password', passwordData);
  }
};

// API 서비스 인스턴스
export const apiService = new ApiService();