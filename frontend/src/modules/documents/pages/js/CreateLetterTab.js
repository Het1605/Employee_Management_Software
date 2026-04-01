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
  const [saving, setSaving] = useState(false);

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

  const resetForm = () => {
    setTitle('');
    setDocumentTypeId('');
    setContent(defaultContent);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await API.post('/documents', {
        title: title.trim(),
        content,
        document_type_id: Number(documentTypeId),
        status: 'draft',
      });
      showToast('Letter saved', 'success');
      resetForm();
      setActiveView('list');
      // TODO: refresh list once list view is implemented
    } catch (err) {
      showToast('Save failed: ' + handleApiError(err), 'error');
    } finally {
      setSaving(false);
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
            <button className="btn-secondary" onClick={() => setActiveView('list')} disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary-action" onClick={handleSave} disabled={!canSave || saving}>
              {saving ? 'Saving...' : 'Save'}
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
                  file: { title: 'File', items: 'preview print' },
                  edit: { title: 'Edit', items: 'undo redo | cut copy paste | selectall | searchreplace' },
                  view: { title: 'View', items: 'code visualaid visualblocks preview fullscreen' },
                  insert: { title: 'Insert', items: 'link image media table charmap hr insertdatetime' },
                  format: { title: 'Format', items: 'bold italic underline strikethrough forecolor backcolor | formats | removeformat' },
                  tools: { title: 'Tools', items: 'code wordcount' },
                  table: { title: 'Table', items: 'inserttable | cell row column deletetable' },
                  help: { title: 'Help', items: 'help' },
                },
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
                  'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'help', 'wordcount'
                ],
                toolbar:
                  'undo redo | formatselect fontselect fontsizeselect | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | table | removeformat code fullscreen',
                paste_data_images: true,
                images_upload_handler: (blobInfo, success, failure) => {
                  try {
                    const base64 = blobInfo.base64();
                    success(`data:${blobInfo.blob().type};base64,${base64}`);
                  } catch (err) {
                    failure('Image upload failed');
                  }
                },
                branding: false,
                statusbar: true,
                content_style:
                  'body { font-family: Inter, system-ui, -apple-system, sans-serif; font-size: 16px; color: #0f172a; line-height: 1.6; }',
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

      <div className={styles.placeholderArea}></div>
    </div>
  );
};

export default CreateLetterTab;
