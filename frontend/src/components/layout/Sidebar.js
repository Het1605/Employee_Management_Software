import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from '../../styles/Sidebar.module.css';

const Sidebar = ({ isOpen, onClose }) => {
  const role = (localStorage.getItem('role') || 'EMPLOYEE').toUpperCase();

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.isOpen : ''}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logo}>HR Portal</div>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
      </div>

      <nav className={styles.nav}>
        <NavLink 
          to={`/${role.toLowerCase()}`} 
          className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`} 
          end
          onClick={handleLinkClick}
        >
          <span className={styles.icon}>📊</span>
          <span className={styles.linkText}>Dashboard</span>
        </NavLink>
        
        {['ADMIN', 'HR', 'MANAGER'].includes(role) && (
          <div className={styles.navGroup}>
            <div className={styles.groupTitle}>Users Management</div>
            <div className={styles.subMenu}>
              <NavLink 
                to={`/${role.toLowerCase()}/users`} 
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                onClick={handleLinkClick}
              >
                <span className={styles.icon}>👥</span>
                <span className={styles.linkText}>Manage Users</span>
              </NavLink>
            </div>
          </div>
        )}

        {/* Other menu items... */}
        {(role === 'HR' || role === 'ADMIN') && (
          <div className={styles.navGroup}>
            <div className={styles.groupTitle}>Organization</div>
            <div className={styles.subMenu}>
              <NavLink 
                to="/admin/companies" 
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                onClick={handleLinkClick}
                end
              >
                <span className={styles.icon}>🏢</span>
                <span className={styles.linkText}>Manage Companies</span>
              </NavLink>
              <NavLink 
                to="/admin/companies/assign" 
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                onClick={handleLinkClick}
              >
                <span className={styles.icon}>🔗</span>
                <span className={styles.linkText}>Company Assignment</span>
              </NavLink>
              <NavLink 
                to={`/${role.toLowerCase()}/calendar`} 
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                onClick={handleLinkClick}
              >
                <span className={styles.icon}>📅</span>
                <span className={styles.linkText}>Calendar</span>
              </NavLink>
            </div>
          </div>
        )}

        {(role === 'HR' || role === 'ADMIN') && (
          <div className={styles.navGroup}>
            <div className={styles.groupTitle}>Payroll</div>
            <div className={styles.subMenu}>
              <div className={styles.navLink} style={{ cursor: 'not-allowed', opacity: 0.5 }}>
                <span className={styles.icon}>💰</span>
                <span className={styles.linkText}>Salary Structure</span>
              </div>
            </div>
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
