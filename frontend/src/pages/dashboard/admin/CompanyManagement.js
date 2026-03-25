import React, { useState, useEffect } from 'react';
import CompanyFormModal from '../../../components/common/CompanyFormModal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Layout from '../../../components/layout/Layout';
import API from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { handleApiError } from '../../../utils/errorHandler';
import styles from '../../../styles/CompanyModule.module.css';
import commonStyles from '../../../styles/UserManagement.module.css';

const CompanyManagement = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    
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
        } catch (err) {
            showToast("Failed to load companies. " + handleApiError(err), 'error');
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
                showToast("Company updated successfully", 'success');
            } else {
                await API.post('/companies/', formData);
                showToast("Company created successfully", 'success');
            }
            setIsModalOpen(false);
            fetchCompanies();
        } catch (err) {
            showToast(handleApiError(err), 'error');
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await API.delete(`/companies/${deletingId}`);
            showToast("Company deleted successfully", 'success');
            setIsConfirmOpen(false);
            fetchCompanies();
        } catch (err) {
            showToast("Unable to delete company. " + handleApiError(err), 'error');
            setIsConfirmOpen(false);
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
