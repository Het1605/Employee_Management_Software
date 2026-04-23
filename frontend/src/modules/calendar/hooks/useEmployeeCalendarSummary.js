import { useState, useCallback, useEffect } from 'react';
import { fetchEmployeeCalendarSummary } from '../services/calendarService';
import { useCompanyContext } from '../../../contexts/CompanyContext';

export const useEmployeeCalendarSummary = (month, year) => {
    const { selectedCompanyId } = useCompanyContext();
    const [days, setDays] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!selectedCompanyId) {
            setDays([]);
            return;
        }
        setLoading(true);
        try {
            const response = await fetchEmployeeCalendarSummary(selectedCompanyId, month + 1, year);
            setDays(response.data.days);
        } catch (error) {
            console.error("Error fetching employee calendar summary:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId, month, year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { days, loading, refreshSummary: fetchData };
};
