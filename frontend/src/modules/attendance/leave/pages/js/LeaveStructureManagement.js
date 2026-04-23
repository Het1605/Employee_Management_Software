import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);

    // Set Balance Hook state
    const [isSetBalanceModalOpen, setIsSetBalanceModalOpen] = useState(false);
    const [selectedUserForBalance, setSelectedUserForBalance] = useState(null);

    const fetchData = useCallback(async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const [structRes, assignRes, userRes] = await Promise.all([
                API.get(`/leave-structures?company_id=${selectedCompanyId}`),
                API.get(`/leave-assignments?company_id=${selectedCompanyId}`),
                API.get(`/users/?company_id=${selectedCompanyId}&active_only=true`)
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

    const openAssignmentModal = (assignment = null) => {
        setEditingAssignment(assignment);
        setIsAssignmentModalOpen(true);
    };

    const openSetBalanceModal = (assignment) => {
        const userObj = users.find(u => u.id === assignment.user_id);
        const structureObj = structures.find(s => s.id === assignment.structure_id);
        
        setSelectedUserForBalance({
            id: assignment.user_id,
            name: userObj ? (userObj.full_name || `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim() || `User ${userObj.id}`) : `User ${assignment.user_id}`,
            structureName: structureObj ? structureObj.name : 'Unknown Structure'
        });
        setIsSetBalanceModalOpen(true);
    };

    const handleSaveAssignment = async (formData) => {
        if (!selectedCompanyId) {
            showToast('No company selected', 'error');
            return;
        }

        try {
            if (editingAssignment) {
                await API.put(`/leave-assignments/${editingAssignment.user_id}`, {
                    structure_id: Number(formData.structure_id)
                });
                showToast('Assignment updated successfully', 'success');
            } else {
                await API.post('/leave-assignments', {
                    company_id: Number(selectedCompanyId),
                    user_id: Number(formData.user_id),
                    structure_id: Number(formData.structure_id)
                });
                showToast('Assignment created successfully', 'success');
            }
            setIsAssignmentModalOpen(false);
            setEditingAssignment(null);
            fetchData();
        } catch (err) {
            showToast('Assignment failed: ' + handleApiError(err), 'error');
        }
    };

    if (!isAdminOrHR) {
        return (
            <>
                <div className={styles.container}>
                    <div className={styles.placeholderCard}>
                        You do not have permission to access this page.
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
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
                        onOpenModal={openAssignmentModal}
                        onOpenSetBalance={openSetBalanceModal}
                        selectedCompanyId={selectedCompanyId}
                    />
                )}

                <LeaveStructureModal
                    isOpen={isStructureModalOpen}
                    onClose={() => setIsStructureModalOpen(false)}
                    onSave={handleSaveStructure}
                    editData={editingStructure}
                />

                <LeaveAssignmentModal
                    isOpen={isAssignmentModalOpen}
                    onClose={() => {
                        setIsAssignmentModalOpen(false);
                        setEditingAssignment(null);
                    }}
                    onSave={handleSaveAssignment}
                    users={users}
                    structures={structures}
                    editData={editingAssignment}
                    assignments={assignments}
                />
                
                <SetLeaveBalanceModal
                    isOpen={isSetBalanceModalOpen}
                    onClose={() => setIsSetBalanceModalOpen(false)}
                    user={selectedUserForBalance}
                    structureName={selectedUserForBalance?.structureName}
                    showToast={showToast}
                    refresh={fetchData}
                />
            </div>
        </>
    );
};

export default LeaveStructureManagement;

/* ─────────────────────────────────────────────────────────────
   Sub-components (Matches Salary Pattern)
   ───────────────────────────────────────────────────────────── */

const BalanceIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="3" x2="12" y2="21"></line>
        <path d="M3 12h18"></path>
        <path d="M3 12a5 5 0 0 0 5 5"></path>
        <path d="M21 12a5 5 0 0 1-5 5"></path>
        <path d="M8 12v4"></path>
        <path d="M16 12v4"></path>
    </svg>
);

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

const LeaveAssignmentTab = ({ assignments, users, structures, refresh, showToast, onOpenModal, onOpenSetBalance, selectedCompanyId }) => {
    const userMap = users.reduce((acc, u) => ({
        ...acc,
        [u.id]: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || `User ${u.id}`
    }), {});

    const structMap = structures.reduce((acc, s) => ({
        ...acc,
        [s.id]: s.name
    }), {});

    const handleDelete = async (userId, name) => {
        if (!selectedCompanyId) return;
        if (!window.confirm(`Are you sure you want to remove assignment for ${name}? This will also wipe their current balances.`)) return;
        try {
            await API.delete(`/leave-assignments/${userId}?company_id=${selectedCompanyId}`);
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
                    <button className="btn-primary-action" onClick={() => onOpenModal(null)}>+ Create Assignment</button>
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
                                    <button 
                                        className={styles.iconBtn} 
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'auto', padding: '0 8px', fontSize: '0.85rem' }} 
                                        title="Set Balance" 
                                        onClick={() => onOpenSetBalance(assignment)}
                                    >
                                        <BalanceIcon /> Set Balance
                                    </button>
                                    <button className={styles.iconBtn} title="Edit" onClick={() => onOpenModal(assignment)}><EditIcon /></button>
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
            const val = details[type].total_days;
            // Allow 0, but not empty string or negative numbers
            if (val === '' || isNaN(val) || Number(val) < 0) {
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
                                                    onKeyDown={e => {
                                                        if (e.key === '-' || e.key === 'e') e.preventDefault();
                                                    }}
                                                    placeholder="0"
                                                    min="0"
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

/* ─────────────────────────────────────────────────────────────
   LeaveAssignmentModal Component
   ───────────────────────────────────────────────────────────── */

const LeaveAssignmentModal = ({ isOpen, onClose, onSave, users, structures, editData, assignments }) => {
    const [userId, setUserId] = useState('');
    const [structureId, setStructureId] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!isOpen) return;
        if (editData) {
            setUserId(editData.user_id);
            setStructureId(editData.structure_id);
        } else {
            setUserId('');
            setStructureId('');
        }
        setErrors({});
    }, [isOpen, editData]);

    // Only show users who don't have an assignment (except when editing)
    const availableUsers = useMemo(() => {
        if (editData) return users; // When editing, we need the current user in list
        const assignedUserIds = new Set(assignments.map(a => a.user_id));
        return users.filter(u => !assignedUserIds.has(u.id));
    }, [users, assignments, editData]);

    const validate = () => {
        const newErrors = {};
        if (!userId) newErrors.user_id = true;
        if (!structureId) newErrors.structure_id = true;
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        onSave({ user_id: userId, structure_id: structureId });
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onMouseDown={onClose}>
            <div className={styles.modalCard} onMouseDown={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>{editData ? 'Update Assignment' : 'Assign Leave Structure'}</h3>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>

                <form className={styles.modalBody} onSubmit={handleSubmit}>
                    <div className={styles.infoBox}>
                        Assign a leave policy to an employee. Note: Each employee can only have one active leave structure assignment.
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.inputGroup}>
                            <label>Employee</label>
                            <select
                                value={userId}
                                onChange={e => {
                                    setUserId(e.target.value);
                                    if (errors.user_id) setErrors(prev => ({ ...prev, user_id: false }));
                                }}
                                disabled={!!editData}
                                className={errors.user_id ? styles.error : ''}
                                required
                            >
                                <option value="">Select Employee</option>
                                {availableUsers.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || `User ${u.id}`}
                                        {u.email ? ` (${u.email})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Leave Structure</label>
                            <select
                                value={structureId}
                                onChange={e => {
                                    setStructureId(e.target.value);
                                    if (errors.structure_id) setErrors(prev => ({ ...prev, structure_id: false }));
                                }}
                                className={errors.structure_id ? styles.error : ''}
                                required
                            >
                                <option value="">Select Structure</option>
                                {structures.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" className={styles.secondaryBtn} onClick={onClose}>Cancel</button>
                        <button type="submit" className={styles.primaryBtn}>
                            {editData ? 'Update Assignment' : 'Assign'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   SetLeaveBalanceModal Component
   ───────────────────────────────────────────────────────────── */

const SetLeaveBalanceModal = ({ isOpen, onClose, user, structureName, showToast, refresh }) => {
    const { selectedCompanyId } = useCompanyContext();
    const [currentBalances, setCurrentBalances] = useState({ PL: 0, CL: 0, SL: 0 });
    const [newBalances, setNewBalances] = useState({ PL: '', CL: '', SL: '' });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen || !user) return;
        
        // 1. Reset state immediately on open to avoid showing stale data from previous user
        setCurrentBalances({ PL: 0, CL: 0, SL: 0 });
        setNewBalances({ PL: 0, CL: 0, SL: 0 });
        
        let isMounted = true;
        const fetchBalance = async () => {
            if (!selectedCompanyId) return;
            setLoading(true);
            try {
                const res = await API.get(`/leave-balance/${user.id}?company_id=${selectedCompanyId}`);
                if (isMounted) {
                    const data = res.data;
                    const balances = {
                        PL: data.PL?.has_snapshot ? (data.PL.remaining ?? 0) : 0,
                        CL: data.CL?.has_snapshot ? (data.CL.remaining ?? 0) : 0,
                        SL: data.SL?.has_snapshot ? (data.SL.remaining ?? 0) : 0
                    };
                    setCurrentBalances(balances);
                    setNewBalances(balances);
                }
            } catch (err) {
                if (isMounted) {
                    // 2. Ensure state is explicitly set to 0 on error (e.g. 404 for new users)
                    setCurrentBalances({ PL: 0, CL: 0, SL: 0 });
                    setNewBalances({ PL: 0, CL: 0, SL: 0 });
                    
                    // Only show error if it's not a 404 (we expect 404 for newly assigned users)
                    if (err.response?.status !== 404) {
                        showToast('Failed to load current balances: ' + (err.response?.data?.detail || err.message), 'error');
                    }
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchBalance();
        
        return () => { isMounted = false; };
    }, [isOpen, user, showToast, selectedCompanyId]);

    const handleInputChange = (type, val) => {
        setNewBalances(prev => ({
            ...prev,
            [type]: val
        }));
    };

    const hasChanges = () => {
        return ['PL', 'CL', 'SL'].some(type => {
            const current = currentBalances[type];
            const newVal = newBalances[type];
            return newVal !== '' && Number(newVal) !== current;
        });
    };

    const handleSave = async () => {
        if (!hasChanges()) {
            showToast('No changes detected', 'info');
            return;
        }

        const payload = {
            user_id: user.id,
            company_id: Number(selectedCompanyId),
            balances: {
                PL: newBalances.PL !== '' ? Number(newBalances.PL) : currentBalances.PL,
                CL: newBalances.CL !== '' ? Number(newBalances.CL) : currentBalances.CL,
                SL: newBalances.SL !== '' ? Number(newBalances.SL) : currentBalances.SL
            }
        };

        setSaving(true);
        try {
            await API.post('/leave-balance/set', payload);
            showToast('Balance updated successfully', 'success');
            if (refresh) refresh();
            onClose();
        } catch (err) {
            showToast('Failed to save balances: ' + (err.response?.data?.detail || err.message), 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className={styles.modalOverlay} onMouseDown={onClose}>
            <div className={styles.modalCard} onMouseDown={e => e.stopPropagation()} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.modalHeader}>
                    <h3>Set Leave Balance</h3>
                    <button className={styles.closeBtn} onClick={onClose} disabled={saving}>&times;</button>
                </div>

                <div className={styles.modalBody} style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                    <div className={styles.formGrid}>
                        <p className={styles.subtitle} style={{ marginTop: '0', marginBottom: '0' }}>Adjust current leave balance for this employee.</p>
                        
                        <div className={styles.infoBox}>
                            <p style={{ margin: '0 0 4px' }}><strong>Employee:</strong> {user.name}</p>
                            <p style={{ margin: 0 }}><strong>Structure:</strong> {structureName || 'None'}</p>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading balances...</div>
                        ) : (
                            <>
                                <div className={styles.configTableContainer}>
                                    <table className={styles.configTable}>
                                        <thead>
                                            <tr>
                                                <th>Leave Type</th>
                                                <th>Current Balance</th>
                                                <th>Set New Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {['PL', 'CL', 'SL'].map(type => (
                                                <tr key={type}>
                                                    <td data-label="Leave Type"><strong>{type}</strong></td>
                                                    <td data-label="Current Balance">{currentBalances[type]}</td>
                                                    <td data-label="Set New Balance" style={{ padding: '0.4rem 0.6rem' }}>
                                                        <input 
                                                            type="number"
                                                            value={newBalances[type]}
                                                            onChange={e => handleInputChange(type, e.target.value)}
                                                            min="0"
                                                            step="0.5"
                                                            placeholder="New balance"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className={styles.infoBox} style={{ fontSize: '0.9em', fontStyle: 'italic', background: '#f8fafc', borderLeftColor: '#94a3b8', color: '#475569', marginTop: '0.5rem' }}>
                                    Note: This sets the current balance. Future accruals will continue automatically.
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.modalActions} style={{ marginTop: '0', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
                    <button type="button" className={styles.secondaryBtn} onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="button" className={styles.primaryBtn} onClick={handleSave} disabled={loading || saving || !hasChanges()}>
                        {saving ? 'Saving...' : 'Save Balance'}
                    </button>
                </div>
            </div>
        </div>
    );
};
