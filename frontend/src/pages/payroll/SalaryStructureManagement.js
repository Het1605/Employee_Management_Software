import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import API from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { handleApiError } from '../../utils/errorHandler';
import '../../styles/CalendarModule.css';
import styles from '../../styles/SalaryStructureLite.module.css';

const SalaryStructureManagement = () => {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [activeTab, setActiveTab] = useState('structures');
  const [componentsList, setComponentsList] = useState([]);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res = await API.get('/companies/');
        setCompanies(res.data || []);
      } catch (err) {
        showToast('Failed to load companies: ' + handleApiError(err), 'error');
      }
    };
    loadCompanies();
  }, [showToast]);

  useEffect(() => {
    const fetchComponents = async () => {
      if (!selectedCompanyId) {
        setComponentsList([]);
        return;
      }
      setLoadingComponents(true);
      try {
        const res = await API.get(`/salary-components?company_id=${selectedCompanyId}`);
        setComponentsList(res.data || []);
      } catch (err) {
        showToast('Failed to load components: ' + handleApiError(err), 'error');
      } finally {
        setLoadingComponents(false);
      }
    };
    fetchComponents();
  }, [selectedCompanyId, showToast]);

  return (
    <Layout title="Salary Structure Management">
      <div className={styles.container}>
        <div className={`calendar-header-card ${styles.selectorCard}`}>
          <div className="header-left">
            <span className="icon-building">🏢</span>
            <div className={`calendar-company-select-wrapper ${selectedCompanyId ? 'has-value' : 'is-placeholder'}`}>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="company-select-modern calendar-company-select"
              >
                <option value="" disabled>Select Company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <span className="calendar-company-select-arrow">▼</span>
            </div>
          </div>
        </div>

        <div className={`modern-tabs-container ${styles.tabsWrap}`}>
          {[
            { id: 'components', label: 'Components' },
            { id: 'structures', label: 'Salary Structures' },
            { id: 'assignment', label: 'Structure Assignment' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`modern-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'components' ? (
          <ComponentsTab
            components={componentsList}
            setComponents={setComponentsList}
            loading={loadingComponents}
            companyId={selectedCompanyId}
            refreshComponents={async () => {
              if (!selectedCompanyId) return;
              try {
                const res = await API.get(`/salary-components?company_id=${selectedCompanyId}`);
                setComponentsList(res.data || []);
              } catch (err) {
                showToast('Failed to load components: ' + handleApiError(err), 'error');
              }
            }}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            editingComponent={editingComponent}
            setEditingComponent={setEditingComponent}
            showToast={showToast}
            handleApiError={handleApiError}
          />
        ) : (
          <div className={styles.placeholderCard}>
            <p>Select a company and a tab to continue. Functionality coming soon.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SalaryStructureManagement;

const EditIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const ComponentsTab = ({ components, setComponents, isModalOpen, setIsModalOpen, editingComponent, setEditingComponent, loading, companyId, refreshComponents, showToast, handleApiError }) => {
  const openModal = (comp = null) => {
    setEditingComponent(comp);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingComponent(null);
    setIsModalOpen(false);
  };

  const handleSave = async (payload) => {
    if (!payload) return closeModal();
    if (!companyId) {
      showToast('Select a company first', 'warning');
      return;
    }
    try {
      const normalizedPayload = {
        ...payload,
        type: (payload.type || '').toUpperCase(),
      };
      if (editingComponent) {
        await API.put(`/salary-components/${editingComponent.id}?company_id=${companyId}`, normalizedPayload);
        showToast('Component updated', 'success');
      } else {
        await API.post('/salary-components/', { ...normalizedPayload, company_id: Number(companyId) });
        showToast('Component created', 'success');
      }
      closeModal();
      refreshComponents();
    } catch (err) {
      showToast('Save failed: ' + handleApiError(err), 'error');
    }
  };

  const handleToggle = (id) => {
    const comp = components.find((c) => c.id === id);
    if (!comp || !companyId) return;
    API.patch(`/salary-components/${id}/status?company_id=${companyId}`, { is_active: !comp.is_active })
      .then(() => refreshComponents())
      .catch((err) => showToast('Update failed: ' + handleApiError(err), 'error'));
  };

  const handleDelete = (comp) => {
    if (window.confirm(`Delete component "${comp.name}"?`)) {
      API.delete(`/salary-components/${comp.id}?company_id=${companyId}`)
        .then(() => refreshComponents())
        .catch((err) => showToast('Delete failed: ' + handleApiError(err), 'error'));
    }
  };

  return (
    <div>
      <div className={styles.tabHeader}>
        <div className={styles.tabTitles}>
          <h3>Manage Components</h3>
          <p className={styles.tabSubtitle}>Create and manage salary components such as Basic, HRA, PF, etc.</p>
        </div>
        <button className="btn-primary-action" onClick={() => openModal(null)}>+ Add Component</button>
      </div>

      <div className={styles.componentGrid}>
        {loading ? (
          <div className={styles.emptyCard}>Loading components...</div>
        ) : components.length === 0 ? (
          <div className={styles.emptyCard}>No components added yet.</div>
        ) : (
          components.map((comp) => (
            <div key={comp.id} className={styles.componentCard}>
              <div className={styles.cardTop}>
                <h4 className={styles.cardName}>{comp.name}</h4>
                <div className={styles.cardActions}>
                  <button className={styles.iconBtn} onClick={() => openModal(comp)} title="Edit">
                    <EditIcon />
                  </button>
                  <button className={`${styles.iconBtn} ${styles.delete}`} onClick={() => handleDelete(comp)} title="Delete">
                    <TrashIcon />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {(() => {
                  const t = (comp.type || '').toUpperCase();
                  return (
                    <span className={`${styles.badge} ${t === 'EARNING' ? styles.badgeEarning : styles.badgeDeduction}`}>
                      {t || 'TYPE'}
                    </span>
                  );
                })()}
                <span className={`${styles.badge} ${comp.is_taxable ? styles.badgeTaxable : styles.badgeNonTaxable}`}>
                  {comp.is_taxable ? 'Taxable' : 'Non-Taxable'}
                </span>
              </div>

              <div className={styles.cardBottom}>
                <div className={styles.statusToggle}>
                  <label className={styles.switch}>
                    <input type="checkbox" checked={comp.is_active} onChange={() => handleToggle(comp.id)} />
                    <span className={styles.slider}></span>
                  </label>
                  <span className={styles.statusLabel}>{comp.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AddComponentModal
        isOpen={isModalOpen}
        onClose={handleSave}
        editData={editingComponent}
      />
    </div>
  );
};

const AddComponentModal = ({ isOpen, onClose, editData }) => {
  const [form, setForm] = useState({
    name: '',
    type: 'EARNING',
    is_taxable: true,
  });

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name,
        type: (editData.type || 'EARNING').toUpperCase(),
        is_taxable: !!editData.is_taxable,
      });
    } else {
      setForm({
        name: '',
        type: 'EARNING',
        is_taxable: true,
      });
    }
  }, [editData, isOpen]);

  const close = () => onClose(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onClose({
      name: form.name.trim(),
      type: (form.type || '').toUpperCase(),
      is_taxable: form.is_taxable,
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onMouseDown={close}>
      <div className={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{editData ? 'Edit Component' : 'Add Component'}</h3>
          <button className={styles.closeBtn} onClick={close} aria-label="Close">&times;</button>
        </div>
        <form className={styles.formGrid} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Component Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Basic Salary"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="EARNING">Earning</option>
              <option value="DEDUCTION">Deduction</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.is_taxable}
                onChange={(e) => setForm({ ...form, is_taxable: e.target.checked })}
              />
              <span>Is Taxable</span>
            </label>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryBtn} onClick={close}>Cancel</button>
            <button type="submit" className={styles.primaryBtn}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};
