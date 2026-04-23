import React, { useState, useMemo } from 'react';
import { useEmployeeCalendarData } from '../hooks/useEmployeeCalendarData';
import { useEmployeeCalendarSummary } from '../hooks/useEmployeeCalendarSummary';
import '../pages/styles/CalendarModule.css';

const generateCalendarDays = (year, month) => {
    // JS getDay() returns 0 for Sunday, 6 for Saturday. This matches our headers.
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Prefix with nulls up to the first day of the month
    const prefixDays = Array.from({ length: firstDay }, () => null);
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
    return [...prefixDays, ...monthDays];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const EmployeeCalendarView = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const { workingDays, holidays, overrides, loading: coreLoading } = useEmployeeCalendarData();
    const { days: summaryDays, loading: summaryLoading } = useEmployeeCalendarSummary(month, year);

    const [selectedDateInfo, setSelectedDateInfo] = useState(null);
    const dates = useMemo(() => generateCalendarDays(year, month), [year, month]);

    const getStatusForDate = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const dtStr = `${yyyy}-${mm}-${dd}`;

        // Find summary data first for attendance/leave markers
        const summaryDay = summaryDays.find(d => d.date === dtStr);

        // 1. Overrides
        const override = overrides.find(o => o.date === dtStr);
        if (override) return { 
            status: override.override_type, 
            name: override.reason || 'Override', 
            source: 'Manual Override', 
            summary: summaryDay 
        };

        // 2. Holidays
        const holiday = holidays.find(h => h.date === dtStr);
        if (holiday) return { 
            status: 'holiday', 
            name: holiday.name, 
            source: `Holiday (${holiday.type})`, 
            summary: summaryDay 
        };

        // 3. Working Day Logic
        const dayOfWeek = date.getDay();
        const wd = workingDays.find(w => w.day_of_week === dayOfWeek);
        
        let baseStatus = { status: 'working', name: 'Working', source: 'Weekly Rule', summary: summaryDay };

        if (wd) {
            // Check for Alternate Saturdays
            if (dayOfWeek === 6 && wd.is_alternate_saturday) {
                const weekOfMonth = Math.ceil(date.getDate() / 7);
                const offWeeks = wd.off_saturdays || [];
                if (offWeeks.includes(weekOfMonth)) {
                    return { status: 'off', name: 'Off / Rest', source: 'Alternate Saturday Rule', summary: summaryDay };
                }
            }

            if (!wd.is_working) return { status: 'off', name: 'Off / Rest', source: 'Weekly Rule', summary: summaryDay };
            if (wd.is_half_day) baseStatus = { status: 'half_day', name: 'Half Day', source: 'Weekly Rule', summary: summaryDay };
        }

        // If it's a working day, check if we have attendance or leave info from summary
        if (summaryDay) {
            if (summaryDay.leave) {
                return { 
                    status: summaryDay.leave === 'full' ? 'leave-full' : 'leave-half', 
                    name: summaryDay.leave === 'full' ? 'On Leave' : 'Half Leave', 
                    source: 'Approved Leave Request', 
                    summary: summaryDay 
                };
            }
            if (summaryDay.attendance) {
                const attNames = { present: 'Present', half_day: 'Half Day (P)', absent: 'Absent' };
                return { 
                    status: `attendance-${summaryDay.attendance}`, 
                    name: attNames[summaryDay.attendance] || 'Attendance Mark', 
                    source: 'Biometric / Manual Mark', 
                    summary: summaryDay 
                };
            }
        }

        return baseStatus;
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

    const isLoading = coreLoading || summaryLoading;

    return (
        <div className="calendar-view-card">
            {/* Header / Navigation - EXACTLY MATCH ADMIN */}
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
                        {Array.from({ length: 10 }, (_, i) => 2024 + i).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    <button onClick={handleNextMonth} className="nav-btn flex-shrink-0">›</button>
                </div>
                <button onClick={jumpToToday} className="btn-secondary today-btn truncate">Today</button>
            </div>

            {isLoading ? <div className="loading-state">Loading company calendar...</div> : (
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

                            // Priority based color coding
                            if (statusObj.status.includes('leave')) colorClass = 'leave';
                            else if (statusObj.status.includes('attendance')) colorClass = statusObj.status.split('-')[1];
                            else if (statusObj.status.includes('working')) colorClass = 'working';
                            else if (statusObj.status.includes('holiday') || statusObj.status === 'off') colorClass = 'holiday';
                            else if (statusObj.status.includes('half_day')) colorClass = 'half-day';

                            const todayClass = isToday(date) ? 'today-cell' : '';

                            return (
                                <div
                                    key={date.toISOString()}
                                    className={`calendar-cell ${colorClass} ${todayClass}`}
                                    onClick={() => setSelectedDateInfo({ date, statusObj, colorClass })}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="calendar-cell-top">
                                        <div /> {/* Spacer */}
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

            {/* Modal for Date Click - EXACTLY MATCH ADMIN */}
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

export default EmployeeCalendarView;
