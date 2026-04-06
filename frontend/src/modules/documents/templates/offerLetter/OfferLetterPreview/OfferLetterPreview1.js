import React from 'react';
import styles from '../../../pages/styles/DocumentsPage.module.css';

export const OfferLetterPreview1 = ({
  username,
  offerDate,
  position,
  companyName,
  startDate,
  headerImg,
  footerImg,
  signatureImg,
  signerName,
  signerRole,
  includeFooter,
}) => (
  <div className={styles.previewColumn}>
    <div className={styles.a4Preview}>
      {headerImg && (
        <img
          src={headerImg}
          alt="Header"
          className={styles.previewImage}
        />
      )}
      <div className={styles.previewTitle}>OFFER LETTER</div>
      <div className={styles.previewRow}>
        <span><strong>To:</strong> {username || '____________'}</span>
        <span><strong>Date:</strong> {offerDate || '____________'}</span>
      </div>
      <div className={styles.previewContent}>
        <p><strong>Dear {username || '________'},</strong></p>

        <p>We are pleased to offer you the position of <strong>{position || '________'}</strong> at <strong>{companyName || '________'}</strong>. Based on your skills, experience, and interview performance, we are confident that you will be a valuable addition to our organization.</p>

        <p>Your employment with us will commence from <strong>{startDate || '________'}</strong>. You will be expected to carry out your responsibilities diligently and contribute effectively to the growth and success of the team and the company.</p>

        <p>During your tenure, you will be involved in various projects and assignments aligned with your role. You are expected to maintain professionalism, follow company policies, and demonstrate a strong commitment to quality and timely delivery of work.</p>

        <p>This offer is subject to the terms and conditions of employment, including company policies, code of conduct, and performance expectations. Further details regarding your role, responsibilities, and compensation structure will be shared with you separately.</p>

        <p>We are excited to have you join our team and look forward to a successful and mutually beneficial association. We wish you a rewarding career with <strong>{companyName || '________'}</strong>.</p>

        <div className={styles.spacerXL}></div>
        <div style={{ textAlign: 'right' }}>
          <p><strong>Sincerely,</strong></p>
          {signatureImg && (
            <img
              src={signatureImg}
              alt="Signature"
              className={styles.previewSignatureImage}
            />
          )}
          <p>{signerName || '________'}</p>
          <p>{signerRole || '________'}</p>
        </div>
      </div>
      {includeFooter && footerImg && (
        <img
          src={footerImg}
          alt="Footer"
          className={styles.previewImage}
        />
      )}
    </div>
  </div>
);
