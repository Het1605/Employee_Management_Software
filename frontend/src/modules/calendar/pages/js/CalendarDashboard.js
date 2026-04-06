import React, { useState } from 'react';
import { useCompanyContext } from '../../../../contexts/CompanyContext';
import WorkingDaysConfig from '../../components/WorkingDaysConfig';
import HolidayManagement from './HolidayManagement';
import OverrideManagement from './OverrideManagement';
import CalendarView from '../../components/CalendarView';
import '../styles/CalendarModule.css';

const CalendarDashboard = () => {
    const { selectedCompanyId } = useCompanyContext();
    const [activeTab, setActiveTab] = useState('calendar');

    return (
        <div className="calendar-dashboard-wrapper">
            {!selectedCompanyId ? (
                <div className="empty-state-card">
                    <div className="empty-icon">📅</div>
                    <h3>No Company Selected</h3>
                    <p>Please select a company from the header to view or manage its calendar.</p>
                </div>
            ) : (
                <div className="calendar-content">
                    {/* Segmented Control Tabs */}
                    <div className="modern-tabs-container">
                        <button className={`modern-tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Month View</button>
                        <button className={`modern-tab ${activeTab === 'working_days' ? 'active' : ''}`} onClick={() => setActiveTab('working_days')}>Working Days</button>
                        <button className={`modern-tab ${activeTab === 'holidays' ? 'active' : ''}`} onClick={() => setActiveTab('holidays')}>Holidays</button>
                        <button className={`modern-tab ${activeTab === 'overrides' ? 'active' : ''}`} onClick={() => setActiveTab('overrides')}>Custom Days</button>
                    </div>

                    <div className="tab-body fade-in">
                        {activeTab === 'calendar' && <CalendarView />}
                        {activeTab === 'working_days' && <WorkingDaysConfig />}
                        {activeTab === 'holidays' && <HolidayManagement />}
                        {activeTab === 'overrides' && <OverrideManagement />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarDashboard;
