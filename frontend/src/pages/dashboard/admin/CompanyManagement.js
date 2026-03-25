import React, { useState, useEffect } from 'react';
import CompanyFormModal from '../../../components/common/CompanyFormModal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Layout from '../../../components/layout/Layout';
import API from '../../../services/api';
import styles from '../../../styles/CompanyModule.module.css';
import commonStyles from '../../../styles/UserManagement.module.css';

const CompanyManagement = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const response = await API.get('/companies/');
            setCompanies(response.data);
            setError(null);
        } catch (err) {
            setError("Failed to fetch companies. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingCompany(null);
        setIsModalOpen(true);
    };

    const handleEdit = (company) => {
        setEditingCompany(company);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeletingId(id);
        setIsConfirmOpen(true);
    };

    const handleModalSubmit = async (formData) => {
        try {
            if (editingCompany) {
                await API.put(`/companies/${editingCompany.id}`, formData);
            } else {
                await API.post('/companies/', formData);
            }
            setIsModalOpen(false);
            fetchCompanies();
        } catch (err) {
            alert(err.response?.data?.detail || "Action failed");
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await API.delete(`/companies/${deletingId}`);
            setIsConfirmOpen(false);
            fetchCompanies();
        } catch (err) {
            alert("Delete failed");
        }
    };

    if (loading && companies.length === 0) return (
        <Layout>
            <div className={styles.container}>Loading...</div>
        </Layout>
    );

    return (
        <Layout 
            title="Company Registry" 
            actionLabel="+ Register New Company"
            onActionClick={handleAdd}
        >
            <div className={styles.container}>
                {error && <div className={commonStyles.errorMsg}>{error}</div>}

                <div className={styles.companyGrid}>
                    {companies.map(company => (
                        <div key={company.id} className={styles.companyCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.logoContainer}>
                                    {company.logo_url ? (
                                        <img src={company.logo_url} alt={company.name} />
                                    ) : (
                                        <span>🏢</span>
                                    )}
                                </div>
                                <div className={styles.actions}>
                                    <button 
                                        className={commonStyles.editBtn} 
                                        onClick={() => handleEdit(company)}
                                        title="Edit Company"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        className={commonStyles.deleteBtn}
                                        onClick={() => handleDeleteClick(company.id)}
                                        title="Delete Company"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            
                            <div className={styles.companyInfo}>
                                <h3>{company.name}</h3>
                                <div className={styles.companyDetails}>
                                    <div className={styles.detailItem}>
                                        📍 {company.address}
                                    </div>
                                    {company.gst_number && (
                                        <div className={styles.detailItem}>
                                            📄 GST: {company.gst_number}
                                        </div>
                                    )}
                                    {company.pan_number && (
                                        <div className={styles.detailItem}>
                                            🔑 PAN: {company.pan_number}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {companies.length === 0 && !loading && (
                    <div className={commonStyles.noData}>
                        No companies found. Click "Register New Company" to get started.
                    </div>
                )}

                <CompanyFormModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleModalSubmit}
                    company={editingCompany}
                />

                <ConfirmDialog 
                    isOpen={isConfirmOpen}
                    title="Delete Company?"
                    message="This will permanently delete the company record and its user assignments. This action cannot be undone."
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setIsConfirmOpen(false)}
                />
            </div>
        </Layout>
    );
};

export default CompanyManagement;
