import React from 'react';
import styles from '../styles/DocumentsPage.module.css';

const SendLetterTab = () => {
  return (
    <div className={styles.tabPanel}>
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📤</div>
        <h3 className={styles.emptyTitle}>Send letters to employees</h3>
        <p className={styles.emptySubtitle}>Distribute finalized letters to recipients. We will wire actions in the next step.</p>
      </div>
    </div>
  );
};

export default SendLetterTab;
