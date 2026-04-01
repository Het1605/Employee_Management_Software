import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../style/Header.module.css';

const Header = ({ title, onToggleSidebar }) => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button className={styles.menuBtn} onClick={onToggleSidebar}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className={styles.headerTitle}>{title || "HR Portal"}</div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.userInfo}>
          <span className={styles.userText}>
            {username} ({role})
          </span>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
