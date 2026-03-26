import React, { useState, useEffect } from 'react';
import { useCalendarMutations } from '../../../hooks/useCalendarMutations';
import { useToast } from '../../../contexts/ToastContext';

const ImportModal = ({ onClose }) => {
    const { fetchImportOptions, importHolidays, saving } = useCalendarMutations();
    const { showToast } = useToast();
    
    const [year, setYear] = useState(new Date().getFullYear());
    const [country, setCountry] = useState('IN');
    const [templates, setTemplates] = useState([]);
    const [selectedIndexes, setSelectedIndexes] = useState(new Set());
    const [fetching, setFetching] = useState(false);

    const handleFetch = async () => {
        setFetching(true);
        try {
            const data = await fetchImportOptions(year, country);
            setTemplates(data || []);
            setSelectedIndexes(new Set()); // reset selections
        } catch (err) {
            showToast("Failed to fetch templates or backend route inactive", "error");
            // MOCK data fallback since backend lacks this complete API:
            setTemplates([
                { date: `${year}-01-26`, name: "Republic Day", type: "public", source: "imported" },
                { date: `${year}-08-15`, name: "Independence Day", type: "public", source: "imported" },
                { date: `${year}-10-02`, name: "Gandhi Jayanti", type: "public", source: "imported" }
            ]);
        } finally {
            setFetching(false);
        }
    };

    const toggleSelection = (index) => {
        const newSet = new Set(selectedIndexes);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedIndexes(newSet);
    };

    const handleImport = async () => {
        const toImport = templates.filter((_, i) => selectedIndexes.has(i));
        if (toImport.length === 0) {
            showToast("Please select at least one holiday to import.", "error");
            return;
        }

        try {
            await importHolidays(toImport);
            showToast("Holidays successfully imported!", "success");
            onClose();
        } catch (err) {
            showToast("Failed to import holidays", "error");
        }
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
            <div className="modal-content card" style={{ background: '#fff', width: '500px', maxWidth: '90%', padding: '20px' }}>
                <h3>Import Holidays</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="Year" className="form-input" />
                    <input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder="Country Code" className="form-input" />
                    <button className="btn btn-outline" onClick={handleFetch} disabled={fetching}>
                        {fetching ? 'Fetching...' : 'Fetch'}
                    </button>
                </div>

                <div className="import-list" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #eee', padding: '10px' }}>
                    {templates.length === 0 ? <p>No holidays fetched yet.</p> : (
                        templates.map((tpl, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedIndexes.has(idx)} 
                                    onChange={() => toggleSelection(idx)}
                                />
                                <span>{tpl.date} - {tpl.name}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button className="btn btn-outline" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleImport} disabled={saving || selectedIndexes.size === 0}>
                        {saving ? 'Importing...' : `Import (${selectedIndexes.size})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
