import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../../../../core/api/apiClient';
import styles from '../styles/Login.module.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await API.post('/auth/reset-password-confirm', { token, new_password: password });
      setMessage('Password reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <p className={styles.error}>Invalid or missing reset token.</p>
          <a href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>Go back to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.title}>Reset Password</h2>
        <p className={styles.subtitle}>Enter your new password below</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>New Password</label>
            <input 
              type="password" 
              className={styles.input} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Confirm New Password</label>
            <input 
              type="password" 
              className={styles.input} 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {message && <p style={{ color: '#059669', fontSize: '0.875rem', marginBottom: '1rem' }}>{message}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
