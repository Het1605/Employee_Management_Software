import React, { useState, useEffect } from 'react';
import Layout from '../../../components/layout/Layout';
import UserCard from '../../../components/common/UserCard';
import UserFormModal from '../../../components/common/UserFormModal';
import API from '../../../services/api';

import styles from '../../../styles/UserManagement.module.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await API.get('/users/');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (data) => {
    try {
      await API.post('/users/', data);
      fetchUsers();
      setIsModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.detail || "Creation failed";
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
      console.error(err);
    }
  };

  const handleUpdate = async (data) => {
    try {
      await API.put(`/users/${selectedUser.id}`, data);
      fetchUsers();
      setIsModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.detail || "Update failed";
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
      console.error(err);
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
            onDelete={async () => {
              if (window.confirm('Delete this user?')) {
                await API.delete(`/users/${user.id}`);
                fetchUsers();
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
    </Layout>
  );
};

export default UserManagement;
