import API from '../../../core/api/apiClient';

export const fetchCalendarCompanies = () => API.get('/companies');

export const fetchWorkingDays = (companyId) => API.get(`/calendar/working-days/${companyId}`);

export const fetchHolidays = (companyId) => API.get(`/calendar/holidays?company_id=${companyId}`);

export const fetchOverrides = (companyId) => API.get(`/calendar/overrides?company_id=${companyId}`);

export const updateWorkingDays = (companyId, days) =>
  API.put(`/calendar/working-days/${companyId}`, { days });

export const createHoliday = (companyId, payload) =>
  API.post(`/calendar/holidays?company_id=${companyId}`, payload);

export const updateHoliday = (holidayId, payload) =>
  API.put(`/calendar/holidays/${holidayId}`, payload);

export const deleteHoliday = (holidayId) => API.delete(`/calendar/holidays/${holidayId}`);

export const createOverride = (companyId, payload) =>
  API.post(`/calendar/overrides?company_id=${companyId}`, payload);

export const updateOverride = (overrideId, payload) =>
  API.put(`/calendar/overrides/${overrideId}`, payload);

export const deleteOverride = (overrideId) => API.delete(`/calendar/overrides/${overrideId}`);

export const fetchImportOptions = (year, country = 'IN') =>
  API.get(`/calendar/import-holidays?year=${year}&country=${country}`);

export const fetchLeaveSummary = (companyId, month, year) =>
  API.get(`/leave-requests/calendar-summary?company_id=${companyId}&month=${month}&year=${year}`);

export const fetchEmployeeCalendarSummary = (month, year) => {
    return API.get(`/calendar/employee-summary?month=${month}&year=${year}`);
};

export const fetchMyCompanyCalendarConfig = () => {
    return API.get('/calendar/my-config');
};
