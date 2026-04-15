import React, { useState, useEffect, useCallback } from 'react';
import API from '../../../../../core/api/apiClient';
import { useToast } from '../../../../../contexts/ToastContext';
import styles from '../styles/MyLeaveRequests.module.css';

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

const EditIcon = () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);

const DeleteIcon = () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
);

const MyLeaveRequests = ({ refreshTrigger }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingReason, setViewingReason] = useState(null);
    const [editingLeave, setEditingLeave] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [processing, setProcessing] = useState(false);
    const { showToast } = useToast();

    // Edit form state
    const [editForm, setEditForm] = useState({
        leave_type: 'FULL_DAY',
        start_date: '',
        end_date: '',
        reason: ''
    });

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get(`/leave-requests/my`);
            setRequests(res.data);
        } catch (err) {
            console.error("Failed to fetch leave requests", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests, refreshTrigger]);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // ─── Edit Handlers ──────────────────────────────────────────────────────
    const openEditModal = (leave) => {
        setEditForm({
            leave_type: leave.leave_type || 'FULL_DAY',
            start_date: leave.start_date,
            end_date: leave.end_date || '',
            reason: leave.reason || ''
        });
        setEditingLeave(leave);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (!editForm.start_date) {
            showToast('Start date is required', 'error');
            return;
        }
        if (editForm.leave_type === 'FULL_DAY' && !editForm.end_date) {
            showToast('End date is required for Full Day leave', 'error');
            return;
        }
        if (editForm.leave_type === 'FULL_DAY' && editForm.start_date > editForm.end_date) {
            showToast('Start date cannot be after end date', 'error');
            return;
        }

        setProcessing(true);
        try {
            const payload = {
                start_date: editForm.start_date,
                end_date: editForm.leave_type === 'HALF_DAY' ? null : editForm.end_date,
                leave_type: editForm.leave_type,
                reason: editForm.reason || null
            };

            await API.patch(`/leave-requests/${editingLeave.id}/edit`, payload);
            showToast('Leave request updated successfully');
            setEditingLeave(null);
            await fetchRequests();
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to update leave request';
            showToast(errorMsg, 'error');
        } finally {
            setProcessing(false);
        }
    };

    // ─── Delete Handlers ────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteConfirm) return;

        setProcessing(true);
        try {
            await API.delete(`/leave-requests/${deleteConfirm.id}/my`);
            showToast('Leave request deleted successfully');
            setDeleteConfirm(null);
            // Remove from state immediately
            setRequests(prev => prev.filter(r => r.id !== deleteConfirm.id));
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to delete leave request';
            showToast(errorMsg, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const canEdit = (status) => ['pending', 'approved'].includes(status?.toLowerCase());

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
                            {/* Action Icons - top right row */}
                            <div className={styles.cardActionIcons}>
                                {canEdit(req.status) && (
                                    <button
                                        className={styles.iconBtn}
                                        onClick={() => openEditModal(req)}
                                        title="Edit Leave"
                                        aria-label="Edit Leave"
                                    >
                                        <EditIcon />
                                    </button>
                                )}
                                <button
                                    className={`${styles.iconBtn} ${styles.deleteIconBtn}`}
                                    onClick={() => setDeleteConfirm(req)}
                                    title="Delete Leave"
                                    aria-label="Delete Leave"
                                >
                                    <DeleteIcon />
                                </button>
                            </div>

                            <div className={styles.cardRow}>
                                <span className={styles.cardLabel}>Applied On:</span>
                                <span className={styles.cardValue}>{formatDate(req.applied_at)}</span>
                            </div>
                            <div className={styles.cardRow}>
                                <span className={styles.cardLabel}>{req.start_date === req.end_date ? 'Date:' : 'Date Range:'}</span>
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
                        </div>
                    ))}
                </div>
            )}

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

            {/* Edit Modal */}
            {editingLeave && (
                <div className={styles.modalOverlay} onClick={() => !processing && setEditingLeave(null)}>
                    <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Edit Leave Request</h3>
                            <button 
                                className={styles.closeBtn} 
                                onClick={() => setEditingLeave(null)}
                                disabled={processing}
                                aria-label="Close"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <form onSubmit={handleEditSubmit} className={styles.editForm}>
                                {/* Leave Type Toggle */}
                                <div className={styles.editFormGroup}>
                                    <label className={styles.editLabel}>Leave Type</label>
                                    <div className={styles.typeToggleContainer}>
                                        <button
                                            type="button"
                                            className={`${styles.typeBtn} ${editForm.leave_type === 'FULL_DAY' ? styles.activeType : ''}`}
                                            onClick={() => setEditForm(prev => ({ ...prev, leave_type: 'FULL_DAY' }))}
                                        >
                                            Full Day
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.typeBtn} ${editForm.leave_type === 'HALF_DAY' ? styles.activeType : ''}`}
                                            onClick={() => setEditForm(prev => ({ ...prev, leave_type: 'HALF_DAY', end_date: '' }))}
                                        >
                                            Half Day
                                        </button>
                                    </div>
                                </div>

                                {/* Start Date */}
                                <div className={styles.editFormGroup}>
                                    <label className={styles.editLabel}>
                                        {editForm.leave_type === 'HALF_DAY' ? 'Date' : 'Start Date'}
                                    </label>
                                    <input
                                        type="date"
                                        className={styles.editInput}
                                        value={editForm.start_date}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value }))}
                                        required
                                    />
                                </div>

                                {/* End Date (only FULL_DAY) */}
                                {editForm.leave_type === 'FULL_DAY' && (
                                    <div className={styles.editFormGroup}>
                                        <label className={styles.editLabel}>End Date</label>
                                        <input
                                            type="date"
                                            className={styles.editInput}
                                            value={editForm.end_date}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
                                            required
                                        />
                                    </div>
                                )}

                                {/* Reason */}
                                <div className={styles.editFormGroup}>
                                    <label className={styles.editLabel}>Reason (Optional)</label>
                                    <textarea
                                        className={styles.editTextarea}
                                        value={editForm.reason}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, reason: e.target.value }))}
                                        placeholder="Enter reason for leave..."
                                    />
                                </div>

                                {/* Buttons */}
                                <div className={styles.editFormActions}>
                                    <button
                                        type="button"
                                        className={styles.cancelBtn}
                                        onClick={() => setEditingLeave(null)}
                                        disabled={processing}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.saveBtn}
                                        disabled={processing}
                                    >
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className={styles.modalOverlay} onClick={() => !processing && setDeleteConfirm(null)}>
                    <div className={styles.confirmCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmIcon}>
                            <DeleteIcon />
                        </div>
                        <h3 className={styles.confirmTitle}>Delete Leave Request</h3>
                        <p className={styles.confirmText}>
                            Are you sure you want to delete this leave request?
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
