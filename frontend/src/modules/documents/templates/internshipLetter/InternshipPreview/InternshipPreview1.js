import React from 'react';
import styles from '../../../pages/styles/DocumentsPage.module.css';

export const InternshipPreview1 = ({
  username,
  offerDate,
  companyName,
  department,
  startDate,
  endDate,
  headerImg,
  footerImg,
  stampImg,
  includeFooter,
  personTitle,
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
      <div className={styles.previewTitle}>INTERNSHIP COMPLETION LETTER</div>
      <div className={styles.previewRow}>
        <span><strong>Date:</strong> {displayOfferDate}</span>
      </div>
      <div className={styles.previewContent}>
        <p>This is to certify that <strong>{titlePrefix} {username || '________'}</strong> has successfully completed {pronounSet.his_her} internship with <strong>{companyName || '________'}</strong>.</p>

        <p>{pronounSet.he_she_cap} worked with us in the <strong>{department || '________'}</strong> for the period from <strong>{displayStart}</strong> to <strong>{displayEnd}</strong>.</p>

        <p>During the internship tenure, {pronounSet.he_she} was involved in various development activities and gained practical exposure to software development processes, technical implementation, and professional work culture. {pronounSet.his_her_cap} conduct and performance during the internship period were found to be satisfactory.</p>

        <p>We appreciate {pronounSet.his_her} efforts and wish {pronounSet.him_her} success in future academic and professional endeavors.</p>

        <div className={styles.spacerXL}></div>
        <p>For<br/><strong>{companyName ? `${companyName},` : '________'}</strong></p>
        <div className={styles.spacerMd || styles.spacerXL}></div>
        <p>Authorized Signatory</p>

        <div className={styles.spacerXL}></div>
        {stampImg && (
          <img
            src={stampImg}
            alt="Stamp"
            className={styles.previewSignatureImage}
            style={{ width: '120px', height: 'auto' }}
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
