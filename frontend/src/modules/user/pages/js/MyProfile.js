import React, { useState, useEffect } from 'react';
import MainLayout from '../../../../layout/MainLayout/js/MainLayout';
import { fetchUserProfile } from '../../services/userService';
import styles from '../styles/MyProfile.module.css';

const MyProfile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) return <p>Loading profile...</p>;

    return (
        <>
            <div className={styles.profileContainer}>
                <div className={styles.profileHeader}>
                    <h1 className={styles.title}>Account Settings</h1>
                    <p className={styles.subtitle}>View your account details and login information.</p>
                </div>

                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Account Information</h2>
                    
                    <div className={styles.detailsGrid}>
                        <div className={styles.detailItem}>
                            <span className={styles.detailItemLabel}>Username / Email</span>
                            <span className={styles.detailItemValue}>{user.email}</span>
                        </div>
                    </div>
                </div>

                {error && <p style={{ color: '#991b1b', marginTop: '1rem', fontWeight: '500' }}>❌ {error}</p>}
            </div>
        </>
    );
};

export default MyProfile;
