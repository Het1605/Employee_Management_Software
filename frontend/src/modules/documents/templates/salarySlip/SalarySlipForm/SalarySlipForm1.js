import React from 'react';
import styles from '../../../pages/styles/DocumentsPage.module.css';

export const SalarySlipForm1 = ({
  users,
  selectedUserId,
  onUserChange,
  ctc,
  onCtcChange,
  month,
  onMonthChange,
  year,
  onYearChange,
  includeFooter,
  onIncludeFooterChange,
  generating,
  onGenerate,
  submitLabel
}) => {
  return (
    <div className={styles.formColumn}>
      <div className={styles.formGrid}>
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
          <label>Annual CTC (₹)</label>
          <input
            type="number"
            placeholder="e.g. 600000"
            value={ctc}
            onChange={(e) => onCtcChange(e.target.value)}
          />
        </div>

        <div className={styles.formField}>
          <label>Month</label>
          <select value={month} onChange={(e) => onMonthChange(e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
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

        <div className={styles.formField}>
          <label>Include Footer</label>
          <div className={styles.checkboxRow}>
            <input
              type="checkbox"
              id="includeFooter"
              checked={includeFooter}
              onChange={(e) => onIncludeFooterChange(e.target.checked)}
            />
            <label htmlFor="includeFooter" style={{ marginBottom: 0 }}>Use company footer</label>
          </div>
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
