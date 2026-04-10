import { useState, useCallback, useEffect } from 'react';
import { fetchMyCompanyCalendarConfig } from '../services/calendarService';

export const useEmployeeCalendarData = () => {
    const [workingDays, setWorkingDays] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [overrides, setOverrides] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetchMyCompanyCalendarConfig();
            const { working_days, holidays, overrides } = response.data;

            setWorkingDays(working_days);
            setHolidays(holidays);
            setOverrides(overrides);
        } catch (error) {
            console.error("Error fetching employee calendar data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { workingDays, holidays, overrides, loading, refreshData: fetchData };
};
