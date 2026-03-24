import React from 'react';
import styles from '../styles/UserManagement.module.css';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ maxWidth: '400px', textAlign: 'center' }}>
        <h2 className={styles.modalTitle} style={{ marginBottom: '1rem' }}>Are you sure?</h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>{message}</p>
        <div className={styles.modalFooter} style={{ justifyContent: 'center' }}>
          <button onClick={onClose} className={styles.cancelBtn}>Cancel</button>
          <button 
            onClick={onConfirm} 
            className={styles.confirmBtn} 
            style={{ backgroundColor: '#dc2626' }}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
