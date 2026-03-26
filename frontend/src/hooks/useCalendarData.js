import { useState, useCallback, useEffect } from 'react';
import API from '../services/api';
import { useCalendarContext } from '../utils/calendarContext';

export const useCalendarData = () => {
    const { selectedCompanyId } = useCalendarContext();
    const [workingDays, setWorkingDays] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [overrides, setOverrides] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!selectedCompanyId) {
            setWorkingDays([]);
            setHolidays([]);
            setOverrides([]);
            return;
        }

        setLoading(true);
        try {
            const [wdRes, holRes, ovRes] = await Promise.all([
                API.get(`/calendar/working-days/${selectedCompanyId}`),
                API.get(`/calendar/holidays?company_id=${selectedCompanyId}`),
                API.get(`/calendar/overrides?company_id=${selectedCompanyId}`)
            ]);

            setWorkingDays(wdRes.data);
            setHolidays(holRes.data);
            setOverrides(ovRes.data);
        } catch (error) {
            console.error("Error fetching calendar data:", error);
            // Optionally could plug in global error handler
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { workingDays, holidays, overrides, loading, refreshData: fetchData };
};
