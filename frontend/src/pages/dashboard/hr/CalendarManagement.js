import React, { useEffect, useState } from 'react';
import CalendarDashboard from '../../../components/calendar/CalendarDashboard';
import { CalendarProvider } from '../../../utils/calendarContext';
import API from '../../../services/api';
import Layout from '../../../components/layout/Layout';

const HRCalendarManagement = () => {
    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        // HR usually sees a subset. For demo, we assume hitting an HR-assigned endpoint.
        // If the backend doesn't specifically have /companies/my right now, fallback to /companies
        API.get('/companies').then(res => {
            setCompanies(res.data || []);
        }).catch(err => console.error(err));
    }, []);

    return (
        <Layout title="Calendar Management (HR)">
            <CalendarProvider>
                <CalendarDashboard companies={companies} />
            </CalendarProvider>
        </Layout>
    );
};

export default HRCalendarManagement;
