import React from 'react';
import styles from '../../../pages/styles/DocumentsPage.module.css';

export const ExperienceForm1 = ({
  username,
  onUsernameChange,
  companyName,
  onCompanyNameChange,
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
  signatoryName,
  onSignatoryNameChange,
  designation,
  onDesignationChange,
  headerWidth,
  onHeaderWidthChange,
  headerHeight,
  onHeaderHeightChange,
  footerWidth,
  onFooterWidthChange,
  footerHeight,
  onFooterHeightChange,
  signatureWidth,
  onSignatureWidthChange,
  signatureHeight,
  onSignatureHeightChange,
  sealWidth,
  onSealWidthChange,
  sealHeight,
  onSealHeightChange,
  onHeaderImageChange,
  onSignatureImageChange,
  onSealImageChange,
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
        <label>Employee Name</label>
        <input type="text" value={username} onChange={(e) => onUsernameChange(e.target.value)} placeholder="Enter employee name" />
      </div>

      {/* 5. Company */}
      <div className={styles.formField}>
        <label>Company Name</label>
        <input type="text" value={companyName} onChange={(e) => onCompanyNameChange(e.target.value)} placeholder="Enter company name" />
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

      {/* 9. Signature image */}
      <div className={styles.formField}>
        <label>Signature Image</label>
        <input type="file" accept="image/*" onChange={(e) => onSignatureImageChange(e.target.files)} />
      </div>
      <div className={styles.formField}>
        <label>Signature Width (px)</label>
        <input type="text" value={signatureWidth} onChange={(e) => onSignatureWidthChange(e.target.value)} placeholder="Optional" />
      </div>
      <div className={styles.formField}>
        <label>Signature Height (px)</label>
        <input type="text" value={signatureHeight} onChange={(e) => onSignatureHeightChange(e.target.value)} placeholder="Default auto" />
      </div>

      {/* 10. Authorized signatory name */}
      <div className={styles.formField}>
        <label>Authorized Signatory Name</label>
        <input type="text" value={signatoryName} onChange={(e) => onSignatoryNameChange(e.target.value)} placeholder="Enter signatory name" />
      </div>

      {/* 11. Designation */}
      <div className={styles.formField}>
        <label>Designation</label>
        <input type="text" value={designation} onChange={(e) => onDesignationChange(e.target.value)} placeholder="Enter designation" />
      </div>

      {/* 12. Organization seal image */}
      <div className={styles.formField}>
        <label>Organization Seal Image</label>
        <input type="file" accept="image/*" onChange={(e) => onSealImageChange(e.target.files)} />
      </div>
      <div className={styles.formField}>
        <label>Seal Width (px)</label>
        <input type="text" value={sealWidth} onChange={(e) => onSealWidthChange(e.target.value)} placeholder="Optional" />
      </div>
      <div className={styles.formField}>
        <label>Seal Height (px)</label>
        <input type="text" value={sealHeight} onChange={(e) => onSealHeightChange(e.target.value)} placeholder="Default auto" />
      </div>

      {/* 13. Footer */}
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
