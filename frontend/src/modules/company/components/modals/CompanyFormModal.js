import React, { useState, useEffect } from 'react';
import styles from '../../pages/styles/CompanyManagement.module.css';

const CompanyFormModal = ({ isOpen, onClose, onSubmit, company = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        address_line_1: '',
        address_line_2: '',
        address_line_3: '',
        postal_code: '',
        gst_number: '',
        pan_number: '',
        logo_url: '',
        header_image: '',
        footer_image: '',
        company_stamp: ''
    });

    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name || '',
                address_line_1: company.address_line_1 || '',
                address_line_2: company.address_line_2 || '',
                address_line_3: company.address_line_3 || '',
                postal_code: company.postal_code || '',
                gst_number: company.gst_number || '',
                pan_number: company.pan_number || '',
                logo_url: company.logo_url || '',
                header_image: company.header_image || '',
                footer_image: company.footer_image || '',
                company_stamp: company.company_stamp || ''
            });
        } else {
            setFormData({
                name: '',
                address_line_1: '',
                address_line_2: '',
                address_line_3: '',
                postal_code: '',
                gst_number: '',
                pan_number: '',
                logo_url: '',
                header_image: '',
                footer_image: '',
                company_stamp: ''
            });
        }
    }, [company, isOpen, setFormData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'gst_number') {
            const upperVal = value.toUpperCase();
            setFormData(prev => {
                const updated = { ...prev, gst_number: upperVal };
                // Extract PAN if first 12 chars of GST change
                const oldGstPart = prev.gst_number.substring(0, 12);
                const newGstPart = upperVal.substring(0, 12);
                
                if (newGstPart.length >= 12 && newGstPart !== oldGstPart) {
                    updated.pan_number = newGstPart.substring(2, 12);
                }
                return updated;
            });
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    [fieldName]: reader.result // Base64 string
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (fieldName) => {
        setFormData(prev => ({ ...prev, [fieldName]: '' }));
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
                                <label>Address Line 1</label>
                                <input
                                    type="text"
                                    name="address_line_1"
                                    value={formData.address_line_1}
                                    onChange={handleChange}
                                    placeholder="House/Office No, Street"
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Address Line 2</label>
                                <input
                                    type="text"
                                    name="address_line_2"
                                    value={formData.address_line_2}
                                    onChange={handleChange}
                                    placeholder="Area, Landmark"
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Address Line 3</label>
                                <input
                                    type="text"
                                    name="address_line_3"
                                    value={formData.address_line_3}
                                    onChange={handleChange}
                                    placeholder="City, State"
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Postal Code</label>
                                <input
                                    type="text"
                                    name="postal_code"
                                    value={formData.postal_code}
                                    onChange={handleChange}
                                    placeholder="Enter postal code"
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.inputGroup}>
                                    <label>GST Number</label>
                                    <input
                                        type="text"
                                        name="gst_number"
                                        value={formData.gst_number}
                                        onChange={handleChange}
                                        placeholder="15-digit GSTIN"
                                        maxLength={15}
                                    />
                                    <small className={styles.helperText}>Optional – used to auto-fill PAN</small>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label>PAN Number</label>
                                    <input
                                        type="text"
                                        name="pan_number"
                                        value={formData.pan_number}
                                        onChange={handleChange}
                                        placeholder="10-digit PAN"
                                        maxLength={10}
                                    />
                                    <small className={styles.helperText}>Optional</small>
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
                                                onChange={(e) => handleFileChange(e, 'logo_url')}
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
                                            <span className={styles.removeLogo} onClick={() => removeImage('logo_url')}>Remove & change</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Header Image</label>
                                {!formData.header_image ? (
                                    <>
                                        <label className={styles.uploadArea}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'header_image')}
                                                style={{ display: 'none' }}
                                            />
                                            <span className={styles.uploadIcon}>📁</span>
                                            <span className={styles.uploadLabel}>Click to upload header image</span>
                                        </label>
                                        <div className={styles.divider}>OR</div>
                                        <input
                                            type="text"
                                            name="header_image"
                                            value={formData.header_image}
                                            onChange={handleChange}
                                            placeholder="Paste URL (https://...)"
                                        />
                                    </>
                                ) : (
                                    <div className={styles.previewContainer}>
                                        <img src={formData.header_image} alt="Header Preview" className={styles.logoPreview} />
                                        <div className={styles.previewInfo}>
                                            <span>Header Ready</span>
                                            <span className={styles.removeLogo} onClick={() => removeImage('header_image')}>Remove & change</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Footer Image</label>
                                {!formData.footer_image ? (
                                    <>
                                        <label className={styles.uploadArea}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'footer_image')}
                                                style={{ display: 'none' }}
                                            />
                                            <span className={styles.uploadIcon}>📁</span>
                                            <span className={styles.uploadLabel}>Click to upload footer image</span>
                                        </label>
                                        <div className={styles.divider}>OR</div>
                                        <input
                                            type="text"
                                            name="footer_image"
                                            value={formData.footer_image}
                                            onChange={handleChange}
                                            placeholder="Paste URL (https://...)"
                                        />
                                    </>
                                ) : (
                                    <div className={styles.previewContainer}>
                                        <img src={formData.footer_image} alt="Footer Preview" className={styles.logoPreview} />
                                        <div className={styles.previewInfo}>
                                            <span>Footer Ready</span>
                                            <span className={styles.removeLogo} onClick={() => removeImage('footer_image')}>Remove & change</span>
                                        </div>
                                    </div>
                                )}
                            </div>



                            <div className={styles.inputGroup}>
                                <label>Company Stamp</label>
                                {!formData.company_stamp ? (
                                    <>
                                        <label className={styles.uploadArea}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'company_stamp')}
                                                style={{ display: 'none' }}
                                            />
                                            <span className={styles.uploadIcon}>📁</span>
                                            <span className={styles.uploadLabel}>Click to upload stamp</span>
                                        </label>
                                        <div className={styles.divider}>OR</div>
                                        <input
                                            type="text"
                                            name="company_stamp"
                                            value={formData.company_stamp}
                                            onChange={handleChange}
                                            placeholder="Paste URL (https://...)"
                                        />
                                    </>
                                ) : (
                                    <div className={styles.previewContainer}>
                                        <img src={formData.company_stamp} alt="Stamp Preview" className={styles.logoPreview} />
                                        <div className={styles.previewInfo}>
                                            <span>Stamp Ready</span>
                                            <span className={styles.removeLogo} onClick={() => removeImage('company_stamp')}>Remove & change</span>
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
