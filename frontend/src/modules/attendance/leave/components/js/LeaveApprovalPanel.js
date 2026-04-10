import React, { useState, useEffect, useCallback } from 'react';
import API from '../../../../../core/api/apiClient';
import { useCompanyContext } from '../../../../../contexts/CompanyContext';
import styles from '../styles/LeaveApprovalPanel.module.css';const ViewIcon = () => (
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

const LeaveApprovalPanel = ({ refreshTrigger, onActionComplete }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [viewingReason, setViewingReason] = useState(null);
    const { selectedCompanyId } = useCompanyContext();

    const fetchRequests = useCallback(async () => {
        // If no company is selected yet, don't try to fetch (prevents 422 errors)
        if (!selectedCompanyId) {
            setRequests([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // company_id is required by the backend to isolate records
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

    const handleAction = async (id, status) => {
        setProcessingId(id);
        try {
            await API.put(`/leave-requests/${id}`, { status });
            // Re-fetch automatically to refresh local state 
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

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

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
                                </div>
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
        </div>
    );
};

export default LeaveApprovalPanel;
