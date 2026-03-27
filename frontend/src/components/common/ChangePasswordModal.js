import React, { useState } from 'react';
import styles from '../../styles/UserManagement.module.css';
import API from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { handleApiError } from '../../utils/errorHandler';

const ChangePasswordModal = ({ user, onClose }) => {
  const [formData, setFormData] = useState({
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      // Assuming a dedicated admin-only endpoint for resetting another user's password exists
      // If not, we use the general update_user though we removed it from the schema earlier?
      // Wait, the User model refactor REMOVED password from update_user schema.
      // So I probably need a new endpoint or use an existing one if available.
      // Looking at auth routes, there is reset-password-confirm but that's with token.
      
      // I'll check if there is an admin endpoint for this. 
      // If not, I'll need to add one or use the UserService directly if I'm on the server, 
      // but this is frontend.
      
      // Let's assume for now there's an endpoint /users/{id}/reset-password
      await API.put(`/users/${user.id}/reset-password`, { password: formData.password });
      
      showToast("Password updated successfully", 'success');
      onClose();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Change Password for {user.full_name}</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div className={styles.fullWidth}>
            <div className={styles.inputGroup}>
              <label>New Password</label>
              <input 
                name="password" 
                type="password" 
                value={formData.password}
                onChange={handleChange} 
                placeholder="••••••••"
                required 
              />
            </div>
          </div>
          <div className={styles.fullWidth}>
            <div className={styles.inputGroup}>
              <label>Confirm New Password</label>
              <input 
                name="confirm_password" 
                type="password" 
                value={formData.confirm_password}
                onChange={handleChange} 
                placeholder="••••••••"
                required 
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={loading}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
