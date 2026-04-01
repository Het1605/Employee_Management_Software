import React, { useState } from 'react';
import API from '../../../../core/api/apiClient';
import styles from '../styles/Login.module.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      await API.post('/auth/reset-password', { email });
      setMessage('If an account exists with this email, you will receive a reset link shortly.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.title}>Forgot Password</h2>
        <p className={styles.subtitle}>Enter your email to receive a reset link</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input 
              type="email" 
              className={styles.input} 
              placeholder="name@example.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {message && <p style={{ color: '#059669', fontSize: '0.875rem', marginBottom: '1rem' }}>{message}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <a href="/" style={{ fontSize: '0.875rem', color: '#3b82f6', textDecoration: 'none' }}>Back to Login</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
