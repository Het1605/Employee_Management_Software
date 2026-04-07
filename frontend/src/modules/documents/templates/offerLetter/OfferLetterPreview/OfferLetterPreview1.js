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
  stampImg,
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
        <p>Dear <strong>{username || '________'}</strong>,</p>

        <p>We are pleased to offer you the position of <strong>{position || '________'}</strong> at <strong>{companyName || '________'}</strong>. Based on your qualifications, skills, and performance during the selection process, we are confident that you will be a valuable addition to our organization.</p>

        <p>Your employment with us will commence from <strong>{startDate || '________'}</strong>. You will be expected to perform your duties with dedication, professionalism, and integrity, and contribute effectively towards the growth and success of the organization.</p>

        <p>During your tenure, you will be assigned responsibilities aligned with your role. You are expected to adhere to company policies, maintain confidentiality, and demonstrate commitment to quality and timely delivery of your work.</p>

        <p>This offer is subject to the terms and conditions of employment, including company policies and code of conduct. Detailed information regarding your compensation, benefits, and responsibilities will be shared with you separately.</p>

        <p>We look forward to welcoming you to our team and wish you a successful and rewarding career with <strong>{companyName || '________'}</strong>.</p>

        <div className={styles.signaturePreview}>
          <p>For</p>
          <p><strong>{companyName || '________'}</strong></p>
          {stampImg && (
            <img
              src={stampImg}
              alt="Company Stamp"
              className={styles.previewSignatureImage}
            />
          )}
          <p>Authorized Signatory</p>
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
