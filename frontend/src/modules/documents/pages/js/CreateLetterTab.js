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
                height: 460,
                menubar: true,
                menu: {
                  file: { title: 'File', items: 'preview' },
                  edit: { title: 'Edit', items: 'undo redo | cut copy paste | selectall | searchreplace' },
                  view: { title: 'View', items: 'code visualaid visualblocks preview fullscreen' },
                  insert: { title: 'Insert', items: 'link image media table charmap hr insertdatetime' },
                  format: { title: 'Format', items: 'bold italic underline strikethrough forecolor backcolor | formats | removeformat' },
                  tools: { title: 'Tools', items: 'code wordcount' },
                  table: { title: 'Table', items: 'inserttable | cell row column deletetable' },
                  help: { title: 'Help', items: 'help' },
                },
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'imagetools', 'charmap', 'preview', 'anchor',
                  'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'help', 'wordcount'
                ],
                toolbar:
                  'undo redo | formatselect fontselect fontsizeselect | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | table | removeformat code fullscreen',
                image_toolbar: 'alignleft aligncenter alignright | rotateleft rotateright | scaleX scaleY',
                quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote | alignleft aligncenter alignright',
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
                  'body { font-family: Inter, system-ui, -apple-system, sans-serif; font-size: 16px; color: #0f172a; line-height: 1.6; } img { max-width: 100%; height: auto; display: block; margin: 10px auto; }',
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
                <th>Type</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.title}</td>
                  <td>{doc.document_type}</td>
                  <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td className={styles.actionsCell}>
                    {doc.file_url && (
                      <button className="btn-primary-action" onClick={() => window.open(doc.file_url, '_blank')}>
                        Download
                      </button>
                    )}
                    <button className="btn-secondary" onClick={() => setPreviewDoc(doc)}>View</button>
                    <button
                      className="btn-secondary"
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
                      Delete
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
                <p className={styles.modalSubtitle}>{previewDoc.document_type}</p>
              </div>
              <div className={styles.modalActions}>
                {previewDoc.file_url && (
                  <button className="btn-secondary" onClick={() => window.open(previewDoc.file_url, '_blank')}>
                    Download
                  </button>
                )}
                <button className="btn-primary-action" onClick={() => setPreviewDoc(null)}>Close</button>
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
