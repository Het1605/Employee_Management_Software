import React, { useEffect, useState } from 'react';
import MainLayout from '../../../layout/MainLayout/js/MainLayout';
import CalendarDashboard from '../pages/js/CalendarDashboard';
import { CalendarProvider } from '../hooks/calendarContext';
import { fetchCalendarCompanies } from '../services/calendarService';

const CalendarManagementPage = ({ title }) => {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchCalendarCompanies()
      .then((res) => {
        setCompanies(res.data || []);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <MainLayout title={title}>
      <CalendarProvider>
        <CalendarDashboard companies={companies} />
      </CalendarProvider>
    </MainLayout>
  );
};

export default CalendarManagementPage;
