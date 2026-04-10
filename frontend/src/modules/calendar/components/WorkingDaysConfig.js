import React, { useState, useEffect } from 'react';
import { useCalendarData } from '../hooks/useCalendarData';
import { useCalendarMutations } from '../hooks/useCalendarMutations';
import { useToast } from '../../../contexts/ToastContext';

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const WorkingDaysConfig = () => {
    const { workingDays, loading, refreshData } = useCalendarData();
    const { updateWorkingDays, saving } = useCalendarMutations(refreshData);
    const { showToast } = useToast();

    const [localDays, setLocalDays] = useState([]);

    useEffect(() => {
        if (workingDays && workingDays.length === 7) {
            setLocalDays([...workingDays].sort((a, b) => a.day_of_week - b.day_of_week));
        }
    }, [workingDays]);

    const handleToggleWorking = (index) => {
        const newDays = [...localDays];
        newDays[index] = {
            ...newDays[index],
            is_working: !newDays[index].is_working,
            is_half_day: !newDays[index].is_working ? false : newDays[index].is_half_day
        };
        setLocalDays(newDays);
    };

    const handleToggleHalfDay = (index) => {
        const newDays = [...localDays];
        newDays[index] = { ...newDays[index], is_half_day: !newDays[index].is_half_day };
        setLocalDays(newDays);
    };

    const handleToggleAlternate = (index) => {
        const newDays = [...localDays];
        newDays[index] = {
            ...newDays[index],
            is_alternate_saturday: !newDays[index].is_alternate_saturday,
            off_saturdays: !newDays[index].is_alternate_saturday ? [2, 4] : [] // Default 2nd & 4th
        };
        setLocalDays(newDays);
    };

    const handleToggleSaturdayWeek = (index, weekNum) => {
        const newDays = [...localDays];
        const currentOff = newDays[index].off_saturdays || [];
        let nextOff;
        if (currentOff.includes(weekNum)) {
            nextOff = currentOff.filter(w => w !== weekNum);
        } else {
            nextOff = [...currentOff, weekNum].sort();
        }
        newDays[index] = { ...newDays[index], off_saturdays: nextOff };
        setLocalDays(newDays);
    };

    const hasChanges = React.useMemo(() => {
        if (!workingDays || workingDays.length !== 7 || localDays.length !== 7) return false;
        const initialSorted = [...workingDays].sort((a, b) => a.day_of_week - b.day_of_week);
        return JSON.stringify(localDays) !== JSON.stringify(initialSorted);
    }, [localDays, workingDays]);

    const handleSave = async () => {
        // Validation: If alternate is enabled, at least one week must be selected
        const satIndex = 5; // Saturday (Monday=0, Sat=5)
        const satConfig = localDays[satIndex];
        if (satConfig.is_alternate_saturday && (!satConfig.off_saturdays || satConfig.off_saturdays.length === 0)) {
            showToast("Please select at least one OFF Saturday for the alternate rule.", "error");
            return;
        }

        try {
            await updateWorkingDays(localDays);
            showToast("Working days successfully updated.", "success");
        } catch (err) {
            showToast("Failed to update working days.", "error");
        }
    };

    if (loading && localDays.length === 0) return <div className="loading-state">Loading configuration...</div>;

    return (
        <div className="working-days-container">
            <div className="working-days-card">
                <div className="card-header">
                    <div className="card-header-top">
                        <h3>Weekly Configuration</h3>
                        <button
                            className="btn-primary-action"
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                        >
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                    <p className="subtitle">Define the standard operating days for this company.</p>
                </div>

                <div className="days-list">
                    {localDays.length === 7 && DAYS_OF_WEEK.map((dayName, index) => {
                        const dayConfig = localDays[index];
                        return (
                            <React.Fragment key={index}>
                                <div className="day-list-item">
                                    <div className="day-name">{dayName}</div>

                                    <div className={`day-status ${dayConfig.is_working ? 'text-working' : 'text-off'}`}>
                                        {dayConfig.is_working ? 'Working' : 'Off / Rest'}
                                    </div>

                                    <div className={`half-day-section ${dayConfig.is_working ? 'visible' : 'hidden'}`}>
                                        <label className="checkbox-standard">
                                            <input
                                                type="checkbox"
                                                checked={dayConfig.is_half_day}
                                                onChange={() => handleToggleHalfDay(index)}
                                            />
                                            <span>Half Day</span>
                                        </label>
                                    </div>

                                    <div className="day-toggle-action">
                                        <label className="switch-wrapper">
                                            <input
                                                type="checkbox"
                                                checked={dayConfig.is_working}
                                                onChange={() => handleToggleWorking(index)}
                                                className="ios-switch"
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                </div>

                                {/* Alternate Saturday Panel (Only for Saturday when working) */}
                                {dayName === "Saturday" && dayConfig.is_working && (
                                    <div className="alternate-saturday-panel">
                                        <div className="alternate-header">
                                            <label className="alternate-toggle-label">
                                                <input
                                                    type="checkbox"
                                                    checked={dayConfig.is_alternate_saturday}
                                                    onChange={() => handleToggleAlternate(index)}
                                                />
                                                <span>Enable Alternate Saturdays</span>
                                            </label>

                                            {dayConfig.is_alternate_saturday && (
                                                <div className="pattern-summary">
                                                    <span className="btn-icon-info">ℹ️</span>
                                                    Off on: {dayConfig.off_saturdays?.length > 0
                                                        ? dayConfig.off_saturdays.map(w => {
                                                            const suffix = ["st", "nd", "rd", "th", "th"][w - 1];
                                                            return `${w}${suffix}`;
                                                        }).join(", ") + " Saturday"
                                                        : "None selected"}
                                                </div>
                                            )}
                                        </div>

                                        {dayConfig.is_alternate_saturday && (
                                            <div className="alternate-body">
                                                <p className="subtitle" style={{ marginBottom: '0.5rem', fontSize: '0.8rem' }}>Selected weeks will be marked as OFF:</p>
                                                <div className="saturday-weeks-grid">
                                                    {[1, 2, 3, 4, 5].map(week => (
                                                        <label key={week} className="week-checkbox-label">
                                                            <span>{week}{["st", "nd", "rd", "th", "th"][week - 1]}</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={dayConfig.off_saturdays?.includes(week)}
                                                                onChange={() => handleToggleSaturdayWeek(index, week)}
                                                            />
                                                        </label>
                                                    ))}
                                                </div>
                                                <p className="text-muted" style={{ fontSize: '0.75rem' }}>Example: 2nd & 4th Saturdays will be marked as holidays.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WorkingDaysConfig;
