import React from 'react';
import styles from '../../../pages/styles/DocumentsPage.module.css';

export const SalarySlipPreview1 = ({
  username,
  month,
  year,
  headerData,
  footerData,
  stampData,
  includeFooter,
  form_data,
}) => {
  const getMonthName = (m) => {
    if (!m) return '____________';
    if (typeof m === 'string' && isNaN(m)) return m;
    try {
      const date = new Date(2000, parseInt(m, 10) - 1, 1);
      return date.toLocaleString('default', { month: 'long' });
    } catch {
      return m;
    }
  };

  const name = form_data?.employee_name || username || '____________';
  const displayMonth = form_data?.display_month || getMonthName(month);
  const displayYear = form_data?.year || year || '____________';
  const designation = form_data?.designation || '____________';
  const totalWorkingDays = form_data?.total_working_days || '0';
  const effectiveDays = form_data?.effective_paid_days || '0';
  const leavesTaken = form_data?.leaves_taken || '0';
  const paidLeaves = form_data?.paid_leaves || '0';
  const unpaidLeaves = form_data?.unpaid_leaves || '0';
  const companyName = form_data?.company_name || '____________';

  const earnings = form_data?.earnings || [];
  const deductions = form_data?.deductions || [];
  const totalEarnings = form_data?.total_earnings || 0;
  const totalDeductions = form_data?.total_deductions || 0;
  const netSalary = form_data?.net_salary || 0;

  const fAmt = (val) => {
    const num = Number(val);
    if (Math.abs(num) < 0.005) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fDays = (val) => {
    if (val === undefined || val === null || val === '') return '0';
    const num = Number(val);
    return Number.isInteger(num) ? num : num.toFixed(1);
  };

  return (
    <div className={styles.previewColumn}>
      <div
        className={styles.previewViewport}
        style={{ '--preview-width': '794px', '--preview-height': '1123px' }}
      >
        <div className={styles.a4Preview}>
          {headerData && (
            <div className={styles.header}>
              <img src={headerData} alt="Header" className={styles.previewImage} />
            </div>
          )}

          <div className={styles.salaryPreviewBody}>
            <div className={styles.salaryTitle}><h2>SALARY SLIP</h2></div>

            <div className={styles.salaryInfoSection}>
              <table className={styles.salaryInfoTable} style={{ tableLayout: 'fixed' }}>
                <tbody>
                  <tr>
                    <td className={styles.salaryInfoCell} style={{ width: '50%' }}><strong>Employee Name:</strong> {name}</td>
                    <td className={styles.salaryInfoCell} style={{ width: '50%' }}><strong>Pay Period:</strong> {displayMonth} {displayYear}</td>
                  </tr>
                  <tr>
                    <td className={styles.salaryInfoCell} style={{ width: '50%' }}><strong>Designation:</strong> {designation}</td>
                    <td className={styles.salaryInfoCell} style={{ width: '50%' }}><strong>Total Working Days:</strong> {totalWorkingDays}</td>
                  </tr>
                  <tr>
                    <td className={styles.salaryInfoCell} style={{ width: '50%' }}><strong>Leaves Taken:</strong> {fDays(leavesTaken)}</td>
                    <td className={styles.salaryInfoCell} style={{ width: '50%' }}><strong>Paid Leaves:</strong> {fDays(paidLeaves)}</td>
                  </tr>
                  <tr>
                    <td className={styles.salaryInfoCell} style={{ width: '50%' }}><strong>Unpaid Leaves:</strong> {fDays(unpaidLeaves)}</td>
                    <td className={styles.salaryInfoCell} style={{ width: '50%' }}><strong>Effective Paid Days:</strong> {fDays(effectiveDays)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <table className={styles.salaryLedgerTable}>
              <thead>
                <tr className={styles.salaryLedgerHeader}>
                  <th>Description</th>
                  <th>Earnings (₹)</th>
                  <th>Deductions (₹)</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((e, idx) => {
                  const isEncash = e.name && e.name.toLowerCase().includes('encashment');
                  return (
                    <tr key={`earn-${idx}`} style={isEncash ? { backgroundColor: '#fcfcfc', fontWeight: '500' } : {}}>
                      <td className={styles.salaryLedgerCell}>{e.name}</td>
                      <td className={styles.salaryLedgerCellRight}>{fAmt(e.amount)}</td>
                      <td className={styles.salaryLedgerCell}></td>
                    </tr>
                  );
                })}
                {deductions.map((d, idx) => (
                  <tr key={`deduct-${idx}`}>
                    <td className={styles.salaryLedgerCell}>{d.name}</td>
                    <td className={styles.salaryLedgerCell}></td>
                    <td className={styles.salaryLedgerCellRight}>{fAmt(d.amount)}</td>
                  </tr>
                ))}
                <tr className={styles.salaryTotalRow}>
                  <td className={styles.salaryLedgerCell}>TOTAL</td>
                  <td className={styles.salaryLedgerCellRight}>{fAmt(totalEarnings)}</td>
                  <td className={styles.salaryLedgerCellRight}>{fAmt(totalDeductions)}</td>
                </tr>
                <tr className={styles.salaryNetPayRow}>
                  <td>NET PAY</td>
                  <td colSpan={2} className={styles.salaryLedgerCellCenter}>₹{fAmt(netSalary)}</td>
                </tr>
              </tbody>
            </table>

            <div className={styles.salarySignatureSection}>
              <p>For</p>
              <p><strong>{companyName}</strong></p>
              {stampData && (
                <img
                  src={stampData}
                  alt="Company Stamp"
                  className={styles.salaryStampImg}
                />
              )}
              <p>Authorized Signatory</p>
            </div>
          </div>

          {includeFooter && footerData && (
            <div className={styles.footer}>
              <img src={footerData} alt="Footer" className={styles.previewImage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
