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
    signatureData,
    signerName,
    signerRole,
    includeFooter,
  } = payload;

  return `
    <html>
      <head>
        <style>
          @page { size: A4; margin: 0; }
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #111; line-height: 1.5; }
          .page { width: 794px; height: 1123px; margin: 0 auto; display: flex; flex-direction: column; box-sizing: border-box; }
          .header { width: 100%; flex: 0 0 auto; margin: 0; padding: 0; }
          .header img { width: 100%; display: block; margin: 0; padding: 0; }
          .content-area { flex: 1 1 auto; padding: 40px; padding-bottom: 180px; overflow: hidden; }
          .content { word-wrap: break-word; overflow-wrap: break-word; white-space: normal; }
          .content p { margin: 8px 0; line-height: 1.5; }
          .top-row { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
          .date { text-align: right; max-width: 40%; }
          .footer { width: 100%; flex: 0 0 auto; }
          .footer img { width: 100%; display: block; }
          img { max-width: 100%; height: auto; display: block; page-break-inside: avoid; }
          .spacer-xl { height: 16px; }
          .signature { margin-top: 32px; text-align: right; }
          .signature .sig-img { display: inline-block; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            ${headerData ? `<img class="header-img" src="${headerData}" alt="Header" />` : ''}
          </div>
          <div class="content-area">
            <div class="spacer-xl"></div>
            <div style="text-align:center;"><h2>OFFER LETTER</h2></div>
            <div class="top-row">
              <div><strong>To:</strong> <strong>${safe(username)}</strong></div>
              <div class="date"><strong>Date:</strong> <strong>${safe(offerDate)}</strong></div>
            </div>
            <div class="spacer-xl"></div>
            <div class="content">
              <p><strong>Dear ${safe(username)},</strong></p>

              <p>We are pleased to offer you the position of <strong>${safe(position)}</strong> at <strong>${safe(companyName)}</strong>. Based on your skills, experience, and interview performance, we are confident that you will be a valuable addition to our organization.</p>

              <p>Your employment with us will commence from <strong>${safe(startDate)}</strong>. You will be expected to carry out your responsibilities diligently and contribute effectively to the growth and success of the team and the company.</p>

              <p>During your tenure, you will be involved in various projects and assignments aligned with your role. You are expected to maintain professionalism, follow company policies, and demonstrate a strong commitment to quality and timely delivery of work.</p>

              <p>This offer is subject to the terms and conditions of employment, including company policies, code of conduct, and performance expectations. Further details regarding your role, responsibilities, and compensation structure will be shared with you separately.</p>

              <p>We are excited to have you join our team and look forward to a successful and mutually beneficial association. We wish you a rewarding career with <strong>${safe(companyName)}</strong>.</p>

              <div class="spacer-xl"></div>
              <div class="signature">
                <p><strong>Sincerely,</strong></p>
                ${signatureData ? `<div class="sig-img"><img src="${signatureData}" alt="Signature" /></div>` : ''}
                <p>${safe(signerName)}</p>
                <p>${safe(signerRole)}</p>
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
