import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../../layout/MainLayout/js/MainLayout';

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
import LeaveStructureManagement from '../../modules/attendance/leave/pages/js/LeaveStructureManagement';
import EmployeeCalendarPage from '../../modules/calendar/pages/js/EmployeeCalendarPage';
import MyProfile from '../../modules/user/pages/js/MyProfile';
import AuditLogPage from '../../modules/audit/pages/js/AuditLogPage';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Protected Routes wrapped in MainLayout */}
        <Route element={<MainLayout />}>
          
          {/* --- Dashboards --- */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/hr" element={<ProtectedRoute allowedRoles={['HR', 'ADMIN']}><HRDashboard /></ProtectedRoute>} />
          <Route path="/manager" element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}><ManagerDashboard /></ProtectedRoute>} />
          <Route path="/employee" element={<ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']}><EmployeeDashboard /></ProtectedRoute>} />
          <Route path="/intern" element={<ProtectedRoute allowedRoles={['INTERN']}><InternDashboard /></ProtectedRoute>} />

          {/* --- User Management --- */}
          <Route 
            path="/user-management" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER']}>
                <UserManagement />
              </ProtectedRoute>
            } 
          />

          {/* --- Organization & Companies --- */}
          <Route 
            path="/company-management" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                <CompanyManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/company-assignment" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                <CompanyAssignment />
              </ProtectedRoute>
            } 
          />

          {/* --- Calendar Management --- */}
          {/* Admin/HR Specific Calendar */}
          <Route 
            path="/admin/calendar" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminCalendarManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/calendar" 
            element={
              <ProtectedRoute allowedRoles={['HR']}>
                <HRCalendarManagement />
              </ProtectedRoute>
            } 
          />
          {/* Employee/General Calendar */}
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute allowedRoles={['EMPLOYEE', 'INTERN',]}>
                <EmployeeCalendarPage />
              </ProtectedRoute>
            } 
          />

          {/* --- Payroll --- */}
          <Route 
            path="/salary-structure" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                <SalaryStructureManagement />
              </ProtectedRoute>
            } 
          />

          {/* --- Attendance --- */}
          <Route 
            path="/mark-attendance" 
            element={
              <ProtectedRoute allowedRoles={['EMPLOYEE', 'INTERN', 'MANAGER']}>
                <AttendancePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/attendance-management" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                <AttendanceManagement />
              </ProtectedRoute>
            } 
          />

          {/* --- Documents --- */}
          <Route 
            path="/documents" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                <DocumentsPage />
              </ProtectedRoute>
            } 
          />

          {/* --- Leave Management --- */}
          <Route 
            path="/leave-management" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE', 'INTERN']}>
                <LeaveManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leave-structure" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                <LeaveStructureManagement />
              </ProtectedRoute>
            } 
          />

          {/* --- Audit Logs --- */}
          <Route 
            path="/audit-logs" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                <AuditLogPage />
              </ProtectedRoute>
            } 
          />

          {/* --- Self Service --- */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE', 'INTERN']}>
                <MyProfile />
              </ProtectedRoute>
            } 
          />

          {/* Redirect for legacy role-prefixed paths */}
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
          <Route path="/hr/*" element={<Navigate to="/hr" replace />} />
          <Route path="/employee/*" element={<Navigate to="/employee" replace />} />

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
