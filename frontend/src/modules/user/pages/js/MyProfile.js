import React, { useState, useEffect } from 'react';
import MainLayout from '../../../../layout/MainLayout/js/MainLayout';
import { fetchUserProfile, submitResignation } from '../../services/userService';
import styles from '../styles/MyProfile.module.css';

const MyProfile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [resignationDate, setResignationDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await fetchUserProfile();
            setUser(response.data);
            if (response.data.end_date) {
                setResignationDate(response.data.end_date);
            }
        } catch (err) {
            console.error("Failed to load profile", err);
            setError("Could not load profile details.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            await submitResignation(resignationDate);
            setSuccessMsg("Resignation submitted successfully.");
            setShowConfirm(false);
            loadProfile(); // Refresh profile to show new status
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to submit resignation.");
            setShowConfirm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <MainLayout title="My Profile"><p>Loading profile...</p></MainLayout>;

    const getStatusInfo = () => {
        if (!user.end_date) return { label: 'Active', class: styles.statusActive, dot: '🟢' };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(user.end_date);
        
        if (endDate >= today) return { label: 'Resigned (Pending)', class: styles.statusResigned, dot: '🟡' };
        return { label: 'Inactive', class: styles.statusInactive, dot: '🔴' };
    };

    const statusObj = getStatusInfo();
    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <MainLayout title="My Profile">
            <div className={styles.profileContainer}>
                <div className={styles.profileHeader}>
                    <h1 className={styles.title}>Account Settings</h1>
                    <p className={styles.subtitle}>Manage your employment details and account status.</p>
                </div>

                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Employment Details</h2>
                    
                    <div className={styles.detailsGrid}>
                        <div className={styles.detailItem}>
                            <span className={styles.detailItemLabel}>Username</span>
                            <span className={styles.detailItemValue}>{user.email}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailItemLabel}>Position</span>
                            <span className={styles.detailItemValue}>{user.position || 'Not Assigned'}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailItemLabel}>Joining Date</span>
                            <span className={styles.detailItemValue}>{user.start_date || 'N/A'}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailItemLabel}>Employment Status</span>
                            <span className={`${styles.statusBadge} ${statusObj.class}`}>
                                {statusObj.dot} {statusObj.label}
                            </span>
                        </div>
                    </div>

                    {!user.end_date ? (
                        <div className={styles.resignationSection}>
                            <h3 className={styles.sectionTitle}>Submit Resignation</h3>
                            <div className={styles.inputGroup}>
                                <label className={styles.detailItemLabel}>Last Working Date</label>
                                <input 
                                    type="date" 
                                    className={styles.dateInput}
                                    min={todayStr}
                                    value={resignationDate}
                                    onChange={(e) => setResignationDate(e.target.value)}
                                />
                            </div>
                            
                            <button 
                                className={styles.submitBtn}
                                disabled={!resignationDate || isSubmitting}
                                onClick={() => setShowConfirm(true)}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Resignation'}
                            </button>

                            <div className={styles.infoText}>
                                ℹ️ <strong>Heads up:</strong> After this date, your account will be automatically deactivated and you will lose access to the portal.
                            </div>
                        </div>
                    ) : (
                        <div className={styles.resignationBanner}>
                            📅 Your employment is scheduled to end on <strong>{user.end_date}</strong>.
                        </div>
                    )}
                </div>

                {successMsg && <p style={{ color: '#166534', marginTop: '1rem', fontWeight: '500' }}>✅ {successMsg}</p>}
                {error && <p style={{ color: '#991b1b', marginTop: '1rem', fontWeight: '500' }}>❌ {error}</p>}
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Confirm Resignation</h3>
                        <p>Are you sure you want to submit your resignation for <strong>{resignationDate}</strong>?</p>
                        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>This action can only be reversed by an Administrator.</p>
                        <div className={styles.modalBtns}>
                            <button className={styles.cancelBtn} onClick={() => setShowConfirm(false)}>Cancel</button>
                            <button className={styles.confirmBtn} onClick={handleSubmit}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default MyProfile;
