import React, { useState } from 'react';
import API from '../../../../../core/api/apiClient';
import styles from '../styles/LeaveRequestForm.module.css';

const LeaveRequestForm = ({ onLeaveCreated }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [leaveType, setLeaveType] = useState('FULL_DAY'); // FULL_DAY / HALF_DAY
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!startDate || (leaveType === 'FULL_DAY' && !endDate)) {
            setMessage({ text: 'Please select required dates', type: 'error' });
            return;
        }
 
        if (leaveType === 'FULL_DAY' && new Date(startDate) > new Date(endDate)) {
            setMessage({ text: 'Start date cannot be after end date', type: 'error' });
            return;
        }

        const userId = localStorage.getItem('userId');
        
        // Ensure we retrieve company safely. For now, fetch from an endpoint or local storage if mapped.
        // Assuming user's company is inherently passed or fetched. 
        // In this system's paradigm, we can pass standard company_id 1 if not tightly coupled, 
        // but standard paradigm is to fetch it from local storage, or the API ignores it if single tenant.
        // Let's use localStorage if available, else fallback to 1 logic.
        const companyId = localStorage.getItem('companyId') || 1;

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            await API.post('/leave-requests', {
                start_date: startDate,
                end_date: leaveType === 'HALF_DAY' ? startDate : endDate,
                reason: reason,
                leave_type: leaveType
            });

            setMessage({ text: 'Leave request submitted successfully!', type: 'success' });
            setStartDate('');
            setEndDate('');
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

            <form onSubmit={handleSubmit}>
                <div className={styles.typeToggleContainer}>
                    <button 
                        type="button"
                        className={`${styles.typeBtn} ${leaveType === 'FULL_DAY' ? styles.activeType : ''}`}
                        onClick={() => setLeaveType('FULL_DAY')}
                    >
                        Full Day
                    </button>
                    <button 
                        type="button"
                        className={`${styles.typeBtn} ${leaveType === 'HALF_DAY' ? styles.activeType : ''}`}
                        onClick={() => setLeaveType('HALF_DAY')}
                    >
                        Half Day
                    </button>
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>{leaveType === 'HALF_DAY' ? 'Date' : 'Start Date'}</label>
                        <input 
                            type="date" 
                            className={styles.input}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                    </div>
                    
                    {leaveType === 'FULL_DAY' && (
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
                    )}

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
