import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, LogOut, User, Menu } from 'lucide-react';
import { useCompanyContext } from '../../../contexts/CompanyContext';
import styles from '../style/Header.module.css';

const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const username = localStorage.getItem('username') || 'User';
  const role = (localStorage.getItem('role') || 'EMPLOYEE').toUpperCase();
  const { companies, selectedCompanyId, setSelectedCompanyId, loadingCompanies } = useCompanyContext();
  const selectedCompanyName = companies.find(c => String(c.id) === String(selectedCompanyId))?.name || '';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button className={styles.menuBtn} onClick={onToggleSidebar}>
          <Menu size={24} />
        </button>
        
        {(role === 'ADMIN' || role === 'HR') && (
          <div className={styles.companySelectContainer}>
            <div className={styles.companyIcon}>
              <Building2 size={18} strokeWidth={2.5} />
            </div>
            <select
              className={styles.companySelect}
              value={selectedCompanyId || ''}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              disabled={loadingCompanies || companies.length === 0}
              title={selectedCompanyName}
            >
              <option value="" disabled>
                {loadingCompanies ? 'Loading...' : 'Select Company'}
              </option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className={styles.selectArrow}>
              <ChevronDown size={16} />
            </div>
          </div>
        )}
      </div>

      <div className={styles.rightSection}>
        <div className={styles.profileWrapper} ref={dropdownRef}>
          <button 
            className={`${styles.profileButton} ${isProfileOpen ? styles.active : ''}`}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className={styles.avatar}>
              {username.charAt(0).toUpperCase()}
            </div>
            <span className={styles.username}>{username}</span>
            <ChevronDown size={14} className={`${styles.chevron} ${isProfileOpen ? styles.rotate : ''}`} />
          </button>

          {isProfileOpen && (
            <div className={styles.profileDropdown}>
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownName}>{username}</p>
                <p className={styles.dropdownRole}>{role}</p>
              </div>
              <div className={styles.dropdownDivider} />
              <button className={styles.dropdownItem} onClick={handleLogout}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
