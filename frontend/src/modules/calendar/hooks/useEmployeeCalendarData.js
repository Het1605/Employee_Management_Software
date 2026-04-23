import { useState, useCallback, useEffect } from 'react';
import { fetchMyCompanyCalendarConfig } from '../services/calendarService';
import { useCompanyContext } from '../../../contexts/CompanyContext';

export const useEmployeeCalendarData = () => {
    const { selectedCompanyId } = useCompanyContext();
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
            const response = await fetchMyCompanyCalendarConfig(selectedCompanyId);
            const { working_days, holidays, overrides } = response.data;

            setWorkingDays(working_days);
            setHolidays(holidays);
            setOverrides(overrides);
        } catch (error) {
            console.error("Error fetching employee calendar data:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId]);

    useEffect(() => {
        fetchData();
    }, [fetchData, selectedCompanyId]);

    return { workingDays, holidays, overrides, loading, refreshData: fetchData };
};
