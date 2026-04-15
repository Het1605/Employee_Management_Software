import React from 'react';
import ModuleDashboard from '../../shared/js/ModuleDashboard';
import { employeeInternSections } from '../../shared/js/employeeInternSections';

const InternDashboard = () => {
  return (
    <ModuleDashboard
      title="Intern Dashboard"
      welcomeTitle="Welcome, Intern"
      subtitle="Stay organized and track your workplace details."
      sections={employeeInternSections}
    />
  );
};

export default InternDashboard;
