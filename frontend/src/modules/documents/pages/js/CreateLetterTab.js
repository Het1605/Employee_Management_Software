import React, { useEffect, useMemo, useState } from 'react';
import API from '../../../../core/api/apiClient';
import { useToast } from '../../../../contexts/ToastContext';
import { handleApiError } from '../../../../utils/errorHandler';
import { useCompanyContext } from '../../../../contexts/CompanyContext';
import { generateTemplateContent } from '../../templates';
import { OfferLetterForm1 } from '../../templates/offerLetter/OfferLetterForm/OfferLetterForm1';
import { OfferLetterPreview1 } from '../../templates/offerLetter/OfferLetterPreview/OfferLetterPreview1';
import { InternshipForm1 } from '../../templates/internshipLetter/InternshipForm/InternshipForm1';
import { InternshipPreview1 } from '../../templates/internshipLetter/InternshipPreview/InternshipPreview1';
import { ExperienceForm1 } from '../../templates/experienceLetter/ExperienceForm/ExperienceForm1';
import { ExperiencePreview1 } from '../../templates/experienceLetter/ExperiencePreview/ExperiencePreview1';
import styles from '../styles/DocumentsPage.module.css';

const CreateLetterTab = ({ activeView, setActiveView }) => {
  const { showToast } = useToast();
  const { selectedCompanyId, companies } = useCompanyContext();
  const [title, setTitle] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [documentTypes, setDocumentTypes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [username, setUsername] = useState('');
  const [offerDate, setOfferDate] = useState(new Date().toISOString().slice(0, 10));
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
  const [personTitle, setPersonTitle] = useState('Mr');
  const [offerUserId, setOfferUserId] = useState('');
  const [offerUsers, setOfferUsers] = useState([]);
  const [internUserId, setInternUserId] = useState('');
  const [internUsers, setInternUsers] = useState([]);
  const [experienceUserId, setExperienceUserId] = useState('');
  const [experienceUsers, setExperienceUsers] = useState([]);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [sealImg, setSealImg] = useState(null);
  const [sealData, setSealData] = useState('');
  const [sealWidth, setSealWidth] = useState('');
  const [sealHeight, setSealHeight] = useState('');
  const [department, setDepartment] = useState('');
  const [endDate, setEndDate] = useState('');

  const selectedDocType = useMemo(
    () => documentTypes.find((t) => String(t.id) === String(documentTypeId)),
    [documentTypes, documentTypeId]
  );

  const selectedCompany = useMemo(
    () => companies.find((c) => String(c.id) === String(selectedCompanyId)),
    [companies, selectedCompanyId]
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
      if (!selectedCompanyId) {
        setDocuments([]);
        return;
      }
      setLoadingList(true);
      const res = await API.get(`/documents?company_id=${selectedCompanyId}`);
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
  }, [activeView, selectedCompanyId]);

  const resetForm = () => {
    setTitle('');
    setDocumentTypeId('');
    setEditingDocId(null);
    setUsername('');
    setOfferDate(new Date().toISOString().slice(0, 10));
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
    setPersonTitle('Mr');
    setOfferUserId('');
    setOfferUsers([]);
    setInternUserId('');
    setInternUsers([]);
    setExperienceUserId('');
    setExperienceUsers([]);
    setIncludeFooter(true);
    setSealImg(null);
    setSealData('');
    setSealWidth('');
    setSealHeight('');
    setDepartment('');
    setEndDate('');
  };

  const toDataUrl = (file, setPreview, setData) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPreview(preview);
    const reader = new FileReader();
    reader.onload = () => setData(reader.result || '');
    reader.readAsDataURL(file);
  };

  const handleHeaderUpload = (files) => toDataUrl(files?.[0], setHeaderImg, setHeaderData);
  const handleSignatureUpload = (files) => toDataUrl(files?.[0], setSignatureImg, setSignatureData);
  const handleFooterUpload = (files) => toDataUrl(files?.[0], setFooterImg, setFooterData);
  const handleSealUpload = (files) => toDataUrl(files?.[0], setSealImg, setSealData);

  useEffect(() => {
    const isOffer = selectedDocType?.name?.toLowerCase().includes('offer');
    if (activeView !== 'create' || !isOffer) return;
    if (!selectedCompanyId) {
      setOfferUsers([]);
      return;
    }
    API.get(`/companies/${selectedCompanyId}/users`)
      .then((res) => setOfferUsers(res.data || []))
      .catch(() => setOfferUsers([]));
  }, [selectedCompanyId, activeView, selectedDocType]);

  useEffect(() => {
    if (!offerUserId) {
      setUsername('');
      setPosition('');
      setStartDate('');
      return;
    }
    const found = offerUsers.find((u) => String(u.id) === String(offerUserId));
    if (!found) return;
    const fullName = found.full_name || `${found.first_name || ''} ${found.last_name || ''}`.trim();
    setUsername(fullName);
    if (!position && found.position) setPosition(found.position);
    if (!startDate && found.start_date) setStartDate(found.start_date);
  }, [offerUserId, offerUsers]);

  useEffect(() => {
    const isIntern = selectedDocType?.name?.toLowerCase().includes('intern');
    if (activeView !== 'create' || !isIntern) return;
    if (!selectedCompanyId) {
      setInternUsers([]);
      return;
    }
    API.get(`/companies/${selectedCompanyId}/users`)
      .then((res) => setInternUsers(res.data || []))
      .catch(() => setInternUsers([]));
  }, [selectedCompanyId, activeView, selectedDocType]);

  useEffect(() => {
    if (!internUserId) {
      setUsername('');
      setDepartment('');
      setStartDate('');
      setEndDate('');
      return;
    }
    const found = internUsers.find((u) => String(u.id) === String(internUserId));
    if (!found) return;
    const fullName = found.full_name || `${found.first_name || ''} ${found.last_name || ''}`.trim();
    setUsername(fullName);
    setDepartment(found.position || '');
    setStartDate(found.start_date || '');
    setEndDate(found.end_date || '');
  }, [internUserId, internUsers]);

  useEffect(() => {
    const isExperience = selectedDocType?.name?.toLowerCase().includes('experience');
    if (activeView !== 'create' || !isExperience) return;
    if (!selectedCompanyId) {
      setExperienceUsers([]);
      return;
    }
    API.get(`/companies/${selectedCompanyId}/users`)
      .then((res) => setExperienceUsers(res.data || []))
      .catch(() => setExperienceUsers([]));
  }, [selectedCompanyId, activeView, selectedDocType]);

  useEffect(() => {
    if (!experienceUserId) {
      setUsername('');
      setPosition('');
      setStartDate('');
      setEndDate('');
      return;
    }
    const found = experienceUsers.find((u) => String(u.id) === String(experienceUserId));
    if (!found) return;
    const fullName = found.full_name || `${found.first_name || ''} ${found.last_name || ''}`.trim();
    setUsername(fullName);
    setPosition(found.position || '');
    setStartDate(found.start_date || '');
    setEndDate(found.end_date || '');
  }, [experienceUserId, experienceUsers]);

  const hydrateFromDocument = (doc) => {
    if (!doc) return;
    const normalizeDateInput = (val) => {
      if (!val) return '';
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    };
    const docName = (doc.document_type_name || doc.document_type?.name || '').toLowerCase();
    setEditingDocId(doc.id);
    setActiveView('create');
    setTitle(doc.title || '');
    const docTypeIdStr = doc.document_type_id ? String(doc.document_type_id) : '';
    setDocumentTypeId(docTypeIdStr);

    if (doc.form_data) {
      const { template_type, data = {}, images = {}, styles = {} } = doc.form_data;
      setPersonTitle(data.title || (template_type === 'offer_letter' ? 'Mr' : personTitle));
      if (template_type === 'offer_letter') {
        setOfferUserId(data.user_id ? String(data.user_id) : '');
        setIncludeFooter(data.include_footer !== false);
      } else if (template_type === 'internship_letter') {
        setInternUserId(data.user_id ? String(data.user_id) : '');
        setIncludeFooter(data.include_footer !== false);
      } else if (template_type === 'experience_letter') {
        setExperienceUserId(data.user_id ? String(data.user_id) : '');
        setIncludeFooter(data.include_footer !== false);
      } else {
        setUsername(data.username || '');
      }
      setCompanyName(data.company_name || '');
      setPosition(data.position || '');
      setDepartment(data.department || '');
      setSignerName(data.signer_name || '');
      setSignerRole(data.signer_role || '');
      setOfferDate(normalizeDateInput(data.date || data.offer_date));
      setStartDate(normalizeDateInput(data.start_date));
      setEndDate(normalizeDateInput(data.end_date));

      const headerSrc = images.header || '';
      const footerSrc = images.footer || '';
      const signatureSrc = images.signature || '';
      const sealSrc = images.seal || '';
      setHeaderData(headerSrc); setHeaderImg(headerSrc);
      setFooterData(footerSrc); setFooterImg(footerSrc);
      setSignatureData(signatureSrc); setSignatureImg(signatureSrc);
      setSealData(sealSrc); setSealImg(sealSrc);

      setHeaderWidth(styles.headerWidth || '');
      setHeaderHeight(styles.headerHeight || '');
      setFooterWidth(styles.footerWidth || '');
      setFooterHeight(styles.footerHeight || '');
      setSignatureWidth(styles.signatureWidth || '');
      setSignatureHeight(styles.signatureHeight || '');
      // legacy internships stored stamp size under signature styles
      setSealWidth(styles.sealWidth || '');
      setSealHeight(styles.sealHeight || '');
      return;
    }

    // Fallback: basic parsing if form_data missing
    const parser = new DOMParser();
    const dom = parser.parseFromString(doc.content || '', 'text/html');
    const getImg = (alt) => dom.querySelector(`img[alt="${alt}"]`)?.getAttribute('src') || '';
    const headerSrc = doc.header_data || getImg('Header');
    const footerSrc = doc.footer_data || getImg('Footer');
    const signatureSrc = doc.signature_data || getImg('Signature');
    const sealSrc = doc.seal_data || getImg('Seal');
    setHeaderData(headerSrc); setHeaderImg(headerSrc);
    setFooterData(footerSrc); setFooterImg(footerSrc);
    setSignatureData(signatureSrc); setSignatureImg(signatureSrc);
    setSealData(sealSrc); setSealImg(sealSrc);
  };

  const handleGeneratePdf = async () => {
    if (!selectedCompanyId) {
      showToast('Select a company from the header first.', 'error');
      return;
    }
    const docName = selectedDocType?.name?.toLowerCase() || '';
    const isInternship = docName.includes('intern');
    const isExperience = docName.includes('experience');

    if (isInternship) {
      if (!title.trim() || !documentTypeId || !internUserId || !personTitle || !department.trim() || !startDate || !endDate || !offerDate) {
        showToast('Please select a user and fill all required fields.', 'error');
        return;
      }
    } else if (isExperience) {
      if (
        !title.trim() ||
        !documentTypeId ||
        !personTitle ||
        !experienceUserId ||
        !position.trim() ||
        !startDate ||
        !endDate ||
        !offerDate
      ) {
        showToast('Please select a user and fill all required fields.', 'error');
        return;
      }
    } else {
      if (!selectedCompany) {
        showToast('Select a company from the header first.', 'error');
        return;
      }
      if (!title.trim() || !documentTypeId || !offerUserId || !position.trim() || !startDate || !offerDate || !signerName.trim() || !signerRole.trim()) {
        showToast('Please select a user and fill all required fields.', 'error');
        return;
      }
    }
    setGenerating(true);
    try {
      const templateType = isExperience ? 'experience_letter' : isInternship ? 'internship_letter' : 'offer_letter';
      const formDataPayload = {
        template_type: templateType,
        template_id: 'template1',
        data: {},
        images: {},
        styles: {},
      };

      if (templateType === 'offer_letter') {
        formDataPayload.data = {
          user_id: Number(offerUserId),
          offer_date: offerDate,
          position,
          start_date: startDate,
          signer_name: signerName,
          signer_role: signerRole,
          include_footer: includeFooter,
        };
        formDataPayload.images = {};
        formDataPayload.styles = {};
      } else if (templateType === 'internship_letter') {
        formDataPayload.data = {
          user_id: Number(internUserId),
          department,
          start_date: startDate,
          end_date: endDate,
          date: offerDate,
          include_footer: includeFooter,
        };
        formDataPayload.images = {};
        formDataPayload.styles = {};
      } else if (templateType === 'experience_letter') {
        formDataPayload.data = {
          user_id: Number(experienceUserId),
          position,
          start_date: startDate,
          end_date: endDate,
          date: offerDate,
          include_footer: includeFooter,
        };
        formDataPayload.images = {};
        formDataPayload.styles = {};
      }

      const content = generateTemplateContent({
        title,
        documentTypeId,
        username,
        position,
        companyName: docName.includes('offer') || docName.includes('intern') || docName.includes('experience') ? (selectedCompany?.name || '') : companyName,
        startDate,
        offerDate,
        department,
        endDate,
        headerData: docName.includes('offer') || docName.includes('intern') || docName.includes('experience') ? (selectedCompany?.header_image || '') : headerData,
        footerData: docName.includes('offer') || docName.includes('intern') || docName.includes('experience') ? (selectedCompany?.footer_image || '') : footerData,
        signatureData: docName.includes('offer') || docName.includes('experience') ? (selectedCompany?.signature_image || '') : signatureData,
        stampData: docName.includes('intern') ? (selectedCompany?.company_stamp || '') : '',
        signerName,
        signerRole,
        headerWidth,
        headerHeight,
        footerWidth,
        footerHeight,
        signatureWidth,
        signatureHeight,
        sealWidth,
        sealHeight,
        sealData: docName.includes('experience') ? (selectedCompany?.company_stamp || '') : sealData,
        includeFooter,
        personTitle,
        documentTypeName: selectedDocType?.name,
      });
      if (editingDocId) {
        await API.put(`/documents/${editingDocId}?company_id=${selectedCompanyId}`, {
          title: title.trim(),
          document_type_id: Number(documentTypeId),
          content,
          form_data: formDataPayload,
        });
      } else {
        await API.post('/documents', {
          company_id: Number(selectedCompanyId),
          title: title.trim(),
          document_type_id: Number(documentTypeId),
          content,
          form_data: formDataPayload,
        });
      }
      await fetchDocuments();
      showToast(editingDocId ? 'Document updated successfully' : 'Document generated successfully', 'success');
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
          <h3>Create Letter {editingDocId ? '(Editing Mode)' : ''}</h3>
          <p className="subtitle">{editingDocId ? 'Update existing document' : 'Write and create official letter'}</p>
        </div>
          <div className="action-buttons" style={{ gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={() => { resetForm(); setActiveView('list'); }}>
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
          (() => {
            const docName = selectedDocType?.name?.toLowerCase() || '';
            const isIntern = docName.includes('intern');
            const isExperience = docName.includes('experience');
            return (
              <div className={styles.dualLayout}>
                {isIntern ? (
              <>
                <InternshipForm1
                  users={internUsers}
                  selectedUserId={internUserId}
                  onUserChange={setInternUserId}
                  offerDate={offerDate}
                  onOfferDateChange={setOfferDate}
                  department={department}
                  onDepartmentChange={setDepartment}
                  startDate={startDate}
                  onStartDateChange={setStartDate}
                  endDate={endDate}
                  onEndDateChange={setEndDate}
                  personTitle={personTitle}
                  onPersonTitleChange={setPersonTitle}
                  includeFooter={includeFooter}
                  onIncludeFooterChange={setIncludeFooter}
                  generating={generating}
                  onGenerate={handleGeneratePdf}
                  submitLabel={editingDocId ? 'Update Document' : 'Generate PDF'}
                />
                <InternshipPreview1
                  username={username}
                  offerDate={offerDate}
                  companyName={selectedCompany?.name || ''}
                  department={department}
                  startDate={startDate}
                  endDate={endDate}
                  headerImg={selectedCompany?.header_image || ''}
                  footerImg={selectedCompany?.footer_image || ''}
                  stampImg={selectedCompany?.company_stamp || ''}
                  includeFooter={includeFooter}
                  personTitle={personTitle}
                />
              </>
                ) : isExperience ? (
              <>
                <ExperienceForm1
                  users={experienceUsers}
                  selectedUserId={experienceUserId}
                  onUserChange={setExperienceUserId}
                  position={position}
                  onPositionChange={setPosition}
                  startDate={startDate}
                  onStartDateChange={setStartDate}
                  endDate={endDate}
                  onEndDateChange={setEndDate}
                  offerDate={offerDate}
                  onOfferDateChange={setOfferDate}
                  personTitle={personTitle}
                  onPersonTitleChange={setPersonTitle}
                  includeFooter={includeFooter}
                  onIncludeFooterChange={setIncludeFooter}
                  generating={generating}
                  onGenerate={handleGeneratePdf}
                  submitLabel={editingDocId ? 'Update Document' : 'Generate PDF'}
                />
                <ExperiencePreview1
                  username={username}
                  companyName={selectedCompany?.name || ''}
                  position={position}
                  startDate={startDate}
                  endDate={endDate}
                  offerDate={offerDate}
                  personTitle={personTitle}
                  headerImg={selectedCompany?.header_image || ''}
                  footerImg={selectedCompany?.footer_image || ''}
                  signatureImg={selectedCompany?.signature_image || ''}
                  sealImg={selectedCompany?.company_stamp || ''}
                  includeFooter={includeFooter}
                />
              </>
                ) : (
              <>
                <OfferLetterForm1
                  users={offerUsers}
                  selectedUserId={offerUserId}
                  onUserChange={setOfferUserId}
                  offerDate={offerDate}
                  onOfferDateChange={setOfferDate}
                  position={position}
                  onPositionChange={setPosition}
                  startDate={startDate}
                  onStartDateChange={setStartDate}
                  signerName={signerName}
                  onSignerNameChange={setSignerName}
                  signerRole={signerRole}
                  onSignerRoleChange={setSignerRole}
                  includeFooter={includeFooter}
                  onIncludeFooterChange={setIncludeFooter}
                  generating={generating}
                  onGenerate={handleGeneratePdf}
                  submitLabel={editingDocId ? 'Update Document' : 'Generate PDF'}
                />
                <OfferLetterPreview1
                  username={username}
                  offerDate={offerDate}
                  position={position}
                  companyName={selectedCompany?.name || ''}
                  startDate={startDate}
                  headerImg={selectedCompany?.header_image || ''}
                  footerImg={selectedCompany?.footer_image || ''}
                  signatureImg={selectedCompany?.signature_image || ''}
                  signerName={signerName}
                  signerRole={signerRole}
                  includeFooter={includeFooter}
                />
              </>
                )}
              </div>
            );
          })()
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
          <button
            className={`btn-primary-action ${styles.noWrapBtn}`}
            onClick={() => {
              resetForm();
              setActiveView('create');
            }}
          >
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
                    <button className={styles.iconBtn} title="Edit" onClick={() => hydrateFromDocument(doc)}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.deleteIcon}`}
                      title="Delete"
                      onClick={async () => {
                        try {
                          await API.delete(`/documents/${doc.id}?company_id=${selectedCompanyId}`);
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
