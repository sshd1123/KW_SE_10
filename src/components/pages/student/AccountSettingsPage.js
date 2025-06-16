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
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AccountSettingsPage;
