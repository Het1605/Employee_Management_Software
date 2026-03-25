import React, { useState } from 'react';
import styles from '../../styles/UserManagement.module.css';

const UserFormModal = ({ user, onClose, onSubmit }) => {
  const currentRole = (localStorage.getItem('role') || 'EMPLOYEE').toUpperCase();
  const isAdmin = currentRole === 'ADMIN';

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    confirm_password: '',
    role: user?.role || 'EMPLOYEE',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Common validations for New User OR Admin Editing (since it's now compulsory)
    const isPasswordRequired = !user || (user && isAdmin);

    if (isPasswordRequired) {
      if (!formData.password) {
        setError('Password is required');
        return;
      }
      if (formData.password !== formData.confirm_password) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
    }

    // Prepare payload
    const payload = { ...formData };
    
    // Cleanup for submission
    if (user) {
      if (!isAdmin) {
        // If non-admin is editing, they shouldn't be sending password fields at all
        delete payload.password;
      }
      delete payload.confirm_password;
    }
    
    onSubmit(payload);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{user ? 'Edit User' : 'Add New User'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        
        {error && <p style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fee2e2', fontSize: '0.875rem' }}>{error}</p>}
        
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
            <label>Full Name</label>
            <input 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="John Doe"
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Email Address</label>
            <input 
              name="email" 
              type="email"
              value={formData.email} 
              onChange={handleChange} 
              placeholder="john@example.com"
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Phone Number</label>
            <input 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              placeholder="+1 234 567 890"
            />
          </div>
          
          {/* Show password fields:
              1. Always for New User
              2. For Edit Mode ONLY if current user is ADMIN (now compulsory)
          */}
          {(!user || (user && isAdmin)) && (
            <>
              <div className={styles.inputGroup}>
                <label>Password</label>
                <input 
                  name="password" 
                  type="password" 
                  value={formData.password}
                  onChange={handleChange} 
                  placeholder="••••••••"
                  required 
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Confirm Password</label>
                <input 
                  name="confirm_password" 
                  type="password" 
                  value={formData.confirm_password}
                  onChange={handleChange} 
                  placeholder="••••••••"
                  required 
                />
              </div>
            </>
          )}

          <div className={styles.fullWidth}>
            <div className={styles.inputGroup}>
              <label>System Role</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="ADMIN">ADMIN</option>
                <option value="HR">HR</option>
                <option value="MANAGER">MANAGER</option>
                <option value="EMPLOYEE">EMPLOYEE</option>
              </select>
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>
              {user ? 'Update Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
