import React, { useState, useEffect, useCallback } from 'react';
import API from '../../../../../core/api/apiClient';
import styles from '../styles/LeaveApprovalPanel.module.css';

const LeaveApprovalPanel = ({ refreshTrigger, onActionComplete }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get(`/leave-requests`);
            setRequests(res.data);
        } catch (err) {
            console.error("Failed to fetch all leave requests", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests, refreshTrigger]);

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
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Employee Name</th>
                                <th>Applied On</th>
                                <th>Date Range</th>
                                <th>Days</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((req) => (
                                <tr key={req.id}>
                                    <td>
                                        {req.user ? `${req.user.first_name} ${req.user.last_name}` : `User #${req.user_id}`}
                                    </td>
                                    <td>{formatDate(req.applied_at)}</td>
                                    <td>{formatDate(req.start_date)} - {formatDate(req.end_date)}</td>
                                    <td>{req.total_days}</td>
                                    <td className={styles.reasonCol}>
                                        <span className={styles.reasonText} title={req.reason || 'N/A'}>
                                            {req.reason || '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${styles[req.status.toLowerCase()] || ''}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td>
                                        {req.status === 'pending' ? (
                                            <div className={styles.actions}>
                                                <button 
                                                    className={styles.approveBtn}
                                                    onClick={() => handleAction(req.id, 'approved')}
                                                    disabled={processingId === req.id}
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    className={styles.rejectBtn}
                                                    onClick={() => handleAction(req.id, 'rejected')}
                                                    disabled={processingId === req.id}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                Reviewed
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default LeaveApprovalPanel;
