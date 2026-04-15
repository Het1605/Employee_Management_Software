import React from 'react';
import styles from '../../pages/styles/DocumentsPage.module.css';

const DocumentInputField = ({ label, required = false, error, children }) => {
  const fieldClassName = [
    styles.formField,
    error ? styles.formFieldError : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={fieldClassName}>
      <label className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.requiredMark}> *</span>}
      </label>
      {children}
      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  );
};

export default DocumentInputField;
