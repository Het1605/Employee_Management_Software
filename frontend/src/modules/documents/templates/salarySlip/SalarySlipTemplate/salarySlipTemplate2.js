export function generateSalarySlipTemplate2(payload) {
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
    const year = safe(form_data.year);
    const totalWorkingDays = safe(form_data.total_working_days);
    const effectiveDays = safe(form_data.effective_days);
    const leaves = safe(form_data.total_leaves);
    const companyName = safe(form_data.company_name);

    const monthly_data = form_data.monthly_data || [];
    const totalEarnings = safe(form_data.total_earnings);
    const totalDeductions = safe(form_data.total_deductions);
    const netSalary = safe(form_data.net_pay);

    const fAmt = (val) => {
        const num = Number(val);
        if (Math.abs(num) < 0.005) return "0.00";
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

    return `
    <html>
      <head>
        <style>
          @page { size: A4 landscape; margin: 0; }
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #111; line-height: 1.5; }
          .page { width: 1123px; height: 794px; margin: 0 auto; display: flex; flex-direction: column; box-sizing: border-box; }
          .content-area { flex: 1 1 auto; padding: 20px 40px; overflow: hidden; }
          img { max-width: 100%; height: auto; display: block; page-break-inside: avoid; }
          
          .salary-summary-title { text-align: center; margin-bottom: 18px; font-size: 15px; font-weight: bold; }
          
          .info-section { margin-bottom: 18px; }
          .info-table { width: 100%; font-size: 12px; border-collapse: collapse; }
          .info-table td { padding: 2px 0; }
          
          .ledger-table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 12px; }
          .ledger-header { background-color: #f2f2f2; }
          .ledger-header th { padding: 4px; text-align: left; border: 1px solid #ddd; }
          .ledger-header th.right { text-align: right; }
          
          .ledger-cell { padding: 3px 4px; border: 1px solid #ddd; text-align: left; }
          .ledger-cell.right { text-align: right; }
          .ledger-cell.center { text-align: center; }
          
          .total-row { background-color: #f9f9f9; font-weight: bold; }
          .net-row { background-color: #eeefff; font-weight: bold; font-size: 13px; }
          
          .signature-section { margin-top: 18px; text-align: left; }
          .signature-section p { margin: 0; font-size: 12px; }
          .signature-section .company { margin: 2px 0; font-weight: bold; }
          .stamp-img { max-height: 120px; max-width: 180px; margin: 2px 0; }
          .authorized { margin: 2px 0 0 0; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="content-area">
              <div class="salary-summary-title">SALARY SUMMARY (YEARLY)</div>
              
              <div class="info-section">
                  <table class="info-table">
                      <tr>
                          <td style="width: 33%;"><strong>Employee Name:</strong> ${name}</td>
                          <td style="width: 33%;"><strong>Designation:</strong> ${designation}</td>
                          <td style="width: 33%;"><strong>Year:</strong> ${year}</td>
                      </tr>
                      <tr>
                          <td><strong>Total Working Days:</strong> ${totalWorkingDays}</td>
                          <td><strong>Effective Days:</strong> ${fDays(effectiveDays)}</td>
                          <td><strong>Total Leaves:</strong> ${fDays(leaves)}</td>
                      </tr>
                  </table>
              </div>

              <table class="ledger-table">
                  <thead>
                      <tr class="ledger-header">
                          <th>Month</th>
                          ${compNames.map(c => `<th class="right">${c}</th>`).join('')}
                          <th class="right">Leave Deduction</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${monthly_data.map(m => `
                          <tr>
                              <td class="ledger-cell">${m.month}</td>
                              ${compNames.map(c => `<td class="ledger-cell right">${fAmt(m.components[c] || 0)}</td>`).join('')}
                              <td class="ledger-cell right">${fAmt(m.leave_deduction)}</td>
                          </tr>
                      `).join('')}
                      
                      <tr class="total-row">
                          <td class="ledger-cell">TOTAL</td>
                          <td class="ledger-cell center" colspan="${compNames.length}">${fAmt(totalEarnings)}</td>
                          <td class="ledger-cell right">${fAmt(totalDeductions)}</td>
                      </tr>
                      <tr class="net-row">
                          <td class="ledger-cell">NET PAY</td>
                          <td class="ledger-cell center" colspan="${compNames.length + 1}">₹${fAmt(netSalary)}</td>
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
        </div>
      </body>
    </html>
  `;
}
