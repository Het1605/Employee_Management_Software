import React, { useState, useEffect, useCallback } from 'react';
import API from '../../../../../core/api/apiClient';
import { useToast } from '../../../../../contexts/ToastContext';
import { useCompanyContext } from '../../../../../contexts/CompanyContext';
import styles from '../styles/MyLeaveRequests.module.css';
import LeaveEditModal from './LeaveEditModal';

const ViewIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const EditIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);

const TrashIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
);

const MyLeaveRequests = ({ refreshTrigger }) => {
    const { selectedCompanyId } = useCompanyContext();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewingReason, setViewingReason] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editingLeave, setEditingLeave] = useState(null);
    const [processing, setProcessing] = useState(false);
    const { showToast } = useToast();

    const fetchRequests = useCallback(async () => {
        if (!selectedCompanyId) {
            setRequests([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await API.get(`/leave-requests/my?company_id=${selectedCompanyId}`);
            setRequests(res.data);
        } catch (err) {
            console.error("Failed to fetch leave requests", err);
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests, refreshTrigger]);

    const handleSaveEdit = (updated) => {
        setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
        showToast('Leave request updated successfully');
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;

        setProcessing(true);
        try {
            await API.delete(`/leave-requests/${deleteConfirm.id}`);
            showToast('Leave request deleted successfully');
            setDeleteConfirm(null);
            setRequests(prev => prev.filter(r => r.id !== deleteConfirm.id));
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to delete leave request';
            showToast(errorMsg, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusLabel = (status) => status.charAt(0).toUpperCase() + status.slice(1);
    const getDurationLabel = (type) => type === 'FULL_DAY' ? 'Full Day' : 'Half Day';

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h2 className={styles.title}>My Leave Requests</h2>
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className={styles.emptyState}>You have no leave requests.</div>
            ) : (
                <div className={styles.cardList}>
                    {requests.map((req) => (
                        <div key={req.id} className={styles.mobileCard}>
                            <div className={styles.cardRow}>
                                <span className={styles.leaveCategory}>{req.leave_category}</span>
                                <span className={`${styles.badge} ${styles[req.status.toLowerCase()] || ''}`}>
                                    {getStatusLabel(req.status)}
                                </span>
                            </div>

                            <div className={styles.cardRow}>
                                <span className={styles.cardLabel}>Duration:</span>
                                <span className={styles.cardValue}>{getDurationLabel(req.leave_duration_type)}</span>
                            </div>

                            <div className={styles.cardRow}>
                                <span className={styles.cardLabel}>Date Range:</span>
                                <span className={styles.cardValue}>
                                    {req.start_date === req.end_date 
                                        ? formatDate(req.start_date) 
                                        : `${formatDate(req.start_date)} - ${formatDate(req.end_date)}`}
                                </span>
                            </div>

                            <div className={styles.cardRow}>
                                <span className={styles.cardLabel}>Total Days:</span>
                                <span className={styles.cardValue}>{req.total_days}</span>
                            </div>

                            <div className={styles.cardRow}>
                                <span className={styles.cardLabel}>Applied On:</span>
                                <span className={styles.cardValue}>{formatDate(req.applied_at)}</span>
                            </div>

                            <div className={styles.cardActions}>
                                <div className={styles.actionGroup}>
                                    {req.reason && req.reason !== '-' && (
                                        <button 
                                            className={styles.viewReasonBtn} 
                                            onClick={() => setViewingReason(req.reason)}
                                            title="View Reason"
                                        >
                                            <ViewIcon />
                                        </button>
                                    )}
                                    <button
                                        className={styles.iconBtn}
                                        onClick={() => setEditingLeave(req)}
                                        title="Edit Request"
                                    >
                                        <EditIcon />
                                    </button>
                                    <button
                                        className={`${styles.iconBtn} ${styles.deleteIconBtn}`}
                                        onClick={() => setDeleteConfirm(req)}
                                        title={req.status === 'pending' ? "Delete Request" : "Hide Request"}
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            <LeaveEditModal 
                isOpen={!!editingLeave}
                onClose={() => setEditingLeave(null)}
                onSave={handleSaveEdit}
                leaveData={editingLeave}
            />

            {/* Reason Modal */}
            {viewingReason && (
                <div className={styles.modalOverlay} onClick={() => setViewingReason(null)}>
                    <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Leave Reason</h3>
                            <button className={styles.closeBtn} onClick={() => setViewingReason(null)}>
                                <CloseIcon />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p className={styles.fullReason}>{viewingReason}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className={styles.modalOverlay} onClick={() => !processing && setDeleteConfirm(null)}>
                    <div className={styles.confirmCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmIcon}>
                            <TrashIcon />
                        </div>
                        <h3 className={styles.confirmTitle}>
                            {deleteConfirm.status === 'pending' ? 'Delete Leave Request' : 'Remove Leave Request'}
                        </h3>
                        <p className={styles.confirmText}>
                            {deleteConfirm.status === 'pending'
                                ? 'Are you sure you want to permanently delete this leave request? This action cannot be undone.'
                                : 'This will remove the leave request from your view only. It will not be deleted permanently.'}
                        </p>
                        <div className={styles.confirmActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setDeleteConfirm(null)}
                                disabled={processing}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.confirmDeleteBtn}
                                onClick={handleDelete}
                                disabled={processing}
                            >
                                {processing ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyLeaveRequests;
