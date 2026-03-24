import React from 'react';
import Header from '../components/Header';
import styles from '../styles/Dashboard.module.css';

const AdminDashboard = () => {
  const sections = [
    { title: 'User Management', desc: 'Create and manage employee accounts.' },
    { title: 'Attendance', desc: 'Track employee clock-in/out times.' },
    { title: 'Salary', desc: 'Manage payroll and salary structures.' },
    { title: 'Leave Requests', desc: 'Review and approve leave applications.' },
  ];

  return (
    <div className="dashboard-page">
      <Header />
      <main className="container">
        <h1 className={styles.welcome}>Admin Dashboard</h1>
        <p className={styles.subtitle}>Manage your organization's human resources efficiently.</p>
        
        <div className={styles.grid}>
          {sections.map((sec, i) => (
            <div key={i} className={styles.card}>
              <h3 className={styles.cardTitle}>{sec.title}</h3>
              <p className={styles.cardDesc}>{sec.desc}</p>
              <button className={styles.cardBtn}>Open Module</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
