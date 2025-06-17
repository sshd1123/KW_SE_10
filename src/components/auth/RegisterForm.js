// components/auth/RegisterForm.jsx
import React, { useState } from 'react';
import { AuthAPI } from '../../services/authApi';
import { useNavigate } from 'react-router-dom';

const RegisterForm = () => {
    // 폼 데이터 상태
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student', // 기본값: 학생
        department: '',
        studentId: '', // 학생인 경우만
        professorId: '' // 교수인 경우만
    });

    // UI 상태
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [step, setStep] = useState(1); // 다단계 폼인 경우

    const navigate = useNavigate();
    // 입력값 변경 처리
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // 실시간 에러 제거
        if (errors[name]) {
            setErrors(prev => ({
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
        }

        // 이메일 검사
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            newErrors.email = '이메일을 입력해주세요.';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = '올바른 이메일 형식이 아닙니다.';
        }

        // 비밀번호 검사
        if (!formData.password) {
            newErrors.password = '비밀번호를 입력해주세요.';
        } else if (formData.password.length < 8) {
            newErrors.password = '비밀번호는 8자 이상이어야 합니다.';
        }

        // 비밀번호 확인
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        }

        // 역할별 추가 검사
        if (formData.role === 'student' && !formData.studentId) {
            newErrors.studentId = '학번을 입력해주세요.';
        }

        if (formData.role === 'professor' && !formData.professorId) {
            newErrors.professorId = '교수 번호를 입력해주세요.';
        }

        if (!formData.department) {
            newErrors.department = '학과를 선택해주세요.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    // 회원가입 처리
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 유효성 검사
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // API 호출 데이터 준비
            const registrationData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                department: formData.department
            };

            // 역할별 추가 데이터
            if (formData.role === 'student') {
                registrationData.studentId = formData.studentId;
            } else if (formData.role === 'professor') {
                registrationData.professorId = formData.professorId;
            }

            // Step 3: API 호출
            const response = await AuthAPI.register(registrationData);

            // Step 4: 성공 처리
            if (response.success) {
                alert('회원가입이 완료되었습니다. 로그인해주세요.');
                navigate('/login');
            }

        } catch (error) {
            // Step 5: 에러 처리
            if (error.message.includes('email')) {
                setErrors({ email: '이미 사용 중인 이메일입니다.' });
            } else if (error.message.includes('studentId')) {
                setErrors({ studentId: '이미 등록된 학번입니다.' });
            } else {
                setErrors({ general: error.message || '회원가입에 실패했습니다.' });
            }
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="register-form">
            <h2>회원가입</h2>

            <form onSubmit={handleSubmit}>
                {/* 이름 입력 */}
                <div className="form-group">
                    <label htmlFor="name">이름 *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={loading}
                        className={errors.name ? 'error' : ''}
                    />
                    {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                {/* 이메일 입력 */}
                <div className="form-group">
                    <label htmlFor="email">이메일 *</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={loading}
                        className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                {/* 역할 선택 */}
                <div className="form-group">
                    <label htmlFor="role">역할 *</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        disabled={loading}
                    >
                        <option value="student">학생</option>
                        <option value="professor">교수</option>
                    </select>
                </div>

                {/* 학과 선택 */}
                <div className="form-group">
                    <label htmlFor="department">학과 *</label>
                    <select
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        disabled={loading}
                        className={errors.department ? 'error' : ''}
                    >
                        <option value="">학과를 선택하세요</option>
                        <option value="컴퓨터공학과">컴퓨터공학과</option>
                        <option value="경영학과">경영학과</option>
                        <option value="전자공학과">전자공학과</option>
                    </select>
                    {errors.department && <span className="error-message">{errors.department}</span>}
                </div>

                {/* 역할별 추가 필드 */}
                {formData.role === 'student' && (
                    <div className="form-group">
                        <label htmlFor="studentId">학번 *</label>
                        <input
                            type="text"
                            id="studentId"
                            name="studentId"
                            value={formData.studentId}
                            onChange={handleInputChange}
                            disabled={loading}
                            className={errors.studentId ? 'error' : ''}
                        />
                        {errors.studentId && <span className="error-message">{errors.studentId}</span>}
                    </div>
                )}

                {formData.role === 'professor' && (
                    <div className="form-group">
                        <label htmlFor="professorId">교수 번호 *</label>
                        <input
                            type="text"
                            id="professorId"
                            name="professorId"
                            value={formData.professorId}
                            onChange={handleInputChange}
                            disabled={loading}
                            className={errors.professorId ? 'error' : ''}
                        />
                        {errors.professorId && <span className="error-message">{errors.professorId}</span>}
                    </div>
                )}

                {/* 비밀번호 입력 */}
                <div className="form-group">
                    <label htmlFor="password">비밀번호 *</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        disabled={loading}
                        className={errors.password ? 'error' : ''}
                    />
                    {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                {/* 비밀번호 확인 */}
                <div className="form-group">
                    <label htmlFor="confirmPassword">비밀번호 확인 *</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        disabled={loading}
                        className={errors.confirmPassword ? 'error' : ''}
                    />
                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>

                {/* 전체 에러 메시지 */}
                {errors.general && (
                    <div className="error-message general-error">{errors.general}</div>
                )}

                {/* 제출 버튼 */}
                <button
                    type="submit"
                    disabled={loading}
                    className="submit-button"
                >
                    {loading ? '회원가입 중...' : '회원가입'}
                </button>
            </form>

            {/* 로그인 링크 */}
            <div className="auth-link">
                이미 계정이 있으신가요?
                <button onClick={() => navigate('/login')}>로그인하기</button>
            </div>
        </div>
    );
};

export default RegisterForm;