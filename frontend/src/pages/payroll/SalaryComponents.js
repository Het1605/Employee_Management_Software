import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { handleApiError } from '../../utils/errorHandler';
import styles from '../../styles/SalaryStructure.module.css';
import AddComponentModal from './modals/AddComponentModal';

// SVG Icons - Matching User Management
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

const SalaryComponents = ({ companyId }) => {
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingComponent, setEditingComponent] = useState(null);
    const { showToast } = useToast();

    const fetchComponents = async () => {
        if (!companyId) {
            setComponents([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await API.get(`/salary-components?company_id=${companyId}`);
            setComponents(res.data || []);
        } catch (err) {
            showToast("Failed to fetch components: " + handleApiError(err), "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComponents();
    }, [companyId]);

    useEffect(() => {
        setIsModalOpen(false);
        setEditingComponent(null);
    }, [companyId]);

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await API.patch(`/salary-components/${id}/status?company_id=${companyId}`, { is_active: !currentStatus });
            setComponents(components.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
            showToast("Status updated successfully", "success");
        } catch (err) {
            showToast("Failed to update status: " + handleApiError(err), "error");
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to PERMANENTLY delete "${name}"? This action cannot be undone.`)) {
            try {
                await API.delete(`/salary-components/${id}?company_id=${companyId}`);
                setComponents(components.filter(c => c.id !== id));
                showToast("Component deleted successfully", "success");
            } catch (err) {
                showToast("Delete Failed: " + handleApiError(err), "error");
            }
        }
    };

    const handleSave = async (formData) => {
        if (!formData) {
            setIsModalOpen(false);
            setEditingComponent(null);
            return;
        }

        try {
            if (!companyId) {
                showToast("Please select a company first.", "warning");
                return;
            }

            if (editingComponent) {
                await API.put(`/salary-components/${editingComponent.id}?company_id=${companyId}`, formData);
                showToast("Component updated successfully", "success");
            } else {
                await API.post('/salary-components/', { ...formData, company_id: Number(companyId) });
                showToast("Component created successfully", "success");
            }
            fetchComponents();
            setIsModalOpen(false);
            setEditingComponent(null);
        } catch (err) {
            showToast("Operation Failed: " + handleApiError(err), "error");
        }
    };

    if (loading) return <div className={styles.comingSoon}>Loading components...</div>;

    return (
        <div className={styles.salaryComponentsWrapper}>
            <div className={styles.tabHeader}>
                <div className={styles.tabTitles}>
                    <h3>Salary Components</h3>
                    <p className={styles.tabSubtitle}>Manage earning and deduction components for salary structures.</p>
                </div>
                <button className="btn-primary-action" onClick={() => setIsModalOpen(true)}>
                    + Add Component
                </button>
            </div>

            <div className={styles.cardGrid}>
                {components.length === 0 ? (
                    <div className={styles.emptyCardState}>
                        <div className={styles.placeholderIcon}>📋</div>
                        <p>No components available. Click "+ Add Component" to get started.</p>
                    </div>
                ) : (
                    components.map((comp) => (
                        <div key={comp.id} className={styles.dataCard}>
                            <div className={styles.cardTopRow}>
                                <h4 className={styles.cardTitle}>{comp.name}</h4>
                                <div className={styles.badgeGroup}>
                                    <span className={`${styles.pillBadge} ${styles[comp.type.toLowerCase()]}`}>
                                        {comp.type}
                                    </span>
                                    <span className={`${styles.pillBadge} ${comp.is_taxable ? styles.taxable : styles.nonTaxable}`}>
                                        {comp.is_taxable ? 'Taxable' : 'Non-Taxable'}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.cardBottomRow}>
                                <div className={styles.statusToggle}>
                                    <label className={styles.switch}>
                                        <input
                                            type="checkbox"
                                            checked={comp.is_active}
                                            onChange={() => handleToggleStatus(comp.id, comp.is_active)}
                                        />
                                        <span className={styles.slider}></span>
                                    </label>
                                    <span className={styles.statusLabel}>
                                        {comp.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.iconBtn}
                                        onClick={() => { setEditingComponent(comp); setIsModalOpen(true); }}
                                        title="Edit"
                                        aria-label={`Edit ${comp.name}`}
                                    >
                                        <EditIcon />
                                    </button>
                                    <button
                                        className={`${styles.iconBtn} ${styles.delete}`}
                                        onClick={() => handleDelete(comp.id, comp.name)}
                                        title="Delete"
                                        aria-label={`Delete ${comp.name}`}
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AddComponentModal 
                isOpen={isModalOpen} 
                onClose={handleSave} 
                editData={editingComponent} 
            />
        </div>
    );
};

export default SalaryComponents;
