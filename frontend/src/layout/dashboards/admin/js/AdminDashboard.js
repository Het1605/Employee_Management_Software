import React from 'react';
import ModuleDashboard from '../../shared/js/ModuleDashboard';

const AdminDashboard = () => {
  const sections = [
    { title: 'User Management', desc: 'Create and manage employee accounts.', path: '/admin/users' },
    { title: 'Manage Companies', desc: 'Create and update company records.', path: '/admin/companies' },
    { title: 'Company Assignment', desc: 'Assign users to companies.', path: '/admin/company-assignment' },
    { title: 'Calendar', desc: 'Manage holidays, working days, and overrides.', path: '/admin/calendar' },
    { title: 'Salary Structure', desc: 'Manage payroll and salary structures.', path: '/admin/salary-structure' },
    { title: 'Documents', desc: 'Create and manage official documents.', path: '/admin/documents' },
    { title: 'Attendance Management', desc: 'Track and review employee attendance.', path: '/admin/attendance' },
    { title: 'Leave Management', desc: 'Review and manage leave requests.', path: '/admin/leave-management' },
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
