export function generateSalarySlipTemplate1(payload) {
  const { 
    form_data = {},
    title,
    headerData,
    footerData,
    stampData,
    includeFooter
  } = payload || {};

  // For the frontend preview before generation, these might be empty if we rely on backend.
  // But for the generated PDF, they will be populated in form_data.
  const name = form_data.employee_name || payload.username || '[Employee Name]';
  const designation = form_data.designation || payload.position || '[Designation]';
  const month = form_data.month || payload.month || '[Month]';
  const year = form_data.year || payload.year || '[Year]';
  const totalWorkingDays = form_data.total_working_days || 0;
  const effectiveDays = form_data.effective_days || 0;
  const leaves = form_data.total_leaves || 0;
  
  const earnings = form_data.earnings || [];
  const deductions = form_data.deductions || [];
  const totalEarnings = form_data.total_earnings || 0;
  const totalDeductions = form_data.total_deductions || 0;
  const netSalary = form_data.net_salary || 0;

  const monthIndex = Number(month);
  const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const displayMonth = (monthIndex >= 1 && monthIndex <= 12) ? monthNames[monthIndex] : month;

  return `
    <div class="page">
      <img src="${headerData || ''}" class="header-img" style="width: 100%;" />
      
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
                      <td><strong>Effective Days:</strong> ${effectiveDays}</td>
                      <td><strong>Total Leaves:</strong> ${leaves}</td>
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
                          <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${Number(e.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                          <td style="padding: 10px; border: 1px solid #ddd;"></td>
                      </tr>
                  `).join('')}
                  
                  ${deductions.map(d => `
                      <tr>
                          <td style="padding: 10px; border: 1px solid #ddd;">${d.name}</td>
                          <td style="padding: 10px; border: 1px solid #ddd;"></td>
                          <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${Number(d.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                      </tr>
                  `).join('')}

                  <tr style="background-color: #f9f9f9; font-weight: bold;">
                      <td style="padding: 10px; border: 1px solid #ddd;">TOTAL</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${Number(totalEarnings).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${Number(totalDeductions).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  </tr>
              </tbody>
          </table>

          <div style="margin-top: 30px; padding: 15px; background-color: #eeefff; border: 1px solid #ccc; text-align: right;">
              <h3 style="margin: 0;">Net Pay: ₹${Number(netSalary).toLocaleString('en-IN', {minimumFractionDigits: 2})}</h3>
          </div>

          <div style="margin-top: 60px;">
              <p style="margin: 0;">For</p>
              <p style="margin: 5px 0;"><strong>${form_data.company_name || payload.companyName || '[Company Name]'}</strong></p>
              ${stampData ? `<img src="${stampData}" style="max-height: 80px; margin: 10px 0;" />` : ''}
              <p style="margin: 0;">Authorized Signatory</p>
          </div>
      </div>

      ${includeFooter ? `<img src="${footerData || ''}" class="footer-img" style="width: 100%; position: absolute; bottom: 0; left: 0;" />` : ''}
    </div>
  `;
}
