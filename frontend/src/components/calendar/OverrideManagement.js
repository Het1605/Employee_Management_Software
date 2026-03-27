import React, { useState } from 'react';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useCalendarMutations } from '../../hooks/useCalendarMutations';
import { useToast } from '../../contexts/ToastContext';
import AddOverrideModal from './modals/AddOverrideModal';

// Trash Icon SVG
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

const formatLabel = (value) =>
    value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const OverrideManagement = () => {
    const { overrides, loading, refreshData } = useCalendarData();
    const { deleteOverride } = useCalendarMutations(refreshData);
    const { showToast } = useToast();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingOverride, setEditingOverride] = useState(null);

    const handleDelete = async (id) => {
        if (window.confirm("Delete this Custom Day?")) {
            try {
                await deleteOverride(id);
                showToast("Custom Day deleted", "success");
            } catch (err) {
                showToast("Error deleting Custom Day", "error");
            }
        }
    };

    if (loading) return <div className="loading-state">Loading Custom Days...</div>;

    return (
        <div className="management-card-container">
            <div className="management-card">
                <div className="management-header">
                    <div className="titles">
                        <h3>Manage Custom Days</h3>
                        <p className="subtitle">Set specific working days, holidays, or half days for specific dates.</p>
                    </div>
                    <div className="action-buttons">
                        <button className="btn-primary-action" onClick={() => setShowAddModal(true)}>+ Add Custom Day</button>
                    </div>
                </div>

                <div className="card-list-grid">
                    {overrides.length === 0 ? (
                        <div className="empty-card-state">
                            <p>No Custom Days available</p>
                        </div>
                    ) : (
                        overrides.map((o) => (
                            <article key={o.id} className="data-card">
                                <div className="data-card-header">
                                    <div className="data-card-content">
                                        <p className="data-card-date">
                                            {new Date(o.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric'})}
                                        </p>
                                    </div>

                                    <div className="actions">
                                        <button className="btn-icon-primary" onClick={() => setEditingOverride(o)} title="Edit Custom Day" aria-label={`Edit Custom Day for ${o.date}`}>
                                            <EditIcon />
                                        </button>
                                        <button className="btn-icon-danger" onClick={() => handleDelete(o.id)} title="Delete Custom Day" aria-label={`Delete Custom Day for ${o.date}`}>
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>

                                <div className="data-card-body">
                                    <div className="data-card-row">
                                        <span className="data-card-label">Type:</span>
                                        <span className={`pill-badge override-${o.override_type}`}>{formatLabel(o.override_type)}</span>
                                    </div>

                                    <div className="data-card-row data-card-row-wrap">
                                        <span className="data-card-label">Reason:</span>
                                        <p className="data-card-text">{o.reason || '-'}</p>
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </div>

            {(showAddModal || editingOverride) && (
                <AddOverrideModal 
                    editData={editingOverride}
                    onClose={(didAdd) => {
                        setShowAddModal(false);
                        setEditingOverride(null);
                        if (didAdd) refreshData();
                    }}
                />
            )}
        </div>
    );
};

export default OverrideManagement;
