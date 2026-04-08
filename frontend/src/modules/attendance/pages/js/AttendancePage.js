import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../../../../layout/MainLayout/js/MainLayout';
import styles from '../styles/AttendancePage.module.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const AttendancePage = () => {
    const [status, setStatus] = useState('');
    const [todayStatus, setTodayStatus] = useState(null);
    const [dayType, setDayType] = useState('working');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    const todayDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    useEffect(() => {
        fetchTodayStatus();
    }, []);

    const fetchTodayStatus = async () => {
        setLoading(true);
        try {
            const userId = localStorage.getItem('userId') || 1; // Fallback for dev mode
            const response = await axios.get(`${API_BASE_URL}/attendance/today`, {
                params: { user_id: userId }
            });
            setTodayStatus(response.data.status);
            setDayType(response.data.day_type);
            if (response.data.status !== 'absent' || response.data.day_type === 'off') {
                setStatus(response.data.status);
            }
        } catch (error) {
            console.error("Error fetching today status", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async () => {
        if (!status) {
            setMessage({ text: 'Please select attendance status', type: 'error' });
            return;
        }

        try {
            const userId = localStorage.getItem('userId') || 1; // Fallback for dev mode
            await axios.post(`${API_BASE_URL}/attendance/mark`, 
                { status: status, user_id: userId, actor_id: userId }
            );
            setMessage({ text: 'Attendance marked successfully', type: 'success' });
            setTodayStatus(status);
        } catch (error) {
            const errorMsg = error.response?.data?.detail || "Error marking attendance";
            setMessage({ text: errorMsg, type: 'error' });
        }
    };

    if (loading) return <div className={styles.loader}>Loading...</div>;

    const isMarked = todayStatus && todayStatus !== 'absent';
    const isOffDay = dayType === 'off';

    return (
        <MainLayout title="Daily Attendance">
            <div className={styles.attendanceContainer}>
                <div className={styles.card}>
                    <h1 className={styles.title}>Mark Your Attendance</h1>
                    
                    <div className={styles.dateSection}>
                        <span className={styles.dateLabel}>Today's Date</span>
                        <span className={styles.dateValue}>{todayDate}</span>
                    </div>

                    {isOffDay ? (
                        <div className={styles.offDayMessage}>
                            Today is a public holiday or off-day. No attendance required.
                        </div>
                    ) : (
                        <>
                            <div className={styles.statusSection}>
                                <p className={styles.sectionTitle}>Select Status</p>
                                <div className={styles.radioGroup}>
                                    <label className={`${styles.radioLabel} ${status === 'present' ? styles.selected : ''} ${isMarked ? styles.disabled : ''}`}>
                                        <input 
                                            type="radio" 
                                            name="status" 
                                            value="present" 
                                            checked={status === 'present'}
                                            onChange={(e) => setStatus(e.target.value)}
                                            disabled={isMarked}
                                        />
                                        <span className={styles.radioText}>Present</span>
                                    </label>

                                    <label className={`${styles.radioLabel} ${status === 'half_day' ? styles.selected : ''} ${isMarked ? styles.disabled : ''}`}>
                                        <input 
                                            type="radio" 
                                            name="status" 
                                            value="half_day" 
                                            checked={status === 'half_day'}
                                            onChange={(e) => setStatus(e.target.value)}
                                            disabled={isMarked}
                                        />
                                        <span className={styles.radioText}>Half Day</span>
                                    </label>

                                    <label className={`${styles.radioLabel} ${status === 'absent' ? styles.selected : ''} ${isMarked ? styles.disabled : ''}`}>
                                        <input 
                                            type="radio" 
                                            name="status" 
                                            value="absent" 
                                            checked={status === 'absent'}
                                            onChange={(e) => setStatus(e.target.value)}
                                            disabled={isMarked}
                                        />
                                        <span className={styles.radioText}>Absent</span>
                                    </label>
                                </div>
                            </div>

                            {message.text && (
                                <div className={`${styles.message} ${styles[message.type]}`}>
                                    {message.text}
                                </div>
                            )}

                            <button 
                                className={styles.submitButton} 
                                onClick={handleMarkAttendance}
                                disabled={isMarked}
                            >
                                {isMarked ? 'Attendance Marked' : 'Mark Attendance'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default AttendancePage;
