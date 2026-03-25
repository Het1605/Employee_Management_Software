import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/CompanyModule.module.css';
import Layout from '../../../components/layout/Layout';
import API from '../../../services/api';

const CompanyAssignment = () => {
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");
    const [assignedUsers, setAssignedUsers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedAssigned, setSelectedAssigned] = useState([]);
    const [selectedAvailable, setSelectedAvailable] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchCompanies = useCallback(async () => {
        try {
            const response = await API.get('/companies/');
            setCompanies(response.data);
            if (response.data.length > 0 && !selectedCompanyId) {
                setSelectedCompanyId(response.data[0].id);
            }
        } catch (err) {
            console.error("Failed to fetch companies");
        }
    }, [selectedCompanyId]);

    const fetchUserLists = useCallback(async (id) => {
        setLoading(true);
        try {
            const [assignedRes, availableRes] = await Promise.all([
                API.get(`/companies/${id}/users`),
                API.get(`/companies/${id}/available`)
            ]);
            setAssignedUsers(assignedRes.data);
            setAvailableUsers(availableRes.data);
            setSelectedAssigned([]);
            setSelectedAvailable([]);
        } catch (err) {
            console.error("Failed to fetch user lists");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    useEffect(() => {
        if (selectedCompanyId) {
            fetchUserLists(selectedCompanyId);
        } else {
            setAssignedUsers([]);
            setAvailableUsers([]);
        }
    }, [selectedCompanyId, fetchUserLists]);

    const toggleSelect = (id, list, setList) => {
        if (list.includes(id)) {
            setList(list.filter(item => item !== id));
        } else {
            setList([...list, id]);
        }
    };

    const handleAssign = async () => {
        if (selectedAvailable.length === 0) return;
        try {
            await API.post(`/companies/${selectedCompanyId}/assign`, {
                user_ids: selectedAvailable
            });
            fetchUserLists(selectedCompanyId);
        } catch (err) {
            alert("Assignment failed");
        }
    };

    const handleUnassign = async () => {
        if (selectedAssigned.length === 0) return;
        try {
            await API.post(`/companies/${selectedCompanyId}/unassign`, {
                user_ids: selectedAssigned
            });
            fetchUserLists(selectedCompanyId);
        } catch (err) {
            alert("Unassignment failed");
        }
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <Layout title="User-Company Assignment">
            <div className={styles.container}>
                <div className={styles.assignmentLayout}>
                    <div className={styles.companySelector}>
                        <label>Target Company</label>
                        <select 
                            value={selectedCompanyId} 
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                            className={styles.select}
                            disabled={loading}
                        >
                            <option value="">-- Select a Company --</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.transferContainer}>
                        {/* Available Users */}
                        <div className={styles.listPanel}>
                            <div className={styles.listHeader}>
                                <span>Eligible Pool</span>
                                <small>{availableUsers.length} Users</small>
                            </div>
                            <div className={styles.listContent}>
                                {availableUsers.map(user => (
                                    <div 
                                        key={user.id} 
                                        className={`${styles.userItem} ${selectedAvailable.includes(user.id) ? styles.selected : ''}`}
                                        onClick={() => toggleSelect(user.id, selectedAvailable, setSelectedAvailable)}
                                    >
                                        <div className={styles.userAvatar}>{getInitials(user.name)}</div>
                                        <div className={styles.userDetails}>
                                            <span className={styles.userName}>{user.name}</span>
                                            <span className={styles.userRole}>{user.role}</span>
                                        </div>
                                    </div>
                                ))}
                                {availableUsers.length === 0 && !loading && (
                                    <div className={styles.emptyMsg}>
                                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅</div>
                                        All users are already assigned.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Arrows */}
                        <div className={styles.transferActions}>
                            <button 
                                className={styles.transferBtn}
                                onClick={handleAssign}
                                disabled={selectedAvailable.length === 0 || loading}
                                title="Add to Company"
                            >
                                ➡️
                            </button>
                            <button 
                                className={styles.transferBtn}
                                onClick={handleUnassign}
                                disabled={selectedAssigned.length === 0 || loading}
                                title="Remove from Company"
                            >
                                ⬅️
                            </button>
                        </div>

                        {/* Assigned Users */}
                        <div className={styles.listPanel}>
                            <div className={styles.listHeader}>
                                <span>Assigned Team</span>
                                <small>{assignedUsers.length} Users</small>
                            </div>
                            <div className={styles.listContent}>
                                {assignedUsers.map(user => (
                                    <div 
                                        key={user.id} 
                                        className={`${styles.userItem} ${selectedAssigned.includes(user.id) ? styles.selected : ''}`}
                                        onClick={() => toggleSelect(user.id, selectedAssigned, setSelectedAssigned)}
                                    >
                                        <div className={styles.userAvatar}>{getInitials(user.name)}</div>
                                        <div className={styles.userDetails}>
                                            <span className={styles.userName}>{user.name}</span>
                                            <span className={styles.userRole}>{user.role}</span>
                                        </div>
                                    </div>
                                ))}
                                {assignedUsers.length === 0 && !loading && (
                                    <div className={styles.emptyMsg}>
                                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👥</div>
                                        No users assigned to this company yet.
                                    </div>
                                )}
                                {loading && <div className={styles.emptyMsg}>Updating Lists...</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CompanyAssignment;
