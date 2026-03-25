import React from 'react';
import Layout from '../../../components/layout/Layout';
import styles from '../../../styles/Dashboard.module.css';

const EmployeeDashboard = () => {
  const sections = [
    { title: 'My Profile', desc: 'View and update your personal information.', path: '#' },
    { title: 'Attendance', desc: 'View your clock-in/out history.', path: '#' },
    { title: 'Leave Request', desc: 'Apply for and track your leave status.', path: '#' },
    { title: 'Payroll', desc: 'View your payslips and tax information.', path: '#' },
  ];

  return (
    <Layout title="Employee Dashboard">
      <h1 className={styles.welcome}>Welcome, Employee</h1>
      <p className={styles.subtitle}>Stay organized and track your workplace details.</p>
      
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

export default EmployeeDashboard;
