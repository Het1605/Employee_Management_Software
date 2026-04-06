import React from 'react';
import styles from '../../../pages/styles/DocumentsPage.module.css';

export const InternshipForm1 = ({
  username,
  onUsernameChange,
  enrollmentNumber,
  onEnrollmentChange,
  offerDate,
  onOfferDateChange,
  companyName,
  onCompanyNameChange,
  department,
  onDepartmentChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  headerWidth,
  onHeaderWidthChange,
  headerHeight,
  onHeaderHeightChange,
  footerWidth,
  onFooterWidthChange,
  footerHeight,
  onFooterHeightChange,
  stampWidth,
  onStampWidthChange,
  stampHeight,
  onStampHeightChange,
  personTitle,
  onPersonTitleChange,
  onHeaderImageChange,
  onStampImageChange,
  onFooterImageChange,
  generating,
  onGenerate,
  submitLabel = 'Generate PDF',
}) => (
  <div className={styles.formColumn}>
    <div className={styles.formGrid}>
      {/* 1. Header image and sizing */}
      <div className={styles.formField}>
        <label>Header Image</label>
        <input type="file" accept="image/*" onChange={(e) => onHeaderImageChange(e.target.files)} />
      </div>
      <div className={styles.formField}>
        <label>Header Width (e.g., 100% or 700px)</label>
        <input type="text" value={headerWidth} onChange={(e) => onHeaderWidthChange(e.target.value)} placeholder="Default 100%" />
      </div>
      <div className={styles.formField}>
        <label>Header Height (px)</label>
        <input type="text" value={headerHeight} onChange={(e) => onHeaderHeightChange(e.target.value)} placeholder="Default auto" />
      </div>
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
        <label>Intern Name</label>
        <input type="text" value={username} onChange={(e) => onUsernameChange(e.target.value)} placeholder="Enter intern name" />
      </div>
      {/* 5. Enrollment */}
      <div className={styles.formField}>
        <label>Enrollment Number</label>
        <input type="text" value={enrollmentNumber} onChange={(e) => onEnrollmentChange(e.target.value)} placeholder="Enter enrollment number" />
      </div>
      {/* 6. Company */}
      <div className={styles.formField}>
        <label>Company Name</label>
        <input type="text" value={companyName} onChange={(e) => onCompanyNameChange(e.target.value)} placeholder="Enter company name" />
      </div>
      {/* 7. Department */}
      <div className={styles.formField}>
        <label>Department</label>
        <input type="text" value={department} onChange={(e) => onDepartmentChange(e.target.value)} placeholder="Enter department" />
      </div>
      {/* 8. Start date */}
      <div className={styles.formField}>
        <label>Start Date</label>
        <input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
      </div>
      {/* 9. End date */}
      <div className={styles.formField}>
        <label>End Date</label>
        <input type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
      </div>
      {/* 10. Signature image */}
      <div className={styles.formField}>
        <label>Stamp/Signature Image</label>
        <input type="file" accept="image/*" onChange={(e) => onStampImageChange(e.target.files)} />
      </div>
      <div className={styles.formField}>
        <label>Stamp Width (px)</label>
        <input type="text" value={stampWidth} onChange={(e) => onStampWidthChange(e.target.value)} placeholder="Optional" />
      </div>
      <div className={styles.formField}>
        <label>Stamp Height (px)</label>
        <input type="text" value={stampHeight} onChange={(e) => onStampHeightChange(e.target.value)} placeholder="Default auto" />
      </div>
      {/* 11. Footer */}
      <div className={styles.formField}>
        <label>Footer Image (optional)</label>
        <input type="file" accept="image/*" onChange={(e) => onFooterImageChange(e.target.files)} />
      </div>
      <div className={styles.formField}>
        <label>Footer Width (e.g., 100% or 700px)</label>
        <input type="text" value={footerWidth} onChange={(e) => onFooterWidthChange(e.target.value)} placeholder="Default 100%" />
      </div>
      <div className={styles.formField}>
        <label>Footer Height (px)</label>
        <input type="text" value={footerHeight} onChange={(e) => onFooterHeightChange(e.target.value)} placeholder="Default auto" />
      </div>
    </div>
    <div className={styles.actionsRow}>
      <button className="btn-primary-action" onClick={onGenerate} disabled={generating}>
        {generating ? 'Generating...' : submitLabel}
      </button>
    </div>
  </div>
);
