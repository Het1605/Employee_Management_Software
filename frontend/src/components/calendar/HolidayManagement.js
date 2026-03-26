import React, { useState } from 'react';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useCalendarMutations } from '../../hooks/useCalendarMutations';
import { useToast } from '../../contexts/ToastContext';
import ImportModal from './modals/ImportModal';
import AddHolidayModal from './modals/AddHolidayModal';

// Trash Icon SVG functional component
const TrashIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" className="icon-trash" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
   </svg>
);

// Edit Icon SVG
const EditIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" className="icon-edit" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '18px', height: '18px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
   </svg>
);

const formatHolidaySource = (source) => {
    if (source === 'imported') return 'API';
    if (source === 'manual') return 'Manual';
    return source;
};

const formatLabel = (value) =>
    value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const HolidayManagement = () => {
    const { holidays, loading, refreshData } = useCalendarData();
    const { deleteHoliday } = useCalendarMutations(refreshData);
    const { showToast } = useToast();
    const [showImportModal, setShowImportModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this holiday?")) {
            try {
                await deleteHoliday(id);
                showToast("Holiday deleted successfully", "success");
            } catch (err) {
                showToast("Error deleting holiday", "error");
            }
        }
    };

    if (loading) return <div className="loading-state">Loading holidays...</div>;

    const activeHolidays = holidays.filter(h => h.is_active);

    return (
        <div className="management-card-container">
            <div className="management-card">
                <div className="management-header">
                    <div className="titles">
                        <h3>Holiday Rules</h3>
                        <p className="subtitle">Manage public and company-specific holidays.</p>
                    </div>
                    <div className="action-buttons" style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn-secondary" onClick={() => setShowImportModal(true)}>Import Holidays</button>
                        <button className="btn-primary-action" onClick={() => setShowAddModal(true)}>+ Add Holiday</button>
                    </div>
                </div>

                <div className="card-list-grid">
                    {activeHolidays.length === 0 ? (
                        <div className="empty-card-state">
                            <p>No holidays available</p>
                        </div>
                    ) : (
                        activeHolidays.map((h) => (
                            <article key={h.id} className="data-card">
                                <div className="data-card-header">
                                    <div className="data-card-content">
                                        <p className="data-card-date">
                                            {new Date(h.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric'})}
                                        </p>
                                        <h4 className="data-card-title">{h.name}</h4>
                                    </div>

                                    <div className="actions">
                                        <button className="btn-icon-primary" onClick={() => setEditingHoliday(h)} title="Edit Holiday" aria-label={`Edit ${h.name}`}>
                                            <EditIcon />
                                        </button>
                                        <button className="btn-icon-danger" onClick={() => handleDelete(h.id)} title="Delete Holiday" aria-label={`Delete ${h.name}`}>
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>

                                <div className="card-badge-row">
                                    <span className={`pill-badge type-${h.type}`}>{formatLabel(h.type)}</span>
                                    <span className={`pill-badge source-badge source-${h.source}`}>{formatHolidaySource(h.source)}</span>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </div>

            {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} />}
            {(showAddModal || editingHoliday) && (
                <AddHolidayModal 
                    editData={editingHoliday}
                    onClose={(didAdd) => { 
                        setShowAddModal(false); 
                        setEditingHoliday(null);
                        if (didAdd) refreshData(); 
                    }} 
                />
            )}
        </div>
    );
};

export default HolidayManagement;
