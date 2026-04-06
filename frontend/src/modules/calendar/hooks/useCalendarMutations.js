import { useState } from 'react';
import { useCompanyContext } from '../../../contexts/CompanyContext';
import {
    createHoliday as createHolidayRequest,
    createOverride as createOverrideRequest,
    deleteHoliday as deleteHolidayRequest,
    deleteOverride as deleteOverrideRequest,
    fetchImportOptions as fetchImportOptionsRequest,
    updateHoliday as updateHolidayRequest,
    updateOverride as updateOverrideRequest,
    updateWorkingDays as updateWorkingDaysRequest,
} from '../services/calendarService';

export const useCalendarMutations = (refreshData) => {
    const { selectedCompanyId } = useCompanyContext();
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
        await updateWorkingDaysRequest(selectedCompanyId, days);
    });

    const createHoliday = (holidayData) => withLoading(async () => {
        await createHolidayRequest(selectedCompanyId, holidayData);
    });

    const updateHoliday = (id, holidayData) => withLoading(async () => {
        await updateHolidayRequest(id, holidayData);
    });

    const deleteHoliday = (id) => withLoading(async () => {
        await deleteHolidayRequest(id);
    });

    const createOverride = (overrideData) => withLoading(async () => {
        await createOverrideRequest(selectedCompanyId, overrideData);
    });

    const updateOverride = (id, overrideData) => withLoading(async () => {
        await updateOverrideRequest(id, overrideData);
    });

    const deleteOverride = (id) => withLoading(async () => {
        await deleteOverrideRequest(id);
    });

    const fetchImportOptions = async (year, country = "IN") => {
        const res = await fetchImportOptionsRequest(year, country);
        return res.data;
    };

    const importHolidays = (holidaysToImport) => withLoading(async () => {
        // Since we don't have a bulk API documented yet, we will map them or simulate
        // In a real app backend would have `/calendar/holidays/bulk`
        // Given constraint: "Do not change backend", we iterate.
        await Promise.all(
            holidaysToImport.map(h => 
                createHolidayRequest(selectedCompanyId, {
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
