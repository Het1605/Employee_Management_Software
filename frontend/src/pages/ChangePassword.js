import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import styles from '../styles/Login.module.css';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const email = localStorage.getItem('userEmail');
    if (!email) {
      setError('Session expired. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/change-password', 
        {
          old_password: formData.old_password,
          new_password: formData.new_password
        },
        {
          headers: { 'X-User-Email': email }
        }
      );
      setMessage('Password changed successfully! Redirecting to login...');
      setTimeout(() => navigate('/'), 2500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Change password failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.title}>Change Password</h2>
        <p className={styles.subtitle}>Enter your details to update your password</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Old Password</label>
            <input 
              type="password" 
              name="old_password"
              className={styles.input} 
              value={formData.old_password} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
            <label className={styles.label}>New Password</label>
            <input 
              type="password" 
              name="new_password"
              className={styles.input} 
              value={formData.new_password} 
              onChange={handleChange} 
              required 
            />
          </div>

          {error && <p className={styles.error} style={{ marginTop: '1rem' }}>{error}</p>}
          {message && <p style={{ color: '#059669', fontSize: '0.875rem', marginTop: '1rem' }}>{message}</p>}

          <button type="submit" className={styles.button} disabled={loading} style={{ marginTop: '1.5rem' }}>
            {loading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>Back to Login</a>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
