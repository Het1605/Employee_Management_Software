import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyContext } from '../../../contexts/CompanyContext';
import styles from '../style/Header.module.css';

const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const role = (localStorage.getItem('role') || 'EMPLOYEE').toUpperCase();
  const { companies, selectedCompanyId, setSelectedCompanyId, loadingCompanies } = useCompanyContext();

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
        
        {(role === 'ADMIN' || role === 'HR') && (
          <div className={styles.companySelectWrapper}>
            <div className={styles.companyIcon}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                <path d="M9 22v-4h6v4"></path>
                <path d="M8 6h.01"></path>
                <path d="M16 6h.01"></path>
                <path d="M8 10h.01"></path>
                <path d="M16 10h.01"></path>
                <path d="M8 14h.01"></path>
                <path d="M16 14h.01"></path>
              </svg>
            </div>
            <select
              className={styles.companySelect}
              value={selectedCompanyId || ''}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              disabled={loadingCompanies || companies.length === 0}
            >
              <option value="" disabled>
                {loadingCompanies ? 'Loading...' : 'Select Company'}
              </option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
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
