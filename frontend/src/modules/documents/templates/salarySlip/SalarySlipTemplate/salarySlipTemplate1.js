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
    const effectiveDays = safe(form_data.effective_days); // Now "Effective Paid Days"
    const leavesTaken = safe(form_data.leaves_taken);
    const paidLeaves = safe(form_data.paid_leaves);
    const unpaidLeaves = safe(form_data.unpaid_leaves);
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
        if (val === undefined || val === null || val === '') return '0';
        const num = Number(val);
        return Number.isInteger(num) ? num : num.toFixed(1);
    };

    return `
    <html>
      <head>
        <style>
          @page { size: A4; margin: 0; }
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #111; line-height: 1.5; }
          .page { width: 794px; height: 1123px; margin: 0 auto; position: relative; box-sizing: border-box; overflow: hidden; }
          .header { width: 100%; margin: 0; padding: 0; }
          .header img { width: 100%; display: block; margin: 0; padding: 0; }
          .content-area { padding: 40px; padding-bottom: 50px; }
          .footer { position: absolute; bottom: 0; left: 0; width: 100%; }
          .footer img { width: 100%; display: block; }
          img { max-width: 100%; height: auto; display: block; }
          
          .salary-title { text-align: center; margin-bottom: 15px; }
          .salary-title h2 { margin: 0; }
          
          .info-section { margin: 5px 0; border-bottom: 2px solid #333; padding-bottom: 5px; }
          .info-table { width: 100%; font-size: 13px; border-collapse: collapse; table-layout: fixed; }
          .info-table td { padding: 3px 0; vertical-align: top; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          
          .ledger-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
          .ledger-header { background-color: #f2f2f2; }
          .ledger-header th { padding: 8px; text-align: left; border: 1px solid #ddd; }
          .ledger-header th.right { text-align: right; }
          
          .ledger-cell { padding: 8px; border: 1px solid #ddd; }
          .ledger-cell.right { text-align: right; }
          .ledger-cell.center { text-align: center; }
          
          .total-row { background-color: #f9f9f9; font-weight: bold; }
          .net-row { background-color: #eeefff; font-weight: bold; font-size: 15px; }
          .net-row td { padding: 10px; border: 1px solid #ddd; }
          
          .signature-section { margin-top: 30px; text-align: left; }
          .signature-section p { margin: 0; }
          .signature-section .company { margin: 3px 0; font-weight: bold; }
          .stamp-img { max-height: 100px; max-width: 180px; margin: 3px 0; }
          .authorized { margin: 3px 0 0 0; }
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
                          <td style="width: 50%;"><strong>Employee Name:</strong> ${name}</td>
                          <td style="width: 50%;"><strong>Pay Period:</strong> ${displayMonth} ${year}</td>
                      </tr>
                      <tr>
                          <td style="width: 50%;"><strong>Designation:</strong> ${designation}</td>
                          <td style="width: 50%;"><strong>Total Working Days:</strong> ${totalWorkingDays}</td>
                      </tr>
                      <tr>
                          <td style="width: 50%;"><strong>Leaves Taken:</strong> ${fDays(leavesTaken)}</td>
                          <td style="width: 50%;"><strong>Paid Leaves:</strong> ${fDays(paidLeaves)}</td>
                      </tr>
                      <tr>
                          <td style="width: 50%;"><strong>Unpaid Leaves:</strong> ${fDays(unpaidLeaves)}</td>
                          <td style="width: 50%;"><strong>Effective Paid Days:</strong> ${fDays(effectiveDays)}</td>
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
                          <td class="ledger-cell center" colspan="2">₹${fAmt(netSalary)}</td>
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
            ${includeFooter && footerData ? `<img src="${footerData}" class="footer-img" alt="Footer" />` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
}
