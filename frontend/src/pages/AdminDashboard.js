import React, { useState } from 'react';
import Layout from '../components/Layout';
import API from '../services/api';
import styles from '../styles/Dashboard.module.css';

const AdminDashboard = () => {
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '' });
  const [msg, setMsg] = useState('');

  const sections = [
    { title: 'User Management', desc: 'Create and manage employee accounts.', path: '/admin/users' },
    { title: 'Attendance', desc: 'Track employee clock-in/out times.', path: '#' },
    { title: 'Salary', desc: 'Manage payroll and salary structures.', path: '#' },
    { title: 'Leave Requests', desc: 'Review and approve leave applications.', path: '#' },
  ];

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const email = localStorage.getItem('email') || 'admin@example.com'; // Fallback for demo
      await API.post('/auth/change-password', { email, ...passwordData });
      setMsg('Password updated successfully!');
      setPasswordData({ old_password: '', new_password: '' });
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Update failed');
    }
  };

  return (
    <Layout title="Admin Dashboard">
      <h1 className={styles.welcome}>Welcome, Admin</h1>
      <p className={styles.subtitle}>Manage your organization's human resources efficiently.</p>
      
      <div className={styles.grid}>
        {sections.map((sec, i) => (
          <div key={i} className={styles.card}>
            <h3 className={styles.cardTitle}>{sec.title}</h3>
            <p className={styles.cardDesc}>{sec.desc}</p>
            <button className={styles.cardBtn} onClick={() => sec.path !== '#' && (window.location.href = sec.path)}>
              Open Module
            </button>
          </div>
        ))}

        <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
          <h3 className={styles.cardTitle}>Change Password</h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginTop: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Old Password</label>
              <input 
                type="password" 
                value={passwordData.old_password} 
                onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>New Password</label>
              <input 
                type="password" 
                value={passwordData.new_password} 
                onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
            </div>
            <button className={styles.cardBtn} type="submit" style={{ height: '38px' }}>Update Password</button>
          </form>
          {msg && <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: msg.includes('success') ? 'green' : 'red' }}>{msg}</p>}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
