import API from '../../../core/api/apiClient';

export const fetchCompanies = () => API.get('/companies/');

export const createCompany = (payload) => API.post('/companies/', payload);

export const updateCompany = (companyId, payload) => API.put(`/companies/${companyId}`, payload);

export const deleteCompany = (companyId) => API.delete(`/companies/${companyId}`);

export const fetchAssignedUsers = (companyId) => API.get(`/companies/${companyId}/users`);

export const fetchAvailableUsers = (companyId) => API.get(`/companies/${companyId}/available`);

export const assignUsersToCompany = (companyId, userIds) =>
  API.post(`/companies/${companyId}/assign`, { user_ids: userIds });

export const unassignUsersFromCompany = (companyId, userIds) =>
  API.post(`/companies/${companyId}/unassign`, { user_ids: userIds });
