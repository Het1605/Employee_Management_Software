import API from '../../../core/api/apiClient';

export const fetchUserProfile = () => {
    return API.get('/users/me');
};

export const submitResignation = (endDate) => {
    return API.post('/users/resign', { end_date: endDate });
};

export const fetchUsers = (companyId = null) => {
    const params = companyId ? { company_id: companyId } : {};
    return API.get('/users/', { params });
};

export const createUser = (payload) => API.post('/users/', payload);

export const updateUser = (userId, payload) => API.put(`/users/${userId}`, payload);

export const toggleUserStatus = (userId, isActive) => 
    API.patch(`/users/${userId}/toggle-status`, { is_active: isActive });

export const deleteUser = (userId) => API.delete(`/users/${userId}`);

export const resetUserPassword = (userId, password) =>
  API.put(`/users/${userId}/reset-password`, { password });
