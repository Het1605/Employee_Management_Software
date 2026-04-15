export function generateOfferLetterTemplate1(payload) {
  const safe = (v) => v || '';
  const {
    username,
    position,
    companyName,
    startDate,
    offerDate,
    headerData,
    footerData,
    stampData,
    includeFooter,
  } = payload;

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
          .content { word-wrap: break-word; overflow-wrap: break-word; white-space: normal; }
          .content p { margin: 8px 0; line-height: 1.5; }
          .top-row { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
          .date { text-align: right; }
          .footer { position: absolute; bottom: 0; left: 0; width: 100%; }
          .footer img { width: 100%; display: block; }
          img { max-width: 100%; height: auto; display: block; }
          .signature { margin-top: 48px; }
          .signature img { max-width: 140px; margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="page">
          ${headerData ? `<div class="header"><img src="${headerData}" alt="Header" /></div>` : ''}
          <div class="content-area">
            <div style="text-align:center; margin-bottom: 32px;"><h2>OFFER LETTER</h2></div>
            <div class="top-row">
              <div><strong>To:</strong> <strong>${safe(username)}</strong></div>
              <div class="date"><strong>Date:</strong> <strong>${safe(offerDate)}</strong></div>
            </div>
            <div class="content">
              <p>Dear <strong>${safe(username)}</strong>,</p>

              <p>We are pleased to offer you the position of <strong>${safe(position)}</strong> at <strong>${safe(companyName)}</strong>. Based on your qualifications, skills, and performance during the selection process, we are confident that you will be a valuable addition to our organization.</p>

              <p>Your employment with us will commence from <strong>${safe(startDate)}</strong>. You will be expected to perform your duties with dedication, professionalism, and integrity, and contribute effectively towards the growth and success of the organization.</p>

              <p>During your tenure, you will be assigned responsibilities aligned with your role. You are expected to adhere to company policies, maintain confidentiality, and demonstrate commitment to quality and timely delivery of your work.</p>

              <p>This offer is subject to the terms and conditions of employment, including company policies and code of conduct. Detailed information regarding your compensation, benefits, and responsibilities will be shared with you separately.</p>

              <p>We look forward to welcoming you to our team and wish you a successful and rewarding career with <strong>${safe(companyName)}</strong>.</p>

              <div class="signature">
                <p>For</p>
                <p><strong>${safe(companyName)}</strong></p>
                ${stampData ? `<img src="${stampData}" alt="Company Stamp" />` : ''}
                <p>Authorized Signatory</p>
              </div>
            </div>
          </div>
          <div class="footer">
            ${includeFooter && footerData ? `<img class="footer-img" src="${footerData}" alt="Footer" />` : ''}
          </div>      
          </div>
      </body>
    </html>
    `;
}
