import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
            path="/admin/company-assignment" 
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
          <Route 
            path="/admin/documents" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                <DocumentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/leave-management" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE', 'INTERN']}>
                <LeaveManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/leave-structure" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                <LeaveStructureManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/audit-log" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                <AuditLogPage />
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
            path="/hr/companies" 
            element={
              <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                <CompanyManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/company-assignment" 
            element={
              <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                <CompanyAssignment />
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
          <Route 
            path="/hr/documents" 
            element={
              <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                <DocumentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/leave-management" 
            element={
              <ProtectedRoute allowedRoles={['HR', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'INTERN']}>
                <LeaveManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/leave-structure" 
            element={
              <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                <LeaveStructureManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/audit-log" 
            element={
              <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                <AuditLogPage />
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

          <Route 
            path="/employee/profile" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE', 'INTERN']}>
                <MyProfile />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
