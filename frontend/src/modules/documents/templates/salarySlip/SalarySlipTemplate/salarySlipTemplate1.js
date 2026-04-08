export function generateSalarySlipTemplate1(payload) {
  const safe = (v) => v || '';
  const {
    form_data = {},
    headerData,
    footerData,
    stampData,
    includeFooter
  } = payload || {};

  const name = safe(form_data.employee_name);
  const designation = safe(form_data.designation);
  const displayMonth = safe(form_data.display_month);
  const year = safe(form_data.year);
  const totalWorkingDays = safe(form_data.total_working_days);
  const effectiveDays = safe(form_data.effective_days);
  const leaves = safe(form_data.total_leaves);
  const companyName = safe(form_data.company_name);
  
  const earnings = form_data.earnings || [];
  const deductions = form_data.deductions || [];
  const totalEarnings = safe(form_data.total_earnings);
  const totalDeductions = safe(form_data.total_deductions);
  const netSalary = safe(form_data.net_salary);

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

  return `
    <html>
      <head>
        <style>
          @page { size: A4; margin: 0; }
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #111; }
          .page { width: 794px; height: 1123px; margin: 0 auto; position: relative; box-sizing: border-box; display: flex; flex-direction: column; }
          .header { width: 100%; flex: 0 0 auto; }
          .header img { width: 100%; display: block; }
          .content-area { flex: 1 1 auto; padding: 40px; padding-bottom: 150px; overflow: hidden; }

          .footer { width: 100%; flex: 0 0 auto; }
          .footer img { width: 100%; display: block; }
          img { max-width: 100%; height: auto; display: block; page-break-inside: avoid; }
          
          .salary-title { text-align: center; }
          .salary-title h2 { margin: 0; }
          
          .info-section { margin: 20px 0; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .info-table { width: 100%; font-size: 14px; border-collapse: collapse; }
          .info-table td { padding: 4px 0; }
          
          .ledger-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
          .ledger-header { background-color: #f2f2f2; }
          .ledger-header th { padding: 10px; text-align: left; border: 1px solid #ddd; }
          .ledger-header th.right { text-align: right; }
          
          .ledger-cell { padding: 10px; border: 1px solid #ddd; }
          .ledger-cell.right { text-align: right; }
          
          .total-row { background-color: #f9f9f9; font-weight: bold; }
          .net-row { background-color: #eeefff; font-weight: bold; font-size: 15px; }
          .net-row td { padding: 12px; border: 1px solid #ddd; }
          
          .signature-section { margin-top: 40px; text-align: left; }
          .signature-section p { margin: 0; }
          .signature-section .company { margin: 5px 0; font-weight: bold; }
          .stamp-img { max-height: 120px; max-width: 200px; margin: 5px 0; }
          .authorized { margin: 5px 0 0 0; }
        </style>
      </head>
      <body>
        <div class="page">
          ${headerData ? `<div class="header"><img src="${headerData}" alt="Header" /></div>` : ''}
          <div class="content-area">
              <div class="salary-title"><h2>SALARY SLIP</h2></div>
              <div class="info-section">
                  <table class="info-table">
                      <tr>
                          <td><strong>Employee Name:</strong> ${name}</td>
                          <td><strong>Pay Period:</strong> ${displayMonth} ${year}</td>
                      </tr>
                      <tr>
                          <td><strong>Designation:</strong> ${designation}</td>
                          <td><strong>Total Working Days:</strong> ${totalWorkingDays}</td>
                      </tr>
                      <tr>
                          <td><strong>Effective Days:</strong> ${fDays(effectiveDays)}</td>
                          <td><strong>Total Leaves:</strong> ${fDays(leaves)}</td>
                      </tr>
                  </table>
              </div>
              <table class="ledger-table">
                  <thead>
                      <tr class="ledger-header">
                          <th>Description</th>
                          <th class="right">Earnings (₹)</th>
                          <th class="right">Deductions (₹)</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${earnings.map(e => `
                        <tr>
                          <td class="ledger-cell">${e.name}</td>
                          <td class="ledger-cell right">${fAmt(e.amount)}</td>
                          <td class="ledger-cell"></td>
                        </tr>
                      `).join('')}
                      ${deductions.map(d => `
                        <tr>
                          <td class="ledger-cell">${d.name}</td>
                          <td class="ledger-cell"></td>
                          <td class="ledger-cell right">${fAmt(d.amount)}</td>
                        </tr>
                      `).join('')}
                      <tr class="total-row">
                          <td class="ledger-cell">TOTAL</td>
                          <td class="ledger-cell right">${fAmt(totalEarnings)}</td>
                          <td class="ledger-cell right">${fAmt(totalDeductions)}</td>
                      </tr>
                      <tr class="net-row">
                          <td>NET PAY</td>
                          <td class="right">₹${fAmt(netSalary)}</td>
                          <td></td>
                      </tr>
                  </tbody>
              </table>

              <div class="signature-section">
                  <p>For</p>
                  <p class="company">${companyName}</p>
                  ${stampData ? `<img src="${stampData}" class="stamp-img" />` : ''}
                  <p class="authorized">Authorized Signatory</p>
              </div>
          </div>
          <div class="footer">
            ${includeFooter && footerData ? `<img src="${footerData}" class="footer-img"/>` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
}
