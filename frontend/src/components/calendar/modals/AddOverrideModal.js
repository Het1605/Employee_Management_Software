import React, { useState } from 'react';
import { useCalendarMutations } from '../../../hooks/useCalendarMutations';
import { useToast } from '../../../contexts/ToastContext';
import { useCalendarContext } from '../../../utils/calendarContext';

const AddOverrideModal = ({ onClose, editData = null }) => {
    const { createOverride, updateOverride, saving } = useCalendarMutations();
    const { showToast } = useToast();
    const { selectedCompanyId } = useCalendarContext();

    const [formData, setFormData] = useState({
        date: editData ? editData.date : '',
        override_type: editData ? editData.override_type : 'working',
        reason: editData ? (editData.reason || '') : ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.date || !formData.override_type) {
            showToast("Please fill in the required fields.", "warning");
            return;
        }

        try {
            if (editData) {
                await updateOverride(editData.id, {
                    date: formData.date,
                    override_type: formData.override_type,
                    reason: formData.reason || null
                });
                showToast("Override updated successfully", "success");
            } else {
                await createOverride({
                    company_id: selectedCompanyId,
                    date: formData.date,
                    override_type: formData.override_type,
                    reason: formData.reason || null
                });
                showToast("Override added successfully", "success");
            }
            onClose(true); // tells parent to refresh Data
        } catch (err) {
            let errorMsg = `Failed to ${editData ? 'update' : 'add'} override.`;
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
                <h3 style={{ marginBottom: '1.5rem', color: '#0f172a' }}>{editData ? 'Edit Override' : 'Add New Override'}</h3>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Target Date <span style={{ color: '#ef4444' }}>*</span></label>
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
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Forced Type <span style={{ color: '#ef4444' }}>*</span></label>
                        <select 
                            name="override_type"
                            value={formData.override_type}
                            onChange={handleChange}
                            className="company-select-modern"
                            style={{ width: '100%', padding: '0.6rem' }}
                            required
                        >
                            <option value="working">Working Day</option>
                            <option value="holiday">Holiday</option>
                            <option value="half_day">Half Day</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>Reason (Optional)</label>
                        <textarea 
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            className="company-select-modern"
                            style={{ width: '100%', padding: '0.6rem', resize: 'vertical', minHeight: '80px' }}
                            placeholder="Why is this date overridden?..."
                        ></textarea>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn-secondary" onClick={() => onClose(false)} disabled={saving}>Cancel</button>
                        <button type="submit" className="btn-primary-action" disabled={saving}>
                            {saving ? 'Saving...' : (editData ? 'Update Override' : 'Save Override')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddOverrideModal;
