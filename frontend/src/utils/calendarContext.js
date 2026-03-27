import React, { createContext, useContext, useState, useEffect } from 'react';

const CalendarContext = createContext();
const STORAGE_KEY = 'selectedCompany';

export const CalendarProvider = ({ children }) => {
    const [selectedCompany, setSelectedCompany] = useState(() => {
        try {
            const storedCompany = localStorage.getItem(STORAGE_KEY);
            return storedCompany ? JSON.parse(storedCompany) : null;
        } catch (error) {
            console.error('Failed to restore selected company:', error);
            return null;
        }
    });

    const setSelectedCompanyId = (company) => {
        if (!company) {
            setSelectedCompany(null);
            return;
        }

        if (typeof company === 'object') {
            setSelectedCompany({
                id: String(company.id),
                name: company.name || '',
            });
            return;
        }

        setSelectedCompany({
            id: String(company),
            name: '',
        });
    };

    useEffect(() => {
        try {
            if (selectedCompany?.id) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedCompany));
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (error) {
            console.error('Failed to persist selected company:', error);
        }
    }, [selectedCompany]);

    const selectedCompanyId = selectedCompany?.id || null;

    // Context value
    const value = {
        selectedCompany,
        selectedCompanyId,
        setSelectedCompanyId,
    };

    return (
        <CalendarContext.Provider value={value}>
            {children}
        </CalendarContext.Provider>
    );
};

export const useCalendarContext = () => {
    const context = useContext(CalendarContext);
    if (!context) {
        throw new Error("useCalendarContext must be used within a CalendarProvider");
    }
    return context;
};
