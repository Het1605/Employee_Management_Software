import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useCalendarData } from '../hooks/useCalendarData';
import { useCompanyContext } from '../../../contexts/CompanyContext';
import { fetchLeaveSummary } from '../services/calendarService';

const generateCalendarDays = (year, month) => {
    // JS getDay() returns 0 for Sunday, 6 for Saturday. This matches our headers.
    const firstDay = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Prefix with nulls up to the first day of the month
    const prefixDays = Array.from({length: firstDay}, () => null);
    const monthDays = Array.from({length: daysInMonth}, (_, i) => new Date(year, month, i + 1));
    return [...prefixDays, ...monthDays];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const CalendarView = () => {
    const { selectedCompanyId } = useCompanyContext();
    const { workingDays, holidays, overrides, loading: coreLoading } = useCalendarData();
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDateInfo, setSelectedDateInfo] = useState(null); 
    const [leaveSummary, setLeaveSummary] = useState({});
    const [fetchingLeaves, setFetchingLeaves] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dates = useMemo(() => generateCalendarDays(year, month), [year, month]);

    const fetchLeaves = useCallback(async () => {
        if (!selectedCompanyId) return;
        setFetchingLeaves(true);
        try {
            // Month is 0-indexed in JS, but 1-indexed in our API
            const response = await fetchLeaveSummary(selectedCompanyId, month + 1, year);
            const summaryMap = {};
            response.data.forEach(item => {
                summaryMap[item.date] = item.leave_count;
            });
            setLeaveSummary(summaryMap);
        } catch (error) {
            console.error("Error fetching leave summary:", error);
        } finally {
            setFetchingLeaves(false);
        }
    }, [selectedCompanyId, month, year]);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    const getStatusForDate = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const dtStr = `${yyyy}-${mm}-${dd}`;
        
        // 1. Overrides
        const override = overrides.find(o => o.date === dtStr);
        if (override) return { status: override.override_type, name: override.reason || 'Override', source: 'Manual Override', dateStr: dtStr };
        
        // 2. Holidays
        const holiday = holidays.find(h => h.date === dtStr);
        if (holiday) return { status: 'holiday', name: holiday.name, source: `Holiday (${holiday.type})`, dateStr: dtStr };

        // 3. Working Days
        const dayOfWeek = date.getDay();
        const wd = workingDays.find(w => w.day_of_week === dayOfWeek);
        if (wd) {
            if (!wd.is_working) return { status: 'off', name: 'Off / Rest', source: 'Weekly Rule', dateStr: dtStr };
            if (wd.is_half_day) return { status: 'half_day', name: 'Half Day', source: 'Weekly Rule', dateStr: dtStr };
            return { status: 'working', name: 'Working', source: 'Weekly Rule', dateStr: dtStr };
        }

        return { status: 'unknown', name: 'Unconfigured', source: 'N/A', dateStr: dtStr };
    };

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const jumpToToday = () => setCurrentDate(new Date());

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() && 
               date.getMonth() === today.getMonth() && 
               date.getFullYear() === today.getFullYear();
    };

    if (!selectedCompanyId) return null;

    return (
        <div className="calendar-view-card">
            <div className="calendar-month-nav-container">
                <div className="calendar-month-nav-row1">
                    <button onClick={handlePrevMonth} className="nav-btn flex-shrink-0">‹</button>
                    
                    <select 
                        className="company-select-modern text-center month-select" 
                        value={month} 
                        onChange={(e) => setCurrentDate(new Date(year, parseInt(e.target.value), 1))}
                    >
                        {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    
                    <select 
                        className="company-select-modern text-center year-select" 
                        value={year} 
                        onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), month, 1))}
                    >
                        {Array.from({length: 10}, (_, i) => year - 5 + i).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
 
                    <button onClick={handleNextMonth} className="nav-btn flex-shrink-0">›</button>
                </div>
                <button onClick={jumpToToday} className="btn-secondary today-btn truncate">Today</button>
            </div>
 
            {coreLoading ? <div className="loading-state">Loading calendar data...</div> : (
                <div className="calendar-scroll-area">
                    <div className="calendar-high-fidelity">
                        {/* Header Row */}
                        {WEEKDAYS.map(day => (
                            <div key={day} className="calendar-week-header">{day}</div>
                        ))}
 
                        {/* Grid Cells */}
                        {dates.map((date, index) => {
                            if (!date) return <div key={`empty-${index}`} className="calendar-cell-empty"></div>;
 
                            const statusObj = getStatusForDate(date);
                            let colorClass = 'loading'; 
                            
                            if (statusObj.status.includes('working')) colorClass = 'working';
                            if (statusObj.status.includes('holiday') || statusObj.status === 'off') colorClass = 'holiday';
                            if (statusObj.status.includes('half_day')) colorClass = 'half-day';
 
                            const todayClass = isToday(date) ? 'today-cell' : '';
                            const leaveCount = leaveSummary[statusObj.dateStr] || 0;
                            const showLeaveBadge = leaveCount > 0 && (statusObj.status === 'working' || statusObj.status === 'half_day');
 
                            return (
                                <div 
                                    key={date.toISOString()} 
                                    className={`calendar-cell ${colorClass} ${todayClass}`}
                                    onClick={() => setSelectedDateInfo({ date, statusObj, colorClass, leaveCount })}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="calendar-cell-top">
                                        {showLeaveBadge ? (
                                            <div className="leave-count-badge">
                                                <span className="icon-users">👥</span>
                                                <span>{leaveCount} {leaveCount === 1 ? 'on leave' : 'on leave'}</span>
                                            </div>
                                        ) : <div />}
                                        <div className="cell-date">{date.getDate()}</div>
                                    </div>
                                    
                                    <div className="status-badge-container">
                                        <span className={`status-pill ${colorClass}`} title={statusObj.name}>
                                            {statusObj.name.length > 15 ? statusObj.name.substring(0, 15) + '...' : statusObj.name}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Simple Inline Modal for Date Click */}
            {selectedDateInfo && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="modal-content card" style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
                        <h2>{selectedDateInfo.date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                        <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <p><strong>Status:</strong> <span className={`pill-badge ${selectedDateInfo.colorClass}`}>{selectedDateInfo.statusObj.name}</span></p>
                            <p><strong>Source:</strong> {selectedDateInfo.statusObj.source}</p>
                        </div>
                        <button className="btn-primary-action" style={{ width: '100%' }} onClick={() => setSelectedDateInfo(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
