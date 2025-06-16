import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, hasRole } from '../utils/authHelpers';

const ProtectedRoute = ({ children, requiredRole = null }) => {
    const location = useLocation();

    // 인증되지 않은 사용자
    if (!isAuthenticated()) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 특정 역할이 필요한 경우 역할 확인
    if (requiredRole && !hasRole(requiredRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;