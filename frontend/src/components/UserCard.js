import React from 'react';
import styles from '../styles/UserManagement.module.css';

const UserCard = ({ user, onEdit, onDelete }) => {
  return (
    <div className={styles.userCard}>
      <div className={styles.cardHeader}>
        <div className={styles.userRole}>{user.role}</div>
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.userName}>{user.name}</h3>
        <p className={styles.userEmail}>{user.email}</p>
        <p className={styles.userPhone}>{user.phone || 'No phone'}</p>
      </div>
      <div className={styles.cardFooter}>
        <button className={styles.editBtn} onClick={() => onEdit(user)}>Edit</button>
        <button className={styles.deleteBtn} onClick={() => onDelete(user)}>Delete</button>
      </div>
    </div>
  );
};

export default UserCard;
