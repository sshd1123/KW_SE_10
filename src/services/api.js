const API_BASE_URL = 'http://localhost:3000/api';

// HTTP 클라이언트 설정
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // 기본 요청 헤더 설정
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }

  // 기본 fetch 래퍼
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API 요청 실패:', error);
      throw error;
    }
  }

  // GET 요청
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST 요청
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PATCH 요청
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // DELETE 요청
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const apiService = new ApiService();

// 1. 인증 관련 API
export const AuthAPI = {
  // 회원가입
  register: async (userData) => {
    const response = await apiService.post('/auth/register', userData);
    return response;
  },

  // 로그인
  login: async (credentials) => {
    const response = await apiService.post('/auth/login', credentials);
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      apiService.token = response.token;
    }
    return response;
  },

  // 로그아웃
  logout: async () => {
    const response = await apiService.post('/auth/logout');
    localStorage.removeItem('authToken');
    apiService.token = null;
    return response;
  }
};

// 2. 강의 관련 API
export const CourseAPI = {
  // 강의 검색
  searchCourses: async (query) => {
    return apiService.get(`/course/search?q=${encodeURIComponent(query)}`);
  },

  // 특정 강의 정보 조회
  getCourse: async (courseId) => {
    return apiService.get(`/course/${courseId}`);
  }
};

// 3. 공지사항 관련 API
export const AnnouncementAPI = {
  // 공지사항 목록 조회
  getAnnouncements: async (courseId) => {
    return apiService.get(`/course/${courseId}/announcement`);
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
  }
};

// 4. 자료실 관련 API
export const ArchiveAPI = {
  // 자료 목록 조회
  getArchives: async (courseId) => {
    return apiService.get(`/course/${courseId}/archive`);
  },

  // 자료 업로드
  uploadArchive: async (courseId, formData) => {
    // 파일 업로드의 경우 별도 처리
    const url = `${API_BASE_URL}/course/${courseId}/archive`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiService.token}`
      },
      body: formData // FormData 객체
    });
    return response.json();
  },

  // 자료 수정
  updateArchive: async (courseId, archiveId, archiveData) => {
    return apiService.patch(`/course/${courseId}/archive/${archiveId}`, archiveData);
  },

  // 자료 삭제
  deleteArchive: async (courseId, archiveId) => {
    return apiService.delete(`/course/${courseId}/archive/${archiveId}`);
  }
};

// 5. 과제 관련 API
export const AssignmentAPI = {
  // 과제 목록 조회
  getAssignments: async (courseId) => {
    return apiService.get(`/course/${courseId}/assignment`);
  },

  // 과제 등록
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
  }
};

// 6. 수강 관련 API
export const EnrollmentAPI = {
  // 수강신청
  enroll: async (enrollmentId) => {
    return apiService.post(`/enrollment/${enrollmentId}`);
  },

  // 성적 입력
  updateGrade: async (enrollmentId, gradeData) => {
    return apiService.patch(`/enrollment/${enrollmentId}/grade`, gradeData);
  }
};
