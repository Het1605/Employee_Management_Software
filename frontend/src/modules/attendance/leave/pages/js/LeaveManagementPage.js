import React, { useState } from 'react';
import MainLayout from '../../../../../layout/MainLayout/js/MainLayout';
import LeaveRequestForm from '../../components/js/LeaveRequestForm';
import MyLeaveRequests from '../../components/js/MyLeaveRequests';
import LeaveApprovalPanel from '../../components/js/LeaveApprovalPanel';
import styles from '../styles/LeaveManagementPage.module.css';

const LeaveManagementPage = () => {
    // Standardized role checking from local storage
    const role = localStorage.getItem('role') || 'EMPLOYEE';
    const isPrivileged = ['ADMIN', 'HR', 'MANAGER'].includes(role.toUpperCase());

    // Trigger state to forcefully refresh nested table components when actions succeed
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <MainLayout title="Leave Management">
            <div className={styles.container}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>Leave Management</h1>
                    <p className={styles.pageSubtitle}>
                        {isPrivileged 
                            ? "Manage your personal leaves and approve pending team requests."
                            : "Apply for leave and track your previously submitted requests."}
                    </p>
                </div>

                {/* Employee / Non-privileged view */}
                {!isPrivileged && (
                    <>
                        <LeaveRequestForm onLeaveCreated={handleRefresh} />
                        <MyLeaveRequests refreshTrigger={refreshTrigger} />
                    </>
                )}

                {/* Only Privileged roles can see the Approval section */}
                {isPrivileged && (
                    <LeaveApprovalPanel refreshTrigger={refreshTrigger} onActionComplete={handleRefresh} />
                )}
            </div>
        </MainLayout>
    );
};

export default LeaveManagementPage;

