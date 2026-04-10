import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../MainLayout/js/MainLayout';
import styles from '../../../../styles/Dashboard.module.css';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const sections = [
    { title: 'My Profile', desc: 'View and update your personal information.', path: '#' },
    { title: 'My Calendar', desc: 'View your attendance, leaves, and holidays.', path: '/employee/calendar' },
    { title: 'Attendance', desc: 'Mark or view your daily clock records.', path: '/employee/attendance' },
    { title: 'Leave Request', desc: 'Apply for and track your leave status.', path: '/attendance/leave' },
    { title: 'Payroll', desc: 'View your payslips and tax information.', path: '#' },
  ];

  return (
    <MainLayout title="Employee Dashboard">
      <h1 className={styles.welcome}>Welcome, Employee</h1>
      <p className={styles.subtitle}>Stay organized and track your workplace details.</p>
      
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
    </MainLayout>
  );
};

export default EmployeeDashboard;
