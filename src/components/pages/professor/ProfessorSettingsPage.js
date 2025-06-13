import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import ProfessorSidebar from '../../dashboard/ProfessorSidebar';
import { getCurrentUser, logout } from '../../../data/authUtils';
import '../../styles/ProfessorSettingsPage.css';

const ProfessorSettingsPage = () => {
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState('settings');
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('profile');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [notifications, setNotifications] = useState({
        emailAnnouncements: true,
        emailAssignments: true,
        emailGrades: true,
        emailStudentMessages: false,
        smsReminders: false,
        pushNotifications: true
    });
    const [privacy, setPrivacy] = useState({
        profileVisibility: 'public',
        showEmail: true,
        showPhone: false,
        showOfficeHours: true,
        allowStudentMessages: true,
        showResearchInterests: true
    });
    const [isEditing, setIsEditing] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const user = getCurrentUser();
        if (!user || user.role !== 'professor') {
            navigate('/login');
            return;
        }

        setUserData(user);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            department: user.department || '',
            position: user.position || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setLoading(false);
    }, [navigate]);

    // 비밀번호 강도 체크
    const checkPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'newPassword') {
            setPasswordStrength(checkPasswordStrength(value));
        }
    };

    const handleNotificationChange = (key) => {
        setNotifications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handlePrivacyChange = (key, value) => {
        setPrivacy(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleProfileSave = () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            alert('이름과 이메일은 필수 입력 항목입니다.');
            return;
        }

        // 실제 환경에서는 API 호출
        alert('프로필이 성공적으로 업데이트되었습니다.');
        setIsEditing(false);
    };

    const handlePasswordChange = () => {
        if (!formData.currentPassword) {
            alert('현재 비밀번호를 입력해주세요.');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            alert('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        if (passwordStrength < 3) {
            alert('비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.');
            return;
        }

        // 실제 환경에서는 API 호출
        alert('비밀번호가 성공적으로 변경되었습니다.');
        setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        }));
        setPasswordStrength(0);
    };

    const handleAccountDeactivate = () => {
        if (window.confirm('정말로 계정을 비활성화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            if (window.confirm('모든 강의 데이터와 학생 정보가 삭제됩니다. 계속하시겠습니까?')) {
                alert('계정이 비활성화되었습니다.');
                logout();
                navigate('/login');
            }
        }
    };

    const getPasswordStrengthText = (strength) => {
        switch (strength) {
            case 0:
            case 1:
                return { text: '매우 약함', class: 'very-weak' };
            case 2:
                return { text: '약함', class: 'weak' };
            case 3:
                return { text: '보통', class: 'medium' };
            case 4:
                return { text: '강함', class: 'strong' };
            case 5:
                return { text: '매우 강함', class: 'very-strong' };
            default:
                return { text: '', class: '' };
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>계정 설정을 불러오는 중입니다...</p>
            </div>
        );
    }

    const strengthInfo = getPasswordStrengthText(passwordStrength);

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
                        <h2>계정 설정</h2>
                        <p>개인정보 및 계정 보안 설정을 관리하세요</p>
                    </div>

                    <div className="settings-container">
                        {/* 설정 네비게이션 */}
                        <div className="settings-nav">
                            <div className="nav-item-group">
                                <h3>개인 설정</h3>
                                <button
                                    className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('profile')}
                                >
                                    <i className="fas fa-user-tie"></i>
                                    프로필 정보
                                </button>
                                <button
                                    className={`nav-item ${activeSection === 'security' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('security')}
                                >
                                    <i className="fas fa-shield-alt"></i>
                                    보안 설정
                                </button>
                                <button
                                    className={`nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('notifications')}
                                >
                                    <i className="fas fa-bell"></i>
                                    알림 설정
                                </button>
                                <button
                                    className={`nav-item ${activeSection === 'privacy' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('privacy')}
                                >
                                    <i className="fas fa-eye"></i>
                                    개인정보 보호
                                </button>
                            </div>

                            <div className="nav-item-group">
                                <h3>교수 설정</h3>
                                <button
                                    className={`nav-item ${activeSection === 'teaching' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('teaching')}
                                >
                                    <i className="fas fa-chalkboard-teacher"></i>
                                    강의 설정
                                </button>
                            </div>

                            <div className="nav-item-group">
                                <h3>기타</h3>
                                <button
                                    className={`nav-item ${activeSection === 'preferences' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('preferences')}
                                >
                                    <i className="fas fa-cog"></i>
                                    환경 설정
                                </button>
                                <button
                                    className={`nav-item ${activeSection === 'about' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('about')}
                                >
                                    <i className="fas fa-info-circle"></i>
                                    정보
                                </button>
                            </div>
                        </div>

                        {/* 설정 콘텐츠 */}
                        <div className="settings-content">
                            {activeSection === 'profile' && (
                                <div className="card settings-card">
                                    <div className="card-header">
                                        <h3>교수 프로필 정보</h3>
                                        <button
                                            className={`btn ${isEditing ? 'btn-outline' : 'btn-primary'}`}
                                            onClick={() => setIsEditing(!isEditing)}
                                        >
                                            {isEditing ? '취소' : '편집'}
                                        </button>
                                    </div>
                                    <div className="card-body settings-card-body">
                                        <div className="profile-section">
                                            <div className="profile-avatar-section">
                                                <div className="profile-avatar-large professor">
                                                    {userData?.name?.charAt(0) || 'P'}
                                                </div>
                                                <div className="avatar-actions">
                                                    <button className="btn btn-outline btn-sm">사진 변경</button>
                                                    <button className="btn btn-outline btn-sm">삭제</button>
                                                </div>
                                            </div>

                                            <div className="profile-form">
                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>이름</label>
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            value={formData.name}
                                                            onChange={handleInputChange}
                                                            disabled={!isEditing}
                                                            className="form-input"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>사번</label>
                                                        <input
                                                            type="text"
                                                            value={userData?.professorId || ''}
                                                            disabled
                                                            className="form-input"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>이메일</label>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={formData.email}
                                                            onChange={handleInputChange}
                                                            disabled={!isEditing}
                                                            className="form-input"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>전화번호</label>
                                                        <input
                                                            type="tel"
                                                            name="phone"
                                                            value={formData.phone}
                                                            onChange={handleInputChange}
                                                            disabled={!isEditing}
                                                            className="form-input"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>학과</label>
                                                        <select
                                                            name="department"
                                                            value={formData.department}
                                                            onChange={handleInputChange}
                                                            disabled={!isEditing}
                                                            className="form-input"
                                                        >
                                                            <option value="컴퓨터공학과">컴퓨터공학과</option>
                                                            <option value="경영학과">경영학과</option>
                                                            <option value="전자공학과">전자공학과</option>
                                                            <option value="기계공학과">기계공학과</option>
                                                            <option value="화학공학과">화학공학과</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>직급</label>
                                                        <select
                                                            name="position"
                                                            value={formData.position}
                                                            onChange={handleInputChange}
                                                            disabled={!isEditing}
                                                            className="form-input"
                                                        >
                                                            <option value="조교수">조교수</option>
                                                            <option value="부교수">부교수</option>
                                                            <option value="정교수">정교수</option>
                                                            <option value="명예교수">명예교수</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>연구실 위치</label>
                                                        <input
                                                            type="text"
                                                            name="officeLocation"
                                                            placeholder="예: 새빛관 903호"
                                                            disabled={!isEditing}
                                                            className="form-input"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>연구실 전화</label>
                                                        <input
                                                            type="tel"
                                                            name="officePhone"
                                                            placeholder="예: 02-123-4567"
                                                            disabled={!isEditing}
                                                            className="form-input"
                                                        />
                                                    </div>
                                                </div>

                                                {isEditing && (
                                                    <div className="form-actions">
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={handleProfileSave}
                                                        >
                                                            저장
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'security' && (
                                <div className="settings-section">
                                    <div className="card settings-card" style={{
                                        overflow:"hidden"
                                    }}>
                                        <div className="card-header">
                                            <h3>비밀번호 변경</h3>
                                        </div>
                                        <div className="card-body settings-card-body">
                                            <div className="password-form-container" style={{
                                                justifyItems: "center",
                                                minHeight:"800px"
                                            }}>
                                                <div className="password-form">
                                                    <div className="form-group">
                                                        <label>현재 비밀번호</label>
                                                        <div className="password-input-group">
                                                            <input
                                                                type={showCurrentPassword ? "text" : "password"}
                                                                name="currentPassword"
                                                                value={formData.currentPassword}
                                                                onChange={handleInputChange}
                                                                className="form-input"
                                                                placeholder="현재 비밀번호를 입력하세요"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="password-toggle"
                                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                            >
                                                                <i className={`fas ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="form-group">
                                                        <label>새 비밀번호</label>
                                                        <div className="password-input-group">
                                                            <input
                                                                type={showNewPassword ? "text" : "password"}
                                                                name="newPassword"
                                                                value={formData.newPassword}
                                                                onChange={handleInputChange}
                                                                className="form-input"
                                                                placeholder="새 비밀번호를 입력하세요"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="password-toggle"
                                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                            >
                                                                <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                            </button>
                                                        </div>
                                                        {formData.newPassword && (
                                                            <div className="password-strength">
                                                                <div className="strength-bar">
                                                                    <div
                                                                        className={`strength-fill ${strengthInfo.class}`}
                                                                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className={`strength-text ${strengthInfo.class}`}>
                                                                    {strengthInfo.text}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="form-group">
                                                        <label>새 비밀번호 확인</label>
                                                        <div className="password-input-group">
                                                            <input
                                                                type={showConfirmPassword ? "text" : "password"}
                                                                name="confirmPassword"
                                                                value={formData.confirmPassword}
                                                                onChange={handleInputChange}
                                                                className="form-input"
                                                                placeholder="새 비밀번호를 다시 입력하세요"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="password-toggle"
                                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            >
                                                                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                            </button>
                                                        </div>
                                                        {formData.newPassword && formData.confirmPassword && (
                                                            <div className={`password-match ${formData.newPassword === formData.confirmPassword ? 'match' : 'no-match'}`}>
                                                                <i className={`fas ${formData.newPassword === formData.confirmPassword ? 'fa-check' : 'fa-times'}`}></i>
                                                                {formData.newPassword === formData.confirmPassword ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="password-requirements">
                                                        <h4>비밀번호 요구사항:</h4>
                                                        <ul>
                                                            <li className={formData.newPassword.length >= 8 ? 'valid' : ''}>
                                                                <i className="fas fa-check"></i> 8자 이상
                                                            </li>
                                                            <li className={/[A-Z]/.test(formData.newPassword) ? 'valid' : ''}>
                                                                <i className="fas fa-check"></i> 대문자 포함
                                                            </li>
                                                            <li className={/[a-z]/.test(formData.newPassword) ? 'valid' : ''}>
                                                                <i className="fas fa-check"></i> 소문자 포함
                                                            </li>
                                                            <li className={/[0-9]/.test(formData.newPassword) ? 'valid' : ''}>
                                                                <i className="fas fa-check"></i> 숫자 포함
                                                            </li>
                                                            <li className={/[^A-Za-z0-9]/.test(formData.newPassword) ? 'valid' : ''}>
                                                                <i className="fas fa-check"></i> 특수문자 포함
                                                            </li>
                                                        </ul>
                                                    </div>

                                                    <div className="form-actions">
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={handlePasswordChange}
                                                        >
                                                            비밀번호 변경
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card settings-card">
                                        <div className="card-header">
                                            <h3>로그인 활동</h3>
                                        </div>
                                        <div className="card-body settings-card-body">
                                            <div className="login-activity">
                                                <div className="activity-item">
                                                    <div className="activity-info">
                                                        <div className="activity-device">
                                                            <i className="fas fa-desktop"></i>
                                                            Chrome on Windows
                                                        </div>
                                                        <div className="activity-location">서울, 대한민국</div>
                                                        <div className="activity-time">현재 세션 - 2025.06.07 14:30</div>
                                                    </div>
                                                    <div className="activity-status current">현재</div>
                                                </div>
                                                <div className="activity-item">
                                                    <div className="activity-info">
                                                        <div className="activity-device">
                                                            <i className="fas fa-mobile-alt"></i>
                                                            Safari on iPhone
                                                        </div>
                                                        <div className="activity-location">서울, 대한민국</div>
                                                        <div className="activity-time">2025.06.06 22:15</div>
                                                    </div>
                                                    <button className="btn btn-outline btn-sm">로그아웃</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'notifications' && (
                                <div className="card settings-card">
                                    <div className="card-header">
                                        <h3>알림 설정</h3>
                                    </div>
                                    <div className="card-body settings-card-body">
                                        <div className="notification-settings">
                                            <div className="notification-group">
                                                <h4>이메일 알림</h4>
                                                <div className="notification-item">
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={notifications.emailAnnouncements}
                                                            onChange={() => handleNotificationChange('emailAnnouncements')}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                    <div className="notification-info">
                                                        <div className="notification-title">시스템 공지사항</div>
                                                        <div className="notification-desc">시스템 업데이트 및 중요 공지사항을 이메일로 받습니다</div>
                                                    </div>
                                                </div>

                                                <div className="notification-item">
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={notifications.emailAssignments}
                                                            onChange={() => handleNotificationChange('emailAssignments')}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                    <div className="notification-info">
                                                        <div className="notification-title">과제 제출 알림</div>
                                                        <div className="notification-desc">학생들의 과제 제출 시 이메일로 알림을 받습니다</div>
                                                    </div>
                                                </div>

                                                <div className="notification-item">
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={notifications.emailGrades}
                                                            onChange={() => handleNotificationChange('emailGrades')}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                    <div className="notification-info">
                                                        <div className="notification-title">성적 마감일 알림</div>
                                                        <div className="notification-desc">성적 입력 마감일 3일 전에 이메일로 알림을 받습니다</div>
                                                    </div>
                                                </div>

                                                <div className="notification-item">
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={notifications.emailStudentMessages}
                                                            onChange={() => handleNotificationChange('emailStudentMessages')}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                    <div className="notification-info">
                                                        <div className="notification-title">학생 메시지</div>
                                                        <div className="notification-desc">학생들의 개인 메시지 및 질문을 이메일로 받습니다</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="notification-group">
                                                <h4>기타 알림</h4>
                                                <div className="notification-item">
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={notifications.smsReminders}
                                                            onChange={() => handleNotificationChange('smsReminders')}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                    <div className="notification-info">
                                                        <div className="notification-title">SMS 긴급 알림</div>
                                                        <div className="notification-desc">긴급 상황 및 중요한 알림을 SMS로 받습니다</div>
                                                    </div>
                                                </div>

                                                <div className="notification-item">
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={notifications.pushNotifications}
                                                            onChange={() => handleNotificationChange('pushNotifications')}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                    <div className="notification-info">
                                                        <div className="notification-title">브라우저 알림</div>
                                                        <div className="notification-desc">실시간 브라우저 푸시 알림을 받습니다</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'privacy' && (
                                <div className="card settings-card">
                                    <div className="card-header">
                                        <h3>개인정보 보호</h3>
                                    </div>
                                    <div className="card-body settings-card-body">
                                        <div className="privacy-settings">
                                            <div className="privacy-item">
                                                <div className="privacy-info">
                                                    <div className="privacy-title">프로필 공개 범위</div>
                                                    <div className="privacy-desc">학생들이 교수 프로필을 볼 수 있는 범위를 설정합니다</div>
                                                </div>
                                                <select
                                                    value={privacy.profileVisibility}
                                                    onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                                                    className="privacy-select"
                                                >
                                                    <option value="public">전체 공개</option>
                                                    <option value="students">학생들에게만</option>
                                                    <option value="faculty">교직원에게만</option>
                                                    <option value="private">비공개</option>
                                                </select>
                                            </div>

                                            <div className="privacy-item">
                                                <div className="privacy-info">
                                                    <div className="privacy-title">이메일 주소 공개</div>
                                                    <div className="privacy-desc">학생들이 교수 이메일 주소를 볼 수 있도록 허용합니다</div>
                                                </div>
                                                <label className="switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={privacy.showEmail}
                                                        onChange={() => handlePrivacyChange('showEmail', !privacy.showEmail)}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>

                                            <div className="privacy-item">
                                                <div className="privacy-info">
                                                    <div className="privacy-title">연구실 전화번호 공개</div>
                                                    <div className="privacy-desc">학생들이 연구실 전화번호를 볼 수 있도록 허용합니다</div>
                                                </div>
                                                <label className="switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={privacy.showPhone}
                                                        onChange={() => handlePrivacyChange('showPhone', !privacy.showPhone)}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>

                                            <div className="privacy-item">
                                                <div className="privacy-info">
                                                    <div className="privacy-title">상담시간 정보 공개</div>
                                                    <div className="privacy-desc">학생들이 상담시간 정보를 볼 수 있도록 허용합니다</div>
                                                </div>
                                                <label className="switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={privacy.showOfficeHours}
                                                        onChange={() => handlePrivacyChange('showOfficeHours', !privacy.showOfficeHours)}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>

                                            <div className="privacy-item">
                                                <div className="privacy-info">
                                                    <div className="privacy-title">학생 메시지 수신 허용</div>
                                                    <div className="privacy-desc">학생들로부터 개인 메시지를 받을 수 있도록 허용합니다</div>
                                                </div>
                                                <label className="switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={privacy.allowStudentMessages}
                                                        onChange={() => handlePrivacyChange('allowStudentMessages', !privacy.allowStudentMessages)}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>

                                            <div className="privacy-item">
                                                <div className="privacy-info">
                                                    <div className="privacy-title">연구 관심분야 공개</div>
                                                    <div className="privacy-desc">연구 관심분야 및 전문 분야를 공개합니다</div>
                                                </div>
                                                <label className="switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={privacy.showResearchInterests}
                                                        onChange={() => handlePrivacyChange('showResearchInterests', !privacy.showResearchInterests)}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'teaching' && (
                                <div className="settings-section">
                                    <div className="card settings-card">
                                        <div className="card-header">
                                            <h3>강의 기본 설정</h3>
                                        </div>
                                        <div className="card-body settings-card-body">
                                            <div className="teaching-settings">
                                                <div className="teaching-item">
                                                    <div className="teaching-info">
                                                        <div className="teaching-title">과제 제출 마감시간</div>
                                                        <div className="teaching-desc">과제 제출 기본 마감시간을 설정합니다</div>
                                                    </div>
                                                    <select className="teaching-select">
                                                        <option value="23:59">23:59 (자정 전)</option>
                                                        <option value="18:00">18:00 (오후 6시)</option>
                                                        <option value="15:00">15:00 (오후 3시)</option>
                                                        <option value="12:00">12:00 (정오)</option>
                                                    </select>
                                                </div>

                                                <div className="teaching-item">
                                                    <div className="teaching-info">
                                                        <div className="teaching-title">지각 제출 허용</div>
                                                        <div className="teaching-desc">마감 시간 이후 과제 제출을 허용합니다</div>
                                                    </div>
                                                    <label className="switch">
                                                        <input type="checkbox" defaultChecked />
                                                        <span className="slider"></span>
                                                    </label>
                                                </div>

                                                <div className="teaching-item">
                                                    <div className="teaching-info">
                                                        <div className="teaching-title">지각 제출 감점</div>
                                                        <div className="teaching-desc">지각 제출 시 적용할 감점 비율을 설정합니다</div>
                                                    </div>
                                                    <select className="teaching-select">
                                                        <option value="10">10% 감점</option>
                                                        <option value="20">20% 감점</option>
                                                        <option value="30">30% 감점</option>
                                                        <option value="50">50% 감점</option>
                                                    </select>
                                                </div>

                                                <div className="teaching-item">
                                                    <div className="teaching-info">
                                                        <div className="teaching-title">성적 공개 시기</div>
                                                        <div className="teaching-desc">성적이 언제 학생들에게 공개될지 설정합니다</div>
                                                    </div>
                                                    <select className="teaching-select">
                                                        <option value="immediate">즉시 공개</option>
                                                        <option value="manual">수동 공개</option>
                                                        <option value="scheduled">예약 공개</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card settings-card">
                                        <div className="card-header">
                                            <h3>출석 관리 설정</h3>
                                        </div>
                                        <div className="card-body settings-card-body">
                                            <div className="attendance-settings">
                                                <div className="teaching-item">
                                                    <div className="teaching-info">
                                                        <div className="teaching-title">지각 허용 시간</div>
                                                        <div className="teaching-desc">강의 시작 후 몇 분까지 지각으로 처리할지 설정합니다</div>
                                                    </div>
                                                    <select className="teaching-select">
                                                        <option value="5">5분</option>
                                                        <option value="10">10분</option>
                                                        <option value="15">15분</option>
                                                        <option value="20">20분</option>
                                                    </select>
                                                </div>

                                                <div className="teaching-item">
                                                    <div className="teaching-info">
                                                        <div className="teaching-title">출석 QR 코드 유효시간</div>
                                                        <div className="teaching-desc">QR 코드를 통한 출석체크 유효 시간을 설정합니다</div>
                                                    </div>
                                                    <select className="teaching-select">
                                                        <option value="10">10분</option>
                                                        <option value="15">15분</option>
                                                        <option value="20">20분</option>
                                                        <option value="30">30분</option>
                                                    </select>
                                                </div>

                                                <div className="teaching-item">
                                                    <div className="teaching-info">
                                                        <div className="teaching-title">자동 출석 알림</div>
                                                        <div className="teaching-desc">강의 시작 시 자동으로 출석 체크를 시작합니다</div>
                                                    </div>
                                                    <label className="switch">
                                                        <input type="checkbox" defaultChecked />
                                                        <span className="slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'preferences' && (
                                <div className="settings-section">
                                    <div className="card settings-card">
                                        <div className="card-header">
                                            <h3>화면 설정</h3>
                                        </div>
                                        <div className="card-body settings-card-body">
                                            <div className="preference-item">
                                                <div className="preference-info">
                                                    <div className="preference-title">테마</div>
                                                    <div className="preference-desc">화면 테마를 선택하세요</div>
                                                </div>
                                                <div className="theme-options">
                                                    <label className="theme-option">
                                                        <input type="radio" name="theme" value="light" defaultChecked />
                                                        <span className="theme-preview light"></span>
                                                        <span>라이트</span>
                                                    </label>
                                                    <label className="theme-option">
                                                        <input type="radio" name="theme" value="dark" />
                                                        <span className="theme-preview dark"></span>
                                                        <span>다크</span>
                                                    </label>
                                                    <label className="theme-option">
                                                        <input type="radio" name="theme" value="auto" />
                                                        <span className="theme-preview auto"></span>
                                                        <span>자동</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="preference-item">
                                                <div className="preference-info">
                                                    <div className="preference-title">언어</div>
                                                    <div className="preference-desc">사용할 언어를 선택하세요</div>
                                                </div>
                                                <select className="preference-select">
                                                    <option value="ko">한국어</option>
                                                    <option value="en">English</option>
                                                    <option value="zh">中文</option>
                                                    <option value="ja">日本語</option>
                                                </select>
                                            </div>

                                            <div className="preference-item">
                                                <div className="preference-info">
                                                    <div className="preference-title">시간대</div>
                                                    <div className="preference-desc">표시할 시간대를 선택하세요</div>
                                                </div>
                                                <select className="preference-select">
                                                    <option value="Asia/Seoul">서울 (GMT+9)</option>
                                                    <option value="UTC">UTC (GMT+0)</option>
                                                    <option value="America/New_York">뉴욕 (GMT-5)</option>
                                                    <option value="Europe/London">런던 (GMT+0)</option>
                                                </select>
                                            </div>

                                            <div className="preference-item">
                                                <div className="preference-info">
                                                    <div className="preference-title">대시보드 레이아웃</div>
                                                    <div className="preference-desc">대시보드에 표시할 정보를 선택하세요</div>
                                                </div>
                                                <div className="dashboard-options">
                                                    <label className="dashboard-option">
                                                        <input type="checkbox" defaultChecked />
                                                        <span>강의 일정</span>
                                                    </label>
                                                    <label className="dashboard-option">
                                                        <input type="checkbox" defaultChecked />
                                                        <span>과제 현황</span>
                                                    </label>
                                                    <label className="dashboard-option">
                                                        <input type="checkbox" defaultChecked />
                                                        <span>성적 통계</span>
                                                    </label>
                                                    <label className="dashboard-option">
                                                        <input type="checkbox" />
                                                        <span>최근 활동</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card settings-card">
                                        <div className="card-header">
                                            <h3>데이터 및 저장소</h3>
                                        </div>
                                        <div className="card-body settings-card-body">
                                            <div className="data-usage">
                                                <div className="usage-item">
                                                    <div className="usage-info">
                                                        <div className="usage-title">강의 자료</div>
                                                        <div className="usage-size">약 2.3GB</div>
                                                    </div>
                                                    <button className="btn btn-outline btn-sm">관리</button>
                                                </div>

                                                <div className="usage-item">
                                                    <div className="usage-info">
                                                        <div className="usage-title">학생 과제 파일</div>
                                                        <div className="usage-size">약 1.8GB</div>
                                                    </div>
                                                    <button className="btn btn-outline btn-sm">관리</button>
                                                </div>

                                                <div className="usage-item">
                                                    <div className="usage-info">
                                                        <div className="usage-title">브라우저 캐시</div>
                                                        <div className="usage-size">약 45MB</div>
                                                    </div>
                                                    <button className="btn btn-outline btn-sm">삭제</button>
                                                </div>
                                            </div>

                                            <div className="data-actions">
                                                <button className="btn btn-primary">강의 데이터 백업</button>
                                                <button className="btn btn-outline">성적 데이터 내보내기</button>
                                                <button className="btn btn-outline">출석 데이터 내보내기</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'about' && (
                                <div className="settings-section">
                                    <div className="card settings-card">
                                        <div className="card-header">
                                            <h3>애플리케이션 정보</h3>
                                        </div>
                                        <div className="card-body settings-card-body">
                                            <div className="app-info">
                                                <div className="app-logo">
                                                    <img src="/symbol.png" alt="학교 로고" />
                                                </div>
                                                <div className="app-details">
                                                    <h4>교수용 학사관리시스템</h4>
                                                    <p>버전 2.1.0 (교수 에디션)</p>
                                                    <p>마지막 업데이트: 2025년 6월 5일</p>
                                                </div>
                                            </div>

                                            <div className="system-info">
                                                <h4>시스템 정보</h4>
                                                <div className="info-grid">
                                                    <div className="info-item">
                                                        <span className="info-label">브라우저:</span>
                                                        <span className="info-value">Chrome 125.0.6422.112</span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span className="info-label">운영체제:</span>
                                                        <span className="info-value">Windows 10</span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span className="info-label">화면 해상도:</span>
                                                        <span className="info-value">1920 × 1080</span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span className="info-label">접근 권한:</span>
                                                        <span className="info-value">교수/관리자</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="support-links">
                                                <h4>도움말 및 지원</h4>
                                                <div className="links-grid">
                                                    <a href="#" className="support-link">
                                                        <i className="fas fa-question-circle"></i>
                                                        교수용 가이드
                                                    </a>
                                                    <a href="#" className="support-link">
                                                        <i className="fas fa-chalkboard-teacher"></i>
                                                        강의 관리 매뉴얼
                                                    </a>
                                                    <a href="#" className="support-link">
                                                        <i className="fas fa-chart-line"></i>
                                                        성적 관리 가이드
                                                    </a>
                                                    <a href="#" className="support-link">
                                                        <i className="fas fa-bug"></i>
                                                        버그 신고
                                                    </a>
                                                    <a href="#" className="support-link">
                                                        <i className="fas fa-envelope"></i>
                                                        기술 지원
                                                    </a>
                                                    <a href="#" className="support-link">
                                                        <i className="fas fa-file-alt"></i>
                                                        교수 규정
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card settings-card danger-zone">
                                        <div className="card-header">
                                            <h3>위험 구역</h3>
                                        </div>
                                        <div className="card-body settings-card-body">
                                            <div className="danger-actions">
                                                <div className="danger-item">
                                                    <div className="danger-info">
                                                        <div className="danger-title">계정 비활성화</div>
                                                        <div className="danger-desc">
                                                            계정을 일시적으로 비활성화합니다. 강의 데이터는 보존되며 나중에 다시 활성화할 수 있습니다.
                                                        </div>
                                                    </div>
                                                    <button className="btn btn-outline danger">비활성화</button>
                                                </div>

                                                <div className="danger-item">
                                                    <div className="danger-info">
                                                        <div className="danger-title">계정 삭제</div>
                                                        <div className="danger-desc">
                                                            계정과 모든 강의 데이터를 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={handleAccountDeactivate}
                                                    >
                                                        계정 삭제
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfessorSettingsPage;