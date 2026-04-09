import React, { useState, useEffect, useCallback } from 'react';
import API from '../../../../../core/api/apiClient';
import styles from '../styles/MyLeaveRequests.module.css';

const MyLeaveRequests = ({ refreshTrigger }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

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
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Applied On</th>
                                <th>Date Range</th>
                                <th>Total Days</th>
                                <th>Reason</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((req) => (
                                <tr key={req.id}>
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MyLeaveRequests;
