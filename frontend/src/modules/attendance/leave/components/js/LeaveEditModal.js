import React, { useState, useEffect } from 'react';
import API from '../../../../../core/api/apiClient';
import styles from '../styles/LeaveEditModal.module.css';

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const LeaveEditModal = ({ isOpen, onClose, onSave, leaveData }) => {
    const today = new Date().toISOString().split('T')[0];
    
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [leaveCategory, setLeaveCategory] = useState('PL');
    const [leaveDurationType, setLeaveDurationType] = useState('FULL_DAY');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && leaveData) {
            setStartDate(leaveData.start_date);
            setEndDate(leaveData.end_date);
            setLeaveCategory(leaveData.leave_category);
            setLeaveDurationType(leaveData.leave_duration_type);
            setReason(leaveData.reason === '-' ? '' : leaveData.reason);
            setError('');
        }
    }, [isOpen, leaveData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (new Date(startDate) > new Date(endDate)) {
            setError('Start date cannot be after end date');
            return;
        }

        setLoading(true);
        try {
            const res = await API.put(`/leave-requests/${leaveData.id}`, {
                start_date: startDate,
                end_date: endDate,
                reason: reason,
                leave_category: leaveCategory,
                leave_duration_type: leaveDurationType
            });
            onSave(res.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update leave request');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>Edit Leave Request</h3>
                    <button className={styles.closeBtn} onClick={onClose}><CloseIcon /></button>
                </div>

                <form className={styles.modalBody} onSubmit={handleSubmit}>
                    {error && <div className={styles.errorMsg}>{error}</div>}
                    
                    {new Date(startDate) < new Date(today) && (
                        <div className={styles.warningMsg} style={{ marginBottom: '1rem', padding: '0.75rem', fontSize: '0.875rem' }}>
                            Note: You are editing a past date (Backdated Leave).
                        </div>
                    )}

                    <div className={styles.typeToggleContainer}>
                        <button 
                            type="button"
                            className={`${styles.typeBtn} ${leaveDurationType === 'FULL_DAY' ? styles.activeType : ''}`}
                            onClick={() => setLeaveDurationType('FULL_DAY')}
                        >
                            Full Day
                        </button>
                        <button 
                            type="button"
                            className={`${styles.typeBtn} ${leaveDurationType === 'HALF_DAY' ? styles.activeType : ''}`}
                            onClick={() => setLeaveDurationType('HALF_DAY')}
                        >
                            Half Day
                        </button>
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Leave Type</label>
                            <select 
                                className={styles.input}
                                value={leaveCategory}
                                onChange={(e) => setLeaveCategory(e.target.value)}
                                required
                            >
                                <option value="PL">Privilege Leave (PL)</option>
                                <option value="CL">Casual Leave (CL)</option>
                                <option value="SL">Sick Leave (SL)</option>
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Start Date</label>
                            <input 
                                type="date" 
                                className={styles.input}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>End Date</label>
                            <input 
                                type="date" 
                                className={styles.input}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className={`${styles.inputGroup} styles.fullWidth`}>
                            <label className={styles.label}>Reason</label>
                            <textarea 
                                className={styles.textarea}
                                placeholder="Enter reason for leave..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    <div className={styles.buttonGroup}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeaveEditModal;
