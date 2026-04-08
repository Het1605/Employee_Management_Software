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
  form_data, // raw metrics from backend calc
}) => {
  // Pattern: Prepare clean payload first
  // Map month number to full month name (e.g., 4 -> April)
  const getMonthName = (m) => {
    if (!m) return '____________';
    if (typeof m === 'string' && isNaN(m)) return m;
    try {
      const date = new Date(2000, parseInt(m) - 1, 1);
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
  const effectiveDays = form_data?.effective_days || '0';
  const totalLeaves = form_data?.total_leaves || '0';
  const companyName = form_data?.company_name || '____________';
  
  const earnings = form_data?.earnings || [];
  const deductions = form_data?.deductions || [];
  const totalEarnings = form_data?.total_earnings || 0;
  const totalDeductions = form_data?.total_deductions || 0;
  const netSalary = form_data?.net_salary || 0;

  // Formatting helpers to match backend EXACTLY
  const fAmt = (val) => {
    const num = Number(val);
    if (Math.abs(num) < 0.005) return "0.00";
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fDays = (val) => {
    const num = Number(val);
    return Number.isInteger(num) ? num : num;
  };

  return (
    <div className={styles.previewColumn}>
      <div className={styles.a4Preview}>
        {headerData && (
          <img
            src={headerData}
            alt="Header"
            className={styles.previewImage}
            style={{ width: '100%' }}
          />
        )}
        
        <div className={styles.previewTitle} style={{ marginTop: '0' }}>SALARY SLIP</div>

        <div style={{ margin: '14px 0', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <tbody>
                    <tr>
                        <td style={{ padding: '2px 0' }}><strong>Employee Name:</strong> {name}</td>
                        <td style={{ padding: '2px 0' }}><strong>Pay Period:</strong> {displayMonth} {displayYear}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '2px 0' }}><strong>Designation:</strong> {designation}</td>
                        <td style={{ padding: '2px 0' }}><strong>Total Working Days:</strong> {totalWorkingDays}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '2px 0' }}><strong>Effective Days:</strong> {fDays(effectiveDays)}</td>
                        <td style={{ padding: '2px 0' }}><strong>Total Leaves:</strong> {fDays(totalLeaves)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '13px' }}>
            <thead>
                <tr style={{ backgroundColor: '#f2f2f2', border: '1px solid #ddd' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Description</th>
                    <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>Earnings (₹)</th>
                    <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>Deductions (₹)</th>
                </tr>
            </thead>
            <tbody>
                {earnings.map((e, idx) => (
                    <tr key={`earn-${idx}`}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{e.name}</td>
                        <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{fAmt(e.amount)}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}></td>
                    </tr>
                ))}
                {deductions.map((d, idx) => (
                    <tr key={`deduct-${idx}`}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{d.name}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}></td>
                        <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{fAmt(d.amount)}</td>
                    </tr>
                ))}
                <tr style={{ backgroundColor: '#f9f9f9', fontWeight: 'bold' }}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>TOTAL</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{fAmt(totalEarnings)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>{fAmt(totalDeductions)}</td>
                </tr>
                <tr style={{ backgroundColor: '#eeefff', fontWeight: 'bold', fontSize: '14px' }}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>NET PAY</td>
                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>₹{fAmt(netSalary)}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}></td>
                </tr>
            </tbody>
        </table>

        <div className={styles.previewSignature}>
          <p style={{ margin: 0 }}>For</p>
          <p style={{ margin: '4px 0', fontWeight: 'bold' }}>{companyName}</p>
          {stampData && (
            <img
              src={stampData}
              alt="Company Stamp"
              className={styles.previewSignatureImage}
              style={{ maxHeight: '100px', width: 'auto' }}
            />
          )}
          <p style={{ margin: 0 }}>Authorized Signatory</p>
        </div>

        {includeFooter && footerData && (
          <img
            src={footerData}
            alt="Footer"
            className={styles.previewImage}
            style={{ 
              position: 'absolute', 
              bottom: '40px', 
              left: '40px', 
              right: '40px', 
              width: 'calc(100% - 80px)' 
            }}
          />
        )}
      </div>
    </div>
  );
};
