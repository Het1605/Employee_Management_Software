import React, { useMemo, useState } from 'react';
import { useCalendarContext } from '../../utils/calendarContext';
import WorkingDaysConfig from './WorkingDaysConfig';
import HolidayManagement from './HolidayManagement';
import OverrideManagement from './OverrideManagement';
import CalendarView from './CalendarView';
// Rename import if needed, assuming styles is standard CSS module or just global.
import '../../styles/CalendarModule.css';

const CalendarDashboard = ({ companies = [] }) => {
    const { selectedCompany, selectedCompanyId, setSelectedCompanyId } = useCalendarContext();
    const [activeTab, setActiveTab] = useState('calendar');

    const companyOptions = useMemo(() => {
        const hasSelectedCompany = selectedCompanyId && companies.some((company) => String(company.id) === String(selectedCompanyId));

        if (hasSelectedCompany || !selectedCompany?.id) {
            return companies;
        }

        return [
            { id: selectedCompany.id, name: selectedCompany.name || 'Selected Company' },
            ...companies,
        ];
    }, [companies, selectedCompany, selectedCompanyId]);

    const handleCompanyChange = (e) => {
        const companyId = e.target.value;
        const selectedOption = companies.find((company) => String(company.id) === String(companyId));
        setSelectedCompanyId(selectedOption || companyId);
    };

    return (
        <div className="calendar-dashboard-wrapper">
            {/* Unified Action Bar Header */}
            <div className="calendar-header-card">
                <div className="header-left">
                    <span className="icon-building">🏢</span>
                    <div className={`calendar-company-select-wrapper ${selectedCompanyId ? 'has-value' : 'is-placeholder'}`}>
                        <select 
                            value={selectedCompanyId || ''} 
                            onChange={handleCompanyChange}
                            className="company-select-modern calendar-company-select"
                        >
                            <option value="" disabled>Select Company</option>
                            {companyOptions.map((company) => (
                                <option key={company.id} value={company.id}>{company.name}</option>
                            ))}
                        </select>
                        <span className="calendar-company-select-arrow" aria-hidden="true">▼</span>
                    </div>
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
                        <button className={`modern-tab ${activeTab === 'overrides' ? 'active' : ''}`} onClick={() => setActiveTab('overrides')}>Day Adjustments</button>
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
