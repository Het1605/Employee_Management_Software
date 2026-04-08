import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import MainLayout from '../../../../layout/MainLayout/js/MainLayout';
import { useCompanyContext } from '../../../../contexts/CompanyContext';
import styles from '../styles/AttendanceManagement.module.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const AttendanceManagement = () => {
    const { selectedCompany } = useCompanyContext();
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
        if (record.day_type === 'off') return;
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

    const getStatusClass = (status, dayType) => {
        if (dayType === 'off') return styles.offDay;
        if (status === 'present') return styles.present;
        if (status === 'half_day') return styles.halfDay;
        if (status === 'absent') return styles.absent;
        return '';
    };

    const getStatusInitial = (status, dayType) => {
        if (dayType === 'off') return 'OFF';
        if (status === 'present') return 'P';
        if (status === 'half_day') return 'H';
        if (status === 'absent') return 'A';
        return '-';
    };

    return (
        <MainLayout title="Attendance Management">
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
                                {[2024, 2025, 2026].map(y => (
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
                                                    className={`${styles.attendanceCell} ${getStatusClass(rec.status, rec.day_type)}`}
                                                    onClick={() => handleCellClick(emp, rec)}
                                                    title={`${rec.date}: ${rec.status}`}
                                                >
                                                    {getStatusInitial(rec.status, rec.day_type)}
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
        </MainLayout>
    );
};

export default AttendanceManagement;
