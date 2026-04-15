import React from 'react';
import styles from '../../../pages/styles/DocumentsPage.module.css';

export const SalarySlipPreview2 = ({
  headerData,
  footerData,
  stampData,
  includeFooter,
  form_data,
}) => {
  const name = form_data?.employee_name || '____________';
  const designation = form_data?.designation || '____________';
  const year = form_data?.year || '____________';
  const totalWorkingDays = form_data?.total_working_days || '0';
  const effectiveDays = form_data?.effective_days || '0';
  const leaves = form_data?.total_leaves || '0';
  const companyName = form_data?.company_name || '____________';

  const monthly_data = form_data?.monthly_data || [];
  const totalEarnings = form_data?.total_earnings || 0;
  const totalDeductions = form_data?.total_deductions || 0;
  const netSalary = form_data?.net_pay || 0;

  const fAmt = (val) => {
    const num = Number(val);
    if (Math.abs(num) < 0.005) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fDays = (val) => {
    const num = Number(val);
    return Number.isInteger(num) ? num : num;
  };

  let compNames = [];
  if (monthly_data.length > 0) {
    compNames = Object.keys(monthly_data[0].components || {});
  }

  return (
    <div className={styles.previewColumn}>
      <div
        className={styles.previewViewport}
        style={{ '--preview-width': '1123px', '--preview-height': '794px' }}
      >
        <div className={styles.a4PreviewLandscape}>
          <div className={styles.salaryPreviewBody}>
            <div className={styles.salaryTitle} style={{ textAlign: 'center', marginBottom: '8px', fontSize: '15px', fontWeight: 'bold' }}>
              SALARY SUMMARY (YEARLY)
            </div>

            <div className={styles.salaryInfoSection} style={{ marginBottom: '8px', borderBottom: 'none' }}>
              <table className={styles.salaryInfoTable} style={{ fontSize: '12px', width: '100%' }}>
                <tbody>
                  <tr>
                    <td className={styles.salaryInfoCell} style={{ width: '33%', padding: '2px 0' }}><strong>Employee Name:</strong> {name}</td>
                    <td className={styles.salaryInfoCell} style={{ width: '33%', padding: '2px 0' }}><strong>Designation:</strong> {designation}</td>
                    <td className={styles.salaryInfoCell} style={{ width: '33%', padding: '2px 0' }}><strong>Year:</strong> {year}</td>
                  </tr>
                  <tr>
                    <td className={styles.salaryInfoCell} style={{ padding: '2px 0' }}><strong>Total Working Days:</strong> {totalWorkingDays}</td>
                    <td className={styles.salaryInfoCell} style={{ padding: '2px 0' }}><strong>Effective Days:</strong> {fDays(effectiveDays)}</td>
                    <td className={styles.salaryInfoCell} style={{ padding: '2px 0' }}><strong>Total Leaves:</strong> {fDays(leaves)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <table className={styles.salaryLedgerTable} style={{ fontSize: '12px' }}>
              <thead>
                <tr className={styles.salaryLedgerHeader}>
                  <th style={{ padding: '4px', border: '1px solid #ddd' }}>Month</th>
                  {compNames.map((c) => <th key={c} style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'right' }}>{c}</th>)}
                  <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'right' }}>Leave Deduction</th>
                </tr>
              </thead>
              <tbody>
                {monthly_data.map((m, idx) => (
                  <tr key={`month-${idx}`}>
                    <td className={styles.salaryLedgerCell} style={{ padding: '3px 4px' }}>{m.month}</td>
                    {compNames.map((c) => (
                      <td key={`comp-${c}`} className={styles.salaryLedgerCellRight} style={{ padding: '3px 4px' }}>
                        {fAmt(m.components[c] || 0)}
                      </td>
                    ))}
                    <td className={styles.salaryLedgerCellRight} style={{ padding: '3px 4px' }}>{fAmt(m.leave_deduction)}</td>
                  </tr>
                ))}
                <tr className={styles.salaryTotalRow}>
                  <td className={styles.salaryLedgerCell} style={{ padding: '3px 4px' }}>TOTAL</td>
                  <td className={styles.salaryLedgerCellCenter} style={{ padding: '3px 4px' }} colSpan={compNames.length}>{fAmt(totalEarnings)}</td>
                  <td className={styles.salaryLedgerCellRight} style={{ padding: '3px 4px' }}>{fAmt(totalDeductions)}</td>
                </tr>
                <tr className={styles.salaryNetPayRow} style={{ fontSize: '13px' }}>
                  <td className={styles.salaryLedgerCell} style={{ padding: '3px 4px' }}>NET PAY</td>
                  <td className={styles.salaryLedgerCellCenter} style={{ padding: '3px 4px' }} colSpan={compNames.length + 1}>₹{fAmt(netSalary)}</td>
                </tr>
              </tbody>
            </table>

            <div className={styles.salarySignatureSection} style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '12px', margin: 0 }}>For</p>
              <p style={{ margin: '2px 0' }}><strong>{companyName}</strong></p>
              {stampData && (
                <img
                  src={stampData}
                  alt="Company Stamp"
                  className={styles.salaryStampImg}
                  style={{ maxHeight: '70px', maxWidth: '180px', margin: '2px 0' }}
                />
              )}
              <p style={{ fontSize: '12px', margin: '2px 0 0 0' }}>Authorized Signatory</p>
            </div>
          </div>
        </div>

        {includeFooter && footerData && (
          <div className={styles.footer}>
            <img src={footerData} alt="Footer" className={styles.previewImage} />
          </div>
        )}
      </div>
    </div>
  );
};
