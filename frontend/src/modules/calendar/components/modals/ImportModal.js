import React, { useState } from 'react';

const ImportModal = ({ onClose }) => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [country, setCountry] = useState('IN');
    const [fetching, setFetching] = useState(false);
    const [templates, setTemplates] = useState([]);

    const handleFetchMock = () => {
        setFetching(true);
        // Simulate fetch delay without API integration
        setTimeout(() => {
            setTemplates([]); // Kept empty as per instructed temporary behavior
            setFetching(false);
        }, 800);
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="modal-content card" style={{ background: '#ffffff', padding: '2rem', borderRadius: '12px', width: '500px', maxWidth: '90%', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginBottom: '1.5rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>Import Holidays</h3>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Year</label>
                        <select 
                            value={year} 
                            onChange={e => setYear(e.target.value)} 
                            className="company-select-modern" 
                            style={{ width: '100%', padding: '0.5rem' }}
                        >
                            {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Country</label>
                        <select 
                            value={country} 
                            onChange={e => setCountry(e.target.value)} 
                            className="company-select-modern" 
                            style={{ width: '100%', padding: '0.5rem' }}
                        >
                            <option value="IN">India (IN)</option>
                            <option value="US">United States (US)</option>
                            <option value="UK">United Kingdom (UK)</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                        <button 
                            className="btn-secondary" 
                            onClick={handleFetchMock} 
                            disabled={fetching}
                            style={{ height: '42px', marginTop: '20px' }}
                        >
                            {fetching ? 'Fetching...' : 'Fetch'}
                        </button>
                    </div>
                </div>

                <div className="import-list" style={{ minHeight: '150px', maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {templates.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No holidays fetched yet.</p>
                    ) : (
                        <div>{/* Future list structure goes here */}</div>
                    )}
                </div>

                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn-primary-action" disabled={true} style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                        Import Selected
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
