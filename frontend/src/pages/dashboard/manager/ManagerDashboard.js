import React from 'react';
import Layout from '../../../components/layout/Layout';
import styles from '../../../styles/Dashboard.module.css';

const ManagerDashboard = () => {
  const sections = [
    { title: 'User Management', desc: 'Manage team member accounts.', path: '/manager/users' },
    { title: 'Team Overview', desc: 'Manage your direct reports and their tasks.', path: '#' },
    { title: 'Attendance Tracking', desc: 'Review team clock-in/out records.', path: '#' },
    { title: 'Project Management', desc: 'Assign and monitor project progress.', path: '#' },
  ];

  return (
    <Layout title="Manager Dashboard">
      <h1 className={styles.welcome}>Welcome, Manager</h1>
      <p className={styles.subtitle}>Lead and support your team towards success.</p>
      
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

export default ManagerDashboard;
