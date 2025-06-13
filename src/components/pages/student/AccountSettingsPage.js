import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../dashboard/Header';
import Sidebar from '../../dashboard/Sidebar';
import { getCurrentUser, logout } from '../../../data/authUtils';
import '../../styles/AccountSettingsPage.css';

const AccountSettingsPage = () => {
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState('settings');
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('profile');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [notifications, setNotifications] = useState({
        emailAnnouncements: true,
        emailAssignments: true,
        emailGrades: false,
        smsReminders: false,
        pushNotifications: true
    });
    const [privacy, setPrivacy] = useState({
        profileVisibility: 'friends',
        showEmail: false,
        showPhone: false,
        allowMessages: true
    });
    const [isEditing, setIsEditing] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }
        setUserData(user);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
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
            if (window.confirm('모든 데이터가 삭제됩니다. 계속하시겠습니까?')) {
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
                return { text: '매우 약함', class: 'asp-very-weak' };
            case 2:
                return { text: '약함', class: 'asp-weak' };
            case 3:
                return { text: '보통', class: 'asp-medium' };
            case 4:
                return { text: '강함', class: 'asp-strong' };
            case 5:
                return { text: '매우 강함', class: 'asp-very-strong' };
            default:
                return { text: '', class: '' };
        }
    };

    if (loading) {
        return (
            <div className="asp-loading-container">
                <div className="asp-loading-spinner"></div>
                <p>계정 설정을 불러오는 중입니다...</p>
            </div>
        );
    }

    return (
        <div className="asp-page">
            <Header
                username={userData?.name}
                role={userData?.role || '학생'}
            />
            <div className="asp-main-layout">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    studentName={userData?.name}
                    studentId={userData?.studentId || userData?.id}
                    department={userData?.department || userData?.major}
                />
                <main className="asp-main-content">
                    <div className="asp-welcome-banner">
                        <h2>계정 설정</h2>
                        <p>개인정보 및 계정 보안 설정을 관리하세요</p>
                    </div>

                    <div className="asp-settings-container">
                        {/* 설정 네비게이션 */}
                        <nav className="asp-settings-nav">
                            <div className="asp-nav-item-group">
                                <h3>개인 정보</h3>
                                <button
                                    className={`asp-nav-item ${activeSection === 'profile' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('profile')}
                                >
                                    <i className="fas fa-user"></i>
                                    프로필 정보
                                </button>
                                <button
                                    className={`asp-nav-item ${activeSection === 'password' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('password')}
                                >
                                    <i className="fas fa-lock"></i>
                                    비밀번호 변경
                                </button>
                                <button
                                    className={`asp-nav-item ${activeSection === 'security' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('security')}
                                >
                                    <i className="fas fa-shield-alt"></i>
                                    로그인 활동
                                </button>
                            </div>

                            <div className="asp-nav-item-group">
                                <h3>환경 설정</h3>
                                <button
                                    className={`asp-nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('notifications')}
                                >
                                    <i className="fas fa-bell"></i>
                                    알림 설정
                                </button>
                                <button
                                    className={`asp-nav-item ${activeSection === 'privacy' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('privacy')}
                                >
                                    <i className="fas fa-eye"></i>
                                    개인정보 보호
                                </button>
                                <button
                                    className={`asp-nav-item ${activeSection === 'preferences' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('preferences')}
                                >
                                    <i className="fas fa-cog"></i>
                                    환경 설정
                                </button>
                            </div>

                            <div className="asp-nav-item-group">
                                <h3>시스템</h3>
                                <button
                                    className={`asp-nav-item ${activeSection === 'data' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('data')}
                                >
                                    <i className="fas fa-database"></i>
                                    데이터 관리
                                </button>
                                <button
                                    className={`asp-nav-item ${activeSection === 'about' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('about')}
                                >
                                    <i className="fas fa-info-circle"></i>
                                    앱 정보
                                </button>
                                <button
                                    className={`asp-nav-item ${activeSection === 'danger' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('danger')}
                                >
                                    <i className="fas fa-exclamation-triangle"></i>
                                    위험 구역
                                </button>
                            </div>
                        </nav>

                        {/* 설정 콘텐츠 */}
                        <div className="asp-settings-content">
                            {/* 프로필 정보 섹션 */}
                            {activeSection === 'profile' && (
                                <div className="asp-settings-section">
                                    <div className="asp-settings-card">
                                        <div className="asp-card-header">
                                            <h3>프로필 정보</h3>
                                            <button
                                                className="asp-btn asp-btn-outline"
                                                onClick={() => setIsEditing(!isEditing)}
                                            >
                                                {isEditing ? '취소' : '편집'}
                                            </button>
                                        </div>
                                        <div className="asp-settings-card-body">
                                            <div className="asp-profile-section">
                                                <div className="asp-profile-avatar-section">
                                                    <div className="asp-profile-avatar-large">
                                                        {userData?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="asp-avatar-actions">
                                                        <button className="asp-btn asp-btn-outline asp-btn-sm">
                                                            사진 변경
                                                        </button>
                                                        <button className="asp-btn asp-btn-outline asp-btn-sm">
                                                            사진 삭제
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="asp-profile-form">
                                                    <div className="asp-form-row">
                                                        <div className="asp-form-group">
                                                            <label>이름</label>
                                                            <input
                                                                type="text"
                                                                name="name"
                                                                value={formData.name}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                                className="asp-form-input"
                                                            />
                                                        </div>
                                                        <div className="asp-form-group">
                                                            <label>이메일</label>
                                                            <input
                                                                type="email"
                                                                name="email"
                                                                value={formData.email}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                                className="asp-form-input"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="asp-form-row">
                                                        <div className="asp-form-group">
                                                            <label>전화번호</label>
                                                            <input
                                                                type="tel"
                                                                name="phone"
                                                                value={formData.phone}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                                className="asp-form-input"
                                                            />
                                                        </div>
                                                        <div className="asp-form-group">
                                                            <label>학번/교번</label>
                                                            <input
                                                                type="text"
                                                                value={userData?.id || ''}
                                                                disabled
                                                                className="asp-form-input"
                                                            />
                                                        </div>
                                                    </div>
                                                    {isEditing && (
                                                        <div className="asp-form-actions">
                                                            <button
                                                                className="asp-btn asp-btn-primary"
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
                                </div>
                            )}

                            {/* 비밀번호 변경 섹션 */}
                            {activeSection === 'password' && (
                                <div className="asp-settings-section">
                                    <div className="asp-settings-card">
                                        <div className="asp-card-header">
                                            <h3>비밀번호 변경</h3>
                                        </div>
                                        <div className="asp-settings-card-body">
                                            <div className="asp-password-form">
                                                <div className="asp-form-group">
                                                    <label>현재 비밀번호</label>
                                                    <div className="asp-password-input-group">
                                                        <input
                                                            type={showCurrentPassword ? "text" : "password"}
                                                            name="currentPassword"
                                                            value={formData.currentPassword}
                                                            onChange={handleInputChange}
                                                            className="asp-form-input"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="asp-password-toggle"
                                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                        >
                                                            <i className={`fas ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="asp-form-group">
                                                    <label>새 비밀번호</label>
                                                    <div className="asp-password-input-group">
                                                        <input
                                                            type={showNewPassword ? "text" : "password"}
                                                            name="newPassword"
                                                            value={formData.newPassword}
                                                            onChange={handleInputChange}
                                                            className="asp-form-input"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="asp-password-toggle"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                        >
                                                            <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                        </button>
                                                    </div>
                                                    {formData.newPassword && (
                                                        <div className="asp-password-strength">
                                                            <div className="asp-strength-bar">
                                                                <div
                                                                    className={`asp-strength-fill ${getPasswordStrengthText(passwordStrength).class}`}
                                                                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className={`asp-strength-text ${getPasswordStrengthText(passwordStrength).class}`}>
                                                                {getPasswordStrengthText(passwordStrength).text}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="asp-form-group">
                                                    <label>새 비밀번호 확인</label>
                                                    <div className="asp-password-input-group">
                                                        <input
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            name="confirmPassword"
                                                            value={formData.confirmPassword}
                                                            onChange={handleInputChange}
                                                            className="asp-form-input"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="asp-password-toggle"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        >
                                                            <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                        </button>
                                                    </div>
                                                    {formData.confirmPassword && (
                                                        <div className={`asp-password-match ${formData.newPassword === formData.confirmPassword ? 'match' : 'no-match'}`}>
                                                            <i className={`fas ${formData.newPassword === formData.confirmPassword ? 'fa-check' : 'fa-times'}`}></i>
                                                            {formData.newPassword === formData.confirmPassword ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="asp-password-requirements">
                                                    <h4>비밀번호 요구사항</h4>
                                                    <ul>
                                                        <li className={formData.newPassword.length >= 8 ? 'valid' : ''}>
                                                            <i className={`fas ${formData.newPassword.length >= 8 ? 'fa-check' : 'fa-times'}`}></i>
                                                            8자 이상
                                                        </li>
                                                        <li className={/[A-Z]/.test(formData.newPassword) ? 'valid' : ''}>
                                                            <i className={`fas ${/[A-Z]/.test(formData.newPassword) ? 'fa-check' : 'fa-times'}`}></i>
                                                            대문자 포함
                                                        </li>
                                                        <li className={/[a-z]/.test(formData.newPassword) ? 'valid' : ''}>
                                                            <i className={`fas ${/[a-z]/.test(formData.newPassword) ? 'fa-check' : 'fa-times'}`}></i>
                                                            소문자 포함
                                                        </li>
                                                        <li className={/[0-9]/.test(formData.newPassword) ? 'valid' : ''}>
                                                            <i className={`fas ${/[0-9]/.test(formData.newPassword) ? 'fa-check' : 'fa-times'}`}></i>
                                                            숫자 포함
                                                        </li>
                                                        <li className={/[^A-Za-z0-9]/.test(formData.newPassword) ? 'valid' : ''}>
                                                            <i className={`fas ${/[^A-Za-z0-9]/.test(formData.newPassword) ? 'fa-check' : 'fa-times'}`}></i>
                                                            특수문자 포함
                                                        </li>
                                                    </ul>
                                                </div>

                                                <div className="asp-form-actions">
                                                    <button
                                                        className="asp-btn asp-btn-primary"
                                                        onClick={handlePasswordChange}
                                                    >
                                                        비밀번호 변경
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 로그인 활동 섹션 */}
                            {activeSection === 'security' && (
                                <div className="asp-settings-section">
                                    <div className="asp-settings-card">
                                        <div className="asp-card-header">
                                            <h3>로그인 활동</h3>
                                        </div>
                                        <div className="asp-settings-card-body">
                                            <div className="asp-login-activity">
                                                <div className="asp-activity-item">
                                                    <div className="asp-activity-info">
                                                        <div className="asp-activity-device">
                                                            <i className="fas fa-desktop"></i>
                                                            Chrome on Windows
                                                        </div>
                                                        <div className="asp-activity-location">서울, 대한민국</div>
                                                        <div className="asp-activity-time">2024년 3월 15일 오후 2:30</div>
                                                    </div>
                                                    <span className="asp-activity-status current">현재 세션</span>
                                                </div>

                                                <div className="asp-activity-item">
                                                    <div className="asp-activity-info">
                                                        <div className="asp-activity-device">
                                                            <i className="fas fa-mobile-alt"></i>
                                                            Safari on iPhone
                                                        </div>
                                                        <div className="asp-activity-location">서울, 대한민국</div>
                                                        <div className="asp-activity-time">2024년 3월 14일 오전 9:15</div>
                                                    </div>
                                                    <button className="asp-btn asp-btn-outline asp-btn-sm">로그아웃</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 알림 설정 섹션 */}
                            {activeSection === 'notifications' && (
                                <div className="asp-settings-section">
                                    <div className="asp-settings-card">
                                        <div className="asp-card-header">
                                            <h3>알림 설정</h3>
                                        </div>
                                        <div className="asp-settings-card-body">
                                            <div className="asp-notification-settings">
                                                <div className="asp-notification-group">
                                                    <h4>이메일 알림</h4>
                                                    <div className="asp-notification-item">
                                                        <div className="asp-notification-info">
                                                            <div className="asp-notification-title">공지사항</div>
                                                            <div className="asp-notification-desc">새로운 공지사항이 등록되면 이메일로 알림을 받습니다.</div>
                                                        </div>
                                                        <label className="asp-switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={notifications.emailAnnouncements}
                                                                onChange={() => handleNotificationChange('emailAnnouncements')}
                                                            />
                                                            <span className="asp-slider"></span>
                                                        </label>
                                                    </div>

                                                    <div className="asp-notification-item">
                                                        <div className="asp-notification-info">
                                                            <div className="asp-notification-title">과제 알림</div>
                                                            <div className="asp-notification-desc">새로운 과제가 등록되거나 마감일이 임박하면 알림을 받습니다.</div>
                                                        </div>
                                                        <label className="asp-switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={notifications.emailAssignments}
                                                                onChange={() => handleNotificationChange('emailAssignments')}
                                                            />
                                                            <span className="asp-slider"></span>
                                                        </label>
                                                    </div>

                                                    <div className="asp-notification-item">
                                                        <div className="asp-notification-info">
                                                            <div className="asp-notification-title">성적 알림</div>
                                                            <div className="asp-notification-desc">성적이 등록되면 이메일로 알림을 받습니다.</div>
                                                        </div>
                                                        <label className="asp-switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={notifications.emailGrades}
                                                                onChange={() => handleNotificationChange('emailGrades')}
                                                            />
                                                            <span className="asp-slider"></span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="asp-notification-group">
                                                    <h4>모바일 알림</h4>
                                                    <div className="asp-notification-item">
                                                        <div className="asp-notification-info">
                                                            <div className="asp-notification-title">SMS 알림</div>
                                                            <div className="asp-notification-desc">중요한 알림을 SMS로 받습니다.</div>
                                                        </div>
                                                        <label className="asp-switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={notifications.smsReminders}
                                                                onChange={() => handleNotificationChange('smsReminders')}
                                                            />
                                                            <span className="asp-slider"></span>
                                                        </label>
                                                    </div>

                                                    <div className="asp-notification-item">
                                                        <div className="asp-notification-info">
                                                            <div className="asp-notification-title">푸시 알림</div>
                                                            <div className="asp-notification-desc">브라우저 푸시 알림을 받습니다.</div>
                                                        </div>
                                                        <label className="asp-switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={notifications.pushNotifications}
                                                                onChange={() => handleNotificationChange('pushNotifications')}
                                                            />
                                                            <span className="asp-slider"></span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 개인정보 보호 섹션 */}
                            {activeSection === 'privacy' && (
                                <div className="asp-settings-section">
                                    <div className="asp-settings-card">
                                        <div className="asp-card-header">
                                            <h3>개인정보 보호</h3>
                                        </div>
                                        <div className="asp-settings-card-body">
                                            <div className="asp-privacy-settings">
                                                <div className="asp-privacy-item">
                                                    <div className="asp-privacy-info">
                                                        <div className="asp-privacy-title">프로필 공개 범위</div>
                                                        <div className="asp-privacy-desc">다른 사용자들이 내 프로필을 볼 수 있는 범위를 설정합니다.</div>
                                                    </div>
                                                    <select
                                                        className="asp-privacy-select"
                                                        value={privacy.profileVisibility}
                                                        onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                                                    >
                                                        <option value="public">전체 공개</option>
                                                        <option value="friends">친구만</option>
                                                        <option value="private">비공개</option>
                                                    </select>
                                                </div>

                                                <div className="asp-privacy-item">
                                                    <div className="asp-privacy-info">
                                                        <div className="asp-privacy-title">이메일 주소 공개</div>
                                                        <div className="asp-privacy-desc">다른 사용자들이 내 이메일 주소를 볼 수 있도록 허용합니다.</div>
                                                    </div>
                                                    <label className="asp-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={privacy.showEmail}
                                                            onChange={() => handlePrivacyChange('showEmail', !privacy.showEmail)}
                                                        />
                                                        <span className="asp-slider"></span>
                                                    </label>
                                                </div>

                                                <div className="asp-privacy-item">
                                                    <div className="asp-privacy-info">
                                                        <div className="asp-privacy-title">전화번호 공개</div>
                                                        <div className="asp-privacy-desc">다른 사용자들이 내 전화번호를 볼 수 있도록 허용합니다.</div>
                                                    </div>
                                                    <label className="asp-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={privacy.showPhone}
                                                            onChange={() => handlePrivacyChange('showPhone', !privacy.showPhone)}
                                                        />
                                                        <span className="asp-slider"></span>
                                                    </label>
                                                </div>

                                                <div className="asp-privacy-item">
                                                    <div className="asp-privacy-info">
                                                        <div className="asp-privacy-title">메시지 수신 허용</div>
                                                        <div className="asp-privacy-desc">다른 사용자들이 나에게 메시지를 보낼 수 있도록 허용합니다.</div>
                                                    </div>
                                                    <label className="asp-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={privacy.allowMessages}
                                                            onChange={() => handlePrivacyChange('allowMessages', !privacy.allowMessages)}
                                                        />
                                                        <span className="asp-slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 환경 설정 섹션 */}
                            {activeSection === 'preferences' && (
                                <div className="asp-settings-section">
                                    <div className="asp-settings-card">
                                        <div className="asp-card-header">
                                            <h3>환경 설정</h3>
                                        </div>
                                        <div className="asp-settings-card-body">
                                            <div className="asp-preference-item">
                                                <div className="asp-preference-info">
                                                    <div className="asp-preference-title">언어 설정</div>
                                                    <div className="asp-preference-desc">사용할 언어를 선택하세요.</div>
                                                </div>
                                                <select className="asp-preference-select">
                                                    <option value="ko">한국어</option>
                                                    <option value="en">English</option>
                                                    <option value="ja">日本語</option>
                                                </select>
                                            </div>

                                            <div className="asp-preference-item">
                                                <div className="asp-preference-info">
                                                    <div className="asp-preference-title">시간대</div>
                                                    <div className="asp-preference-desc">표시할 시간대를 선택하세요.</div>
                                                </div>
                                                <select className="asp-preference-select">
                                                    <option value="Asia/Seoul">서울 (GMT+9)</option>
                                                    <option value="UTC">UTC (GMT+0)</option>
                                                    <option value="America/New_York">뉴욕 (GMT-5)</option>
                                                </select>
                                            </div>

                                            <div className="asp-preference-item">
                                                <div className="asp-preference-info">
                                                    <div className="asp-preference-title">테마 설정</div>
                                                    <div className="asp-preference-desc">사용할 테마를 선택하세요.</div>
                                                </div>
                                                <div className="asp-theme-options">
                                                    <label className="asp-theme-option">
                                                        <input type="radio" name="theme" value="light" defaultChecked />
                                                        <div className="asp-theme-preview light"></div>
                                                        <span>라이트</span>
                                                    </label>
                                                    <label className="asp-theme-option">
                                                        <input type="radio" name="theme" value="dark" />
                                                        <div className="asp-theme-preview dark"></div>
                                                        <span>다크</span>
                                                    </label>
                                                    <label className="asp-theme-option">
                                                        <input type="radio" name="theme" value="auto" />
                                                        <div className="asp-theme-preview auto"></div>
                                                        <span>자동</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 데이터 관리 섹션 */}
                            {activeSection === 'data' && (
                                <div className="asp-settings-section">
                                    <div className="asp-settings-card">
                                        <div className="asp-card-header">
                                            <h3>데이터 관리</h3>
                                        </div>
                                        <div className="asp-settings-card-body">
                                            <div className="asp-data-usage">
                                                <div className="asp-usage-item">
                                                    <div className="asp-usage-info">
                                                        <div className="asp-usage-title">프로필 데이터</div>
                                                        <div className="asp-usage-size">2.3 MB</div>
                                                    </div>
                                                </div>
                                                <div className="asp-usage-item">
                                                    <div className="asp-usage-info">
                                                        <div className="asp-usage-title">과제 파일</div>
                                                        <div className="asp-usage-size">45.7 MB</div>
                                                    </div>
                                                </div>
                                                <div className="asp-usage-item">
                                                    <div className="asp-usage-info">
                                                        <div className="asp-usage-title">캐시 데이터</div>
                                                        <div className="asp-usage-size">12.1 MB</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="asp-data-actions">
                                                <button className="asp-btn asp-btn-outline">데이터 내보내기</button>
                                                <button className="asp-btn asp-btn-outline">캐시 지우기</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 앱 정보 섹션 */}
                            {activeSection === 'about' && (
                                <div className="asp-settings-section">
                                    <div className="asp-settings-card">
                                        <div className="asp-card-header">
                                            <h3>앱 정보</h3>
                                        </div>
                                        <div className="asp-settings-card-body">
                                            <div className="asp-app-info">
                                                <div className="asp-app-logo">
                                                    <img src="/logo.png" alt="App Logo" />
                                                </div>
                                                <div className="asp-app-details">
                                                    <h4>학교 관리 시스템</h4>
                                                    <p>버전: 1.0.0</p>
                                                    <p>빌드: 2024.03.15</p>
                                                    <p>개발자: 학교 IT팀</p>
                                                </div>
                                            </div>

                                            <div className="asp-system-info">
                                                <h4>시스템 정보</h4>
                                                <div className="asp-info-grid">
                                                    <div className="asp-info-item">
                                                        <span className="asp-info-label">브라우저</span>
                                                        <span className="asp-info-value">Chrome 122.0.6261.94</span>
                                                    </div>
                                                    <div className="asp-info-item">
                                                        <span className="asp-info-label">운영체제</span>
                                                        <span className="asp-info-value">Windows 11</span>
                                                    </div>
                                                    <div className="asp-info-item">
                                                        <span className="asp-info-label">화면 해상도</span>
                                                        <span className="asp-info-value">1920x1080</span>
                                                    </div>
                                                    <div className="asp-info-item">
                                                        <span className="asp-info-label">사용자 에이전트</span>
                                                        <span className="asp-info-value">Mozilla/5.0...</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="asp-support-links">
                                                <h4>지원 및 도움말</h4>
                                                <div className="asp-links-grid">
                                                    <a href="#" className="asp-support-link">
                                                        <i className="fas fa-question-circle"></i>
                                                        <span>도움말</span>
                                                    </a>
                                                    <a href="#" className="asp-support-link">
                                                        <i className="fas fa-bug"></i>
                                                        <span>버그 신고</span>
                                                    </a>
                                                    <a href="#" className="asp-support-link">
                                                        <i className="fas fa-envelope"></i>
                                                        <span>문의하기</span>
                                                    </a>
                                                    <a href="#" className="asp-support-link">
                                                        <i className="fas fa-file-alt"></i>
                                                        <span>이용약관</span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 위험 구역 섹션 */}
                            {activeSection === 'danger' && (
                                <div className="asp-settings-section">
                                    <div className="asp-settings-card asp-danger-zone">
                                        <div className="asp-card-header">
                                            <h3>위험 구역</h3>
                                        </div>
                                        <div className="asp-settings-card-body">
                                            <div className="asp-danger-actions">
                                                <div className="asp-danger-item">
                                                    <div className="asp-danger-info">
                                                        <div className="asp-danger-title">계정 비활성화</div>
                                                        <div className="asp-danger-desc">
                                                            계정을 일시적으로 비활성화합니다. 나중에 다시 활성화할 수 있습니다.
                                                        </div>
                                                    </div>
                                                    <button className="asp-btn asp-btn-danger" onClick={handleAccountDeactivate}>
                                                        계정 비활성화
                                                    </button>
                                                </div>

                                                <div className="asp-danger-item">
                                                    <div className="asp-danger-info">
                                                        <div className="asp-danger-title">계정 삭제</div>
                                                        <div className="asp-danger-desc">
                                                            계정과 모든 데이터를 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                                                        </div>
                                                    </div>
                                                    <button className="asp-btn asp-btn-danger">
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
                </main>
            </div>
        </div>
    );
};

export default AccountSettingsPage;
