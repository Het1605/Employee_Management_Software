import React from 'react';
import styles from '../../../pages/styles/DocumentsPage.module.css';

export const OfferLetterForm1 = ({
  username,
  onUsernameChange,
  offerDate,
  onOfferDateChange,
  position,
  onPositionChange,
  companyName,
  onCompanyNameChange,
  startDate,
  onStartDateChange,
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
  signerName,
  onSignerNameChange,
  signerRole,
  onSignerRoleChange,
  onHeaderImageChange,
  onSignatureImageChange,
  onFooterImageChange,
  generating,
  onGenerate,
  submitLabel = 'Generate PDF',
}) => (
  <div className={styles.formColumn}>
    <div className={styles.formGrid}>
      <div className={styles.formField}>
        <label>Username</label>
        <input type="text" value={username} onChange={(e) => onUsernameChange(e.target.value)} placeholder="Enter username" />
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
        <label>Company Name</label>
        <input type="text" value={companyName} onChange={(e) => onCompanyNameChange(e.target.value)} placeholder="Enter company name" />
      </div>
      <div className={styles.formField}>
        <label>Start Date</label>
        <input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
      </div>
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
      <div className={styles.formField}>
        <label>Signature Image</label>
        <input type="file" accept="image/*" onChange={(e) => onSignatureImageChange(e.target.files)} />
      </div>
      <div className={styles.formField}>
        <label>Signature Width (px)</label>
        <input type="text" value={signatureWidth} onChange={(e) => onSignatureWidthChange(e.target.value)} placeholder="Default 120px" />
      </div>
      <div className={styles.formField}>
        <label>Signature Height (px)</label>
        <input type="text" value={signatureHeight} onChange={(e) => onSignatureHeightChange(e.target.value)} placeholder="Default auto" />
      </div>
      <div className={styles.formField}>
        <label>Signer Name</label>
        <input type="text" value={signerName} onChange={(e) => onSignerNameChange(e.target.value)} placeholder="Required" />
      </div>
      <div className={styles.formField}>
        <label>Signer Role/Designation</label>
        <input type="text" value={signerRole} onChange={(e) => onSignerRoleChange(e.target.value)} placeholder="Required" />
      </div>
      <div className={styles.formField}>
        <label>Footer Image</label>
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
