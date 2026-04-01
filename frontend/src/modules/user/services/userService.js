import API from '../../../core/api/apiClient';

export const fetchUsers = () => API.get('/users/');

export const createUser = (payload) => API.post('/users/', payload);

export const updateUser = (userId, payload) => API.put(`/users/${userId}`, payload);

export const deleteUser = (userId) => API.delete(`/users/${userId}`);

export const toggleUserStatus = (userId, isActive) =>
  API.patch(`/users/${userId}/toggle-status`, { is_active: isActive });

export const resetUserPassword = (userId, password) =>
  API.put(`/users/${userId}/reset-password`, { password });
