import React from 'react';
import styles from '../../../pages/styles/DocumentsPage.module.css';

export const OfferLetterForm1 = ({
  users,
  selectedUserId,
  onUserChange,
  offerDate,
  onOfferDateChange,
  position,
  onPositionChange,
  startDate,
  onStartDateChange,
  includeFooter,
  onIncludeFooterChange,
  generating,
  onGenerate,
  submitLabel = 'Generate PDF',
}) => (
  <div className={styles.formColumn}>
    <div className={styles.formGrid}>
      <div className={styles.formField}>
        <label>User</label>
        <select value={selectedUserId} onChange={(e) => onUserChange(e.target.value)}>
          {users.length === 0 ? (
            <option value="">No users available for this company</option>
          ) : (
            <>
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email}
                </option>
              ))}
            </>
          )}
        </select>
      </div>
      <div className={styles.formField}>
        <label>Date</label>
        <input type="date" value={offerDate} onChange={(e) => onOfferDateChange(e.target.value)} />
      </div>
      <div className={styles.formField}>
        <label>Position</label>
        <input type="text" value={position} onChange={(e) => onPositionChange(e.target.value)} placeholder="Enter position" />
      </div>
      <div className={styles.formField}>
        <label>Start Date</label>
        <input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
      </div>
      <div className={styles.formField}>
        <label>Include Footer</label>
        <div className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={includeFooter}
            onChange={(e) => onIncludeFooterChange(e.target.checked)}
          />
          <span>Use company footer</span>
        </div>
      </div>
    </div>
    <div className={styles.actionsRow}>
      <button className="btn-primary-action" onClick={onGenerate} disabled={generating}>
        {generating ? 'Generating...' : submitLabel}
      </button>
    </div>
  </div>
);
