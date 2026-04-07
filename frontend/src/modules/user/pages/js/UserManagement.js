import React, { useState, useEffect } from 'react';
import MainLayout from '../../../../layout/MainLayout/js/MainLayout';
import UserCard from '../../components/UserCard';
import UserFormModal from '../../components/UserFormModal';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { useToast } from '../../../../contexts/ToastContext';
import { handleApiError } from '../../../../utils/errorHandler';
import {
  createUser,
  deleteUser,
  fetchUsers as fetchUsersRequest,
  toggleUserStatus,
  updateUser,
} from '../../services/userService';

import styles from '../styles/UserManagement.module.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { showToast } = useToast();

  const fetchUsers = async () => {
    try {
      const res = await fetchUsersRequest();
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
      await createUser(data);
      showToast("User created successfully", 'success');
      fetchUsers();
      setIsModalOpen(false);
    } catch (err) {
      showToast(handleApiError(err), 'error');
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateUser(selectedUser.id, data);
      showToast("User updated successfully", 'success');
      fetchUsers();
      setIsModalOpen(false);
    } catch (err) {
      showToast(handleApiError(err), 'error');
    }
  };

  const handleToggleStatus = async (userId, isActive) => {
    try {
      await toggleUserStatus(userId, isActive);
      showToast(`User ${isActive ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchUsers();
    } catch (err) {
      showToast(handleApiError(err), 'error');
    }
  };

  return (
    <MainLayout>
      <div className={styles.actionRow}>
        <button
          className="btn-primary-action"
          onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
        >
          Add New
        </button>
      </div>
      <div className={styles.userGrid}>
        {users.map(user => (
          <UserCard 
            key={user.id} 
            user={user} 
            onEdit={() => { setSelectedUser(user); setIsModalOpen(true); }} 
            onChangePassword={() => { setSelectedUser(user); setIsPasswordModalOpen(true); }}
            onStatusChange={handleToggleStatus}
            onDelete={async () => {
              if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                try {
                  await deleteUser(user.id);
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
    </MainLayout>
  );
};

export default UserManagement;
