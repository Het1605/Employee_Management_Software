import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/Header.module.css';

const Header = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>HR Portal</div>
      <div className={styles.userInfo}>
        <span className={styles.userText}>
          {username} ({role})
        </span>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
