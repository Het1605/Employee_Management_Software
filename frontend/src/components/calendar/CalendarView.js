import React, { useState, useEffect } from 'react';
import { useCalendarData } from '../../hooks/useCalendarData';
import API from '../../services/api';
import { useCalendarContext } from '../../utils/calendarContext';

const generateCalendarDays = (year, month) => {
    // Generate dates for visualization padding empty spaces to align with Mon-Sun
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const prefixDays = Array.from({length: firstDay}, () => null);
    const monthDays = Array.from({length: daysInMonth}, (_, i) => new Date(year, month, i + 1));
    return [...prefixDays, ...monthDays];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CalendarView = () => {
    const { selectedCompanyId } = useCalendarContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [dayStatuses, setDayStatuses] = useState({});
    const [loading, setLoading] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dates = generateCalendarDays(year, month);

    useEffect(() => {
        const fetchMonthStatuses = async () => {
             setLoading(true);
             try {
                const statuses = {};
                for (let d of dates) {
                    if (d) {
                        const dtStr = d.toISOString().split('T')[0];
                        // Simulated bulk local fetch for UX speed
                        const res = await API.get(`/calendar/status?company_id=${selectedCompanyId}&target_date=${dtStr}`);
                        statuses[dtStr] = res.data;
                    }
                }
                setDayStatuses(statuses);
             } catch (e) {
                 console.error(e);
             } finally {
                 setLoading(false);
             }
        };

        if (selectedCompanyId) {
            fetchMonthStatuses();
        }
    }, [year, month, selectedCompanyId]);

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    if (!selectedCompanyId) return null;

    return (
        <div className="calendar-view-card">
            <div className="calendar-month-nav">
                <button onClick={handlePrevMonth} className="nav-btn">‹</button>
                <h3 className="month-title">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={handleNextMonth} className="nav-btn">›</button>
            </div>

            {loading ? <div className="loading-state">Loading calendar data...</div> : (
                <div className="calendar-high-fidelity">
                    {/* Header Row */}
                    {WEEKDAYS.map(day => (
                        <div key={day} className="calendar-week-header">{day}</div>
                    ))}

                    {/* Grid Cells */}
                    {dates.map((date, index) => {
                        if (!date) return <div key={`empty-${index}`} className="calendar-cell-empty"></div>;

                        const dtStr = date.toISOString().split('T')[0];
                        const statusObj = dayStatuses[dtStr] || { status: 'loading' };
                        let colorClass = 'loading';
                        if (statusObj.status === 'working') colorClass = 'working';
                        if (statusObj.status === 'holiday') colorClass = 'holiday';
                        if (statusObj.status === 'half_day') colorClass = 'half-day';

                        return (
                            <div key={dtStr} className={`calendar-cell ${colorClass}`}>
                                <div className="cell-date">{date.getDate()}</div>
                                {statusObj.status !== 'loading' && (
                                    <div className="status-badge-container">
                                        <span className={`status-pill ${colorClass}`}>
                                            {statusObj.name || statusObj.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CalendarView;
