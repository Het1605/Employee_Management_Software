import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from '../styles/Layout.module.css';

const Layout = ({ children, title, onActionClick, actionLabel }) => {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.contentArea}>
        <header className={styles.contentHeader}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#fff', borderBottom: '1px solid #eee' }}>
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{title}</h1>
            {actionLabel && (
              <button 
                onClick={onActionClick}
                style={{ 
                  backgroundColor: '#3b82f6', 
                  color: '#fff', 
                  padding: '0.6rem 1.2rem', 
                  borderRadius: '6px', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {actionLabel}
              </button>
            )}
          </div>
        </header>
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
