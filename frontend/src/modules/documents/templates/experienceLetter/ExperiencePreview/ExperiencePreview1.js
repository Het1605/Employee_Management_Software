import React from 'react';
import styles from '../../../pages/styles/DocumentsPage.module.css';

export const ExperiencePreview1 = ({
  username,
  companyName,
  position,
  startDate,
  endDate,
  offerDate,
  personTitle,
  headerImg,
  footerImg,
  signatureImg,
  sealImg,
  includeFooter,
}) => {
  const formatDateShort = (dateStr) => {
    if (!dateStr) return '____________';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
  };
  const ordinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const formatDateLong = (dateStr) => {
    if (!dateStr) return '________';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const day = ordinal(d.getDate());
    const month = d.toLocaleDateString('en-GB', { month: 'long' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const titlePrefix = personTitle || 'Mr';
  const pronounSet = titlePrefix === 'Ms'
    ? { he_she_cap: 'She', he_she: 'she', his_her: 'her', his_her_cap: 'Her', him_her: 'her' }
    : { he_she_cap: 'He', he_she: 'he', his_her: 'his', his_her_cap: 'His', him_her: 'him' };

  const displayOfferDate = formatDateShort(offerDate);
  const displayStart = formatDateLong(startDate);
  const displayEnd = formatDateLong(endDate);

  return (
    <div className={styles.previewColumn}>
      <div className={styles.a4Preview}>
        {headerImg && (
          <img
            src={headerImg}
            alt="Header"
            className={styles.previewImage}
            style={{ width: '100%', height: 'auto' }}
          />
        )}
        <div className={styles.previewTitle}>EXPERIENCE LETTER</div>
        <div className={styles.previewRow}>
          <span><strong>Date:</strong> {displayOfferDate}</span>
        </div>

        <div className={styles.previewContent}>
          <p>This is to certify that <strong>{titlePrefix} {username || '________'}</strong> was employed with <strong>{companyName || '________'}</strong> as a <strong>{position || '________'}</strong> from <strong>{displayStart}</strong> to <strong>{displayEnd}</strong>.</p>

          <p>During {pronounSet.his_her} tenure with us, {pronounSet.he_she} consistently demonstrated a high level of professionalism, dedication, and technical competence in {pronounSet.his_her} assigned responsibilities. {pronounSet.he_she_cap} actively contributed to various projects and played a valuable role in achieving team objectives.</p>

          <p>{pronounSet.he_she_cap} exhibited strong problem-solving abilities, effective communication skills, and a positive attitude towards learning and growth. {pronounSet.his_her_cap} ability to adapt to new challenges and deliver quality work within timelines was highly commendable.</p>

          <p>Throughout {pronounSet.his_her} association with the organization, {pronounSet.he_she} maintained excellent conduct and upheld the values and standards of the company.</p>

          <p>We sincerely appreciate {pronounSet.his_her} contributions and wish {pronounSet.him_her} continued success in {pronounSet.his_her} future professional endeavors.</p>

          <div className={styles.spacerXL}></div>
          <p>Sincerely,</p>
          {signatureImg && (
            <img
              src={signatureImg}
              alt="Signature"
              className={styles.previewSignatureImage}
              style={{ width: '150px', height: 'auto' }}
            />
          )}
          <p>Authorized Signatory</p>
          {sealImg && (
            <img
              src={sealImg}
              alt="Seal"
              className={styles.previewSignatureImage}
              style={{ width: '150px', height: 'auto' }}
            />
          )}
        </div>

        {includeFooter && footerImg && (
          <img
            src={footerImg}
            alt="Footer"
            className={styles.previewImage}
            style={{ width: '100%', height: 'auto' }}
          />
        )}
      </div>
    </div>
  );
};
