import React from 'react';
import MainLayout from '../../../layout/MainLayout/js/MainLayout';
import CalendarDashboard from '../pages/js/CalendarDashboard';

const CalendarManagementPage = ({ title }) => {
  return (
    <MainLayout title={title}>
      <CalendarDashboard />
    </MainLayout>
  );
};

export default CalendarManagementPage;
