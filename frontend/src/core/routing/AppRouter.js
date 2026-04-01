import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Auth Pages
import Login from '../../modules/auth/pages/js/Login';
import ForgotPassword from '../../modules/auth/pages/js/ForgotPassword';
import ResetPassword from '../../modules/auth/pages/js/ResetPassword';
import ChangePassword from '../../modules/auth/pages/js/ChangePassword';

// Dashboards
import AdminDashboard from '../../layout/dashboards/admin/js/AdminDashboard';
import UserManagement from '../../modules/user/pages/js/UserManagement';
import HRDashboard from '../../layout/dashboards/hr/js/HRDashboard';
import ManagerDashboard from '../../layout/dashboards/manager/js/ManagerDashboard';
import EmployeeDashboard from '../../layout/dashboards/employee/js/EmployeeDashboard';
import CompanyManagement from '../../modules/company/pages/js/CompanyManagement';
import CompanyAssignment from '../../modules/company/pages/js/CompanyAssignment';
import AdminCalendarManagement from '../../modules/calendar/pages/js/AdminCalendarManagement';
import HRCalendarManagement from '../../modules/calendar/pages/js/HRCalendarManagement';
import SalaryStructureManagement from '../../modules/payroll/pages/js/SalaryStructureManagement';

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
        <Route 
          path="/admin/companies" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
              <CompanyManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/companies/assign" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
              <CompanyAssignment />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/calendar" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
              <AdminCalendarManagement />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/salary-structure" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
              <SalaryStructureManagement />
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
        <Route 
          path="/hr/calendar" 
          element={
            <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
              <HRCalendarManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hr/salary-structure" 
          element={
            <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
              <SalaryStructureManagement />
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
