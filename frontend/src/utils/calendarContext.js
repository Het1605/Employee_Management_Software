import React, { createContext, useContext, useState, useEffect } from 'react';

const CalendarContext = createContext();

export const CalendarProvider = ({ children }) => {
    // We store the selected company ID here
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);

    // Context value
    const value = {
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
