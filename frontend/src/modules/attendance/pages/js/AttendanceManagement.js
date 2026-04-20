import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import MainLayout from '../../../../layout/MainLayout/js/MainLayout';
import { useCompanyContext } from '../../../../contexts/CompanyContext';
import styles from '../styles/AttendanceManagement.module.css';
import { useCalendarData } from '../../../calendar/hooks/useCalendarData';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const AttendanceManagement = () => {
    const { selectedCompany } = useCompanyContext();
    const { workingDays, holidays, overrides } = useCalendarData();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [attendanceData, setAttendanceData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null); // { userId, name, date, status }
    const [updateStatus, setUpdateStatus] = useState('');

    useEffect(() => {
        if (selectedCompany?.id) {
            fetchAttendance();
        }
    }, [selectedCompany, month, year]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/attendance/company`, {
                params: {
                    company_id: selectedCompany.id,
                    month,
                    year
                }
            });
            setAttendanceData(response.data);
        } catch (error) {
            console.error("Error fetching attendance data", error);
        } finally {
            setLoading(false);
        }
    };

    const daysInMonth = useMemo(() => {
        return new Date(year, month, 0).getDate();
    }, [month, year]);

    const filteredData = attendanceData.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCellClick = (emp, record) => {
        // Prevent modal on Off Days / Holidays
        const calStatus = getDayStatus(record.date);
        if (calStatus === 'off' || record.day_type === 'off') return;

        // Prevent modal if Locked by Approved Leave
        if (record.is_locked) {
            alert("Attendance for this day is locked due to an approved leave request. You must reject or delete the leave request to modify this record.");
            return;
        }

        setSelectedRecord({
            userId: emp.user_id,
            name: emp.name,
            date: record.date,
            status: record.status
        });
        setUpdateStatus(record.status);
        setIsModalOpen(true);
    };

    const handleSaveAttendance = async () => {
        try {
            const adminId = localStorage.getItem('userId');
            await axios.post(`${API_BASE_URL}/attendance/mark`, {
                user_id: selectedRecord.userId,
                actor_id: adminId,
                date: selectedRecord.date,
                status: updateStatus,
                company_id: selectedCompany.id
            });
            setIsModalOpen(false);
            fetchAttendance();
        } catch (error) {
            alert(error.response?.data?.detail || "Error updating attendance");
        }
    };

    const getDayStatus = (dateStr) => {
        if (!workingDays || workingDays.length === 0) return 'working';
        
        const date = new Date(dateStr);
        // JS getDay() returns 0 for Sunday, 1 for Monday... 6 for Saturday
        const dayOfWeek = date.getDay();
        
        // 1. Overrides
        const override = overrides.find(o => o.date === dateStr);
        if (override) return override.override_type; 

        // 2. Holidays
        const holiday = holidays.find(h => h.date === dateStr);
        if (holiday) return 'off';

        // 3. Working Days config
        const wd = workingDays.find(w => w.day_of_week === dayOfWeek);
        if (wd) {
            // Check for Alternate Saturdays
            if (dayOfWeek === 6 && wd.is_alternate_saturday) {
                const weekOfMonth = Math.ceil(date.getDate() / 7);
                const offWeeks = wd.off_saturdays || [];
                if (offWeeks.includes(weekOfMonth)) return 'off';
            }
            if (!wd.is_working) return 'off';
        }
        return 'working';
    };

    const getStatusClass = (status, dayType, dateStr, isLocked) => {
        const calStatus = getDayStatus(dateStr);
        if (calStatus === 'off') return styles.offDay;
        if (isLocked) return `${styles.lockedCell} ${status === 'half_day' ? styles.halfDay : styles.absent}`;
        if (status === 'present') return styles.present;
        if (status === 'half_day') return styles.halfDay;
        if (status === 'absent') return styles.absent;
        return '';
    };

    const getStatusInitial = (status, dayType, dateStr, isLocked) => {
        const calStatus = getDayStatus(dateStr);
        if (calStatus === 'off') return 'OFF';
        if (isLocked) return status === 'half_day' ? 'H (L)' : 'A (L)';
        if (status === 'present') return 'P';
        if (status === 'half_day') return 'H';
        if (status === 'absent') return 'A';
        return '-';
    };

    return (
        <>
            <div className={styles.container}>
                <div className={styles.filterCard}>
                    <div className={styles.filterGroup}>
                        <div className={styles.inputItem}>
                            <label>Month</label>
                            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.inputItem}>
                            <label>Year</label>
                            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                                {Array.from({ length: 9 }, (_, i) => new Date().getFullYear() - 3 + i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.inputItem}>
                            <label>Search Employee</label>
                            <input 
                                type="text" 
                                placeholder="Name..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.gridContainer}>
                    {loading ? (
                        <div className={styles.loader}>Loading attendance data...</div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.attendanceTable}>
                                <thead>
                                    <tr>
                                        <th className={styles.stickyCol}>Employee Name</th>
                                        {Array.from({ length: daysInMonth }, (_, i) => (
                                            <th key={i + 1} className={styles.dateHeader}>{i + 1}</th>
                                        ))}
                                        <th className={styles.statsHeader}>P</th>
                                        <th className={styles.statsHeader}>H</th>
                                        <th className={styles.statsHeader}>A</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map(emp => (
                                        <tr key={emp.user_id}>
                                            <td className={styles.stickyCol}>{emp.name}</td>
                                            {emp.attendance.map((rec, idx) => (
                                                <td 
                                                    key={idx} 
                                                    className={`${styles.attendanceCell} ${getStatusClass(rec.status, rec.day_type, rec.date, rec.is_locked)}`}
                                                    onClick={() => handleCellClick(emp, rec)}
                                                    title={rec.is_locked ? `Locked by Leave: ${rec.status}` : `${rec.date}: ${rec.status}`}
                                                >
                                                    {getStatusInitial(rec.status, rec.day_type, rec.date, rec.is_locked)}
                                                </td>
                                            ))}
                                            <td className={styles.statVal}>{emp.present_days}</td>
                                            <td className={styles.statVal}>{emp.half_days}</td>
                                            <td className={styles.statVal}>{emp.absent_days}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {isModalOpen && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modal}>
                            <h3>Update Attendance</h3>
                            <div className={styles.modalBody}>
                                <div className={styles.modalInfo}>
                                    <p><strong>Employee:</strong> {selectedRecord?.name}</p>
                                    <p><strong>Date:</strong> {selectedRecord?.date}</p>
                                </div>
                                <div className={styles.statusSelect}>
                                    <label>Status</label>
                                    <select value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)}>
                                        <option value="present">Present</option>
                                        <option value="half_day">Half Day</option>
                                        <option value="absent">Absent</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <button className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button className={styles.saveBtn} onClick={handleSaveAttendance}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AttendanceManagement;
