import React, { useState } from 'react';
import styles from '../pages/styles/UserManagement.module.css';

const UserFormModal = ({ user, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    position: user?.position || '',
    start_date: user?.start_date || '',
    end_date: user?.end_date || '',
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

    // Password is only required for New User
    const isPasswordRequired = !user;

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

    // Prepare payload (avoid empty strings for optional dates)
    const payload = { ...formData };
    if (!payload.start_date) delete payload.start_date;
    if (!payload.end_date) delete payload.end_date;
    
    // Cleanup for submission
    if (user) {
      delete payload.password;
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
          <div className={styles.inputGroup}>
            <label>First Name</label>
            <input 
              name="first_name" 
              value={formData.first_name} 
              onChange={handleChange} 
              placeholder="Ankit"
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Last Name</label>
            <input 
              name="last_name" 
              value={formData.last_name} 
              onChange={handleChange} 
              placeholder="Sharma"
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
          <div className={styles.inputGroup}>
            <label>Position</label>
            <input
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Start Date</label>
            <input
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>End Date</label>
            <input
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={handleChange}
            />
          </div>
          
          {/* Show password fields ONLY for New User */}
          {!user && (
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
                <option value="INTERN">INTERN</option>
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
