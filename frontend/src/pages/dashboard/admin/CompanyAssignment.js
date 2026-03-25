import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/CompanyModule.module.css';
import Layout from '../../../components/layout/Layout';
import API from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { handleApiError } from '../../../utils/errorHandler';

const CompanyAssignment = () => {
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");
    const [assignedUsers, setAssignedUsers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedAssigned, setSelectedAssigned] = useState([]);
    const [selectedAvailable, setSelectedAvailable] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const { showToast } = useToast();
    
    // Responsive states
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [activeTab, setActiveTab] = useState('available');

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isTablet = windowWidth <= 1024 && windowWidth > 768;
    const isMobile = windowWidth <= 768;

    const fetchCompanies = useCallback(async () => {
        try {
            const response = await API.get('/companies/');
            setCompanies(response.data);
            if (response.data.length > 0 && !selectedCompanyId) {
                setSelectedCompanyId(response.data[0].id);
            }
        } catch (err) {
            showToast("Failed to load companies. " + handleApiError(err), 'error');
        }
    }, [selectedCompanyId, showToast]);

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
            showToast("Failed to load users. " + handleApiError(err), 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

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
            showToast("Users assigned successfully", 'success');
            fetchUserLists(selectedCompanyId);
        } catch (err) {
            showToast("User assignment failed. " + handleApiError(err), 'error');
        }
    };

    const handleUnassign = async () => {
        if (selectedAssigned.length === 0) return;
        try {
            await API.post(`/companies/${selectedCompanyId}/unassign`, {
                user_ids: selectedAssigned
            });
            showToast("Users removed successfully", 'success');
            fetchUserLists(selectedCompanyId);
        } catch (err) {
            showToast("User removal failed. " + handleApiError(err), 'error');
        }
    };

    const handleSingleAssign = async (userId) => {
        try {
            await API.post(`/companies/${selectedCompanyId}/assign`, { user_ids: [userId] });
            showToast("User assigned successfully", 'success');
            fetchUserLists(selectedCompanyId);
        } catch (err) { 
            showToast("Assignment failed. " + handleApiError(err), 'error');
        }
    };

    const handleSingleUnassign = async (userId) => {
        try {
            await API.post(`/companies/${selectedCompanyId}/unassign`, { user_ids: [userId] });
            showToast("User removed successfully", 'success');
            fetchUserLists(selectedCompanyId);
        } catch (err) { 
            showToast("Removal failed. " + handleApiError(err), 'error'); 
        }
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const filteredAvailable = availableUsers.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredAssigned = assignedUsers.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout title="User-Company Assignment">
            <div className={styles.container}>
                <div className={styles.assignmentLayout}>
                    <div className={styles.topControls}>
                        <div className={styles.controlGroup}>
                            <label>Select Company</label>
                            <select 
                                value={selectedCompanyId} 
                                onChange={(e) => setSelectedCompanyId(e.target.value)}
                                className={styles.select}
                                disabled={loading}
                            >
                                <option value="">-- Choose a company --</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.controlGroup}>
                            <label>&nbsp;</label>
                            <div className={styles.searchWrapper}>
                                <span className={styles.searchIcon}>🔍</span>
                                <input 
                                    type="text" 
                                    placeholder="Search users by name or email..." 
                                    className={styles.searchInput}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {isMobile && (
                        <div className={styles.mobileTabs}>
                            <button 
                                className={`${styles.tabBtn} ${activeTab === 'available' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('available')}
                            >
                                Available ({filteredAvailable.length})
                            </button>
                            <button 
                                className={`${styles.tabBtn} ${activeTab === 'assigned' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('assigned')}
                            >
                                Assigned ({filteredAssigned.length})
                            </button>
                        </div>
                    )}

                    <div className={`${styles.transferContainer} ${isTablet ? styles.tabletLayout : ''} ${isMobile ? styles.mobileLayout : ''}`}>
                        {/* Available Users */}
                        {(!isMobile || activeTab === 'available') && (
                            <div className={styles.listPanel}>
                                <div className={styles.listHeader}>
                                    <span>Available Users</span>
                                    {!isMobile && <small>{filteredAvailable.length} Users</small>}
                                </div>
                                <div className={styles.listContent}>
                                    {filteredAvailable.map(user => (
                                        <div 
                                            key={user.id} 
                                            className={`${styles.userItem} ${selectedAvailable.includes(user.id) ? styles.selected : ''}`}
                                            onClick={() => !isMobile && !isTablet && toggleSelect(user.id, selectedAvailable, setSelectedAvailable)}
                                        >
                                            {isMobile ? (
                                                <div className={styles.mobileCard}>
                                                    <div className={styles.mobileRowAvatar}>
                                                        <div className={styles.userAvatar}>{getInitials(user.name)}</div>
                                                        <span className={styles.userNameMobile}>{user.name}</span>
                                                    </div>
                                                    <div className={styles.mobileRow}>
                                                        <span className={styles.userEmailMobile}>{user.email}</span>
                                                    </div>
                                                    <div className={styles.mobileRow}>
                                                        <div className={styles.roleBadgeMobile}>{user.role}</div>
                                                    </div>
                                                    <div className={styles.mobileRow}>
                                                        <button 
                                                            className={styles.inlineAssignBtnMobile}
                                                            onClick={(e) => { e.stopPropagation(); handleSingleAssign(user.id); }}
                                                        >
                                                            Assign
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={styles.userAvatar}>{getInitials(user.name)}</div>
                                                    <div className={styles.userDetails}>
                                                        <span className={styles.userName}>{user.name}</span>
                                                        <span className={styles.userEmail}>{user.email}</span>
                                                    </div>
                                                    <div className={styles.roleBadge}>{user.role}</div>
                                                    {isTablet && (
                                                        <button 
                                                            className={styles.inlineAssignBtn}
                                                            onClick={(e) => { e.stopPropagation(); handleSingleAssign(user.id); }}
                                                        >
                                                            Assign
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    {filteredAvailable.length === 0 && !loading && (
                                        <div className={styles.emptyMsg}>
                                            <div className={styles.emptyIcon}>🔍</div>
                                            <span>No available users found.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Arrows (Hidden on Tablet/Mobile via CSS) */}
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
                        {(!isMobile || activeTab === 'assigned') && (
                            <div className={styles.listPanel}>
                                <div className={styles.listHeader}>
                                    <span>Assigned Users</span>
                                    {!isMobile && <small>{filteredAssigned.length} Users</small>}
                                </div>
                                <div className={styles.listContent}>
                                    {filteredAssigned.map(user => (
                                        <div 
                                            key={user.id} 
                                            className={`${styles.userItem} ${selectedAssigned.includes(user.id) ? styles.selected : ''}`}
                                            onClick={() => !isMobile && !isTablet && toggleSelect(user.id, selectedAssigned, setSelectedAssigned)}
                                        >
                                            {isMobile ? (
                                                <div className={styles.mobileCard}>
                                                    <div className={styles.mobileRowAvatar}>
                                                        <div className={styles.userAvatar}>{getInitials(user.name)}</div>
                                                        <span className={styles.userNameMobile}>{user.name}</span>
                                                    </div>
                                                    <div className={styles.mobileRow}>
                                                        <span className={styles.userEmailMobile}>{user.email}</span>
                                                    </div>
                                                    <div className={styles.mobileRow}>
                                                        <div className={styles.roleBadgeMobile}>{user.role}</div>
                                                    </div>
                                                    <div className={styles.mobileRow}>
                                                        <button 
                                                            className={styles.inlineRemoveBtnMobile}
                                                            onClick={(e) => { e.stopPropagation(); handleSingleUnassign(user.id); }}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={styles.userAvatar}>{getInitials(user.name)}</div>
                                                    <div className={styles.userDetails}>
                                                        <span className={styles.userName}>{user.name}</span>
                                                        <span className={styles.userEmail}>{user.email}</span>
                                                    </div>
                                                    <div className={styles.roleBadge}>{user.role}</div>
                                                    {isTablet && (
                                                        <button 
                                                            className={styles.inlineRemoveBtn}
                                                            onClick={(e) => { e.stopPropagation(); handleSingleUnassign(user.id); }}
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    {filteredAssigned.length === 0 && !loading && (
                                        <div className={styles.emptyMsg}>
                                            <div className={styles.emptyIcon}>👥</div>
                                            <span>No assigned users found.</span>
                                        </div>
                                    )}
                                    {loading && <div className={styles.emptyMsg}>Updating Lists...</div>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CompanyAssignment;
