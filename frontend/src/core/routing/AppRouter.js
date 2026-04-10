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
import InternDashboard from '../../layout/dashboards/intern/js/InternDashboard';
import CompanyManagement from '../../modules/company/pages/js/CompanyManagement';
import CompanyAssignment from '../../modules/company/pages/js/CompanyAssignment';
import AdminCalendarManagement from '../../modules/calendar/pages/js/AdminCalendarManagement';
import HRCalendarManagement from '../../modules/calendar/pages/js/HRCalendarManagement';
import SalaryStructureManagement from '../../modules/payroll/pages/js/SalaryStructureManagement';
import DocumentsPage from '../../modules/documents/pages/js/DocumentsPage';
import AttendancePage from '../../modules/attendance/pages/js/AttendancePage';
import AttendanceManagement from '../../modules/attendance/pages/js/AttendanceManagement';
import LeaveManagementPage from '../../modules/attendance/leave/pages/js/LeaveManagementPage';
import EmployeeCalendarPage from '../../modules/calendar/pages/js/EmployeeCalendarPage';

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

        <Route 
          path="/admin/attendance" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
              <AttendanceManagement />
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

        <Route 
          path="/hr/attendance" 
          element={
            <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
              <AttendanceManagement />
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
        <Route 
          path="/employee/calendar" 
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE', 'INTERN', 'MANAGER', 'HR', 'ADMIN']}>
              <EmployeeCalendarPage />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/intern"
          element={
            <ProtectedRoute allowedRoles={['INTERN']}>
              <InternDashboard />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/documents" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
              <DocumentsPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/employee/attendance" 
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE', 'INTERN', 'MANAGER']}>
              <AttendancePage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/attendance/leave" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE', 'INTERN']}>
              <LeaveManagementPage />
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
