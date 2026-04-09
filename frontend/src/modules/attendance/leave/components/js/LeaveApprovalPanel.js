import React, { useState, useEffect, useCallback } from 'react';
import API from '../../../../../core/api/apiClient';
import { useCompanyContext } from '../../../../../contexts/CompanyContext';
import styles from '../styles/LeaveApprovalPanel.module.css';

const EditIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const LeaveApprovalPanel = ({ refreshTrigger, onActionComplete }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
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
            setUpdatingId(null);
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
                                        ) : updatingId === req.id ? (
                                            <div className={styles.actions}>
                                                {req.status === 'rejected' && (
                                                    <button 
                                                        className={styles.approveBtn}
                                                        onClick={() => handleAction(req.id, 'approved')}
                                                        disabled={processingId === req.id}
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {req.status === 'approved' && (
                                                    <button 
                                                        className={styles.rejectBtn}
                                                        onClick={() => handleAction(req.id, 'rejected')}
                                                        disabled={processingId === req.id}
                                                    >
                                                        Reject
                                                    </button>
                                                )}
                                                <button 
                                                    className={styles.cancelBtn}
                                                    onClick={() => setUpdatingId(null)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                className={styles.iconBtn}
                                                onClick={() => setUpdatingId(req.id)}
                                                title="Update Decision"
                                            >
                                                <EditIcon />
                                            </button>
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
