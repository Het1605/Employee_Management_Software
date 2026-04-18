import React from 'react';
import styles from '../../../pages/styles/DocumentsPage.module.css';
import DocumentInputField from '../../shared/DocumentInputField';

export const SalarySlipForm1 = ({
  users,
  selectedUserId,
  onUserChange,
  month,
  onMonthChange,
  year,
  onYearChange,
  includeFooter,
  onIncludeFooterChange,
  generating,
  onGenerate,
  submitLabel,
  templateId,
  onTemplateChange,
  errors = {},
}) => {
  return (
    <div className={styles.formColumn}>
      <div className={styles.formGrid}>
        <DocumentInputField label="Template" required error={errors.template_id}>
          <select value={templateId} onChange={(e) => onTemplateChange(e.target.value)}>
            <option value="salaryTemplate1">Salary Slip Template 1 (Monthly)</option>
            <option value="salaryTemplate2">Salary Slip Template 2 (Yearly Landscape)</option>
          </select>
        </DocumentInputField>

        <DocumentInputField label="Employee" required error={errors.user_id}>
          <select value={selectedUserId} onChange={(e) => onUserChange(e.target.value)}>
            <option value="">Select Employee</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim()}
              </option>
            ))}
          </select>
        </DocumentInputField>

        <DocumentInputField label="Month" required error={errors.month}>
          <select value={month} onChange={(e) => onMonthChange(e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </DocumentInputField>

        <DocumentInputField label="Year" required error={errors.year}>
          <select value={year} onChange={(e) => onYearChange(e.target.value)}>
            {Array.from({ length: 9 }, (_, i) => new Date().getFullYear() - 3 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </DocumentInputField>

        <div className={styles.formField}>
          <label className={styles.fieldLabel}>Include Footer</label>
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
