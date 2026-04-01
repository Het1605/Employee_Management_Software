import React from 'react';
import MainLayout from '../../../MainLayout/js/MainLayout';
import styles from '../../../../styles/Dashboard.module.css';

const AdminDashboard = () => {
  const sections = [
    { title: 'User Management', desc: 'Create and manage employee accounts.', path: '/admin/users' },
    { title: 'Attendance', desc: 'Track employee clock-in/out times.', path: '#' },
    { title: 'Salary', desc: 'Manage payroll and salary structures.', path: '#' },
    { title: 'Leave Requests', desc: 'Review and approve leave applications.', path: '#' },
  ];

  return (
    <MainLayout title="Admin Dashboard">
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
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
