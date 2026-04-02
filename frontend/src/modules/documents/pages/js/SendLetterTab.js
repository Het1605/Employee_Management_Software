import React, { useEffect, useState, useMemo } from 'react';
import API from '../../../../core/api/apiClient';
import { useToast } from '../../../../contexts/ToastContext';
import { handleApiError } from '../../../../utils/errorHandler';
import styles from '../styles/DocumentsPage.module.css';

const SendLetterTab = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const canSend = useMemo(() => !!selectedUserId && !!selectedDocumentId && !loading, [selectedUserId, selectedDocumentId, loading]);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res = await API.get('/companies/');
        const list = res.data || [];
        setCompanies(list);
        if (list.length > 0) {
          setSelectedCompanyId(String(list[0].id));
        }
      } catch (err) {
        showToast('Failed to load companies: ' + handleApiError(err), 'error');
      }
    };
    loadCompanies();
  }, [showToast]);

  useEffect(() => {
    const loadDocs = async () => {
      setLoadingDocs(true);
      try {
        const res = await API.get('/documents');
        setDocuments(res.data || []);
      } catch (err) {
        showToast('Failed to load documents: ' + handleApiError(err), 'error');
      } finally {
        setLoadingDocs(false);
      }
    };
    loadDocs();
  }, [showToast]);

  useEffect(() => {
    if (!selectedCompanyId) {
      setUsers([]);
      return;
    }
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await API.get(`/companies/${selectedCompanyId}/users`);
        setUsers(res.data || []);
      } catch (err) {
        showToast('Failed to load users: ' + handleApiError(err), 'error');
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, [selectedCompanyId, showToast]);

  const handleSend = async () => {
    if (!selectedUserId) {
      showToast('Select a user to send the letter.', 'error');
      return;
    }
    if (!selectedDocumentId) {
      showToast('Select a document to send.', 'error');
      return;
    }
    setLoading(true);
    try {
      await API.post('/documents/send', {
        user_id: Number(selectedUserId),
        document_id: Number(selectedDocumentId),
      });
      showToast('Email sent successfully', 'success');
      setSelectedUserId('');
      setSelectedDocumentId('');
    } catch (err) {
      showToast('Failed to send email: ' + handleApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="management-card">
      <div className="management-header">
        <div className="titles">
          <h3>Send Letter</h3>
          <p className="subtitle">Send generated documents to users via email</p>
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Company</label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            disabled={loading || companies.length === 0}
          >
            {companies.length === 0 && <option value="">No companies</option>}
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.formField}>
          <label>User</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={loading || loadingUsers || users.length === 0}
          >
            <option value="">Select user</option>
            {users.map((u) => {
              const label = u.full_name || (u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.email || `User ${u.id}`);
              return (
                <option key={u.id} value={u.id}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
        <div className={styles.formField}>
          <label>Letter</label>
          <select
            value={selectedDocumentId}
            onChange={(e) => setSelectedDocumentId(e.target.value)}
            disabled={loading || loadingDocs || documents.length === 0}
          >
            <option value="">Select document</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.actionsRow}>
        <button
          className="btn-primary-action"
          onClick={handleSend}
          disabled={!canSend}
        >
          {loading ? 'Sending...' : 'Send Email'}
        </button>
      </div>
    </div>
  );
};

export default SendLetterTab;
