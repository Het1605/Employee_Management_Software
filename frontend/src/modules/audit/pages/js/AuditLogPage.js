import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Filter, 
    History, 
    ArrowRight, 
    Calendar,
    Scale,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import API from '../../../../core/api/apiClient';
import { useCompanyContext } from '../../../../contexts/CompanyContext';
import styles from '../styles/AuditLogPage.module.css';

const AuditLogPage = () => {
    const { selectedCompanyId } = useCompanyContext();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    useEffect(() => {
        if (selectedCompanyId) {
            fetchLogs();
        }
    }, [selectedCompanyId]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/leave-requests/activity-logs?company_id=${selectedCompanyId}`);
            setLogs(res.data);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'BALANCE_SET': return <Scale size={20} />;
            case 'APPROVED': return <CheckCircle2 size={20} />;
            case 'REJECTED': return <XCircle size={20} />;
            default: return <History size={20} />;
        }
    };

    const getActionClass = (action) => {
        switch (action) {
            case 'BALANCE_SET': return styles.adjustment;
            case 'APPROVED': return styles.approved;
            case 'REJECTED': return styles.rejected;
            default: return '';
        }
    };

    const getActionLabel = (action) => {
        switch (action) {
            case 'BALANCE_SET': return 'Balance Adjustment';
            case 'APPROVED': return 'Leave Approved';
            case 'REJECTED': return 'Leave Rejected';
            default: return action;
        }
    };

    const filteredLogs = logs.filter(log => {
        const userName = `${log.user?.first_name || ''} ${log.user?.last_name || ''}`.toLowerCase();
        const leaveType = (log.leave_type || '').toLowerCase();
        const actionLabel = getActionLabel(log.action).toLowerCase();
        const search = searchTerm.toLowerCase();

        const matchesSearch = 
            userName.includes(search) || 
            leaveType.includes(search) || 
            actionLabel.includes(search);

        const matchesFilter = filterType === 'ALL' || log.action === filterType;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Audit Management</h1>
                <p>Track leave balance adjustments and workflow history</p>
            </div>

            <div className={styles.controls}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by User..." 
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select 
                    className={styles.filterSelect}
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="ALL">All Activities</option>
                    <option value="BALANCE_SET">Adjustments Only</option>
                    <option value="APPROVED">Approvals Only</option>
                    <option value="REJECTED">Rejections Only</option>
                </select>
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading activity logs...</div>
            ) : filteredLogs.length === 0 ? (
                <div className={styles.emptyState}>No activity logs found.</div>
            ) : (
                <div className={styles.logList}>
                    {filteredLogs.map(log => {
                        return (
                            <div key={log.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.actionInfo}>
                                        <div className={`${styles.iconBox} ${getActionClass(log.action)}`}>
                                            {getActionIcon(log.action)}
                                        </div>
                                        <div>
                                            <h3 className={styles.actionTitle}>{getActionLabel(log.action)}</h3>
                                            <span className={styles.timestamp}>{formatDate(log.timestamp)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.cardBody}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>User</span>
                                        <span className={styles.value}>
                                            {log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Unknown User'}
                                        </span>
                                    </div>

                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>leave_type</span>
                                        <span className={styles.value}>{log.leave_type}</span>
                                    </div>

                                    <div className={styles.infoItem} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                        <span className={styles.label}>Balance Change</span>
                                        <div className={styles.multiMonthContainer}>
                                            {(log.balance_changes || []).map((change, index) => {
                                                const before = parseFloat(change.before || 0);
                                                const after = parseFloat(change.after || 0);
                                                const delta = after - before;
                                                return (
                                                    <div key={index} className={styles.balanceRow}>
                                                        <span className={styles.monthLabel}>{change.month}</span>
                                                        <div className={styles.adjustmentLine}>
                                                            <span className={styles.value}>{before.toFixed(2)}</span>
                                                            <ArrowRight size={12} className={styles.arrow} />
                                                            <span className={`${styles.value} ${styles.highlight}`}>
                                                                {after.toFixed(2)}
                                                            </span>
                                                            {delta !== 0 && (
                                                                <span className={`${styles.delta} ${delta > 0 ? styles.plus : styles.minus}`}>
                                                                    {delta > 0 ? '+' : ''}{delta.toFixed(2)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {log.details && log.details.start_date && (
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Period ({log.details.total_days} Days)</span>
                                            <div className={styles.value} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Calendar size={14} />
                                                {log.details.start_date} - {log.details.end_date}
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>Action By</span>
                                        <span className={styles.value} style={{ textTransform: 'capitalize' }}>
                                            {log.action_by_role ? log.action_by_role.toLowerCase() : 'System'}{' '}
                                            ({log.admin?.first_name || 'System'})
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AuditLogPage;
