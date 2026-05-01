import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../../../styles/Dashboard.module.css';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const sections = [
    { title: 'User Management', desc: 'Manage team member accounts.', path: '/user-management' },
    { title: 'Attendance Management', desc: 'Track and review employee attendance.', path: '/attendance-management' },
    { title: 'Leave Management', desc: 'Review and manage leave requests.', path: '/leave-management' },
    { title: 'Location Tracking', desc: 'Monitor field staff journeys.', path: '/location' },
  ];

  return (
    <>
      <h1 className={styles.welcome}>Welcome, Manager</h1>
      <p className={styles.subtitle}>Lead and support your team towards success.</p>
      
      <div className={styles.grid}>
        {sections.map((sec, i) => (
          <div key={i} className={styles.card}>
            <h3 className={styles.cardTitle}>{sec.title}</h3>
            <p className={styles.cardDesc}>{sec.desc}</p>
            <button className={styles.cardBtn} onClick={() => sec.path !== '#' && navigate(sec.path)}>
              Open Module
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default ManagerDashboard;
