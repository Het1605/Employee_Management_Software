import React from 'react';
import styles from '../../../pages/styles/DocumentsPage.module.css';
import DocumentInputField from '../../shared/DocumentInputField';

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
  errors = {},
  submitLabel = 'Generate PDF',
}) => (
  <div className={styles.formColumn}>
    <div className={styles.formGrid}>
      {/* 2. Date */}
      <DocumentInputField label="Date (DD Mon, YYYY)" required error={errors.offer_date}>
        <input type="date" value={offerDate} onChange={(e) => onOfferDateChange(e.target.value)} />
      </DocumentInputField>

      {/* 3. Title */}
      <DocumentInputField label="Title" required error={errors.personTitle}>
        <select value={personTitle} onChange={(e) => onPersonTitleChange(e.target.value)}>
          <option value="Mr">Mr</option>
          <option value="Ms">Ms</option>
        </select>
      </DocumentInputField>

      {/* 4. Name */}
      <DocumentInputField label="Employee Name" required error={errors.user_id}>
        <select value={selectedUserId} onChange={(e) => onUserChange(e.target.value)}>
          <option value="">Select employee</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim()}
            </option>
          ))}
        </select>
      </DocumentInputField>

      {/* 6. Position */}
      <DocumentInputField label="Position" required error={errors.position}>
        <input type="text" value={position} onChange={(e) => onPositionChange(e.target.value)} placeholder="Enter position" />
      </DocumentInputField>

      {/* 7. Start date */}
      <DocumentInputField label="Start Date" required error={errors.start_date}>
        <input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
      </DocumentInputField>

      {/* 8. End date */}
      <DocumentInputField label="End Date" required error={errors.end_date}>
        <input type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
      </DocumentInputField>

      {/* 9. Footer */}
      <div className={styles.formField}>
        <label className={styles.fieldLabel}>Include Footer</label>
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
