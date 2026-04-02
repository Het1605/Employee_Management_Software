import React, { useEffect, useMemo, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import API from '../../../../core/api/apiClient';
import { useToast } from '../../../../contexts/ToastContext';
import { handleApiError } from '../../../../utils/errorHandler';
import styles from '../styles/DocumentsPage.module.css';

const defaultContent = '';

const CreateLetterTab = ({ activeView, setActiveView }) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [content, setContent] = useState(defaultContent);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [generating, setGenerating] = useState(false);

  const canSave = useMemo(() => title.trim().length >= 2 && content.trim().length > 0 && documentTypeId, [title, content, documentTypeId]);

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
    setContent(defaultContent);
  };

  const handleGeneratePdf = async () => {
    if (!canSave) {
      showToast('Please add a title, type, and content before generating.', 'error');
      return;
    }
    setGenerating(true);
    try {
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
            <button className="btn-primary-action" onClick={handleGeneratePdf} disabled={generating}>
              {generating ? 'Generating...' : 'Generate PDF'}
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

        <div className={styles.editorCard}>
          <label className={styles.editorLabel}>Content</label>
          <div className={styles.editorWrapper}>
            <Editor
              apiKey={process.env.REACT_APP_TINYMCE_API_KEY || ''}
              value={content}
              onEditorChange={(val) => setContent(val)}
              init={{
                height: 560,
                menubar: true,
                menu: {
                  file: { title: 'File', items: 'newdocument | preview | print' },
                  edit: { title: 'Edit', items: 'undo redo | cut copy paste | selectall | searchreplace' },
                  view: { title: 'View', items: 'visualaid visualblocks visualchars code fullscreen' },
                  insert: { title: 'Insert', items: 'link image media table hr charmap emoticons insertdatetime pagebreak toc codesample anchor' },
                  format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats | removeformat | forecolor backcolor' },
                  tools: { title: 'Tools', items: 'code wordcount' },
                  table: { title: 'Table', items: 'inserttable | cell row column deletetable' },
                  help: { title: 'Help', items: 'help' },
                },
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'imagetools', 'media',
                  'charmap', 'emoticons', 'preview', 'anchor', 'searchreplace', 'visualblocks',
                  'visualchars', 'code', 'fullscreen', 'insertdatetime', 'table', 'help',
                  'wordcount', 'pagebreak', 'toc', 'hr', 'codesample', 'directionality'
                ],
                toolbar:
                  'undo redo | bold italic underline strikethrough superscript subscript | fontselect fontsizeselect formatselect | forecolor backcolor | alignleft aligncenter alignright alignjustify | outdent indent | bullist numlist checklist | lineheight | link image media codesample | table | pagebreak toc | ltr rtl | removeformat fullscreen code',
                image_toolbar: 'alignleft aligncenter alignright | rotateleft rotateright | scaleX scaleY | editimage imageoptions',
                quickbars_selection_toolbar: 'bold italic underline | h2 h3 blockquote | alignleft aligncenter alignright | bullist numlist',
                quickbars_insert_toolbar: 'link image media table hr pagebreak',
                object_resizing: true,
                image_advtab: true,
                image_caption: true,
                paste_data_images: true,
                file_picker_types: 'image',
                file_picker_callback: (callback) => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const base64 = reader.result;
                      if (typeof base64 === 'string') {
                        callback(base64, { title: file.name });
                      }
                    };
                    reader.onerror = () => {
                      // TinyMCE failure handler is not provided here; rely on images_upload_handler for errors
                    };
                    reader.readAsDataURL(file);
                  };
                  input.click();
                },
                branding: false,
                statusbar: true,
                content_style:
                  'body { font-family: Inter, system-ui, -apple-system, sans-serif; font-size: 16px; color: #0f172a; line-height: 1.6; } img { max-width: 100%; height: auto; display: block; margin: 10px auto; } table { width: 100%; border-collapse: collapse; } table, th, td { border: 1px solid #e2e8f0; } th, td { padding: 8px; }',
              }}
            />
          </div>
        </div>
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
