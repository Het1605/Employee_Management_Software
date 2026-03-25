import React, { useState, useEffect } from 'react';
import styles from '../../styles/CompanyModule.module.css';

const CompanyFormModal = ({ isOpen, onClose, onSubmit, company = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        gst_number: '',
        pan_number: '',
        logo_url: ''
    });

    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name || '',
                address: company.address || '',
                gst_number: company.gst_number || '',
                pan_number: company.pan_number || '',
                logo_url: company.logo_url || ''
            });
        } else {
            setFormData({
                name: '',
                address: '',
                gst_number: '',
                pan_number: '',
                logo_url: ''
            });
        }
    }, [company, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'gst_number') {
            const upperVal = value.toUpperCase();
            
            // Automatically extract PAN if string has reached indices 3-12
            let extractedPan = formData.pan_number;
            if (upperVal.length >= 12) {
                extractedPan = upperVal.substring(2, 12);
            } else if (upperVal.length > 2) {
                extractedPan = upperVal.substring(2);
            } else {
                extractedPan = '';
            }
            
            setFormData(prev => ({
                ...prev,
                gst_number: upperVal,
                pan_number: extractedPan
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    logo_url: reader.result // Base64 string
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setFormData(prev => ({ ...prev, logo_url: '' }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3>{company ? 'Edit Company' : 'Register New Company'}</h3>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        <div className={styles.formGrid}>
                            <div className={styles.inputGroup}>
                                <label>Company Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter full legal name"
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Address *</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                    rows="3"
                                    placeholder="Full physical address"
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.inputGroup}>
                                    <label>GST Number *</label>
                                    <input
                                        type="text"
                                        name="gst_number"
                                        value={formData.gst_number}
                                        onChange={handleChange}
                                        placeholder="15-digit GSTIN (e.g. 27ABCDE1234F1Z5)"
                                        pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[0-9A-Z]{1}[0-9A-Z]{1}$"
                                        title="Format: 2 digits, 5 letters, 4 digits, 1 letter, followed by 3 alphanumeric characters"
                                        maxLength={15}
                                        required
                                    />
                                </div>

                                <div className={styles.inputGroup}>
                                    <label>PAN Number (Auto-extracted) *</label>
                                    <input
                                        type="text"
                                        name="pan_number"
                                        value={formData.pan_number}
                                        onChange={handleChange}
                                        placeholder="10-digit PAN"
                                        pattern="^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
                                        title="PAN is automatically extracted from the GST Number."
                                        readOnly
                                        style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed', color: '#64748b' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Company Logo</label>
                                
                                {!formData.logo_url ? (
                                    <>
                                        <label className={styles.uploadArea}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                style={{ display: 'none' }}
                                            />
                                            <span className={styles.uploadIcon}>📁</span>
                                            <span className={styles.uploadLabel}>Click to upload logo file</span>
                                        </label>
                                        
                                        <div className={styles.divider}>OR</div>
                                        
                                        <input
                                            type="text"
                                            name="logo_url"
                                            value={formData.logo_url}
                                            onChange={handleChange}
                                            placeholder="Paste URL (https://...)"
                                        />
                                    </>
                                ) : (
                                    <div className={styles.previewContainer}>
                                        <img src={formData.logo_url} alt="Logo Preview" className={styles.logoPreview} />
                                        <div className={styles.previewInfo}>
                                            <span>Logo Ready</span>
                                            <span className={styles.removeLogo} onClick={removeLogo}>Remove & change</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitBtn}>
                            {company ? 'Update Company' : 'Register Company'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompanyFormModal;
