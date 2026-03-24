import React, { useState, useEffect } from 'react';
import styles from '../styles/UserManagement.module.css';

const UserFormModal = ({ isOpen, onClose, onSubmit, user }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE',
    password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'EMPLOYEE',
        password: '',
        confirm_password: ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'EMPLOYEE',
        password: '',
        confirm_password: ''
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const roles = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{user ? 'Edit User' : 'Add New User'}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className={styles.input} 
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              className={styles.input} 
              required 
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Phone Number</label>
            <input 
              type="text" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              className={styles.input} 
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Role</label>
            <select 
              name="role" 
              value={formData.role} 
              onChange={handleChange} 
              className={styles.select}
            >
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          
          {!user && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  className={styles.input} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Confirm Password</label>
                <input 
                  type="password" 
                  name="confirm_password" 
                  value={formData.confirm_password} 
                  onChange={handleChange} 
                  className={styles.input} 
                  required 
                />
              </div>
            </>
          )}

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Discard</button>
            <button type="submit" className={styles.confirmBtn}>{user ? 'Update' : 'Create New'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
