import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../../../../layout/MainLayout/js/MainLayout';
import styles from '../styles/AttendancePage.module.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const AttendancePage = () => {
    const [status, setStatus] = useState('present');
    const [todayStatus, setTodayStatus] = useState(null);
    const [dayType, setDayType] = useState('working');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isLocked, setIsLocked] = useState(false);
    const [lockMessage, setLockMessage] = useState('');

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
        setStatus('present'); // Default to present for employee marking
        try {
            const userId = localStorage.getItem('userId') || 1;
            const response = await axios.get(`${API_BASE_URL}/attendance/today`, {
                params: { user_id: userId }
            });
            setTodayStatus(response.data.status);
            setDayType(response.data.day_type);
            setIsLocked(response.data.is_locked);
            setLockMessage(response.data.lock_message);
            
            if (response.data.status !== 'absent') {
                setStatus(response.data.status);
            }
        } catch (error) {
            console.error("Error fetching today status", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async () => {
        if (isLocked) return;

        try {
            const userId = localStorage.getItem('userId') || 1;
            await axios.post(`${API_BASE_URL}/attendance/mark`, 
                { status: 'present', user_id: userId, actor_id: userId }
            );
            setMessage({ text: 'Attendance marked successfully', type: 'success' });
            setTodayStatus('present');
            setStatus('present');
        } catch (error) {
            const errorMsg = error.response?.data?.detail || "Error marking attendance";
            setMessage({ text: errorMsg, type: 'error' });
        }
    };

    if (loading) return <div className={styles.loader}>Loading...</div>;

    const isMarked = todayStatus === 'present';
    const isOffDay = dayType === 'off';

    return (
        <>
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
                                <p className={styles.sectionTitle}>Mark Present</p>
                                <p className={styles.helperText}>
                                    Note: You only need to mark your presence here. 
                                    Absences are handled through the Leave management system.
                                </p>
                            </div>

                            {isLocked && (
                                <div className={styles.lockMessage}>
                                    <span className={styles.lockIcon}>🔒</span> {lockMessage}
                                </div>
                            )}

                            {message.text && (
                                <div className={`${styles.message} ${styles[message.type]}`}>
                                    {message.text}
                                </div>
                            )}

                            <button 
                                className={`${styles.submitButton} ${isLocked ? styles.disabled : ''}`} 
                                onClick={handleMarkAttendance}
                                disabled={isLocked}
                            >
                                {isLocked ? 'Attendance Locked' : (isMarked ? 'Already Marked Present' : 'Mark Present Today')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default AttendancePage;
