import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import UserCard from '../components/UserCard';
import UserFormModal from '../components/UserFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import API from '../services/api';
import styles from '../styles/UserManagement.module.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/users/');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateOrUpdate = async (formData) => {
    try {
      if (selectedUser) {
        await API.put(`/users/${selectedUser.id}`, formData);
      } else {
        await API.post('/users/', formData);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Something went wrong');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/users/${selectedUser.id}`);
      setIsConfirmOpen(false);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const openAddModal = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (user) => {
    setSelectedUser(user);
    setIsConfirmOpen(true);
  };

  return (
    <Layout 
      title="Manage Users" 
      onActionClick={openAddModal} 
      actionLabel="Add New"
    >
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className={styles.userGrid}>
          {users.map(user => (
            <UserCard 
              key={user.id} 
              user={user} 
              onEdit={openEditModal} 
              onDelete={openDeleteConfirm} 
            />
          ))}
        </div>
      )}

      <UserFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateOrUpdate}
        user={selectedUser}
      />

      <ConfirmDialog 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleDelete}
        message={`This will permanently delete ${selectedUser?.name}.`}
      />
    </Layout>
  );
};

export default UserManagement;
