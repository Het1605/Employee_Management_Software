import React from 'react';
import MainLayout from '../../../../layout/MainLayout/js/MainLayout';
import EmployeeCalendarView from '../../components/EmployeeCalendarView';
import '../../pages/styles/CalendarModule.css';

const EmployeeCalendarPage = () => {
    return (
        <MainLayout title="My Calendar">
            <div className="calendar-management-page">
                <header className="page-header">
                    <div>
                        <h1 className="page-title">My Calendar</h1>
                        <p className="page-subtitle">View your attendance, leaves, and company holidays in one place.</p>
                    </div>
                </header>

                <main className="page-content">
                    <EmployeeCalendarView />
                </main>
            </div>
        </MainLayout>
    );
};

export default EmployeeCalendarPage;
