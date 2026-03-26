import React from 'react';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useCalendarMutations } from '../../hooks/useCalendarMutations';
import { useToast } from '../../contexts/ToastContext';

// Trash Icon SVG
const TrashIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" className="icon-trash" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
   </svg>
);

const OverrideManagement = () => {
    const { overrides, loading, refreshData } = useCalendarData();
    const { deleteOverride } = useCalendarMutations(refreshData);
    const { showToast } = useToast();

    const handleDelete = async (id) => {
        if (window.confirm("Delete this override?")) {
            try {
                await deleteOverride(id);
                showToast("Override deleted", "success");
            } catch (err) {
                showToast("Error deleting override", "error");
            }
        }
    };

    if (loading) return <div className="loading-state">Loading overrides...</div>;

    return (
        <div className="management-card-container">
            <div className="management-card">
                <div className="management-header">
                    <div className="titles">
                        <h3>Calendar Overrides</h3>
                        <p className="subtitle">Manage forced working days or impromptu holidays.</p>
                    </div>
                    <div className="action-buttons">
                        <button className="btn-primary-action">+ Add Override</button>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="modern-data-table">
                        <thead>
                            <tr>
                                <th className="th-date">Target Date</th>
                                <th className="th-badge">Forced Type</th>
                                <th className="th-name">Reason</th>
                                <th className="th-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {overrides.length === 0 ? (
                                <tr>
                                    <td colSpan="4">
                                        <div className="empty-table-state">
                                            <span className="huge-icon">📅</span>
                                            <p>No overrides defined.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                overrides.map((o) => (
                                    <tr key={o.id}>
                                        <td className="td-date font-medium">{new Date(o.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric'})}</td>
                                        <td className="td-badge">
                                            <span className={`pill-badge override-${o.override_type}`}>{o.override_type.replace('_', ' ')}</span>
                                        </td>
                                        <td className="td-name text-muted">{o.reason || '-'}</td>
                                        <td className="td-actions">
                                            <button className="btn-icon-danger" onClick={() => handleDelete(o.id)} title="Delete Override">
                                                <TrashIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OverrideManagement;
