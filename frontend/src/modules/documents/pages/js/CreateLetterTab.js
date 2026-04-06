import React, { useEffect, useMemo, useState } from 'react';
import API from '../../../../core/api/apiClient';
import { useToast } from '../../../../contexts/ToastContext';
import { handleApiError } from '../../../../utils/errorHandler';
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
  const [personTitle, setPersonTitle] = useState('Mr');
  const [signatoryName, setSignatoryName] = useState('');
  const [designation, setDesignation] = useState('');
  const [sealImg, setSealImg] = useState(null);
  const [sealData, setSealData] = useState('');
  const [sealWidth, setSealWidth] = useState('');
  const [sealHeight, setSealHeight] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stampImg, setStampImg] = useState(null);
  const [stampData, setStampData] = useState('');
  const [stampWidth, setStampWidth] = useState('');
  const [stampHeight, setStampHeight] = useState('');

  const selectedDocType = useMemo(
    () => documentTypes.find((t) => String(t.id) === String(documentTypeId)),
    [documentTypes, documentTypeId]
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
    setPersonTitle('Mr');
    setSignatoryName('');
    setDesignation('');
    setSealImg(null);
    setSealData('');
    setSealWidth('');
    setSealHeight('');
    setEnrollmentNumber('');
    setDepartment('');
    setEndDate('');
    setStampImg(null);
    setStampData('');
    setStampWidth('');
    setStampHeight('');
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
  const handleStampUpload = (files) => toDataUrl(files?.[0], setStampImg, setStampData);
  const handleSealUpload = (files) => toDataUrl(files?.[0], setSealImg, setSealData);

  const handleGeneratePdf = async () => {
    const docName = selectedDocType?.name?.toLowerCase() || '';
    const isInternship = docName.includes('intern');
    const isExperience = docName.includes('experience');

    if (isInternship) {
      if (!title.trim() || !documentTypeId || !personTitle || !username.trim() || !enrollmentNumber.trim() || !companyName.trim() || !department.trim() || !startDate || !endDate || !offerDate || !headerData || !stampData) {
        showToast('Please fill all required fields and upload header & stamp images (footer optional).', 'error');
        return;
      }
    } else if (isExperience) {
      if (
        !title.trim() ||
        !documentTypeId ||
        !personTitle ||
        !username.trim() ||
        !companyName.trim() ||
        !position.trim() ||
        !startDate ||
        !endDate ||
        !offerDate ||
        !headerData ||
        !signatureData ||
        !sealData ||
        !signatoryName.trim() ||
        !designation.trim()
      ) {
        showToast('Please fill all required fields and upload header, signature, and seal images (footer optional).', 'error');
        return;
      }
    } else {
      if (!title.trim() || !documentTypeId || !username.trim() || !position.trim() || !companyName.trim() || !startDate || !headerData || !signatureData || !signerName.trim() || !signerRole.trim()) {
        showToast('Please fill all required fields and upload header & signature images (footer optional).', 'error');
        return;
      }
    }
    setGenerating(true);
    try {
      const content = generateTemplateContent({
        title,
        documentTypeId,
        username,
        position,
        companyName,
        startDate,
        offerDate,
        enrollmentNumber,
        department,
        endDate,
        headerData,
        footerData,
        signatureData,
        stampData,
        signerName,
        signerRole,
        signatoryName,
        designation,
        headerWidth,
        headerHeight,
        footerWidth,
        footerHeight,
        signatureWidth,
        signatureHeight,
        stampWidth,
        stampHeight,
        sealWidth,
        sealHeight,
        sealData,
        personTitle,
        documentTypeName: selectedDocType?.name,
      });
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
          (() => {
            const docName = selectedDocType?.name?.toLowerCase() || '';
            const isIntern = docName.includes('intern');
            const isExperience = docName.includes('experience');
            return (
              <div className={styles.dualLayout}>
                {isIntern ? (
              <>
                <InternshipForm1
                  username={username}
                  onUsernameChange={setUsername}
                  enrollmentNumber={enrollmentNumber}
                  onEnrollmentChange={setEnrollmentNumber}
                  offerDate={offerDate}
                  onOfferDateChange={setOfferDate}
                  companyName={companyName}
                  onCompanyNameChange={setCompanyName}
                  department={department}
                  onDepartmentChange={setDepartment}
                  startDate={startDate}
                  onStartDateChange={setStartDate}
                  endDate={endDate}
                  onEndDateChange={setEndDate}
                  personTitle={personTitle}
                  onPersonTitleChange={setPersonTitle}
                  headerWidth={headerWidth}
                  onHeaderWidthChange={setHeaderWidth}
                  headerHeight={headerHeight}
                  onHeaderHeightChange={setHeaderHeight}
                  footerWidth={footerWidth}
                  onFooterWidthChange={setFooterWidth}
                  footerHeight={footerHeight}
                  onFooterHeightChange={setFooterHeight}
                  stampWidth={stampWidth}
                  onStampWidthChange={setStampWidth}
                  stampHeight={stampHeight}
                  onStampHeightChange={setStampHeight}
                  onHeaderImageChange={handleHeaderUpload}
                  onStampImageChange={handleStampUpload}
                  onFooterImageChange={handleFooterUpload}
                  generating={generating}
                  onGenerate={handleGeneratePdf}
                />
                <InternshipPreview1
                  username={username}
                  enrollmentNumber={enrollmentNumber}
                  offerDate={offerDate}
                  companyName={companyName}
                  department={department}
                  startDate={startDate}
                  endDate={endDate}
                  headerImg={headerImg}
                  footerImg={footerImg}
                  stampImg={stampImg}
                  stampWidth={stampWidth}
                  stampHeight={stampHeight}
                  headerWidth={headerWidth}
                  headerHeight={headerHeight}
                  footerWidth={footerWidth}
                  footerHeight={footerHeight}
                  personTitle={personTitle}
                />
              </>
                ) : isExperience ? (
              <>
                <ExperienceForm1
                  username={username}
                  onUsernameChange={setUsername}
                  companyName={companyName}
                  onCompanyNameChange={setCompanyName}
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
                  signatoryName={signatoryName}
                  onSignatoryNameChange={setSignatoryName}
                  designation={designation}
                  onDesignationChange={setDesignation}
                  headerWidth={headerWidth}
                  onHeaderWidthChange={setHeaderWidth}
                  headerHeight={headerHeight}
                  onHeaderHeightChange={setHeaderHeight}
                  footerWidth={footerWidth}
                  onFooterWidthChange={setFooterWidth}
                  footerHeight={footerHeight}
                  onFooterHeightChange={setFooterHeight}
                  signatureWidth={signatureWidth}
                  onSignatureWidthChange={setSignatureWidth}
                  signatureHeight={signatureHeight}
                  onSignatureHeightChange={setSignatureHeight}
                  sealWidth={sealWidth}
                  onSealWidthChange={setSealWidth}
                  sealHeight={sealHeight}
                  onSealHeightChange={setSealHeight}
                  onHeaderImageChange={handleHeaderUpload}
                  onSignatureImageChange={handleSignatureUpload}
                  onSealImageChange={handleSealUpload}
                  onFooterImageChange={handleFooterUpload}
                  generating={generating}
                  onGenerate={handleGeneratePdf}
                />
                <ExperiencePreview1
                  username={username}
                  companyName={companyName}
                  position={position}
                  startDate={startDate}
                  endDate={endDate}
                  offerDate={offerDate}
                  personTitle={personTitle}
                  headerImg={headerImg}
                  footerImg={footerImg}
                  signatureImg={signatureImg}
                  sealImg={sealImg}
                  signatoryName={signatoryName}
                  designation={designation}
                  headerWidth={headerWidth}
                  headerHeight={headerHeight}
                  footerWidth={footerWidth}
                  footerHeight={footerHeight}
                  signatureWidth={signatureWidth}
                  signatureHeight={signatureHeight}
                  sealWidth={sealWidth}
                  sealHeight={sealHeight}
                />
              </>
                ) : (
              <>
                <OfferLetterForm1
                  username={username}
                  onUsernameChange={setUsername}
                  offerDate={offerDate}
                  onOfferDateChange={setOfferDate}
                  position={position}
                  onPositionChange={setPosition}
                  companyName={companyName}
                  onCompanyNameChange={setCompanyName}
                  startDate={startDate}
                  onStartDateChange={setStartDate}
                  headerWidth={headerWidth}
                  onHeaderWidthChange={setHeaderWidth}
                  headerHeight={headerHeight}
                  onHeaderHeightChange={setHeaderHeight}
                  footerWidth={footerWidth}
                  onFooterWidthChange={setFooterWidth}
                  footerHeight={footerHeight}
                  onFooterHeightChange={setFooterHeight}
                  signatureWidth={signatureWidth}
                  onSignatureWidthChange={setSignatureWidth}
                  signatureHeight={signatureHeight}
                  onSignatureHeightChange={setSignatureHeight}
                  signerName={signerName}
                  onSignerNameChange={setSignerName}
                  signerRole={signerRole}
                  onSignerRoleChange={setSignerRole}
                  onHeaderImageChange={handleHeaderUpload}
                  onSignatureImageChange={handleSignatureUpload}
                  onFooterImageChange={handleFooterUpload}
                  generating={generating}
                  onGenerate={handleGeneratePdf}
                />
                <OfferLetterPreview1
                  username={username}
                  offerDate={offerDate}
                  position={position}
                  companyName={companyName}
                  startDate={startDate}
                  headerImg={headerImg}
                  footerImg={footerImg}
                  signatureImg={signatureImg}
                  signatureWidth={signatureWidth}
                  signatureHeight={signatureHeight}
                  signerName={signerName}
                  signerRole={signerRole}
                  headerWidth={headerWidth}
                  headerHeight={headerHeight}
                  footerWidth={footerWidth}
                  footerHeight={footerHeight}
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
