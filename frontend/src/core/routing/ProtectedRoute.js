import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const userRole = localStorage.getItem('role'); // Standardized key
  const isAuthenticated = !!localStorage.getItem('access_token') || !!localStorage.getItem('refresh_token') || !!localStorage.getItem('token');

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to their respective dashboard if they try to access a forbidden route
    const redirectPath = userRole ? `/${userRole.toLowerCase()}` : '/';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
