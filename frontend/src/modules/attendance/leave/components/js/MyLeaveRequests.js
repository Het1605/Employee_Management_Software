import React, { useState, useEffect, useCallback } from 'react';
import API from '../../../../../core/api/apiClient';
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

const MyLeaveRequests = ({ refreshTrigger }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingReason, setViewingReason] = useState(null);

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
                                <span className={styles.cardLabel}>Applied On:</span>
                                <span className={styles.cardValue}>{formatDate(req.applied_at)}</span>
                            </div>
                            <div className={styles.cardRow}>
                                <span className={styles.cardLabel}>Date Range:</span>
                                <span className={styles.cardValue}>{formatDate(req.start_date)} - {formatDate(req.end_date)}</span>
                            </div>
                            <div className={styles.cardRow}>
                                <span className={styles.cardLabel}>Total Days:</span>
                                <span className={styles.cardValue}>{req.total_days} days</span>
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
        </div>
    );
};

export default MyLeaveRequests;
