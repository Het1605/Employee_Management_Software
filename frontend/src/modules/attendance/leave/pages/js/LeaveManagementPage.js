import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCompanyContext } from '../../../../../contexts/CompanyContext';
import MainLayout from '../../../../../layout/MainLayout/js/MainLayout';
import LeaveRequestForm from '../../components/js/LeaveRequestForm';
import MyLeaveRequests from '../../components/js/MyLeaveRequests';
import LeaveApprovalPanel from '../../components/js/LeaveApprovalPanel';
import API from '../../../../../core/api/apiClient';
import styles from '../styles/LeaveManagementPage.module.css';

const LeaveManagementPage = () => {
    const location = useLocation();
    const { selectedCompanyId } = useCompanyContext();
    const isApplyOnly = location.pathname === '/apply-leave';

    // Standardized role checking from local storage
    const role = localStorage.getItem('role') || 'EMPLOYEE';
    const isPrivileged = ['ADMIN', 'HR', 'MANAGER'].includes(role.toUpperCase());

    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [balances, setBalances] = useState({ PL: { remaining: 0 }, CL: { remaining: 0 }, SL: { remaining: 0 } });
    const [loading, setLoading] = useState(false);

    const userId = localStorage.getItem('userId');

    React.useEffect(() => {
        if (userId && selectedCompanyId) {
            fetchBalance();
        }
    }, [userId, refreshTrigger, selectedCompanyId]);

    const fetchBalance = async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const res = await API.get(`/leave-balance/${userId}?company_id=${selectedCompanyId}`);
            if (res.data) {
                setBalances(res.data);
            }
        } catch (err) {
            console.error("Error fetching balance:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();

    const BalanceBar = () => (
        <div className={styles.balanceBar}>
            <span className={styles.balanceLabel}>
                Current Balance ({currentMonth} {currentYear}):
            </span>
            <span className={styles.balanceValues}>
                PL: {balances.PL?.remaining || 0} | CL: {balances.CL?.remaining || 0} | SL: {balances.SL?.remaining || 0}
            </span>
        </div>
    );

    // Logic to decide what to show
    const showApproval = isPrivileged && !isApplyOnly;
    const showApplyForm = !isPrivileged || isApplyOnly;

    return (
        <>
            <div className={styles.container}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>
                        {isApplyOnly ? "Apply for Leave" : "Leave Management"}
                    </h1>
                    <p className={styles.pageSubtitle}>
                        {isApplyOnly 
                            ? "Submit a new leave request and monitor your existing ones."
                            : (isPrivileged 
                                ? "Manage your personal leaves and approve pending team requests."
                                : "Apply for leave and track your previously submitted requests.")
                        }
                    </p>
                </div>

                {showApplyForm && (
                    <>
                        <BalanceBar />
                        <LeaveRequestForm onLeaveCreated={handleRefresh} />
                        <MyLeaveRequests refreshTrigger={refreshTrigger} />
                    </>
                )}

                {showApproval && (
                    <LeaveApprovalPanel refreshTrigger={refreshTrigger} onActionComplete={handleRefresh} />
                )}
            </div>
        </>
    );
};

export default LeaveManagementPage;

