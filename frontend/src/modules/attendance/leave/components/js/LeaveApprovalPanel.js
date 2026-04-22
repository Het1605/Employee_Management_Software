import React, { useState, useEffect, useCallback } from 'react';
import API from '../../../../../core/api/apiClient';
import { useCompanyContext } from '../../../../../contexts/CompanyContext';
import { useToast } from '../../../../../contexts/ToastContext';
import styles from '../styles/LeaveApprovalPanel.module.css';
import LeaveEditModal from './LeaveEditModal';

const ViewIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const DeleteIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
);

const EditIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);

const LeaveApprovalPanel = ({ refreshTrigger, onActionComplete }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [viewingReason, setViewingReason] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editingLeave, setEditingLeave] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const { selectedCompanyId } = useCompanyContext();
    const { showToast } = useToast();

    const fetchRequests = useCallback(async () => {
        if (!selectedCompanyId) {
            setRequests([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await API.get(`/leave-requests?company_id=${parseInt(selectedCompanyId, 10)}`);
            setRequests(res.data);
        } catch (err) {
            console.error("Failed to fetch all leave requests", err);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests, refreshTrigger, selectedCompanyId]);

    const handleSaveEdit = (updated) => {
        setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
        showToast('Leave request updated successfully');
        if (onActionComplete) onActionComplete();
    };

    const handleAction = async (id, status) => {
        setProcessingId(id);
        try {
            await API.put(`/leave-requests/${id}/approve-reject`, { status });
            await fetchRequests();
            if (onActionComplete) {
                onActionComplete();
            }
        } catch (err) {
            console.error(`Failed to ${status} request`, err);
            alert(`Failed to complete action: ${err.response?.data?.detail || err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setDeleting(true);
        try {
            await API.delete(`/leave-requests/${deleteConfirm.id}`);
            showToast('Leave request deleted successfully');
            setDeleteConfirm(null);
            setRequests(prev => prev.filter(r => r.id !== deleteConfirm.id));
            if (onActionComplete) {
                onActionComplete();
            }
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to delete leave request';
            showToast(errorMsg, 'error');
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const isPending = (status) => status?.toLowerCase() === 'pending';

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h2 className={styles.title}>Leave Approval Management</h2>
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className={styles.emptyState}>No leave requests exist for the company.</div>
            ) : (
                <div className={styles.cardList}>
                    {requests.map((req) => (
                        <div key={req.id} className={styles.mobileCard}>
                            <div className={styles.cardRow}>
                                <span className={styles.cardLabel}>Employee:</span>
                                <span className={styles.cardValue}>
                                    {req.user ? `${req.user.first_name} ${req.user.last_name}` : `User #${req.user_id}`}
                                </span>
                            </div>
                            <div className={styles.cardRow}>
                                <span className={styles.cardLabel}>Applied On:</span>
                                <span className={styles.cardValue}>{formatDate(req.applied_at)}</span>
                            </div>
                            <div className={styles.cardRow}>
                                <span className={styles.cardLabel}>Leave Type:</span>
                                <span className={styles.cardValue}>
                                    <strong>{req.leave_category}</strong> ({req.leave_duration_type === 'FULL_DAY' ? 'Full Day' : 'Half Day'})
                                </span>
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
                                <span className={styles.cardValue}>{req.total_days} {req.total_days === 1 || req.total_days === 0.5 ? 'Day' : 'Days'}</span>
                            </div>
                            <div className={styles.cardRow}>
                                <span className={styles.cardLabel}>Reason:</span>
                                <span className={styles.cardValue}>
                                    {req.reason && req.reason !== '-' ? (
                                        <button 
                                            className={styles.viewReasonBtn} 
                                            onClick={() => setViewingReason(req.reason)}
                                            title="View Full Reason"
                                        >
                                            <ViewIcon />
                                        </button>
                                    ) : (
                                        '-'
                                    )}
                                </span>
                            </div>
                            <div className={styles.cardRow}>
                                <span className={styles.cardLabel}>Status:</span>
                                <span className={styles.cardValue}>
                                    <span className={`${styles.badge} ${styles[req.status.toLowerCase()] || ''}`}>
                                        {req.status}
                                    </span>
                                </span>
                            </div>
                            <div className={styles.cardActions}>
                                <span className={styles.cardLabel}>Actions:</span>
                                <div className={styles.actionGroup}>
                                    {(req.status === 'pending' || req.status === 'rejected') && (
                                        <button 
                                            className={styles.approveBtn}
                                            onClick={() => handleAction(req.id, 'approved')}
                                            disabled={processingId === req.id}
                                        >
                                            Approve
                                        </button>
                                    )}
                                    {(req.status === 'pending' || req.status === 'approved') && (
                                        <button 
                                            className={styles.rejectBtn}
                                            onClick={() => handleAction(req.id, 'rejected')}
                                            disabled={processingId === req.id}
                                        >
                                            Reject
                                        </button>
                                    )}
                                    
                                    <div className={styles.iconActions}>
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
                                            title="Delete Leave"
                                        >
                                            <DeleteIcon />
                                        </button>
                                    </div>
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
                            <button 
                                className={styles.closeBtn} 
                                onClick={() => setViewingReason(null)}
                                aria-label="Close"
                            >
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
                <div className={styles.modalOverlay} onClick={() => !deleting && setDeleteConfirm(null)}>
                    <div className={styles.confirmCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmIcon}>
                            <DeleteIcon />
                        </div>
                        <h3 className={styles.confirmTitle}>Remove Leave Request</h3>
                        <p className={styles.confirmText}>
                            This will remove the leave request from your view only. It will not be deleted permanently.
                        </p>
                        <div className={styles.confirmActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.confirmDeleteBtn}
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveApprovalPanel;
