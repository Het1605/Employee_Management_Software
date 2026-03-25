import React from 'react';

const ConfirmDialog = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', width: '90%' }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button onClick={onCancel} style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', backgroundColor: '#ef4444', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
