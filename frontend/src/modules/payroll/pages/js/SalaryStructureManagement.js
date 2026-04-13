import React, { useEffect, useState } from 'react';
import MainLayout from '../../../../layout/MainLayout/js/MainLayout';
import API from '../../../../core/api/apiClient';
import { useToast } from '../../../../contexts/ToastContext';
import { handleApiError } from '../../../../utils/errorHandler';
import { useCompanyContext } from '../../../../contexts/CompanyContext';
import '../../../../modules/calendar/pages/styles/CalendarModule.css';
import styles from '../styles/SalaryStructureManagement.module.css';

const SalaryStructureManagement = () => {
  const { showToast } = useToast();
  const { selectedCompanyId } = useCompanyContext();
  const [activeTab, setActiveTab] = useState('structures');
  const [componentsList, setComponentsList] = useState([]);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [structuresList, setStructuresList] = useState([]);
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

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

  useEffect(() => {
    const fetchStructures = async () => {
      if (!selectedCompanyId) {
        setStructuresList([]);
        return;
      }
      setLoadingStructures(true);
      try {
        const defs = await API.get(`/salary-structures?company_id=${selectedCompanyId}`);
        const definitions = defs.data || [];
        const withComponents = await Promise.all(
          definitions.map(async (d) => {
            try {
              const comps = await API.get(`/salary-structures/${d.id}/components`);
              const compRows = comps.data || [];
              const total = compRows.reduce((sum, r) => sum + Number(r.percentage || 0), 0);
              return { ...d, components: compRows, total };
            } catch {
              return { ...d, components: [], total: 0 };
            }
          })
        );
        setStructuresList(withComponents);
      } catch (err) {
        showToast('Failed to load structures: ' + handleApiError(err), 'error');
      } finally {
        setLoadingStructures(false);
      }
    };
    fetchStructures();
  }, [selectedCompanyId, showToast]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!selectedCompanyId) {
        setUsers([]);
        return;
      }
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
    fetchUsers();
  }, [selectedCompanyId, showToast]);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!selectedCompanyId) {
        setAssignments([]);
        return;
      }
      setLoadingAssignments(true);
      try {
        const res = await API.get(`/user-salary-structures?company_id=${selectedCompanyId}`);
        setAssignments(res.data || []);
      } catch (err) {
        showToast('Failed to load assignments: ' + handleApiError(err), 'error');
      } finally {
        setLoadingAssignments(false);
      }
    };
    fetchAssignments();
  }, [selectedCompanyId, showToast]);

  const refreshAssignments = async () => {
    if (!selectedCompanyId) return;
    try {
      const res = await API.get(`/user-salary-structures?company_id=${selectedCompanyId}`);
      setAssignments(res.data || []);
    } catch (err) {
      showToast('Failed to load assignments: ' + handleApiError(err), 'error');
    }
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        {!selectedCompanyId ? (
          <div className={styles.placeholderCard}>Please select a company from the header to manage salary structures.</div>
        ) : (
        <>
        <div className={`modern-tabs-container ${styles.tabsWrap}`}>
          {[
            { id: 'components', label: 'Components' },
            { id: 'structures', label: 'Salary Structures' },
            { id: 'assignment', label: 'Salary Assignment' },
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
        ) : activeTab === 'structures' ? (
          <StructuresTab
            companyId={selectedCompanyId}
            components={componentsList}
            structures={structuresList}
            refreshStructures={async () => {
              if (!selectedCompanyId) return;
              try {
                const defs = await API.get(`/salary-structures?company_id=${selectedCompanyId}`);
                const definitions = defs.data || [];
                const withComponents = await Promise.all(
                  definitions.map(async (d) => {
                    const comps = await API.get(`/salary-structures/${d.id}/components`);
                    const compRows = comps.data || [];
                    const total = compRows.reduce((sum, r) => sum + Number(r.percentage || 0), 0);
                    return { ...d, components: compRows, total };
                  })
                );
                setStructuresList(withComponents);
              } catch (err) {
                showToast('Failed to load structures: ' + handleApiError(err), 'error');
              }
            }}
            isModalOpen={structureModalOpen}
            setIsModalOpen={setStructureModalOpen}
            editingStructure={editingStructure}
            setEditingStructure={setEditingStructure}
            loading={loadingStructures}
            showToast={showToast}
            handleApiError={handleApiError}
          />
        ) : activeTab === 'assignment' ? (
          <AssignmentTab
            companyId={selectedCompanyId}
            users={users}
            structures={structuresList}
            assignments={assignments}
            loading={loadingAssignments || loadingUsers}
            onOpenModal={(assignment = null) => {
              setEditingAssignment(assignment);
              setAssignmentModalOpen(true);
            }}
            onDelete={async (assignment) => {
              if (!window.confirm('Are you sure you want to delete this assignment?')) return;
              try {
                await API.delete(`/user-salary-structures/${assignment.id}`);
                refreshAssignments();
                showToast('Assignment deleted', 'success');
              } catch (err) {
                showToast('Delete failed: ' + handleApiError(err), 'error');
              }
            }}
          />
        ) : (
          <div className={styles.placeholderCard}>
            <p>Select a company and a tab to continue. Functionality coming soon.</p>
          </div>
        )}
        </>
        )}

        {(assignmentModalOpen || editingAssignment) && (
          <AssignmentModal
            isOpen={assignmentModalOpen}
            onClose={async (data) => {
              if (!data) {
                setAssignmentModalOpen(false);
                setEditingAssignment(null);
                return;
              }

              try {
                if (editingAssignment) {
                  await API.put(`/user-salary-structures/${editingAssignment.id}`, {
                    user_id: Number(data.user_id),
                    structure_id: Number(data.structure_id),
                    ctc: Number(data.ctc),
                  });
                  showToast('Assignment updated', 'success');
                } else {
                  await API.post('/user-salary-structures', {
                    user_id: Number(data.user_id),
                    structure_id: Number(data.structure_id),
                    ctc: Number(data.ctc),
                  });
                  showToast('Assignment created', 'success');
                }
                setAssignmentModalOpen(false);
                setEditingAssignment(null);
                refreshAssignments();
              } catch (err) {
                showToast('Save failed: ' + handleApiError(err), 'error');
              }
            }}
            users={users}
            structures={structuresList}
            companyId={selectedCompanyId}
            editData={editingAssignment}
          />
        )}
      </div>
    </MainLayout>
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

const AssignmentTab = ({ companyId, users, structures, assignments, loading, onOpenModal, onDelete }) => {
  const userMap = users.reduce((acc, user) => ({
    ...acc,
    [user.id]: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
  }), {});
  const structureMap = structures.reduce((acc, st) => ({ ...acc, [st.id]: st.structure_name || st.name }), {});

  return (
    <div className="management-card">
      <div className="management-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="titles">
          <h3>User Salary Assignment</h3>
          <p className="subtitle">Assign salary structures to users based on company</p>
        </div>
        <div className="action-buttons">
          <button className="btn-primary-action" onClick={() => onOpenModal(null)} disabled={!companyId}>+ Create Assignment</button>
        </div>
      </div>

      {loading ? (
        <div className={styles.placeholderCard}>Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className={styles.placeholderCard}>No salary structures assigned to users yet</div>
      ) : (
        <div className={styles.assignmentGrid}>
          {assignments.map((assignment) => (
            <div key={assignment.id} className={styles.assignmentCard}>
              <div className={styles.cardRow}>
                <span className={styles.userName} title={userMap[assignment.user_id]}>
                  {userMap[assignment.user_id] || `User ${assignment.user_id}`}
                </span>
                <div className={styles.inlineActions}>
                  <button className={styles.iconBtn} onClick={() => onOpenModal(assignment)} title="Edit">
                    <EditIcon />
                  </button>
                  <button className={`${styles.iconBtn} ${styles.delete}`} onClick={() => onDelete(assignment)} title="Delete">
                    <TrashIcon />
                  </button>
                </div>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.structureName}>
                  {structureMap[assignment.structure_id] || `Structure ${assignment.structure_id}`}
                </span>
                <span className={styles.ctcAmount}>
                  ₹{Number(assignment.ctc).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AssignmentModal = ({ isOpen, onClose, users, structures, companyId, editData }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedStructure, setSelectedStructure] = useState('');
  const [ctc, setCtc] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setSelectedUser(editData.user_id || '');
      setSelectedStructure(editData.structure_id || '');
      setCtc(editData.ctc || '');
    } else {
      setSelectedUser('');
      setSelectedStructure('');
      setCtc('');
    }
  }, [isOpen, editData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedStructure || !ctc || Number(ctc) <= 0) return;
    onClose({ 
      user_id: Number(selectedUser), 
      structure_id: Number(selectedStructure),
      ctc: Number(ctc)
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onMouseDown={() => onClose(null)}>
      <div className={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{editData ? 'Edit Assignment' : 'Assign Salary Structure'}</h3>
          <button className={styles.closeBtn} onClick={() => onClose(null)} aria-label="Close">&times;</button>
        </div>
        <form className={styles.formGrid} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>User</label>
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} required>
              <option value="" disabled>Select user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.full_name || `${user.first_name} ${user.last_name}`.trim()}</option>
              ))}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>Salary Structure</label>
            <select value={selectedStructure} onChange={(e) => setSelectedStructure(e.target.value)} required>
              <option value="" disabled>Select structure</option>
              {structures
                .filter((s) => Number(s.company_id) === Number(companyId))
                .map((structure) => (
                  <option key={structure.id} value={structure.id}>{structure.structure_name || structure.name}</option>
                ))}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>Annual CTC (₹)</label>
            <input
              type="number"
              step="0.01"
              value={ctc}
              onChange={(e) => setCtc(e.target.value)}
              placeholder="e.g. 600000"
              required
              min="0.01"
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryBtn} onClick={() => onClose(null)}>Cancel</button>
            <button type="submit" className={styles.primaryBtn}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
    <div className="management-card">
      <div className="management-header">
        <div className="titles">
          <h3>Manage Components</h3>
          <p className="subtitle">Create and manage salary components such as Basic, HRA, PF, etc.</p>
        </div>
        <div className="action-buttons">
          <button className={`btn-primary-action ${styles.noWrapBtn}`} onClick={() => openModal(null)}>+ Add Component</button>
        </div>
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

const StructuresTab = ({ companyId, components, structures, refreshStructures, isModalOpen, setIsModalOpen, editingStructure, setEditingStructure, loading, showToast, handleApiError }) => {
  const openModal = (structure = null) => {
    setEditingStructure(structure);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingStructure(null);
    setIsModalOpen(false);
  };

  const handleSave = async (data) => {
    if (!data) return closeModal();
    if (!companyId) return;
    try {
      const detailPayload = {
        items: data.components.map((c) => ({
          component_id: c.component_id,
          percentage: c.percentage,
        })),
      };

      if (editingStructure) {
        // Update definition
        await API.put(`/salary-structures/${editingStructure.id}`, {
          structure_name: data.name,
        });
        // Update each component percentage
        await Promise.all(
          detailPayload.items.map((item) =>
            API.put(`/salary-structures/${editingStructure.id}/components/${item.component_id}`, {
              percentage: item.percentage,
            })
          )
        );
        showToast('Structure updated', 'success');
      } else {
        // Create then add details
        const createRes = await API.post('/salary-structures', {
          structure_name: data.name,
          company_id: Number(companyId),
        });
        const structureId = createRes.data.id;
        await API.post(`/salary-structures/${structureId}/components`, detailPayload);
        showToast('Structure saved', 'success');
      }

      closeModal();
      refreshStructures();
    } catch (err) {
      showToast('Save failed: ' + handleApiError(err), 'error');
    }
  };

  return (
    <div className="management-card">
      <div className="management-header">
        <div className="titles">
          <h3>Manage Salary Structures</h3>
          <p className="subtitle">
            Create and manage salary structures by defining percentage distribution across all components (all percentages are strictly based on CTC).
          </p>
        </div>
        <div className="action-buttons">
          <button className={`btn-primary-action ${styles.noWrapBtn}`} onClick={() => openModal(null)} disabled={!companyId || components.length === 0}>
            + Create Structure
          </button>
        </div>
      </div>

      {!companyId ? (
        <div className={styles.placeholderCard}>Select a company to manage structures.</div>
      ) : components.length === 0 ? (
        <div className={styles.placeholderCard}>Add components first to define structures.</div>
      ) : loading ? (
        <div className={styles.placeholderCard}>Loading structures...</div>
      ) : (
        <div className={styles.structuresList}>
          {structures.length === 0 ? (
            <div className={styles.placeholderCard}>No salary structures created yet.</div>
          ) : (
            structures.map((structure) => (
              <div key={structure.id} className={styles.structureCard}>
                <div className={styles.structureHeader}>
                  <h4 className={styles.structureName}>{structure.structure_name || structure.name}</h4>
                  <div className={styles.inlineActions}>
                    <button className={styles.iconBtn} onClick={() => openModal(structure)} title="Edit">
                      <EditIcon />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.delete}`}
                      onClick={async () => {
                        if (window.confirm(`Delete salary structure "${structure.structure_name || structure.name}"?`)) {
                          try {
                            await API.delete(`/salary-structures/${structure.id}`);
                            refreshStructures();
                          } catch (err) {
                            showToast('Delete failed: ' + handleApiError(err), 'error');
                          }
                        }
                      }}
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                <table className={styles.structureTable}>
                  <thead>
                    <tr>
                      <th>Component Name</th>
                      <th style={{ width: '140px' }}>Percentage (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {structure.components.map((row) => (
                      <tr key={row.component_id}>
                        <td>{row.component_name || row.name || '-'}</td>
                        <td>{formatPercent(row.percentage)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={styles.totalRow}>Total: {formatPercent(structure.total)}%</div>
              </div>
            ))
          )}
        </div>
      )}

      <StructureModal
        isOpen={isModalOpen}
        onClose={(data) => {
          if (!data) return closeModal();
          handleSave(data);
        }}
        components={components}
        editData={editingStructure}
      />
    </div>
  );
};

const formatPercent = (val) => {
  const num = Number(val);
  if (Number.isNaN(num)) return val;
  return Number.isFinite(num) ? Number(num.toString()) : val;
};

const StructureModal = ({ isOpen, onClose, components, editData }) => {
  const [name, setName] = useState('');
  const [percentages, setPercentages] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setName(editData.structure_name || editData.name || '');
      const initial = {};
      editData.components.forEach((c) => {
        initial[c.component_id] = Number(c.percentage);
      });
      setPercentages(initial);
    } else {
      setName('');
      const initial = {};
      components.forEach((c) => {
        initial[c.id] = 0;
      });
      setPercentages(initial);
    }
  }, [isOpen, editData, components]);

  const total = components.reduce((sum, c) => sum + Number(percentages[c.id] || 0), 0);
  const totalValid = Math.abs(total - 100) < 0.0001;
  const hasComponents = components && components.length > 0;

  const updatePercentage = (id, value) => {
    const val = Number(value);
    setPercentages((prev) => ({ ...prev, [id]: isNaN(val) ? 0 : val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!totalValid || !hasComponents) return;
    const payload = {
      id: editData ? editData.id : Date.now(),
      name: name.trim() || 'Untitled Structure',
      components: components.map((c) => ({
        component_id: c.id,
        component_name: c.name,
        percentage: Number(percentages[c.id] || 0),
      })),
      total,
    };
    onClose(payload);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onMouseDown={() => onClose(null)}>
      <div className={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{editData ? 'Edit Structure' : 'Create Structure'}</h3>
          <button className={styles.closeBtn} onClick={() => onClose(null)} aria-label="Close">&times;</button>
        </div>
        <div className={styles.modalBody}>
          <form className={styles.formGrid} onSubmit={handleSubmit} style={{ gap: '1rem' }}>
            <div className={styles.inputGroup}>
              <label>Structure Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard CTC Split"
                required
              />
            </div>

            <div className={styles.placeholderCard} style={{ borderStyle: 'solid', borderColor: '#e2e8f0' }}>
              <p style={{ margin: 0, fontWeight: 700 }}>Important:</p>
              <p style={{ margin: 0 }}>All percentages are calculated based on CTC. Define how total CTC is distributed across components.</p>
            </div>

            {!hasComponents ? (
              <div className={styles.placeholderCard}>
                <p style={{ margin: 0, fontWeight: 700 }}>No components found for this company.</p>
                <p style={{ margin: 0 }}>Please create components first.</p>
              </div>
            ) : (
              <div className={styles.structureCard} style={{ boxShadow: 'none', border: '1px solid #e2e8f0', padding: '0.75rem' }}>
                <div className={styles.componentTableWrapper}>
                  <table className={styles.structureTable}>
                    <thead>
                      <tr>
                        <th>Component Name</th>
                        <th style={{ width: '160px' }}>Percentage (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {components.map((c) => (
                        <tr key={c.id}>
                          <td>{c.name}</td>
                          <td>
                              <input
                              type="number"
                              min="0"
                              step="any"
                              value={percentages[c.id] ?? 0}
                              onChange={(e) => updatePercentage(c.id, e.target.value)}
                              style={{ width: '100%', padding: '0.45rem 0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={styles.totalRow}>Total: {formatPercent(total)}%</div>
                {!totalValid && <div className={styles.errorText}>Total percentage must be 100%</div>}
                {totalValid && hasComponents && <div className={styles.successText}>Total is valid (100%).</div>}
              </div>
            )}

            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtn} onClick={() => onClose(null)}>Cancel</button>
              <button type="submit" className={styles.primaryBtn} disabled={!totalValid || !hasComponents}>Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
