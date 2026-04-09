import React from 'react';
import styles from '../../../pages/styles/DocumentsPage.module.css';

export const SalarySlipForm2 = ({
  users,
  selectedUserId,
  onUserChange,
  year,
  onYearChange,
  includeFooter,
  onIncludeFooterChange,
  generating,
  onGenerate,
  submitLabel,
  templateId,
  onTemplateChange
}) => {
  return (
    <div className={styles.formColumn}>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Template</label>
          <select value={templateId} onChange={(e) => onTemplateChange(e.target.value)}>
            <option value="salaryTemplate1">Salary Slip Template 1 (Monthly)</option>
            <option value="salaryTemplate2">Salary Slip Template 2 (Yearly Landscape)</option>
          </select>
        </div>

        <div className={styles.formField}>
          <label>Employee</label>
          <select value={selectedUserId} onChange={(e) => onUserChange(e.target.value)}>
            <option value="">Select Employee</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim()}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formField}>
          <label>Year</label>
          <select value={year} onChange={(e) => onYearChange(e.target.value)}>
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.actionsRow}>
        <button
          className="btn-primary-action"
          onClick={onGenerate}
          disabled={generating}
        >
          {generating ? 'Generating Slip...' : submitLabel}
        </button>
      </div>
    </div>
  );
};
