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
                                    비밀번호 변경
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