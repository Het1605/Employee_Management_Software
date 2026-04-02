import React, { useEffect, useMemo, useState } from 'react';
import API from '../../../../core/api/apiClient';
import { useToast } from '../../../../contexts/ToastContext';
import { handleApiError } from '../../../../utils/errorHandler';
import styles from '../styles/DocumentsPage.module.css';

const CreateLetterTab = ({ activeView, setActiveView }) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [documentTypes, setDocumentTypes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [username, setUsername] = useState('');
  const [offerDate, setOfferDate] = useState('');
  const [position, setPosition] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [headerImg, setHeaderImg] = useState(null);
  const [signatureImg, setSignatureImg] = useState(null);
  const [footerImg, setFooterImg] = useState(null);
  const [headerData, setHeaderData] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [footerData, setFooterData] = useState('');
  const [headerWidth, setHeaderWidth] = useState('');
  const [headerHeight, setHeaderHeight] = useState('');
  const [footerWidth, setFooterWidth] = useState('');
  const [footerHeight, setFooterHeight] = useState('');
  const [signatureWidth, setSignatureWidth] = useState('');
  const [signatureHeight, setSignatureHeight] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState('');

  const canSave = useMemo(
    () => title.trim().length >= 2 && documentTypeId,
    [title, documentTypeId]
  );

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await API.get('/document-types');
        setDocumentTypes(res.data || []);
      } catch (err) {
        showToast('Failed to load document types: ' + handleApiError(err), 'error');
      }
    };
    fetchTypes();
  }, [showToast]);

  const fetchDocuments = async () => {
    try {
      setLoadingList(true);
      const res = await API.get('/documents');
      setDocuments(res.data || []);
    } catch (err) {
      showToast('Failed to load documents: ' + handleApiError(err), 'error');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (activeView === 'list') {
      fetchDocuments();
    }
  }, [activeView]);

  const resetForm = () => {
    setTitle('');
    setDocumentTypeId('');
    setUsername('');
    setOfferDate('');
    setPosition('');
    setCompanyName('');
    setStartDate('');
    setHeaderImg(null);
    setSignatureImg(null);
    setFooterImg(null);
    setHeaderData('');
    setSignatureData('');
    setFooterData('');
    setHeaderWidth('');
    setHeaderHeight('');
    setFooterWidth('');
    setFooterHeight('');
    setSignatureWidth('');
    setSignatureHeight('');
    setSignerName('');
    setSignerRole('');
  };

  const toDataUrl = (file, setPreview, setData) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPreview(preview);
    const reader = new FileReader();
    reader.onload = () => setData(reader.result || '');
    reader.readAsDataURL(file);
  };

  const buildHtmlContent = () => {
    const safe = (v) => v || '';
    const hW = headerWidth || '100%';
    const hH = headerHeight || 'auto';
    const fW = footerWidth || '100%';
    const fH = footerHeight || 'auto';
    const sW = signatureWidth || '120px';
    const sH = signatureHeight || 'auto';
    return `
    <html>
      <head>
        <style>
          @page { size: A4; margin: 0; }
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #111; line-height: 1.5; }
          .page { width: 794px; min-height: 1123px; margin: 0 auto; position: relative; }
          .header { width: 100%; margin: 0; padding: 0; }
          .header img { width: 100%; display: block; margin: 0; padding: 0; }
          .content-area { padding: 40px; }
          .content { word-wrap: break-word; overflow-wrap: break-word; white-space: normal; }
          .content p { margin: 8px 0; line-height: 1.5; }
          .top-row { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
          .date { text-align: right; max-width: 40%; }
          .footer { width: 100%; position: absolute; bottom: 0; left: 0; }
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
            ${headerData ? `<img class="header-img" src="${headerData}" alt="Header" style="width:${hW}; height:${hH};" />` : ''}
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
                ${signatureData ? `<div class="sig-img"><img src="${signatureData}" alt="Signature" style="width:${sW}; height:${sH};" /></div>` : ''}
                <p>${safe(signerName)}</p>
                <p>${safe(signerRole)}</p>
              </div>
            </div>
          </div>
          <div class="footer">
            ${footerData ? `<img class="footer-img" src="${footerData}" alt="Footer" style="width:${fW}; height:${fH};" />` : ''}
          </div>
        </div>
      </body>
    </html>
    `;
  };

  const handleGeneratePdf = async () => {
    if (!title.trim() || !documentTypeId || !username.trim() || !position.trim() || !companyName.trim() || !startDate || !headerData || !signatureData || !signerName.trim() || !signerRole.trim()) {
      showToast('Please fill all required fields and upload header & signature images (footer optional).', 'error');
      return;
    }
    setGenerating(true);
    try {
      const content = buildHtmlContent();
      await API.post('/documents/generate', {
        title: title.trim(),
        document_type_id: Number(documentTypeId),
        content,
      });
      await fetchDocuments();
      showToast('Document generated successfully', 'success');
      resetForm();
      setActiveView('list');
    } catch (err) {
      showToast('Generate failed: ' + handleApiError(err), 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (activeView === 'create') {
    return (
      <div className="management-card">
        <div className="management-header">
          <div className="titles">
            <h3>Create Letter</h3>
            <p className="subtitle">Write and create official letter</p>
          </div>
          <div className="action-buttons" style={{ gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={() => setActiveView('list')}>
              Cancel
            </button>
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label>Title</label>
            <input
              type="text"
              placeholder="Enter letter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className={styles.formField}>
            <label>Document Type</label>
            <select value={documentTypeId} onChange={(e) => setDocumentTypeId(e.target.value)}>
              <option value="" disabled>Select type</option>
              {documentTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {documentTypeId && (
          <div className={styles.dualLayout}>
            <div className={styles.formColumn}>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label>Username</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
                </div>
                <div className={styles.formField}>
                  <label>Date</label>
                  <input type="date" value={offerDate} onChange={(e) => setOfferDate(e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label>Position</label>
                  <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Enter position" />
                </div>
                <div className={styles.formField}>
                  <label>Company Name</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Enter company name" />
                </div>
                <div className={styles.formField}>
                  <label>Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label>Header Image</label>
                  <input type="file" accept="image/*" onChange={(e) => toDataUrl(e.target.files?.[0], setHeaderImg, setHeaderData)} />
                </div>
                <div className={styles.formField}>
                  <label>Header Width (e.g., 100% or 700px)</label>
                  <input type="text" value={headerWidth} onChange={(e) => setHeaderWidth(e.target.value)} placeholder="Default 100%" />
                </div>
                <div className={styles.formField}>
                  <label>Header Height (px)</label>
                  <input type="text" value={headerHeight} onChange={(e) => setHeaderHeight(e.target.value)} placeholder="Default auto" />
                </div>
                <div className={styles.formField}>
                  <label>Signature Image</label>
                  <input type="file" accept="image/*" onChange={(e) => toDataUrl(e.target.files?.[0], setSignatureImg, setSignatureData)} />
                </div>
                <div className={styles.formField}>
                  <label>Signature Width (px)</label>
                  <input type="text" value={signatureWidth} onChange={(e) => setSignatureWidth(e.target.value)} placeholder="Default 120px" />
                </div>
                <div className={styles.formField}>
                  <label>Signature Height (px)</label>
                  <input type="text" value={signatureHeight} onChange={(e) => setSignatureHeight(e.target.value)} placeholder="Default auto" />
                </div>
                <div className={styles.formField}>
                  <label>Signer Name</label>
                  <input type="text" value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Required" />
                </div>
                <div className={styles.formField}>
                  <label>Signer Role/Designation</label>
                  <input type="text" value={signerRole} onChange={(e) => setSignerRole(e.target.value)} placeholder="Required" />
                </div>
                <div className={styles.formField}>
                  <label>Footer Image</label>
                  <input type="file" accept="image/*" onChange={(e) => toDataUrl(e.target.files?.[0], setFooterImg, setFooterData)} />
                </div>
                <div className={styles.formField}>
                  <label>Footer Width (e.g., 100% or 700px)</label>
                  <input type="text" value={footerWidth} onChange={(e) => setFooterWidth(e.target.value)} placeholder="Default 100%" />
                </div>
                <div className={styles.formField}>
                  <label>Footer Height (px)</label>
                  <input type="text" value={footerHeight} onChange={(e) => setFooterHeight(e.target.value)} placeholder="Default auto" />
                </div>
              </div>
              <div className={styles.actionsRow}>
                <button className="btn-primary-action" onClick={handleGeneratePdf} disabled={generating}>
                  {generating ? 'Generating...' : 'Generate PDF'}
                </button>
              </div>
            </div>

            <div className={styles.previewColumn}>
              <div className={styles.a4Preview}>
                {headerImg && (
                  <img
                    src={headerImg}
                    alt="Header"
                    className={styles.previewImage}
                    style={{ width: headerWidth || '100%', height: headerHeight || 'auto' }}
                  />
                )}
                <div className={styles.previewTitle}>OFFER LETTER</div>
                <div className={styles.previewRow}>
                  <span><strong>To:</strong> {username || '____________'}</span>
                  <span><strong>Date:</strong> {offerDate || '____________'}</span>
                </div>
                <div className={styles.previewContent}>
                  <p><strong>Dear {username || '________'},</strong></p>

                  <p>We are pleased to offer you the position of <strong>{position || '________'}</strong> at <strong>{companyName || '________'}</strong>. Based on your skills, experience, and interview performance, we are confident that you will be a valuable addition to our organization.</p>

                  <p>Your employment with us will commence from <strong>{startDate || '________'}</strong>. You will be expected to carry out your responsibilities diligently and contribute effectively to the growth and success of the team and the company.</p>

                  <p>During your tenure, you will be involved in various projects and assignments aligned with your role. You are expected to maintain professionalism, follow company policies, and demonstrate a strong commitment to quality and timely delivery of work.</p>

                  <p>This offer is subject to the terms and conditions of employment, including company policies, code of conduct, and performance expectations. Further details regarding your role, responsibilities, and compensation structure will be shared with you separately.</p>

                  <p>We are excited to have you join our team and look forward to a successful and mutually beneficial association. We wish you a rewarding career with <strong>{companyName || '________'}</strong>.</p>

                  <div className={styles.spacerXL}></div>
                  <div style={{ textAlign: 'right' }}>
                    <p><strong>Sincerely,</strong></p>
                    {signatureImg && (
                      <img
                        src={signatureImg}
                        alt="Signature"
                        className={styles.previewSignatureImage}
                        style={{ width: signatureWidth || '120px', height: signatureHeight || 'auto' }}
                      />
                    )}
                    <p>{signerName || '________'}</p>
                    <p>{signerRole || '________'}</p>
                  </div>
                </div>
                {footerImg && (
                  <img
                    src={footerImg}
                    alt="Footer"
                    className={styles.previewImage}
                    style={{ width: footerWidth || '100%', height: footerHeight || 'auto' }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="management-card">
      <div className="management-header">
        <div className="titles">
          <h3>Create Letters</h3>
          <p className="subtitle">Create and manage official letters for employees</p>
        </div>
        <div className="action-buttons">
          <button className={`btn-primary-action ${styles.noWrapBtn}`} onClick={() => setActiveView('create')}>
            + Create Letter
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className={styles.placeholderArea}>{loadingList ? 'Loading documents...' : 'No saved documents yet. Use "Create Letter" to add one.'}</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.title}</td>
                  <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td className={styles.actionsCell}>
                    <button className={styles.iconBtn} onClick={() => setPreviewDoc(doc)} title="View">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button className={styles.iconBtn} title="Edit" disabled>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.deleteIcon}`}
                      title="Delete"
                      onClick={async () => {
                        try {
                          await API.delete(`/documents/${doc.id}`);
                          await fetchDocuments();
                          showToast('Document deleted', 'success');
                        } catch (err) {
                          showToast('Delete failed: ' + handleApiError(err), 'error');
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewDoc && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>{previewDoc.title}</h3>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.iconBtn} onClick={() => setPreviewDoc(null)} aria-label="Close">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <div className={styles.modalBody} dangerouslySetInnerHTML={{ __html: previewDoc.content }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateLetterTab;
