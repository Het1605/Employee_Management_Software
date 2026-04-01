import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../../core/api/apiClient';
import styles from '../styles/Login.module.css';

const ChangePassword = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        const userEmail = localStorage.getItem('userEmail');

        try {
            await API.post('/auth/change-password', 
                { old_password: oldPassword, new_password: newPassword },
                { headers: { 'X-User-Email': userEmail } }
            );
            setMessage('Password changed successfully. Please log in with your new password.');
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.card}>
                <h2 className={styles.title}>Change Password</h2>
                <p className={styles.subtitle}>Update your security credentials</p>
                <form onSubmit={handleChangePassword} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Old Password</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>New Password</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className={styles.error}>{error}</p>}
                    {message && <p style={{ color: '#059669', fontSize: '0.875rem', marginBottom: '1rem' }}>{message}</p>}
                    <button type="submit" className={styles.button} disabled={loading}>
                        {loading ? 'Updating...' : 'Change Password'}
                    </button>
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <a href="/" style={{ fontSize: '0.875rem', color: '#3b82f6', textDecoration: 'none' }}>Back to Login</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
