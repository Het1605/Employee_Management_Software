import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../Header/js/Header';
import Sidebar from '../../Sidebar/js/Sidebar';
import styles from '../style/Layout.module.css';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className={styles.layout}>
      {/* Sidebar with state and close handler */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && <div className={styles.overlay} onClick={closeSidebar}></div>}

      <div className={styles.contentArea}>
        {/* Header with toggle solely */}
        <Header onToggleSidebar={toggleSidebar} />
        
        <main className={styles.mainContent}>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
