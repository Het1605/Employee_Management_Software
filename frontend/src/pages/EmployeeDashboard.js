import React from 'react';
import Header from '../components/Header';
import styles from '../styles/Dashboard.module.css';

const EmployeeDashboard = () => {
  const sections = [
    { title: 'My Tasks', desc: 'View and update your assigned tasks.' },
    { title: 'Attendance', desc: 'Mark your daily attendance.' },
    { title: 'Leave Application', desc: 'Apply for leaves and check status.' },
    { title: 'Salary Slips', desc: 'View and download your monthly slips.' },
  ];

  return (
    <div className="dashboard-page">
      <Header />
      <main className="container">
        <h1 className={styles.welcome}>Employee Dashboard</h1>
        <p className={styles.subtitle}>Access your personal HR and task information.</p>
        
        <div className={styles.grid}>
          {sections.map((sec, i) => (
            <div key={i} className={styles.card}>
              <h3 className={styles.cardTitle}>{sec.title}</h3>
              <p className={styles.cardDesc}>{sec.desc}</p>
              <button className={styles.cardBtn}>Access</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
