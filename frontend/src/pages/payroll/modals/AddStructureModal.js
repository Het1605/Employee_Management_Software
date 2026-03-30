import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from '../../../styles/UserManagement.module.css';

const INITIAL_FORM = {
    name: '',
    description: ''
};

const AddStructureModal = ({ isOpen, onClose, editData }) => {
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
                name: editData.name || '',
                description: editData.description || ''
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
            setError('Structure Name is required');
            return;
        }

        setError('');
        onClose({
            name: formData.name.trim(),
            description: formData.description.trim() || null
        });
    };

    return createPortal(
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
                    <h2>{editData ? 'Edit Salary Structure' : 'Add Salary Structure'}</h2>
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
                        <label>Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Software Engineer"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                        <label>Description</label>
                        <textarea
                            placeholder="e.g. For IT employees"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            style={{
                                minHeight: '100px',
                                resize: 'vertical',
                                padding: '0.75rem',
                                border: '1.5px solid #e2e8f0',
                                borderRadius: '10px',
                                fontSize: '0.9375rem',
                                backgroundColor: '#f8fafc',
                                color: '#1e293b'
                            }}
                        />
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
                            {editData ? 'Update Structure' : 'Create Structure'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default AddStructureModal;
