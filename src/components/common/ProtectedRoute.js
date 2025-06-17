// components/common/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// 개발 중에는 무조건 true로 설정
const FORCE_BYPASS = true;

const ProtectedRoute = ({ children, requiredRole = null }) => {
    const location = useLocation();

    console.log('🔍 ProtectedRoute 호출됨');
    console.log('🎯 FORCE_BYPASS:', FORCE_BYPASS);
    console.log('📍 경로:', location.pathname);

    // 강제 우회 (개발 중)
    if (FORCE_BYPASS) {
        console.log('🚀 강제 우회 모드 - 모든 라우트 허용');
        return children;
    }

    // 실제 배포 시에만 아래 코드 실행
    // (현재는 FORCE_BYPASS = true 이므로 실행되지 않음)
    
    console.log('❌ 로그인 페이지로 리다이렉트');
    return <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;