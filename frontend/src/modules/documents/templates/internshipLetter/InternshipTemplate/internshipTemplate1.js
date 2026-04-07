export function generateInternshipTemplate1(payload) {
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
    department,
    startDate,
    endDate,
    offerDate,
    headerData,
    footerData,
    stampData,
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
  const stW = '120px';
  const stH = 'auto';
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
          .content p { margin: 8px 0; line-height: 1.5; }
          .title { text-align: center; font-weight: 700; margin: 16px 0; font-size: 18pt; }
          .date-row { margin-bottom: 16px; }
          .footer { width: 100%; flex: 0 0 auto; }
          .footer img { width: 100%; display: block; }
          img { max-width: 100%; height: auto; display: block; page-break-inside: avoid; }
          .spacer-xl { height: 16px; }
          .spacer-md { height: 12px; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            ${headerData ? `<img class="header-img" src="${headerData}" alt="Header" style="width:${hW}; height:${hH};" />` : ''}
          </div>
          <div class="content-area">
            <div class="spacer-xl"></div>
            <div class="title">INTERNSHIP COMPLETION LETTER</div>
            <div class="date-row"><strong>Date:</strong> <strong>${displayOfferDate}</strong></div>
            <div class="content">
              <p>This is to certify that <strong>${titlePrefix} ${safe(username)}</strong> has successfully completed ${pronounSet.his_her} internship with <strong>${safe(companyName)}</strong>.</p>
              <p>${pronounSet.he_she_cap} worked with us in the <strong>${safe(department)}</strong> for the period from <strong>${displayStart}</strong> to <strong>${displayEnd}</strong>.</p>
              <p>During the internship tenure, ${pronounSet.he_she} was involved in various development activities and gained practical exposure to software development processes, technical implementation, and professional work culture. ${pronounSet.his_her_cap} conduct and performance during the internship period were found to be satisfactory.</p>
              <p>We appreciate ${pronounSet.his_her} efforts and wish ${pronounSet.him_her} success in future academic and professional endeavors.</p>
              <div class="spacer-xl"></div>
              <p>For<br/><strong>${safe(companyName)}</strong></p>
              <div class="spacer-md"></div>
              <p>Authorized Signatory</p>
              <div class="spacer-xl"></div>
              ${stampData ? `<img src="${stampData}" alt="Stamp" style="width:${stW}; height:${stH};" />` : ''}
            </div>
          </div>
          ${includeFooter ? `<div class="footer">${footerData ? `<img class="footer-img" src="${footerData}" alt="Footer" style="width:${fW}; height:${fH};" />` : ''}</div>` : ''}
        </div>
      </body>
    </html>
    `;
}
