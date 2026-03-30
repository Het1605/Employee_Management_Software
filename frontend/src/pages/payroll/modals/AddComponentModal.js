import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from '../../../styles/UserManagement.module.css';

const INITIAL_FORM = {
    name: '',
    type: 'EARNING',
    is_taxable: true
};

const AddComponentModal = ({ isOpen, onClose, editData }) => {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [error, setError] = useState('');

    const handleClose = useCallback(() => {
        setFormData(INITIAL_FORM);
        setError('');
        onClose(null);
    }, [onClose]);

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name,
                type: editData.type,
                is_taxable: editData.is_taxable
            });
        } else {
            setFormData(INITIAL_FORM);
        }
        setError('');
    }, [editData, isOpen]);

    useEffect(() => {
        const onEsc = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', onEsc);
        }

        return () => {
            document.removeEventListener('keydown', onEsc);
        };
    }, [isOpen, handleClose]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Component Name is required');
            return;
        }

        setError('');
        onClose(formData);
    };

    return createPortal(
        (
        <div
            className={styles.modalOverlay}
            onMouseDown={handleClose}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
            }}
        >
            <div
                className={styles.modalContent}
                style={{
                    background: '#ffffff',
                    padding: '2rem',
                    borderRadius: '12px',
                    width: '450px',
                    maxWidth: '90%',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    border: 'none',
                    margin: 0
                }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div
                    className={styles.modalHeader}
                    style={{
                        marginBottom: '1rem',
                        paddingBottom: 0,
                        borderBottom: 'none'
                    }}
                >
                    <h2>{editData ? 'Edit Salary Component' : 'Add Salary Component'}</h2>
                    <button type="button" className={styles.closeBtn} onClick={handleClose}>&times;</button>
                </div>
                
                {error && (
                    <div className={styles.errorMsg} style={{ marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}
                
                <form
                    onSubmit={handleSubmit}
                    className={styles.formGrid}
                    style={{ gridTemplateColumns: '1fr', gap: '0.9rem' }}
                >
                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                        <label>Component Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Basic Salary, HRA"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="EARNING">EARNING</option>
                            <option value="DEDUCTION">DEDUCTION</option>
                        </select>
                    </div>

                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <input
                                id="is_taxable"
                                type="checkbox"
                                checked={formData.is_taxable}
                                onChange={(e) => setFormData({ ...formData, is_taxable: e.target.checked })}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label
                                htmlFor="is_taxable"
                                style={{
                                    margin: 0,
                                    color: '#475569',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    letterSpacing: 0,
                                    textTransform: 'none'
                                }}
                            >
                                Is Taxable
                            </label>
                        </div>
                    </div>

                    <div
                        className={styles.formActions}
                        style={{
                            marginTop: '0.5rem',
                            paddingTop: 0,
                            gap: '0.75rem',
                            borderTop: 'none'
                        }}
                    >
                        <button type="button" className={styles.cancelBtn} onClick={handleClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitBtn}>
                            {editData ? 'Update Component' : 'Create Component'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        ),
        document.body
    );
};

export default AddComponentModal;
