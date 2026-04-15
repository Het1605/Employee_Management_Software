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
import { SalarySlipForm1 } from '../../templates/salarySlip/SalarySlipForm/SalarySlipForm1';
import { SalarySlipPreview1 } from '../../templates/salarySlip/SalarySlipPreview/SalarySlipPreview1';
import { SalarySlipForm2 } from '../../templates/salarySlip/SalarySlipForm/SalarySlipForm2';
import { SalarySlipPreview2 } from '../../templates/salarySlip/SalarySlipPreview/SalarySlipPreview2';
import DocumentInputField from '../../templates/shared/DocumentInputField';
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
  const [personTitle, setPersonTitle] = useState('Mr');
  const [offerUserId, setOfferUserId] = useState('');
  const [offerUsers, setOfferUsers] = useState([]);
  const [internUserId, setInternUserId] = useState('');
  const [internUsers, setInternUsers] = useState([]);
  const [experienceUserId, setExperienceUserId] = useState('');
  const [experienceUsers, setExperienceUsers] = useState([]);
  
  // Salary Slip State
  const [salarySlipUserId, setSalarySlipUserId] = useState('');
  const [salarySlipUsers, setSalarySlipUsers] = useState([]);
  const [salaryTemplateId, setSalaryTemplateId] = useState('salaryTemplate1');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [salaryDetails, setSalaryDetails] = useState(null);

  const [includeFooter, setIncludeFooter] = useState(true);
  const [department, setDepartment] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const selectedDocType = useMemo(
    () => documentTypes.find((t) => String(t.id) === String(documentTypeId)),
    [documentTypes, documentTypeId]
  );

  const selectedCompany = useMemo(
    () => companies.find((c) => String(c.id) === String(selectedCompanyId)),
    [companies, selectedCompanyId]
  );

  const clearFieldError = React.useCallback((fieldName) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  const setTitleValue = React.useCallback((value) => {
    setTitle(value);
    clearFieldError('title');
  }, [clearFieldError]);

  const setDocumentTypeValue = React.useCallback((value) => {
    setDocumentTypeId(value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.documentTypeId;
      delete next.user_id;
      delete next.offer_date;
      delete next.position;
      delete next.start_date;
      delete next.end_date;
      delete next.department;
      delete next.month;
      delete next.year;
      delete next.template_id;
      delete next.personTitle;
      return next;
    });
  }, []);

  const setOfferUserValue = React.useCallback((value) => {
    setOfferUserId(value);
    clearFieldError('user_id');
  }, [clearFieldError]);

  const setInternUserValue = React.useCallback((value) => {
    setInternUserId(value);
    clearFieldError('user_id');
  }, [clearFieldError]);

  const setExperienceUserValue = React.useCallback((value) => {
    setExperienceUserId(value);
    clearFieldError('user_id');
  }, [clearFieldError]);

  const setSalarySlipUserValue = React.useCallback((value) => {
    setSalarySlipUserId(value);
    clearFieldError('user_id');
  }, [clearFieldError]);

  const setOfferDateValue = React.useCallback((value) => {
    setOfferDate(value);
    clearFieldError('offer_date');
  }, [clearFieldError]);

  const setPositionValue = React.useCallback((value) => {
    setPosition(value);
    clearFieldError('position');
  }, [clearFieldError]);

  const setStartDateValue = React.useCallback((value) => {
    setStartDate(value);
    clearFieldError('start_date');
  }, [clearFieldError]);

  const setEndDateValue = React.useCallback((value) => {
    setEndDate(value);
    clearFieldError('end_date');
  }, [clearFieldError]);

  const setDepartmentValue = React.useCallback((value) => {
    setDepartment(value);
    clearFieldError('department');
  }, [clearFieldError]);

  const setMonthValue = React.useCallback((value) => {
    setMonth(value);
    clearFieldError('month');
  }, [clearFieldError]);

  const setYearValue = React.useCallback((value) => {
    setYear(value);
    clearFieldError('year');
  }, [clearFieldError]);

  const setSalaryTemplateValue = React.useCallback((value) => {
    setSalaryTemplateId(value);
    clearFieldError('template_id');
  }, [clearFieldError]);

  const validateDocumentFields = React.useCallback(() => {
    const errors = {};
    const docName = selectedDocType?.name?.toLowerCase() || '';
    const isIntern = docName.includes('intern');
    const isExperience = docName.includes('experience');
    const isSalarySlip = docName.includes('salary slip');

    if (!selectedCompanyId) {
      errors.companyId = 'Select a company from the header first.';
    }
    if (!title.trim()) {
      errors.title = 'This field is required';
    }
    if (!documentTypeId) {
      errors.documentTypeId = 'This field is required';
    }

    if (isSalarySlip) {
      if (!salaryTemplateId) errors.template_id = 'This field is required';
      if (!salarySlipUserId) errors.user_id = 'This field is required';
      if (!month && salaryTemplateId === 'salaryTemplate1') errors.month = 'This field is required';
      if (!year) errors.year = 'This field is required';
    } else if (isIntern) {
      if (!personTitle) errors.personTitle = 'This field is required';
      if (!internUserId) errors.user_id = 'This field is required';
      if (!department.trim()) errors.department = 'This field is required';
      if (!startDate) errors.start_date = 'This field is required';
      if (!endDate) errors.end_date = 'This field is required';
      if (!offerDate) errors.offer_date = 'This field is required';
    } else if (isExperience) {
      if (!personTitle) errors.personTitle = 'This field is required';
      if (!experienceUserId) errors.user_id = 'This field is required';
      if (!position.trim()) errors.position = 'This field is required';
      if (!startDate) errors.start_date = 'This field is required';
      if (!endDate) errors.end_date = 'This field is required';
      if (!offerDate) errors.offer_date = 'This field is required';
    } else {
      if (!offerUserId) errors.user_id = 'This field is required';
      if (!position.trim()) errors.position = 'This field is required';
      if (!startDate) errors.start_date = 'This field is required';
      if (!offerDate) errors.offer_date = 'This field is required';
    }

    return errors;
  }, [
    selectedCompanyId,
    selectedDocType,
    title,
    documentTypeId,
    salaryTemplateId,
    salarySlipUserId,
    month,
    year,
    personTitle,
    internUserId,
    department,
    startDate,
    endDate,
    offerDate,
    experienceUserId,
    position,
    offerUserId,
  ]);

  useEffect(() => {
    if (selectedCompanyId && fieldErrors.companyId) {
      clearFieldError('companyId');
    }
  }, [selectedCompanyId, fieldErrors.companyId, clearFieldError]);

  // Live calculation for Salary Slip
  useEffect(() => {
    const isSalarySlip = selectedDocType?.name?.toLowerCase().includes('salary slip');
    if (!isSalarySlip || !salarySlipUserId || !year || !selectedCompanyId) {
       setSalaryDetails(null);
       return;
    }
    if (salaryTemplateId === 'salaryTemplate1' && !month) {
       setSalaryDetails(null);
       return;
    }

    const timeoutId = setTimeout(() => {
      const endpoint = salaryTemplateId === 'salaryTemplate2' 
        ? '/documents/salary/yearly-calculate' 
        : '/documents/salary/calculate';
        
      const params = {
        user_id: salarySlipUserId,
        year: year,
        company_id: selectedCompanyId
      };
      
      if (salaryTemplateId === 'salaryTemplate1') {
        params.month = month;
      }

      API.post(endpoint, null, { params })
      .then(res => setSalaryDetails(res.data))
      .catch(() => setSalaryDetails(null));
    }, 500); // debounce

    return () => clearTimeout(timeoutId);
  }, [salarySlipUserId, month, year, selectedCompanyId, selectedDocType, salaryTemplateId]);

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
  }, [showToast, setDocumentTypes]);

  const fetchDocuments = React.useCallback(async () => {
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
  }, [selectedCompanyId, showToast]);

  useEffect(() => {
    if (activeView === 'list') {
      fetchDocuments();
    }
  }, [activeView, fetchDocuments]);

  const resetForm = React.useCallback(() => {
    setTitle('');
    setDocumentTypeId('');
    setEditingDocId(null);
    setUsername('');
    setOfferDate(new Date().toISOString().slice(0, 10));
    setPosition('');
    setCompanyName('');
    setStartDate('');
    setPersonTitle('Mr');
    setOfferUserId('');
    setOfferUsers([]);
    setInternUserId('');
    setInternUsers([]);
    setExperienceUserId('');
    setExperienceUsers([]);
    setIncludeFooter(true);
    setDepartment('');
    setEndDate('');
    setSalarySlipUserId('');
    setSalaryTemplateId('salaryTemplate1');
    setMonth(new Date().getMonth() + 1);
    setYear(new Date().getFullYear());
    setFieldErrors({});
  }, []);

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
  }, [selectedCompanyId, activeView, selectedDocType, setOfferUsers]);

  useEffect(() => {
    const isOffer = selectedDocType?.name?.toLowerCase().includes('offer');
    if (!isOffer) return;
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
    if (found.position) setPosition(found.position);
    if (found.start_date) setStartDate(found.start_date);
  }, [offerUserId, offerUsers, selectedDocType]);

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
  }, [selectedCompanyId, activeView, selectedDocType, setInternUsers]);

  useEffect(() => {
    const isIntern = selectedDocType?.name?.toLowerCase().includes('intern');
    if (!isIntern) return;
    if (!internUserId) {
      setUsername('');
      setDepartment('');
      setStartDate('');
      return;
    }
    const found = internUsers.find((u) => String(u.id) === String(internUserId));
    if (!found) return;
    const fullName = found.full_name || `${found.first_name || ''} ${found.last_name || ''}`.trim();
    setUsername(fullName);
    setDepartment(found.position || '');
    setStartDate(found.start_date || '');
    setEndDate(found.end_date || '');
  }, [internUserId, internUsers, selectedDocType]);

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
  }, [selectedCompanyId, activeView, selectedDocType, setExperienceUsers]);

  useEffect(() => {
    const isExperience = selectedDocType?.name?.toLowerCase().includes('experience');
    if (!isExperience) return;
    if (!experienceUserId) {
      setUsername('');
      setPosition('');
      setStartDate('');
      return;
    }
    const found = experienceUsers.find((u) => String(u.id) === String(experienceUserId));
    if (!found) return;
    const fullName = found.full_name || `${found.first_name || ''} ${found.last_name || ''}`.trim();
    setUsername(fullName);
    setPosition(found.position || '');
    setStartDate(found.start_date || '');
    setEndDate(found.end_date || '');
  }, [experienceUserId, experienceUsers, selectedDocType]);

  useEffect(() => {
    const isSalarySlip = selectedDocType?.name?.toLowerCase().includes('salary slip');
    if (activeView !== 'create' || !isSalarySlip) return;
    if (!selectedCompanyId) {
      setSalarySlipUsers([]);
      return;
    }
    API.get(`/companies/${selectedCompanyId}/users`)
      .then((res) => setSalarySlipUsers(res.data || []))
      .catch(() => setSalarySlipUsers([]));
  }, [selectedCompanyId, activeView, selectedDocType]);

  useEffect(() => {
    if (!salarySlipUserId) {
      setUsername('');
      return;
    }
    const found = salarySlipUsers.find((u) => String(u.id) === String(salarySlipUserId));
    if (!found) return;
    const fullName = found.full_name || `${found.first_name || ''} ${found.last_name || ''}`.trim();
    setUsername(fullName);
  }, [salarySlipUserId, salarySlipUsers]);

  const hydrateFromDocument = (doc) => {
    if (!doc) return;
    const normalizeDateInput = (val) => {
      if (!val) return '';
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    };
    setEditingDocId(doc.id);
    setActiveView('create');
    setTitle(doc.title || '');
    const docTypeIdStr = doc.document_type_id ? String(doc.document_type_id) : '';
    setDocumentTypeId(docTypeIdStr);

    if (doc.form_data) {
      const { template_type, data = {} } = doc.form_data;
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
      } else if (template_type === 'salary_slip') {
        setSalarySlipUserId(data.user_id ? String(data.user_id) : '');
        setSalaryTemplateId(data.template_id || 'salaryTemplate1');
        setMonth(data.month || new Date().getMonth() + 1);
        setYear(data.year || new Date().getFullYear());
        setIncludeFooter(data.include_footer !== false);
      } else {
        setUsername(data.username || '');
      }
      setCompanyName(data.company_name || '');
      setPosition(data.position || '');
      setDepartment(data.department || '');
      setOfferDate(normalizeDateInput(data.date || data.offer_date));
      setStartDate(normalizeDateInput(data.start_date));
      return;
    }
  };

  const handleGeneratePdf = async () => {
    const errors = validateDocumentFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    const docName = selectedDocType?.name?.toLowerCase() || '';
    const isInternship = docName.includes('intern');
    const isExperience = docName.includes('experience');
    const isSalarySlip = docName.includes('salary slip');
    setGenerating(true);
    try {
      const templateType = isSalarySlip ? 'salary_slip' : isExperience ? 'experience_letter' : isInternship ? 'internship_letter' : 'offer_letter';
      const formDataPayload = {
        template_type: templateType,
        template_id: 'template1',
        data: {},
        images: {},
        styles: {},
      };

      if (templateType === 'salary_slip') {
        formDataPayload.template_id = salaryTemplateId;
        formDataPayload.data = {
          template_id: salaryTemplateId,
          user_id: Number(salarySlipUserId),
          month: Number(month),
          year: Number(year),
          include_footer: includeFooter,
        };
      } else if (templateType === 'offer_letter') {
        formDataPayload.data = {
          user_id: Number(offerUserId),
          offer_date: offerDate,
          position,
          start_date: startDate,
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
        companyName: selectedCompany?.name || '',
        startDate,
        offerDate,
        department,
        endDate,
        headerData: selectedCompany?.header_image || '',
        footerData: selectedCompany?.footer_image || '',
        stampData: selectedCompany?.company_stamp || '',
        sealData: selectedCompany?.company_stamp || '',
        includeFooter,
        personTitle,
        documentTypeName: selectedDocType?.name,
        month,
        year,
        form_data: {
          ...(templateType === 'salary_slip' ? salaryDetails || {} : {}),
          template_id: salaryTemplateId
        }
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
          <DocumentInputField label="Title" required error={fieldErrors.title}>
            <input
              type="text"
              placeholder="Enter letter title"
              value={title}
              onChange={(e) => setTitleValue(e.target.value)}
              aria-invalid={!!fieldErrors.title}
            />
          </DocumentInputField>
          <DocumentInputField label="Document Type" required error={fieldErrors.documentTypeId}>
            <select
              value={documentTypeId}
              onChange={(e) => setDocumentTypeValue(e.target.value)}
              aria-invalid={!!fieldErrors.documentTypeId}
            >
              <option value="" disabled>Select type</option>
              {documentTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </DocumentInputField>
        </div>

        {fieldErrors.companyId && (
          <div className={styles.inlineAlert}>{fieldErrors.companyId}</div>
        )}

        {documentTypeId && (
          (() => {
            const docName = selectedDocType?.name?.toLowerCase() || '';
            const isIntern = docName.includes('intern');
            const isExperience = docName.includes('experience');
            const isSalarySlip = docName.includes('salary slip');
            return (
              <div className={styles.dualLayout}>
                {isIntern ? (
              <>
                <InternshipForm1
                  users={internUsers}
                  selectedUserId={internUserId}
                  onUserChange={setInternUserValue}
                  offerDate={offerDate}
                  onOfferDateChange={setOfferDateValue}
                  department={department}
                  onDepartmentChange={setDepartmentValue}
                  startDate={startDate}
                  onStartDateChange={setStartDateValue}
                  endDate={endDate}
                  onEndDateChange={setEndDateValue}
                  personTitle={personTitle}
                  onPersonTitleChange={(value) => {
                    setPersonTitle(value);
                    clearFieldError('personTitle');
                  }}
                  includeFooter={includeFooter}
                  onIncludeFooterChange={setIncludeFooter}
                  generating={generating}
                  onGenerate={handleGeneratePdf}
                  errors={fieldErrors}
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
                  onUserChange={setExperienceUserValue}
                  position={position}
                  onPositionChange={setPositionValue}
                  startDate={startDate}
                  onStartDateChange={setStartDateValue}
                  endDate={endDate}
                  onEndDateChange={setEndDateValue}
                  offerDate={offerDate}
                  onOfferDateChange={setOfferDateValue}
                  personTitle={personTitle}
                  onPersonTitleChange={(value) => {
                    setPersonTitle(value);
                    clearFieldError('personTitle');
                  }}
                  includeFooter={includeFooter}
                  onIncludeFooterChange={setIncludeFooter}
                  generating={generating}
                  onGenerate={handleGeneratePdf}
                  errors={fieldErrors}
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
                  sealImg={selectedCompany?.company_stamp || ''}
                  includeFooter={includeFooter}
                />
              </>
                ) : isSalarySlip ? (
              <>
                {salaryTemplateId === 'salaryTemplate2' ? (
                  <SalarySlipForm2
                    users={salarySlipUsers}
                    selectedUserId={salarySlipUserId}
                    onUserChange={setSalarySlipUserValue}
                    year={year}
                    onYearChange={setYearValue}
                    includeFooter={includeFooter}
                    onIncludeFooterChange={setIncludeFooter}
                    generating={generating}
                    onGenerate={handleGeneratePdf}
                    submitLabel={editingDocId ? 'Update Document' : 'Generate PDF'}
                    templateId={salaryTemplateId}
                    onTemplateChange={setSalaryTemplateValue}
                    errors={fieldErrors}
                  />
                ) : (
                  <SalarySlipForm1
                    users={salarySlipUsers}
                    selectedUserId={salarySlipUserId}
                    onUserChange={setSalarySlipUserValue}
                    month={month}
                    onMonthChange={setMonthValue}
                    year={year}
                    onYearChange={setYearValue}
                    includeFooter={includeFooter}
                    onIncludeFooterChange={setIncludeFooter}
                    generating={generating}
                    onGenerate={handleGeneratePdf}
                    submitLabel={editingDocId ? 'Update Document' : 'Generate PDF'}
                    templateId={salaryTemplateId}
                    onTemplateChange={setSalaryTemplateValue}
                    errors={fieldErrors}
                  />
                )}
                {salaryTemplateId === 'salaryTemplate2' ? (
                  <SalarySlipPreview2
                    headerData={selectedCompany?.header_image || ''}
                    footerData={selectedCompany?.footer_image || ''}
                    stampData={selectedCompany?.company_stamp || ''}
                    includeFooter={includeFooter}
                    form_data={salaryDetails || {}}
                  />
                ) : (
                  <SalarySlipPreview1
                    username={username}
                    month={month}
                    year={year}
                    headerData={selectedCompany?.header_image || ''}
                    footerData={selectedCompany?.footer_image || ''}
                    stampData={selectedCompany?.company_stamp || ''}
                    includeFooter={includeFooter}
                    form_data={salaryDetails || {}}
                  />
                )}
              </>
                ) : (
              <>
                <OfferLetterForm1
                  users={offerUsers}
                  selectedUserId={offerUserId}
                  onUserChange={setOfferUserValue}
                  offerDate={offerDate}
                  onOfferDateChange={setOfferDateValue}
                  position={position}
                  onPositionChange={setPositionValue}
                  startDate={startDate}
                  onStartDateChange={setStartDateValue}
                  includeFooter={includeFooter}
                  onIncludeFooterChange={setIncludeFooter}
                  generating={generating}
                  onGenerate={handleGeneratePdf}
                  errors={fieldErrors}
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
                  stampImg={selectedCompany?.company_stamp || ''}
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
