import React from 'react';
import styles from '../../../pages/styles/DocumentsPage.module.css';

export const ExperienceForm1 = ({
  users,
  selectedUserId,
  onUserChange,
  position,
  onPositionChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  offerDate,
  onOfferDateChange,
  personTitle,
  onPersonTitleChange,
  includeFooter,
  onIncludeFooterChange,
  generating,
  onGenerate,
  submitLabel = 'Generate PDF',
}) => (
  <div className={styles.formColumn}>
    <div className={styles.formGrid}>
      {/* 2. Date */}
      <div className={styles.formField}>
        <label>Date (DD Mon, YYYY)</label>
        <input type="date" value={offerDate} onChange={(e) => onOfferDateChange(e.target.value)} />
      </div>

      {/* 3. Title */}
      <div className={styles.formField}>
        <label>Title</label>
        <select value={personTitle} onChange={(e) => onPersonTitleChange(e.target.value)}>
          <option value="Mr">Mr</option>
          <option value="Ms">Ms</option>
        </select>
      </div>

      {/* 4. Name */}
      <div className={styles.formField}>
        <label>Employee Name</label>
        <select value={selectedUserId} onChange={(e) => onUserChange(e.target.value)}>
          <option value="">Select employee</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim()}
            </option>
          ))}
        </select>
      </div>

      {/* 6. Position */}
      <div className={styles.formField}>
        <label>Position</label>
        <input type="text" value={position} onChange={(e) => onPositionChange(e.target.value)} placeholder="Enter position" />
      </div>

      {/* 7. Start date */}
      <div className={styles.formField}>
        <label>Start Date</label>
        <input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
      </div>

      {/* 8. End date */}
      <div className={styles.formField}>
        <label>End Date</label>
        <input type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
      </div>

      {/* 9. Footer */}
      <div className={styles.formField}>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={includeFooter}
            onChange={(e) => onIncludeFooterChange(e.target.checked)}
          />
          Include Footer
        </label>
      </div>
    </div>
    <div className={styles.actionsRow}>
      <button className="btn-primary-action" onClick={onGenerate} disabled={generating}>
        {generating ? 'Generating...' : submitLabel}
      </button>
    </div>
  </div>
);
