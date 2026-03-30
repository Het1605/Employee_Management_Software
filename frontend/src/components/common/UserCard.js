import React from 'react';
import styles from '../../styles/UserManagement.module.css';

const EditIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const UserCard = ({ user, onEdit, onDelete, onChangePassword, onStatusChange }) => {
  const currentUserRole = localStorage.getItem('role');
  const isAdmin = currentUserRole === 'ADMIN';

  return (
    <div className={styles.userCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.userName} title={user.full_name}>
          {user.full_name}
        </h3>
        <span className={`${styles.userRole} ${styles[user.role.toLowerCase()]}`}>
          {user.role}
        </span>
      </div>
      
      <div className={styles.cardBody}>
        <p className={styles.userEmail}>{user.email}</p>
        <p className={styles.userPhone}>{user.phone || 'No phone'}</p>
      </div>

      <div className={styles.cardActions}>
        <div className={styles.statusToggle}>
          <label className={styles.switch}>
            <input 
              type="checkbox" 
              checked={user.is_active} 
              onChange={(e) => onStatusChange(user.id, e.target.checked)}
            />
            <span className={styles.slider}></span>
          </label>
          <span className={styles.statusLabel}>
            {user.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className={styles.actionButtons}>
          <button 
            className={styles.iconBtn} 
            onClick={() => onEdit(user)}
            title="Edit User"
          >
            <EditIcon />
          </button>
          
          {isAdmin && (
            <button 
              className={styles.iconBtn} 
              onClick={() => onChangePassword(user)}
              title="Change Password"
            >
              <LockIcon />
            </button>
          )}
          
          <button 
            className={`${styles.iconBtn} ${styles.delete}`} 
            onClick={() => onDelete(user)}
            title="Delete User"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
