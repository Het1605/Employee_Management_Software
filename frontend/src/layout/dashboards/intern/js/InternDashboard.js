import React from 'react';
import MainLayout from '../../../MainLayout/js/MainLayout';
import styles from '../../../../styles/Dashboard.module.css';

const InternDashboard = () => {
  const sections = [
    { title: 'Learning Plan', desc: 'Review your onboarding tasks and current training progress.', path: '#' },
    { title: 'My Tasks', desc: 'Track the assignments and goals shared with you by your team.', path: '#' },
    { title: 'Attendance', desc: 'View your attendance details and daily work expectations.', path: '#' },
    { title: 'Support', desc: 'Find the right point of contact when you need help or clarification.', path: '#' },
  ];

  return (
    <MainLayout title="Intern Dashboard">
      <h1 className={styles.welcome}>Welcome, Intern</h1>
      <p className={styles.subtitle}>Stay aligned with your training, tasks, and team expectations.</p>

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

export default InternDashboard;
