import React, { useState } from 'react';
import { useCalendarMutations } from '../../hooks/useCalendarMutations';
import { useToast } from '../../../../contexts/ToastContext';
import { useCompanyContext } from '../../../../contexts/CompanyContext';

const AddHolidayModal = ({ onClose, editData = null }) => {
    const { createHoliday, updateHoliday, saving } = useCalendarMutations();
    const { showToast } = useToast();
    const { selectedCompanyId } = useCompanyContext();

    const [conflict, setConflict] = useState(null);
    const [formData, setFormData] = useState({
        date: editData ? editData.date : '',
        name: editData ? editData.name : '',
        type: editData ? editData.type : 'public',
        description: editData ? (editData.description || '') : ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e, force = false) => {
        if (e) e.preventDefault();
        
        if (!formData.date || !formData.name) {
            showToast("Please fill in the required fields (Date and Name).", "warning");
            return;
        }

        try {
            if (editData) {
                await updateHoliday(editData.id, {
                    date: formData.date,
                    name: formData.name,
                    type: formData.type,
                    description: formData.description || null,
                    force: force
                });
                showToast("Holiday updated successfully", "success");
            } else {
                await createHoliday({
                    company_id: selectedCompanyId,
                    date: formData.date,
                    name: formData.name,
                    type: formData.type,
                    description: formData.description || null,
                    source: "manual",
                    force: force
                });
                showToast("Holiday added successfully", "success");
            }
            onClose(true); 
        } catch (err) {
            if (err.response?.status === 409 && err.response.data?.detail?.conflict) {
                setConflict(err.response.data.detail);
                return;
            }

            let errorMsg = `Failed to ${editData ? 'update' : 'add'} holiday.`;
            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                if (typeof detail === 'string') {
                    errorMsg = detail;
                } else if (Array.isArray(detail)) {
                    errorMsg = detail.map(d => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}`).join(', ');
                }
            }
            showToast(errorMsg, "error");
        }
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="modal-content card" style={{ background: '#ffffff', padding: '2rem', borderRadius: '12px', width: '450px', maxWidth: '90%', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginBottom: '1.5rem', color: '#0f172a' }}>{editData ? 'Edit Holiday' : 'Add New Holiday'}</h3>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                    {conflict && (
                        <div className="conflict-overlay" style={{
                            position: 'absolute',
                            inset: '-0.5rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 10,
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: '1.5rem',
                            border: '2px solid #3b82f6',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
                            <h4 style={{ color: '#1e293b', marginBottom: '0.5rem', fontWeight: '700' }}>Conflict Detected</h4>
                            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                                {conflict.message}
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                                <button 
                                    type="button" 
                                    className="btn-secondary" 
                                    style={{ flex: 1 }}
                                    onClick={() => setConflict(null)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-primary-action" 
                                    style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                                    onClick={() => handleSubmit(null, true)}
                                >
                                    Replace
                                </button>
                            </div>
                        </div>
                    )}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Date <span style={{ color: '#ef4444' }}>*</span></label>
                        <input 
                            type="date" 
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="company-select-modern"
                            style={{ width: '100%', padding: '0.6rem' }}
                            required
                        />
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Holiday Name <span style={{ color: '#ef4444' }}>*</span></label>
                        <input 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="company-select-modern"
                            style={{ width: '100%', padding: '0.6rem' }}
                            placeholder="e.g., New Year's Day"
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Type <span style={{ color: '#ef4444' }}>*</span></label>
                        <select 
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="company-select-modern"
                            style={{ width: '100%', padding: '0.6rem' }}
                        >
                            <option value="public">Public</option>
                            <option value="company">Company</option>
                            <option value="optional">Optional</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Description (Optional)</label>
                        <textarea 
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="company-select-modern"
                            style={{ width: '100%', padding: '0.6rem', resize: 'vertical', minHeight: '80px' }}
                            placeholder="Additional details..."
                        ></textarea>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn-secondary" onClick={() => onClose(false)} disabled={saving}>Cancel</button>
                        <button type="submit" className="btn-primary-action" disabled={saving}>
                            {saving ? 'Saving...' : (editData ? 'Update Holiday' : 'Save Holiday')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddHolidayModal;
