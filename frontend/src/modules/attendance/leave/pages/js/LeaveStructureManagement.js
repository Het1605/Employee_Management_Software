import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../../../../layout/MainLayout/js/MainLayout';
import API from '../../../../../core/api/apiClient';
import { useToast } from '../../../../../contexts/ToastContext';
import { handleApiError } from '../../../../../utils/errorHandler';
import styles from '../styles/LeaveStructureManagement.module.css';

const LeaveStructureManagement = () => {
    const { showToast } = useToast();
    const role = (localStorage.getItem('role') || 'EMPLOYEE').toUpperCase();
    const isAdminOrHR = ['ADMIN', 'HR'].includes(role);

    const [activeTab, setActiveTab] = useState('structures');
    const [structures, setStructures] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [structRes, assignRes, userRes] = await Promise.all([
                API.get('/leave-structures'),
                API.get('/leave-assignments'),
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
    }, [showToast]);

    useEffect(() => {
        if (isAdminOrHR) {
            fetchData();
        }
    }, [isAdminOrHR, fetchData]);

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

const LeaveStructuresTab = ({ structures, refresh, showToast }) => {
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
                    <button className="btn-primary-action">+ Create Structure</button>
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
                                    <button className={styles.iconBtn} title="Edit"><EditIcon /></button>
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

