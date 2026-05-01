import React from 'react';
import ModuleDashboard from '../../shared/js/ModuleDashboard';

const AdminDashboard = () => {
  const sections = [
    { title: 'User Management', desc: 'Create and manage employee accounts.', path: '/user-management' },
    { title: 'Manage Companies', desc: 'Create and update company records.', path: '/company-management' },
    { title: 'Company Assignment', desc: 'Assign users to companies.', path: '/company-assignment' },
    { title: 'Calendar', desc: 'Manage holidays, working days, and overrides.', path: '/admin/calendar' },
    { title: 'Salary Structure', desc: 'Manage payroll and salary structures.', path: '/salary-structure' },
    { title: 'Documents', desc: 'Create and manage official documents.', path: '/documents' },
    { title: 'Attendance Management', desc: 'Track and review employee attendance.', path: '/attendance-management' },
    { title: 'Leave Management', desc: 'Review and manage leave requests.', path: '/leave-management' },
  ];

  return (
    <ModuleDashboard
      title="Admin Dashboard"
      welcomeTitle="Welcome, Admin"
      subtitle="Manage your organization's human resources efficiently."
      sections={sections}
    />
  );
};

export default AdminDashboard;
