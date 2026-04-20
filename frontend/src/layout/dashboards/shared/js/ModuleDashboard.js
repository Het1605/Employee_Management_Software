import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../MainLayout/js/MainLayout';
import styles from '../../../../styles/Dashboard.module.css';

const ModuleDashboard = ({ title, welcomeTitle, subtitle, sections }) => {
  const navigate = useNavigate();

  return (
    <>
      <h1 className={styles.welcome}>{welcomeTitle}</h1>
      <p className={styles.subtitle}>{subtitle}</p>

      <div className={styles.grid}>
        {sections.map((section) => (
          <div key={section.title} className={styles.card}>
            <h3 className={styles.cardTitle}>{section.title}</h3>
            <p className={styles.cardDesc}>{section.desc}</p>
            <button
              className={styles.cardBtn}
              onClick={() => {
                if (section.path) {
                  navigate(section.path);
                }
              }}
              type="button"
            >
              Open Module
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default ModuleDashboard;
