import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from '../styles/Sidebar.module.css';

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>HR Portal</div>
      <nav className={styles.nav}>
        <NavLink to="/admin" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`} end>
          Dashboard
        </NavLink>
        
        <div className={styles.navGroup}>
          <div className={styles.groupTitle}>Users Management</div>
          <div className={styles.subMenu}>
            <NavLink to="/admin/users" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
              Manage Users
            </NavLink>
          </div>
        </div>
        
        <div className={styles.navGroup}>
          <div className={styles.groupTitle}>Other Modules</div>
          <div className={styles.navLink} style={{ cursor: 'not-allowed', opacity: 0.5 }}>Attendance</div>
          <div className={styles.navLink} style={{ cursor: 'not-allowed', opacity: 0.5 }}>Salary</div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
