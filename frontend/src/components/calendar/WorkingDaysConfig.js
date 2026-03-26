import React, { useState, useEffect } from 'react';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useCalendarMutations } from '../../hooks/useCalendarMutations';
import { useToast } from '../../contexts/ToastContext';

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const WorkingDaysConfig = () => {
    const { workingDays, loading, refreshData } = useCalendarData();
    const { updateWorkingDays, saving } = useCalendarMutations(refreshData);
    const { showToast } = useToast();

    const [localDays, setLocalDays] = useState([]);

    useEffect(() => {
        if (workingDays && workingDays.length === 7) {
            setLocalDays([...workingDays].sort((a,b) => a.day_of_week - b.day_of_week));
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

    const handleSave = async () => {
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
                    <h3>Weekly Configuration</h3>
                    <p className="subtitle">Define the standard operating days for this company.</p>
                </div>
                
                <div className="days-list">
                    {localDays.length === 7 && DAYS_OF_WEEK.map((dayName, index) => {
                        const dayConfig = localDays[index];
                        return (
                            <div key={index} className="day-list-item">
                                <div className="day-info">
                                    <span className="day-name">{dayName}</span>
                                    <span className={`status-text ${dayConfig.is_working ? 'text-working' : 'text-off'}`}>
                                        {dayConfig.is_working ? 'Working' : 'Off / Rest'}
                                    </span>
                                </div>
                                <div className="day-controls">
                                    <label className="switch-wrapper">
                                        <input 
                                            type="checkbox" 
                                            checked={dayConfig.is_working} 
                                            onChange={() => handleToggleWorking(index)} 
                                            className="ios-switch"
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                    
                                    <div className={`half-day-toggle ${dayConfig.is_working ? 'visible' : 'hidden'}`}>
                                        <label className="checkbox-standard">
                                            <input 
                                                type="checkbox" 
                                                checked={dayConfig.is_half_day} 
                                                onChange={() => handleToggleHalfDay(index)} 
                                            />
                                            Half Day
                                        </label>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <div className="card-footer actions-right">
                    <button 
                        className="btn-primary-action" 
                        onClick={handleSave} 
                        disabled={saving || localDays.length === 0}
                    >
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkingDaysConfig;
