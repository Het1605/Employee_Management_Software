import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { handleApiError } from '../../utils/errorHandler';
import styles from '../../styles/SalaryStructure.module.css';
import AddStructureModal from './modals/AddStructureModal';

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

const StructureInfo = ({ companyId }) => {
    const [structures, setStructures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStructure, setEditingStructure] = useState(null);
    const { showToast } = useToast();

    const fetchStructures = async () => {
        if (!companyId) {
            setStructures([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await API.get(`/salary-structures?company_id=${companyId}`);
            setStructures(res.data || []);
        } catch (err) {
            showToast("Failed to fetch structures: " + handleApiError(err), "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStructures();
    }, [companyId]);

    useEffect(() => {
        setIsModalOpen(false);
        setEditingStructure(null);
    }, [companyId]);

    const handleSave = async (formData) => {
        if (!formData) {
            setIsModalOpen(false);
            setEditingStructure(null);
            return;
        }

        try {
            if (!companyId) {
                showToast("Please select a company first.", "warning");
                return;
            }

            if (editingStructure) {
                await API.put(`/salary-structures/${editingStructure.id}?company_id=${companyId}`, formData);
                showToast("Structure updated successfully", "success");
            } else {
                await API.post('/salary-structures/', {
                    ...formData,
                    company_id: Number(companyId),
                    is_active: true
                });
                showToast("Structure created successfully", "success");
            }

            await fetchStructures();
            setIsModalOpen(false);
            setEditingStructure(null);
        } catch (err) {
            showToast("Operation Failed: " + handleApiError(err), "error");
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await API.patch(`/salary-structures/${id}/status?company_id=${companyId}`, { is_active: !currentStatus });
            setStructures(structures.map((structure) => (
                structure.id === id ? { ...structure, is_active: !currentStatus } : structure
            )));
            showToast("Structure status updated successfully", "success");
        } catch (err) {
            showToast("Failed to update structure status: " + handleApiError(err), "error");
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
            try {
                await API.delete(`/salary-structures/${id}?company_id=${companyId}`);
                setStructures(structures.filter((structure) => structure.id !== id));
                showToast("Structure deleted successfully", "success");
            } catch (err) {
                showToast("Delete Failed: " + handleApiError(err), "error");
            }
        }
    };

    if (loading) return <div className={styles.comingSoon}>Loading structures...</div>;

    return (
        <div>
            <div className={styles.tabHeader}>
                <div className={styles.tabTitles}>
                    <h3>Salary Structures</h3>
                    <p className={styles.tabSubtitle}>Manage salary structures for selected company.</p>
                </div>
                <button className="btn-primary-action" onClick={() => setIsModalOpen(true)}>
                    + Add Structure
                </button>
            </div>

            <div className={styles.structureList}>
                {structures.length === 0 ? (
                    <div className={styles.emptyCardState}>
                        <div className={styles.placeholderIcon}>🗂️</div>
                        <p>No structures available. Click "+ Add Structure" to get started.</p>
                    </div>
                ) : (
                    structures.map((structure) => (
                        <article key={structure.id} className={styles.structureItem}>
                            <div className={styles.structureContent}>
                                <h4 className={styles.structureName}>{structure.name}</h4>
                                <p className={styles.structureDescriptionText}>
                                    {structure.description || 'No description provided'}
                                </p>
                            </div>

                            <div className={styles.structureActionsRow}>
                                <div className={styles.statusToggle}>
                                    <label className={styles.switch}>
                                        <input
                                            type="checkbox"
                                            checked={structure.is_active}
                                            onChange={() => handleToggleStatus(structure.id, structure.is_active)}
                                        />
                                        <span className={styles.slider}></span>
                                    </label>
                                    <span className={styles.statusLabel}>
                                        {structure.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.iconBtn}
                                        onClick={() => { setEditingStructure(structure); setIsModalOpen(true); }}
                                        title="Edit"
                                        aria-label={`Edit ${structure.name}`}
                                    >
                                        <EditIcon />
                                    </button>
                                    <button
                                        className={`${styles.iconBtn} ${styles.delete}`}
                                        onClick={() => handleDelete(structure.id, structure.name)}
                                        title="Delete"
                                        aria-label={`Delete ${structure.name}`}
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </div>

            <AddStructureModal
                isOpen={isModalOpen}
                onClose={handleSave}
                editData={editingStructure}
            />
        </div>
    );
};

export default StructureInfo;
