import React, { useState } from 'react';
import '../styles/RegisterPage.css';

// 더미 데이터 (실제 환경에서는 API에서 가져옴)
const departments = [
    '컴퓨터정보공학부',
    '소프트웨어학부',
];

// 회원가입 폼 컴포넌트
const RegisterForm = ({ onSubmit, onNavigateToLogin, loading = false, errors = {} }) => {
    // 폼 데이터 상태
    const [formData, setFormData] = useState({
        name: '',
        password: '',
        confirmPassword: '',
        role: 'student', // 기본값: 학생
        department: '',
        studentId: '', // 학생인 경우만
        professorId: '', // 교수인 경우만
        phone: ''
    });

    // UI 상태
    const [localErrors, setLocalErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // 외부 errors와 로컬 errors 병합
    const allErrors = { ...localErrors, ...errors };

    // 입력값 변경 처리
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // 실시간 에러 제거
        if (allErrors[name]) {
            setLocalErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // 유효성 검사 함수
    const validateForm = () => {
        const newErrors = {};

        // 이름 검사
        if (!formData.name.trim()) {
            newErrors.name = '이름을 입력해주세요.';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = '이름은 2자 이상이어야 합니다.';
        }

        // 비밀번호 검사
        if (!formData.password) {
            newErrors.password = '비밀번호를 입력해주세요.';
        } else if (formData.password.length < 8) {
            newErrors.password = '비밀번호는 8자 이상이어야 합니다.';
        } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = '비밀번호는 영문과 숫자를 포함해야 합니다.';
        }

        // 비밀번호 확인
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        }

        // 역할별 추가 검사
        if (formData.role === 'student') {
            if (!formData.studentId) {
                newErrors.studentId = '학번을 입력해주세요.';
            } else if (!/^\d+$/.test(formData.studentId)) {
                newErrors.studentId = '학번은 숫자만 입력해주세요.';
            }
        }

        if (formData.role === 'professor') {
            if (!formData.professorId) {
                newErrors.professorId = '교수 번호를 입력해주세요.';
            } else if (!/^\d+$/.test(formData.professorId)) {
                newErrors.professorId = '교수 번호는 숫자만 입력해주세요.';
            }
        }

        if (!formData.department) {
            newErrors.department = '학과를 선택해주세요.';
        }

        // 전화번호 검사 (선택사항)
        if (formData.phone && !/^010-\d{4}-\d{4}$/.test(formData.phone)) {
            newErrors.phone = '전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)';
        }

        setLocalErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 회원가입 처리
    const handleSubmit = async () => {
        // 유효성 검사
        if (!validateForm()) {
            return;
        }

        // API 호출 데이터 준비
        const registrationData = {
            name: formData.name,
            password: formData.password,
            role: formData.role,
            department: formData.department,
            phone: formData.phone
        };

        // 역할별 추가 데이터
        if (formData.role === 'student') {
            registrationData.studentId = formData.studentId;
        } else if (formData.role === 'professor') {
            registrationData.professorId = formData.professorId;
        }

        // 부모 컴포넌트로 데이터 전달
        if (onSubmit) {
            onSubmit(registrationData);
        }
    };

    return (
        <div className="register-form">
            {/* 역할 선택 */}
            <div className="form-group">
                <label className="form-label">가입 유형 *</label>
                <div className="role-selection">
                    <label className={`role-option ${formData.role === 'student' ? 'selected' : ''}`}>
                        <input
                            type="radio"
                            name="role"
                            value="student"
                            checked={formData.role === 'student'}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                        <div className="role-content">
                            <div className="role-title">
                                <i className='fas fa-graduation-cap' />
                                학생
                            </div>
                        </div>
                    </label>
                    <label className={`role-option ${formData.role === 'professor' ? 'selected' : ''}`}>
                        <input
                            type="radio"
                            name="role"
                            value="professor"
                            checked={formData.role === 'professor'}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                        <div className="role-content">
                            <div className="role-title">
                                <i className='fas fa-chalkboard' />
                                교수
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            {/* 이름 입력 */}
            <div className="form-group">
                <label className="form-label">이름 *</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="실명을 입력해주세요"
                    className={`form-input ${allErrors.name ? 'error' : ''}`}
                />
                {allErrors.name && <span className="error-message">{allErrors.name}</span>}
            </div>

            {/* 학번/교수번호 입력 */}
            {formData.role === 'student' && (
                <div className="form-group">
                    <label className="form-label">학번 *</label>
                    <input
                        type="text"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleInputChange}
                        disabled={loading}
                        placeholder="학번을 입력해주세요"
                        className={`form-input ${allErrors.studentId ? 'error' : ''}`}
                    />
                    {allErrors.studentId && <span className="error-message">{allErrors.studentId}</span>}
                </div>
            )}

            {formData.role === 'professor' && (
                <div className="form-group">
                    <label className="form-label">교수 번호 *</label>
                    <input
                        type="text"
                        name="professorId"
                        value={formData.professorId}
                        onChange={handleInputChange}
                        disabled={loading}
                        placeholder="교수번호를 입력해주세요"
                        className={`form-input ${allErrors.professorId ? 'error' : ''}`}
                    />
                    {allErrors.professorId && <span className="error-message">{allErrors.professorId}</span>}
                </div>
            )}

            {/* 학과 선택 */}
            <div className="form-group">
                <label className="form-label">학과 *</label>
                <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`form-select ${allErrors.department ? 'error' : ''}`}
                >
                    <option value="">학과를 선택해주세요</option>
                    {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
                {allErrors.department && <span className="error-message">{allErrors.department}</span>}
            </div>

            {/* 전화번호 입력 (선택사항) */}
            <div className="form-group">
                <label className="form-label">전화번호 (선택사항)</label>
                <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="010-1234-5678"
                    className={`form-input ${allErrors.phone ? 'error' : ''}`}
                />
                {allErrors.phone && <span className="error-message">{allErrors.phone}</span>}
            </div>

            {/* 비밀번호 입력 */}
            <div className="form-group">
                <label className="form-label">비밀번호 *</label>
                <div className="password-input-container">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        disabled={loading}
                        placeholder="영문, 숫자 포함 8자 이상"
                        className={`form-input password-input ${allErrors.password ? 'error' : ''}`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="password-toggle"
                        disabled={loading}
                    >
                        {showPassword ? <i className='fas fa-eye-slash' /> : <i className='fas fa-eye' />}
                    </button>
                </div>
                {allErrors.password && <span className="error-message">{allErrors.password}</span>}
            </div>

            {/* 비밀번호 확인 */}
            <div className="form-group">
                <label className="form-label">비밀번호 확인 *</label>
                <div className="password-input-container">
                    <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        disabled={loading}
                        placeholder="비밀번호를 다시 입력해주세요"
                        className={`form-input password-input ${allErrors.confirmPassword ? 'error' : ''}`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="password-toggle"
                        disabled={loading}
                    >
                        {showConfirmPassword ? <i className='fas fa-eye-slash' /> : <i className='fas fa-eye' />}
                    </button>
                </div>
                {allErrors.confirmPassword && <span className="error-message">{allErrors.confirmPassword}</span>}
            </div>

            {/* 전체 에러 메시지 */}
            {allErrors.general && (
                <div className="general-error">
                    {allErrors.general}
                </div>
            )}

            {/* 제출 버튼 */}
            <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="submit-button"
            >
                {loading ? (
                    <div className="loading-content">
                        <div className="loading-spinner"></div>
                        회원가입 중...
                    </div>
                ) : (
                    '회원가입'
                )}
            </button>
        </div>
    );
};

export default RegisterForm;