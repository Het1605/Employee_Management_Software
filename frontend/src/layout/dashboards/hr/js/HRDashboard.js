import React from 'react';
import ModuleDashboard from '../../shared/js/ModuleDashboard';

const HRDashboard = () => {
  const sections = [
    { title: 'User Management', desc: 'Manage employee accounts and roles.', path: '/hr/users' },
    { title: 'Manage Companies', desc: 'Create and update company records.', path: '/hr/companies' },
    { title: 'Company Assignment', desc: 'Assign users to companies.', path: '/hr/company-assignment' },
    { title: 'Calendar', desc: 'Manage holidays, working days, and overrides.', path: '/hr/calendar' },
    { title: 'Salary Structure', desc: 'Manage payroll and salary structures.', path: '/hr/salary-structure' },
    { title: 'Documents', desc: 'Create and manage official documents.', path: '/hr/documents' },
    { title: 'Attendance Management', desc: 'Track and review employee attendance.', path: '/hr/attendance' },
    { title: 'Leave Management', desc: 'Review and manage leave requests.', path: '/hr/leave-management' },
  ];

  return (
    <ModuleDashboard
      title="HR Dashboard"
      welcomeTitle="Welcome, HR Manager"
      subtitle="Oversee organizational talent and employee well-being."
      sections={sections}
    />
  );
};

export default HRDashboard;
