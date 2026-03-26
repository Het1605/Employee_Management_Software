import { useState } from 'react';
import API from '../services/api';
import { useCalendarContext } from '../utils/calendarContext';

export const useCalendarMutations = (refreshData) => {
    const { selectedCompanyId } = useCalendarContext();
    const [saving, setSaving] = useState(false);

    const withLoading = async (operation) => {
        setSaving(true);
        try {
            await operation();
            if (refreshData) await refreshData();
        } catch (error) {
            throw error;
        } finally {
            setSaving(false);
        }
    };

    const updateWorkingDays = (days) => withLoading(async () => {
        await API.put(`/calendar/working-days/${selectedCompanyId}`, { days });
    });

    const createHoliday = (holidayData) => withLoading(async () => {
        await API.post(`/calendar/holidays?company_id=${selectedCompanyId}`, holidayData);
    });

    const updateHoliday = (id, holidayData) => withLoading(async () => {
        await API.put(`/calendar/holidays/${id}`, holidayData);
    });

    const deleteHoliday = (id) => withLoading(async () => {
        await API.delete(`/calendar/holidays/${id}`);
    });

    const createOverride = (overrideData) => withLoading(async () => {
        await API.post(`/calendar/overrides?company_id=${selectedCompanyId}`, overrideData);
    });

    const updateOverride = (id, overrideData) => withLoading(async () => {
        await API.put(`/calendar/overrides/${id}`, overrideData);
    });

    const deleteOverride = (id) => withLoading(async () => {
        await API.delete(`/calendar/overrides/${id}`);
    });

    const fetchImportOptions = async (year, country = "IN") => {
        const res = await API.get(`/calendar/import-holidays?year=${year}&country=${country}`);
        return res.data;
    };

    const importHolidays = (holidaysToImport) => withLoading(async () => {
        // Since we don't have a bulk API documented yet, we will map them or simulate
        // In a real app backend would have `/calendar/holidays/bulk`
        // Given constraint: "Do not change backend", we iterate.
        await Promise.all(
            holidaysToImport.map(h => 
                API.post(`/calendar/holidays?company_id=${selectedCompanyId}`, {
                    date: h.date,
                    name: h.name,
                    type: h.type || "public",
                    source: "imported",
                    is_active: true
                })
            )
        );
    });

    return {
        saving,
        updateWorkingDays,
        createHoliday,
        updateHoliday,
        deleteHoliday,
        createOverride,
        updateOverride,
        deleteOverride,
        fetchImportOptions,
        importHolidays,
    };
};
