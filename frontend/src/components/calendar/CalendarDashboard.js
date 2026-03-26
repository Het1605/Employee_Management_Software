import React, { useState } from 'react';
import { useCalendarContext } from '../../utils/calendarContext';
import WorkingDaysConfig from './WorkingDaysConfig';
import HolidayManagement from './HolidayManagement';
import OverrideManagement from './OverrideManagement';
import CalendarView from './CalendarView';
// Rename import if needed, assuming styles is standard CSS module or just global.
import '../../styles/CalendarModule.css';

const CalendarDashboard = ({ companies = [] }) => {
    const { selectedCompanyId, setSelectedCompanyId } = useCalendarContext();
    const [activeTab, setActiveTab] = useState('calendar');

    const handleCompanyChange = (e) => {
        setSelectedCompanyId(e.target.value);
    };

    const getPrimaryAction = () => {
        if (!selectedCompanyId) return null;
        if (activeTab === 'holidays') return <button className="btn-primary-action">+ Add Holiday</button>;
        if (activeTab === 'overrides') return <button className="btn-primary-action">+ Add Override</button>;
        // calendar/working_days might not have a generic global add button
        return null;
    };

    return (
        <div className="calendar-dashboard-wrapper">
            {/* Unified Action Bar Header */}
            <div className="calendar-header-card">
                <div className="header-left">
                    <span className="icon-building">🏢</span>
                    <select 
                        value={selectedCompanyId || ''} 
                        onChange={handleCompanyChange}
                        className="company-select-modern"
                    >
                        <option value="" disabled>Select Company ▼</option>
                        {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="header-right">
                    {getPrimaryAction()}
                </div>
            </div>

            {!selectedCompanyId ? (
                <div className="empty-state-card">
                    <div className="empty-icon">📅</div>
                    <h3>No Company Selected</h3>
                    <p>Please select a company from the dropdown menu to view or manage its calendar.</p>
                </div>
            ) : (
                <div className="calendar-content">
                    {/* Segmented Control Tabs */}
                    <div className="modern-tabs-container">
                        <button className={`modern-tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Month View</button>
                        <button className={`modern-tab ${activeTab === 'working_days' ? 'active' : ''}`} onClick={() => setActiveTab('working_days')}>Working Days</button>
                        <button className={`modern-tab ${activeTab === 'holidays' ? 'active' : ''}`} onClick={() => setActiveTab('holidays')}>Holidays</button>
                        <button className={`modern-tab ${activeTab === 'overrides' ? 'active' : ''}`} onClick={() => setActiveTab('overrides')}>Overrides</button>
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
