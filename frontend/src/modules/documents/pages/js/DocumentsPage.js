import React, { useState } from 'react';
import MainLayout from '../../../../layout/MainLayout/js/MainLayout';
import '../../../../modules/calendar/pages/styles/CalendarModule.css';
import styles from '../styles/DocumentsPage.module.css';
import CreateLetterTab from './CreateLetterTab';
import SendLetterTab from './SendLetterTab';

const tabs = [
  { id: 'create', label: 'Create Letter' },
  { id: 'send', label: 'Send Letter' },
];

const DocumentsPage = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [activeView, setActiveView] = useState('list');

  return (
    <MainLayout title="Document Management">
      <div className={styles.container}>
        <div className={styles.pageIntro}>
          <p className={styles.subtitle}>Create and send official documents</p>
        </div>

        <div className={`modern-tabs-container ${styles.tabsWrap}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`modern-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== 'create') setActiveView('list');
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="fade-in">
          {activeTab === 'create' ? (
            <CreateLetterTab activeView={activeView} setActiveView={setActiveView} />
          ) : (
            <SendLetterTab />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DocumentsPage;
