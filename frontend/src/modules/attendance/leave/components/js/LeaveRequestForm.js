import React, { useState } from 'react';
import API from '../../../../../core/api/apiClient';
import { useCompanyContext } from '../../../../../contexts/CompanyContext';
import styles from '../styles/LeaveRequestForm.module.css';

const LeaveRequestForm = ({ onLeaveCreated }) => {
    const today = new Date().toISOString().split('T')[0];
    const { selectedCompanyId } = useCompanyContext();
    
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [leaveCategory, setLeaveCategory] = useState('PL'); // PL / CL / SL
    const [leaveDurationType, setLeaveDurationType] = useState('FULL_DAY'); // FULL_DAY / HALF_DAY
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedCompanyId) {
            setMessage({ text: 'Please select a company in the header first.', type: 'error' });
            return;
        }

        if (!startDate || !endDate) {
            setMessage({ text: 'Please select required dates', type: 'error' });
            return;
        }
 
        if (new Date(startDate) > new Date(endDate)) {
            setMessage({ text: 'Start date cannot be after end date', type: 'error' });
            return;
        }


        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            await API.post('/leave-requests', {
                company_id: parseInt(selectedCompanyId),
                start_date: startDate,
                end_date: endDate,
                reason: reason,
                leave_category: leaveCategory,
                leave_duration_type: leaveDurationType
            });

            setMessage({ text: 'Leave request submitted successfully!', type: 'success' });
            setStartDate(today);
            setEndDate(today);
            setReason('');
            
            if (onLeaveCreated) {
                onLeaveCreated();
            }

            // Clear success message after 3 seconds
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 3000);

        } catch (error) {
            const errorMsg = error.response?.data?.detail || "Failed to submit leave request";
            setMessage({ text: errorMsg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.card}>
            <h2 className={styles.title}>Apply for Leave</h2>
            
            {message.text && (
                <div className={message.type === 'success' ? styles.successMsg : styles.errorMsg}>
                    {message.text}
                </div>
            )}

            {new Date(startDate) < new Date(today) && (
                <div className={styles.warningMsg}>
                    Note: You are applying for a past date (Backdated Leave).
                </div>
            )}

            <form onSubmit={handleSubmit}>
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
                        <label className={styles.label}>Leave Type (Category)</label>
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
                        {/* Empty spacer for alignment if needed, or put something else */}
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

                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                        <label className={styles.label}>Reason (Optional)</label>
                        <textarea 
                            className={styles.textarea}
                            placeholder="Enter reason for leave..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        ></textarea>
                    </div>
                </div>

                <div className={styles.buttonGroup}>
                    <button 
                        type="submit" 
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LeaveRequestForm;
