import React, { useState } from 'react';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useCalendarMutations } from '../../hooks/useCalendarMutations';
import { useToast } from '../../contexts/ToastContext';
import ImportModal from './modals/ImportModal';

// Trash Icon SVG functional component
const TrashIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" className="icon-trash" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
   </svg>
);

const HolidayManagement = () => {
    const { holidays, loading, refreshData } = useCalendarData();
    const { deleteHoliday } = useCalendarMutations(refreshData);
    const { showToast } = useToast();
    const [showImportModal, setShowImportModal] = useState(false);

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
                    <div className="action-buttons">
                        <button className="btn-secondary" onClick={() => setShowImportModal(true)}>Import Holidays</button>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="modern-data-table">
                        <thead>
                            <tr>
                                <th className="th-date">Date</th>
                                <th className="th-name">Holiday Name</th>
                                <th className="th-badge">Type</th>
                                <th className="th-badge">Source</th>
                                <th className="th-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeHolidays.length === 0 ? (
                                <tr>
                                    <td colSpan="5">
                                        <div className="empty-table-state">
                                            <span className="huge-icon">🌴</span>
                                            <p>No holidays logged yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                activeHolidays.map((h) => (
                                    <tr key={h.id}>
                                        <td className="td-date font-medium">{new Date(h.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric'})}</td>
                                        <td className="td-name">{h.name}</td>
                                        <td className="td-badge">
                                            <span className={`pill-badge type-${h.type}`}>{h.type}</span>
                                        </td>
                                        <td className="td-badge">
                                            <span className={`pill-badge source-${h.source}`}>{h.source}</span>
                                        </td>
                                        <td className="td-actions">
                                            <button className="btn-icon-danger" onClick={() => handleDelete(h.id)} title="Delete Holiday">
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

            {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} />}
        </div>
    );
};

export default HolidayManagement;
