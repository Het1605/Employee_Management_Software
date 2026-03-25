import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from '../../styles/Sidebar.module.css';

const Sidebar = () => {
  const role = (localStorage.getItem('role') || 'EMPLOYEE').toUpperCase();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>HR Portal</div>
      <nav className={styles.nav}>
        {/* Common Dashboard Link */}
        <NavLink 
          to={`/${role.toLowerCase()}`} 
          className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`} 
          end
        >
          Dashboard
        </NavLink>
        
        {/* User Management - ADMIN, HR, MANAGER */}
        {['ADMIN', 'HR', 'MANAGER'].includes(role) && (
          <div className={styles.navGroup}>
            <div className={styles.groupTitle}>Users Management</div>
            <div className={styles.subMenu}>
              <NavLink to={`/${role.toLowerCase()}/users`} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
                Manage Users
              </NavLink>
            </div>
          </div>
        )}

        {/* Placeholder for other roles */}
        {(role === 'HR' || role === 'MANAGER' || role === 'ADMIN') && (
          <div className={styles.navGroup}>
            <div className={styles.groupTitle}>Organization</div>
            <div className={styles.navLink} style={{ cursor: 'not-allowed', opacity: 0.5 }}>Employees List</div>
            <div className={styles.navLink} style={{ cursor: 'not-allowed', opacity: 0.5 }}>Attendance</div>
          </div>
        )}
        
        <div className={styles.navGroup}>
          <div className={styles.groupTitle}>Self Service</div>
          <div className={styles.navLink} style={{ cursor: 'not-allowed', opacity: 0.5 }}>My Profile</div>
          <div className={styles.navLink} style={{ cursor: 'not-allowed', opacity: 0.5 }}>Leave Requests</div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
