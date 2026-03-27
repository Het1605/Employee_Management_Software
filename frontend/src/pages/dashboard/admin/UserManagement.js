import React, { useState, useEffect } from 'react';
import Layout from '../../../components/layout/Layout';
import UserCard from '../../../components/common/UserCard';
import UserFormModal from '../../../components/common/UserFormModal';
import ChangePasswordModal from '../../../components/common/ChangePasswordModal';
import API from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { handleApiError } from '../../../utils/errorHandler';

import styles from '../../../styles/UserManagement.module.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { showToast } = useToast();

  const fetchUsers = async () => {
    try {
      const res = await API.get('/users/');
      setUsers(res.data);
    } catch (err) {
      showToast("Failed to load users. " + handleApiError(err), 'error');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (data) => {
    try {
      await API.post('/users/', data);
      showToast("User created successfully", 'success');
      fetchUsers();
      setIsModalOpen(false);
    } catch (err) {
      showToast(handleApiError(err), 'error');
    }
  };

  const handleUpdate = async (data) => {
    try {
      await API.put(`/users/${selectedUser.id}`, data);
      showToast("User updated successfully", 'success');
      fetchUsers();
      setIsModalOpen(false);
    } catch (err) {
      showToast(handleApiError(err), 'error');
    }
  };

  return (
    <Layout 
      title="User Management" 
      actionLabel="Add New" 
      onActionClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
    >
      <div className={styles.userGrid}>
        {users.map(user => (
          <UserCard 
            key={user.id} 
            user={user} 
            onEdit={() => { setSelectedUser(user); setIsModalOpen(true); }} 
            onChangePassword={() => { setSelectedUser(user); setIsPasswordModalOpen(true); }}
            onDelete={async () => {
              if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                try {
                  await API.delete(`/users/${user.id}`);
                  showToast("User deleted successfully", 'success');
                  fetchUsers();
                } catch (err) {
                  showToast("Unable to delete user. " + handleApiError(err), 'error');
                }
              }
            }}
          />
        ))}
      </div>
      {isModalOpen && (
        <UserFormModal 
          user={selectedUser} 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={selectedUser ? handleUpdate : handleCreate} 
        />
      )}
      {isPasswordModalOpen && (
        <ChangePasswordModal 
          user={selectedUser} 
          onClose={() => setIsPasswordModalOpen(false)} 
        />
      )}
    </Layout>
  );
};

export default UserManagement;
