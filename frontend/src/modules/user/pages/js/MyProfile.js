import React, { useState, useEffect } from 'react';
import MainLayout from '../../../../layout/MainLayout/js/MainLayout';
import { fetchUserProfile } from '../../services/userService';
import API from '../../../../core/api/apiClient';
import styles from '../styles/MyProfile.module.css';
import modalStyles from '../../../user/components/ChangePasswordModal.module.css';

const MyProfile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Modal State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState('');
    const [modalSuccess, setModalSuccess] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await fetchUserProfile();
            setUser(response.data);
        } catch (err) {
            console.error("Failed to load profile", err);
            setError("Could not load profile details.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setIsPasswordModalOpen(true);
        setModalError('');
        setModalSuccess('');
        setOldPassword('');
        setNewPassword('');
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalError('');
        setModalSuccess('');

        const userEmail = localStorage.getItem('userEmail');

        try {
            await API.post('/auth/change-password', 
                { old_password: oldPassword, new_password: newPassword },
                { headers: { 'X-User-Email': userEmail } }
            );
            setModalSuccess('Password changed successfully.');
            setTimeout(() => {
                setIsPasswordModalOpen(false);
            }, 1500);
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                // Handle FastAPI validation errors (list of objects)
                setModalError(detail[0]?.msg || 'Validation error occurred');
            } else if (typeof detail === 'object' && detail !== null) {
                setModalError(JSON.stringify(detail));
            } else {
                setModalError(detail || 'Failed to change password');
            }
        } finally {
            setModalLoading(false);
        }
    };

    if (loading) return <p>Loading profile...</p>;

    return (
        <>
            <div className={styles.profileContainer}>
                <div className={styles.profileHeader}>
                    <h1 className={styles.title}>Account Settings</h1>
                    <p className={styles.subtitle}>View your account details and login information.</p>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Account Information</h2>
                        <button 
                            className={styles.changePasswordBtn}
                            onClick={handleOpenModal}
                        >
                            Change Password
                        </button>
                    </div>

                    <div className={styles.detailsGrid}>
                        <div className={styles.detailItem}>
                            <span className={styles.detailItemLabel}>Username / Email</span>
                            <span className={styles.detailItemValue}>{user.email}</span>
                        </div>
                    </div>
                </div>

                {error && <p style={{ color: '#991b1b', marginTop: '1rem', fontWeight: '500' }}>❌ {error}</p>}
            </div>

            {/* Change Password Modal */}
            {isPasswordModalOpen && (
                <div className={modalStyles.modalOverlay} onClick={() => setIsPasswordModalOpen(false)}>
                    <div className={modalStyles.modalCard} onClick={e => e.stopPropagation()}>
                        <div className={modalStyles.modalHeader}>
                            <h3 className={modalStyles.modalTitle}>Change Password</h3>
                            <button className={modalStyles.closeBtn} onClick={() => setIsPasswordModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        
                        <div className={modalStyles.modalBody}>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                Update your account security by changing your current password.
                            </p>

                            <form onSubmit={handleModalSubmit} className={modalStyles.form}>
                                <div className={modalStyles.inputGroup}>
                                    <label className={modalStyles.label}>Old Password</label>
                                    <input
                                        type="password"
                                        className={modalStyles.input}
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                    />
                                </div>
                                
                                <div className={modalStyles.inputGroup}>
                                    <label className={modalStyles.label}>New Password</label>
                                    <input
                                        type="password"
                                        className={modalStyles.input}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                    />
                                </div>

                                {modalError && <div className={modalStyles.errorMsg}>{modalError}</div>}
                                {modalSuccess && <div style={{ color: '#059669', fontSize: '0.875rem', marginTop: '0.5rem', textAlign: 'center' }}>{modalSuccess}</div>}

                                <div className={modalStyles.buttonGroup}>
                                    <button 
                                        type="button" 
                                        className={modalStyles.cancelBtn} 
                                        onClick={() => setIsPasswordModalOpen(false)}
                                        disabled={modalLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className={modalStyles.submitBtn} 
                                        disabled={modalLoading}
                                    >
                                        {modalLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MyProfile;
