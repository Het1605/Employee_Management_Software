import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Auth Pages
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import ChangePassword from '../pages/auth/ChangePassword';

// Dashboards
import AdminDashboard from '../pages/dashboard/admin/AdminDashboard';
import UserManagement from '../pages/dashboard/admin/UserManagement';
import HRDashboard from '../pages/dashboard/hr/HRDashboard';
import ManagerDashboard from '../pages/dashboard/manager/ManagerDashboard';
import EmployeeDashboard from '../pages/dashboard/employee/EmployeeDashboard';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER']}>
              <UserManagement />
            </ProtectedRoute>
          } 
        />

        {/* HR Routes */}
        <Route 
          path="/hr" 
          element={
            <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
              <HRDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hr/users" 
          element={
            <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
              <UserManagement />
            </ProtectedRoute>
          } 
        />

        {/* Manager Routes */}
        <Route 
          path="/manager" 
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <ManagerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/manager/users" 
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <UserManagement />
            </ProtectedRoute>
          } 
        />

        {/* Employee Routes */}
        <Route 
          path="/employee" 
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
