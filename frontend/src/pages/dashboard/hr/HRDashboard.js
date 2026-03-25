import React from 'react';
import Layout from '../../../components/layout/Layout';
import styles from '../../../styles/Dashboard.module.css';

const HRDashboard = () => {
  const sections = [
    { title: 'User Management', desc: 'Manage employee accounts and roles.', path: '/hr/users' },
    { title: 'Employee Directory', desc: 'View and manage employee profiles.', path: '#' },
    { title: 'Performance', desc: 'Track and review employee performance.', path: '#' },
    { title: 'Leave Management', desc: 'Review and manage leave requests.', path: '#' },
  ];

  return (
    <Layout title="HR Dashboard">
      <h1 className={styles.welcome}>Welcome, HR Manager</h1>
      <p className={styles.subtitle}>Oversee organizational talent and employee well-being.</p>
      
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
    </Layout>
  );
};

export default HRDashboard;
