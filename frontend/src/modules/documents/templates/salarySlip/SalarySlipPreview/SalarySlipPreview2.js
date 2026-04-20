import React from 'react';
import styles from '../../../pages/styles/DocumentsPage.module.css';

export const SalarySlipPreview2 = ({
  headerData,
  footerData,
  stampData,
  includeFooter,
  form_data,
}) => {
  const containerRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const handleResize = () => {
      // Apply scaling ONLY on desktop (>= 1024px)
      if (window.innerWidth >= 1024 && containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const targetWidth = 1123; // Landscape A4 width
        if (containerWidth < targetWidth) {
          const newScale = containerWidth / targetWidth;
          setScale(newScale);
        } else {
          setScale(1);
        }
      } else {
        setScale(1); // Standard CSS handles mobile scaling
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const name = form_data?.employee_name || '____________';
  const designation = form_data?.designation || '____________';
  const year = form_data?.year || '____________';
  const totalWorkingDays = form_data?.total_working_days || '0';
  const effectiveDays = form_data?.effective_paid_days || '0';
  const leavesTaken = form_data?.leaves_taken || '0';
  const paidLeaves = form_data?.paid_leaves || '0';
  const unpaidLeaves = form_data?.unpaid_leaves || '0';
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
    if (val === undefined || val === null || val === '') return '0';
    const num = Number(val);
    return Number.isInteger(num) ? num : num.toFixed(1);
  };

  let compNames = [];
  if (monthly_data.length > 0) {
    compNames = Object.keys(monthly_data[0].components || {});
  }

  return (
    <div className={styles.previewColumn} ref={containerRef}>
      <div 
        className={styles.previewViewport}
        style={(window.innerWidth >= 1024 && scale < 1) ? { 
          overflow: 'hidden', 
          height: `${794 * scale}px`, 
          minHeight: 'auto'
        } : {}}
      >
        <div 
          className={styles.a4PreviewLandscape}
          style={(window.innerWidth >= 1024 && scale < 1) ? { 
            transform: `scale(${scale})`, 
            transformOrigin: 'top center',
            margin: '0 auto'
          } : {}}
        >
          <div className={styles.salaryPreviewBody}>
            <div className={styles.salaryTitle}>
              SALARY SUMMARY (YEARLY)
            </div>

            <div className={styles.salaryInfoSection} style={{ borderBottom: 'none' }}>
              <table className={styles.salaryInfoTable}>
                <tbody>
                  <tr>
                    <td className={styles.salaryInfoCell}><strong>Employee Name:</strong> {name}</td>
                    <td className={styles.salaryInfoCell}><strong>Designation:</strong> {designation}</td>
                    <td className={styles.salaryInfoCell}><strong>Year:</strong> {year}</td>
                    <td className={styles.salaryInfoCell}><strong>Total Working Days:</strong> {totalWorkingDays}</td>
                  </tr>
                  <tr>
                    <td className={styles.salaryInfoCell}><strong>Leaves Taken:</strong> {fDays(leavesTaken)}</td>
                    <td className={styles.salaryInfoCell}><strong>Paid Leaves:</strong> {fDays(paidLeaves)}</td>
                    <td className={styles.salaryInfoCell}><strong>Unpaid Leaves:</strong> {fDays(unpaidLeaves)}</td>
                    <td className={styles.salaryInfoCell}><strong>Effective Paid Days:</strong> {fDays(effectiveDays)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <table className={styles.salaryLedgerTable}>
              <thead>
                <tr className={styles.salaryLedgerHeader}>
                  <th>Month</th>
                  {compNames.map((c) => <th key={c} className={styles.salaryLedgerCellRight}>{c}</th>)}
                  <th className={styles.salaryLedgerCellRight}>Leave Deduction</th>
                </tr>
              </thead>
              <tbody>
                {monthly_data.map((m, idx) => (
                  <tr key={`month-${idx}`}>
                    <td className={styles.salaryLedgerCell}>{m.month}</td>
                    {compNames.map((c) => (
                      <td key={`comp-${c}`} className={styles.salaryLedgerCellRight}>
                        {fAmt(m.components[c] || 0)}
                      </td>
                    ))}
                    <td className={styles.salaryLedgerCellRight}>{fAmt(m.leave_deduction)}</td>
                  </tr>
                ))}
                <tr className={styles.salaryTotalRow}>
                  <td className={styles.salaryLedgerCell}>TOTAL</td>
                  <td className={styles.salaryLedgerCellCenter} colSpan={compNames.length}>{fAmt(totalEarnings)}</td>
                  <td className={styles.salaryLedgerCellRight}>{fAmt(totalDeductions)}</td>
                </tr>
                <tr className={styles.salaryNetPayRow}>
                  <td className={styles.salaryLedgerCell}>NET PAY</td>
                  <td className={styles.salaryLedgerCellCenter} colSpan={compNames.length + 1}>₹{fAmt(netSalary)}</td>
                </tr>
              </tbody>
            </table>

            <div className={styles.salarySignatureSection}>
              <p className={styles.salarySignatureLabel}>For</p>
              <p className={styles.salarySignatureCompany}><strong>{companyName}</strong></p>
              {stampData && (
                <img
                  src={stampData}
                  alt="Company Stamp"
                  className={styles.salaryStampImg}
                />
              )}
              <p className={styles.salarySignatureLabel}>Authorized Signatory</p>
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
