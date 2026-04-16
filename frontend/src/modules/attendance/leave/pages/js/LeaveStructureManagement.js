import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../../../../layout/MainLayout/js/MainLayout';
import API from '../../../../../core/api/apiClient';
import { useToast } from '../../../../../contexts/ToastContext';
import { useCompanyContext } from '../../../../../contexts/CompanyContext';
import { handleApiError } from '../../../../../utils/errorHandler';
import styles from '../styles/LeaveStructureManagement.module.css';

const LeaveStructureManagement = () => {
    const { showToast } = useToast();
    const { selectedCompanyId } = useCompanyContext();
    const role = (localStorage.getItem('role') || 'EMPLOYEE').toUpperCase();
    const isAdminOrHR = ['ADMIN', 'HR'].includes(role);

    const [activeTab, setActiveTab] = useState('structures');
    const [structures, setStructures] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
    const [editingStructure, setEditingStructure] = useState(null);

    const fetchData = useCallback(async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const [structRes, assignRes, userRes] = await Promise.all([
                API.get(`/leave-structures?company_id=${selectedCompanyId}`),
                API.get(`/leave-assignments?company_id=${selectedCompanyId}`),
                API.get('/users/')
            ]);
            setStructures(structRes.data || []);
            setAssignments(assignRes.data || []);
            setUsers(userRes.data || []);
        } catch (err) {
            showToast('Failed to load data: ' + handleApiError(err), 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast, selectedCompanyId]);

    useEffect(() => {
        if (isAdminOrHR && selectedCompanyId) {
            fetchData();
        }
    }, [isAdminOrHR, fetchData, selectedCompanyId]);

    const openStructureModal = (structure = null) => {
        setEditingStructure(structure);
        setIsStructureModalOpen(true);
    };

    const handleSaveStructure = async (formData) => {
        if (!selectedCompanyId) {
            showToast('No company selected', 'error');
            return;
        }

        try {
            if (editingStructure) {
                await API.put(`/leave-structures/${editingStructure.id}`, {
                    name: formData.name,
                    details: formData.details
                });
                showToast('Leave structure updated successfully', 'success');
            } else {
                await API.post('/leave-structures', {
                    company_id: Number(selectedCompanyId),
                    name: formData.name,
                    details: formData.details
                });
                showToast('Leave structure created successfully', 'success');
            }
            setIsStructureModalOpen(false);
            setEditingStructure(null);
            fetchData();
        } catch (err) {
            showToast('Save failed: ' + handleApiError(err), 'error');
        }
    };

    if (!isAdminOrHR) {
        return (
            <MainLayout title="Unauthorized">
                <div className={styles.container}>
                    <div className={styles.placeholderCard}>
                        You do not have permission to access this page.
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="Leave Structure">
            <div className={styles.container}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>Leave Structure</h1>
                    <p className={styles.pageSubtitle}>
                        {activeTab === 'structures' 
                            ? "Create and manage leave structures by defining PL, CL, and SL policies." 
                            : "Assign leave structures to users"}
                    </p>
                </div>

                <div className={`modern-tabs-container ${styles.tabsWrap}`}>
                    {[
                        { id: 'structures', label: 'Leave Structures' },
                        { id: 'assignment', label: 'Leave Assignment' }
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

                {loading ? (
                    <div className={styles.placeholderCard}>Loading data...</div>
                ) : activeTab === 'structures' ? (
                    <LeaveStructuresTab 
                        structures={structures} 
                        refresh={fetchData} 
                        showToast={showToast}
                        onOpenModal={openStructureModal}
                    />
                ) : (
                    <LeaveAssignmentTab 
                        assignments={assignments} 
                        users={users} 
                        structures={structures}
                        refresh={fetchData} 
                        showToast={showToast}
                    />
                )}

                <LeaveStructureModal
                    isOpen={isStructureModalOpen}
                    onClose={() => setIsStructureModalOpen(false)}
                    onSave={handleSaveStructure}
                    editData={editingStructure}
                />
            </div>
        </MainLayout>
    );
};

export default LeaveStructureManagement;

/* ─────────────────────────────────────────────────────────────
   Sub-components (Matches Salary Pattern)
   ───────────────────────────────────────────────────────────── */

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

const LeaveStructuresTab = ({ structures, refresh, showToast, onOpenModal }) => {
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete leave structure "${name}"?`)) return;
        try {
            await API.delete(`/leave-structures/${id}`);
            showToast('Structure deleted successfully', 'success');
            refresh();
        } catch (err) {
            showToast('Delete failed: ' + handleApiError(err), 'error');
        }
    };

    return (
        <div className={styles.managementCard}>
            <div className={styles.managementHeader}>
                <div className={styles.titles}>
                    <h3>Manage Leave Structures</h3>
                    <p className={styles.subtitle}>Define how many leaves employees get and how they are handled.</p>
                </div>
                <div className={styles.actionButtons}>
                    <button className="btn-primary-action" onClick={() => onOpenModal(null)}>+ Create Structure</button>
                </div>
            </div>

            {structures.length === 0 ? (
                <div className={styles.placeholderCard}>No leave structures defined yet. Create one to get started.</div>
            ) : (
                <div className={styles.structuresList}>
                    {structures.map((structure) => (
                        <div key={structure.id} className={styles.structureCard}>
                            <div className={styles.structureHeader}>
                                <h4 className={styles.structureName}>{structure.name}</h4>
                                <div className={styles.inlineActions}>
                                    <button className={styles.iconBtn} title="Edit" onClick={() => onOpenModal(structure)}><EditIcon /></button>
                                    <button 
                                        className={`${styles.iconBtn} ${styles.delete}`} 
                                        title="Delete"
                                        onClick={() => handleDelete(structure.id, structure.name)}
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>

                            <table className={styles.structureTable}>
                                <thead>
                                    <tr>
                                        <th>Leave Type</th>
                                        <th>Days</th>
                                        <th>Allocation</th>
                                        <th>Reset Policy</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(structure.details || []).map((detail, idx) => (
                                        <tr key={idx}>
                                            <td><strong>{detail.leave_type}</strong></td>
                                            <td>{detail.total_days}</td>
                                            <td>{detail.allocation_type}</td>
                                            <td>{detail.reset_policy}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const LeaveAssignmentTab = ({ assignments, users, structures, refresh, showToast }) => {
    const userMap = users.reduce((acc, u) => ({
        ...acc,
        [u.id]: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || `User ${u.id}`
    }), {});

    const structMap = structures.reduce((acc, s) => ({
        ...acc,
        [s.id]: s.name
    }), {});

    const handleDelete = async (userId, name) => {
        if (!window.confirm(`Are you sure you want to remove assignment for ${name}? This will also wipe their current balances.`)) return;
        try {
            await API.delete(`/leave-assignments/${userId}`);
            showToast('Assignment removed successfully', 'success');
            refresh();
        } catch (err) {
            showToast('Removal failed: ' + handleApiError(err), 'error');
        }
    };

    return (
        <div className={styles.managementCard}>
            <div className={styles.managementHeader}>
                <div className={styles.titles}>
                    <h3>Leave Assignment</h3>
                    <p className={styles.subtitle}>Assign leave policies to specific employees.</p>
                </div>
                <div className={styles.actionButtons}>
                    <button className="btn-primary-action">+ Create Assignment</button>
                </div>
            </div>

            {assignments.length === 0 ? (
                <div className={styles.placeholderCard}>No leave structures assigned to users yet.</div>
            ) : (
                <div className={styles.assignmentGrid}>
                    {assignments.map((assignment) => (
                        <div key={assignment.id} className={styles.assignmentCard}>
                            <div className={styles.cardRow}>
                                <span className={styles.userName}>{userMap[assignment.user_id] || `User ${assignment.user_id}`}</span>
                                <div className={styles.inlineActions}>
                                    <button className={styles.iconBtn} title="Edit"><EditIcon /></button>
                                    <button 
                                        className={`${styles.iconBtn} ${styles.delete}`} 
                                        title="Delete"
                                        onClick={() => handleDelete(assignment.user_id, userMap[assignment.user_id])}
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                            <div className={styles.cardRow}>
                                <span className={styles.assignedStructureName}>
                                    {structMap[assignment.structure_id] || `Structure ${assignment.structure_id}`}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   LeaveStructureModal Component
   ───────────────────────────────────────────────────────────── */

const LeaveStructureModal = ({ isOpen, onClose, onSave, editData }) => {
    const [name, setName] = useState('');
    const [details, setDetails] = useState({
        PL: { total_days: '', allocation_type: 'MONTHLY', reset_policy: 'EXTEND' },
        CL: { total_days: '', allocation_type: 'MONTHLY', reset_policy: 'VOID' },
        SL: { total_days: '', allocation_type: 'YEARLY', reset_policy: 'VOID' }
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!isOpen) return;
        if (editData) {
            setName(editData.name || '');
            const newDetails = {};
            (editData.details || []).forEach(d => {
                newDetails[d.leave_type] = {
                    total_days: d.total_days,
                    allocation_type: d.allocation_type,
                    reset_policy: d.reset_policy
                };
            });
            setDetails(prev => ({ ...prev, ...newDetails }));
        } else {
            setName('');
            setDetails({
                PL: { total_days: '', allocation_type: 'MONTHLY', reset_policy: 'EXTEND' },
                CL: { total_days: '', allocation_type: 'MONTHLY', reset_policy: 'VOID' },
                SL: { total_days: '', allocation_type: 'YEARLY', reset_policy: 'VOID' }
            });
        }
        setErrors({});
    }, [isOpen, editData]);

    const handleDetailChange = (type, field, value) => {
        setDetails(prev => ({
            ...prev,
            [type]: { ...prev[type], [field]: value }
        }));
        // Clear error if user starts typing
        if (errors[`${type}_total_days`]) {
            setErrors(prev => {
                const newErrs = { ...prev };
                delete newErrs[`${type}_total_days`];
                return newErrs;
            });
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = true;
        
        ['PL', 'CL', 'SL'].forEach(type => {
            if (!details[type].total_days || isNaN(details[type].total_days) || Number(details[type].total_days) <= 0) {
                newErrors[`${type}_total_days`] = true;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const detailList = Object.entries(details).map(([type, config]) => ({
            leave_type: type,
            total_days: Number(config.total_days),
            allocation_type: config.allocation_type,
            reset_policy: config.reset_policy
        }));

        onSave({ name: name.trim(), details: detailList });
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onMouseDown={onClose}>
            <div className={styles.modalCard} onMouseDown={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>{editData ? 'Edit Leave Structure' : 'Create Leave Structure'}</h3>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>

                <form className={styles.modalBody} onSubmit={handleSubmit}>
                    <div className={styles.infoBox}>
                        Define leave policies for PL, CL, and SL including days, allocation type, and reset rules.
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.inputGroup}>
                            <label>Structure Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => {
                                    setName(e.target.value);
                                    if (errors.name) setErrors(prev => ({ ...prev, name: false }));
                                }}
                                placeholder="e.g. Standard Leave Policy"
                                className={errors.name ? styles.error : ''}
                                required
                            />
                        </div>

                        <div className={styles.configTableContainer}>
                            <table className={styles.configTable}>
                                <thead>
                                    <tr>
                                        <th>Leave Type</th>
                                        <th>Days</th>
                                        <th>Allocation</th>
                                        <th>Reset Policy</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {['PL', 'CL', 'SL'].map(type => (
                                        <tr key={type}>
                                            <td data-label="Leave Type"><strong>{type}</strong></td>
                                            <td data-label="Days">
                                                <input
                                                    type="number"
                                                    value={details[type].total_days}
                                                    onChange={e => handleDetailChange(type, 'total_days', e.target.value)}
                                                    placeholder="e.g. 12"
                                                    className={errors[`${type}_total_days`] ? styles.error : ''}
                                                    required
                                                />
                                            </td>
                                            <td data-label="Allocation">
                                                <select
                                                    value={details[type].allocation_type}
                                                    onChange={e => handleDetailChange(type, 'allocation_type', e.target.value)}
                                                >
                                                    <option value="MONTHLY">Monthly</option>
                                                    <option value="YEARLY">Yearly</option>
                                                </select>
                                            </td>
                                            <td data-label="Reset Policy">
                                                <select
                                                    value={details[type].reset_policy}
                                                    onChange={e => handleDetailChange(type, 'reset_policy', e.target.value)}
                                                >
                                                    <option value="ENCASH">Encash</option>
                                                    <option value="EXTEND">Extend</option>
                                                    <option value="VOID">Void</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" className={styles.secondaryBtn} onClick={onClose}>Cancel</button>
                        <button type="submit" className={styles.primaryBtn}>Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

