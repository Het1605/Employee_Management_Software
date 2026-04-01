import React, { useState, useEffect } from 'react';
import CompanyFormModal from '../../components/modals/CompanyFormModal';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import MainLayout from '../../../../layout/MainLayout/js/MainLayout';
import { useToast } from '../../../../contexts/ToastContext';
import { handleApiError } from '../../../../utils/errorHandler';
import styles from '../styles/CompanyManagement.module.css';
import commonStyles from '../../../user/pages/styles/UserManagement.module.css';
import {
  createCompany,
  deleteCompany,
  fetchCompanies as fetchCompaniesRequest,
  updateCompany,
} from '../../services/companyService';

const EditIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

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
            const response = await fetchCompaniesRequest();
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
                await updateCompany(editingCompany.id, formData);
                showToast("Company updated successfully", 'success');
            } else {
                await createCompany(formData);
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
            await deleteCompany(deletingId);
            showToast("Company deleted successfully", 'success');
            setIsConfirmOpen(false);
            fetchCompanies();
        } catch (err) {
            showToast("Unable to delete company. " + handleApiError(err), 'error');
            setIsConfirmOpen(false);
        }
    };

    if (loading && companies.length === 0) return (
        <MainLayout>
            <div className={styles.container}>Loading...</div>
        </MainLayout>
    );

    return (
        <MainLayout 
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
                                        className={commonStyles.iconBtn} 
                                        onClick={() => handleEdit(company)}
                                        title="Edit Company"
                                    >
                                        <EditIcon />
                                    </button>
                                    <button 
                                        className={`${commonStyles.iconBtn} ${commonStyles.delete}`}
                                        onClick={() => handleDeleteClick(company.id)}
                                        title="Delete Company"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                            
                            <div className={styles.companyInfo}>
                                <h3>{company.name}</h3>
                                <div className={styles.companyDetails}>
                                    {(company.address_line_1 || company.address_line_2 || company.address_line_3 || company.postal_code) && (
                                        <div className={styles.detailItem}>
                                            📍 {[company.address_line_1, company.address_line_2, company.address_line_3, company.postal_code].filter(Boolean).join(', ')}
                                        </div>
                                    )}
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
        </MainLayout>
    );
};

export default CompanyManagement;
