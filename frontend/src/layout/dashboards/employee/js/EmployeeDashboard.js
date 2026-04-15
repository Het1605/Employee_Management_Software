import React from 'react';
import ModuleDashboard from '../../shared/js/ModuleDashboard';
import { employeeInternSections } from '../../shared/js/employeeInternSections';

const EmployeeDashboard = () => {
  return (
    <ModuleDashboard
      title="Employee Dashboard"
      welcomeTitle="Welcome, Employee"
      subtitle="Stay organized and track your workplace details."
      sections={employeeInternSections}
    />
  );
};

export default EmployeeDashboard;
