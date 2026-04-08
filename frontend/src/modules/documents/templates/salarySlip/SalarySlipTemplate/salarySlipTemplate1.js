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
          .page { width: 794px; min-height: 1123px; margin: 0 auto; position: relative; box-sizing: border-box; }
          .content-area { padding: 40px; }
          .header-img { width: 100%; display: block; margin: 0; padding: 0; }
          .footer { width: 100%; flex: 0 0 auto; }
          .footer img { width: 100%; display: block; }
          img { max-width: 100%; height: auto; display: block; page-break-inside: avoid; }
        </style>
      </head>
      <body>
        <div class="page">
          <img src="${safe(headerData)}" class="header-img" style="width: 100%;" />
          <div class="content-area" style="padding: 40px;">
              <center><h2>SALARY SLIP</h2></center>
              <div style="margin: 20px 0; border-bottom: 2px solid #333; padding-bottom: 10px;">
                  <table style="width: 100%; font-size: 14px;">
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
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                  <thead>
                      <tr style="background-color: #f2f2f2; border: 1px solid #ddd;">
                          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Description</th>
                          <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Earnings (₹)</th>
                          <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Deductions (₹)</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${earnings.map(e => `
                        <tr>
                          <td style="padding: 10px; border: 1px solid #ddd;">${e.name}</td>
                          <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${fAmt(e.amount)}</td>
                          <td style="padding: 10px; border: 1px solid #ddd;"></td>
                        </tr>
                      `).join('')}
                      ${deductions.map(d => `
                        <tr>
                          <td style="padding: 10px; border: 1px solid #ddd;">${d.name}</td>
                          <td style="padding: 10px; border: 1px solid #ddd;"></td>
                          <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${fAmt(d.amount)}</td>
                        </tr>
                      `).join('')}
                      <tr style="background-color: #f9f9f9; font-weight: bold;">
                          <td style="padding: 10px; border: 1px solid #ddd;">TOTAL</td>
                          <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${fAmt(totalEarnings)}</td>
                          <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${fAmt(totalDeductions)}</td>
                      </tr>
                      <tr style="background-color: #eeefff; font-weight: bold; font-size: 15px;">
                          <td style="padding: 12px; border: 1px solid #ddd;">NET PAY</td>
                          <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">₹${fAmt(netSalary)}</td>
                          <td style="padding: 12px; border: 1px solid #ddd;"></td>
                      </tr>
                  </tbody>
              </table>

              <div style="margin-top: 40px; text-align: left;">
                  <p style="margin: 0;">For</p>
                  <p style="margin: 5px 0;"><strong>${companyName}</strong></p>
                  ${stampData ? `<img src="${stampData}" style="max-height: 120px; max-width: 200px; margin: 5px 0;" />` : ''}
                  <p style="margin: 5px 0 0 0;">Authorized Signatory</p>
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
