export function generateExperienceTemplate1(payload) {
  const safe = (v) => v || '';
  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
  };
  const ordinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const formatDateLong = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const day = ordinal(d.getDate());
    const month = d.toLocaleDateString('en-GB', { month: 'long' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const {
    personTitle,
    username,
    companyName,
    position,
    startDate,
    endDate,
    offerDate,
    headerData,
    footerData,
    signatureData,
    sealData,
    includeFooter,
  } = payload;

  const titlePrefix = personTitle || 'Mr';
  const pronounSet = titlePrefix === 'Ms'
    ? { he_she_cap: 'She', he_she: 'she', his_her: 'her', his_her_cap: 'Her', him_her: 'her' }
    : { he_she_cap: 'He', he_she: 'he', his_her: 'his', his_her_cap: 'His', him_her: 'him' };

  const hW = '100%';
  const hH = 'auto';
  const fW = '100%';
  const fH = 'auto';
  const sigW = '150px';
  const sigH = 'auto';
  const sealW = '150px';
  const sealH = 'auto';
  const displayOfferDate = formatDateShort(offerDate);
  const displayStart = formatDateLong(startDate);
  const displayEnd = formatDateLong(endDate);

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
          .content p { margin: 10px 0; line-height: 1.6; }
          .title { text-align: center; font-weight: 700; margin: 16px 0; }
          .date-row { margin-bottom: 16px; }
          .footer { width: 100%; flex: 0 0 auto; }
          .footer img { width: 100%; display: block; }
          img { max-width: 100%; height: auto; display: block; page-break-inside: avoid; }
          .spacer-xl { height: 20px; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            ${headerData ? `<img class="header-img" src="${headerData}" alt="Header" style="width:${hW}; height:${hH};" />` : ''}
          </div>
          <div class="content-area">
            <div class="spacer-xl"></div>
            <div class="title">EXPERIENCE LETTER</div>
            <div class="date-row"><strong>Date:</strong> <strong>${displayOfferDate}</strong></div>
            <div class="content">
              <p>This is to certify that <strong>${titlePrefix} ${safe(username)}</strong> was employed with <strong>${safe(companyName)}</strong> as a <strong>${safe(position)}</strong> from <strong>${displayStart}</strong> to <strong>${displayEnd}</strong>.</p>

              <p>During ${pronounSet.his_her} tenure with us, ${pronounSet.he_she} consistently demonstrated a high level of professionalism, dedication, and technical competence in ${pronounSet.his_her} assigned responsibilities. ${pronounSet.he_she_cap} actively contributed to various projects and played a valuable role in achieving team objectives.</p>

              <p>${pronounSet.he_she_cap} exhibited strong problem-solving abilities, effective communication skills, and a positive attitude towards learning and growth. ${pronounSet.his_her_cap} ability to adapt to new challenges and deliver quality work within timelines was highly commendable.</p>

              <p>Throughout ${pronounSet.his_her} association with the organization, ${pronounSet.he_she} maintained excellent conduct and upheld the values and standards of the company.</p>

              <p>We sincerely appreciate ${pronounSet.his_her} contributions and wish ${pronounSet.him_her} continued success in ${pronounSet.his_her} future professional endeavors.</p>

              <div class="spacer-xl"></div>
              <p>Sincerely,</p>
              ${signatureData ? `<img src="${signatureData}" alt="Signature" style="width:${sigW}; height:${sigH};" />` : ''}
              <p>Authorized Signatory</p>
              ${sealData ? `<img src="${sealData}" alt="Seal" style="width:${sealW}; height:${sealH};" />` : ''}
            </div>
          </div>
          ${includeFooter ? `<div class="footer">${footerData ? `<img class="footer-img" src="${footerData}" alt="Footer" style="width:${fW}; height:${fH};" />` : ''}</div>` : ''}
        </div>
      </body>
    </html>
    `;
}
