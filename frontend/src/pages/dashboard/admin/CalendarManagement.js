import React, { useEffect, useState } from 'react';
import CalendarDashboard from '../../../components/calendar/CalendarDashboard';
import { CalendarProvider } from '../../../utils/calendarContext';
import API from '../../../services/api';
import Layout from '../../../components/layout/Layout';

const AdminCalendarManagement = () => {
    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        // Admin can see all companies
        API.get('/companies').then(res => {
            setCompanies(res.data || []);
        }).catch(err => console.error(err));
    }, []);

    return (
        <Layout title="Calendar Management (Admin)">
            <CalendarProvider>
                <CalendarDashboard companies={companies} />
            </CalendarProvider>
        </Layout>
    );
};

export default AdminCalendarManagement;
