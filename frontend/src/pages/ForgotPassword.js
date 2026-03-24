import React, { useState } from 'react';
import API from '../services/api';
import styles from '../styles/Login.module.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { email });
      setMessage('If email exists, reset link sent');
    } catch (err) {
      setMessage('If email exists, reset link sent'); // Generic message even on error for security
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
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          {message && <p style={{ color: '#059669', fontSize: '0.875rem', marginBottom: '1rem' }}>{message}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>Back to Login</a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
