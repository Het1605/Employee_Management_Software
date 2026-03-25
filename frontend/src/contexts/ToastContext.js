import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type, visible: true });
        
        // Auto-dismiss after 3.5 seconds
        setTimeout(() => {
            setToast(t => ({ ...t, visible: false }));
        }, 3500);
    }, []);

    const toastStyles = {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '14px 28px',
        borderRadius: '8px',
        color: '#ffffff',
        fontWeight: '600',
        fontSize: '15px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        zIndex: 9999,
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        opacity: toast.visible ? 1 : 0,
        transform: toast.visible ? 'translateY(0)' : 'translateY(20px)',
        pointerEvents: toast.visible ? 'auto' : 'none',
        background: toast.type === 'error' ? '#ef4444' : '#10b981',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div style={toastStyles}>
                {toast.type === 'error' ? '⚠️' : '✅'}
                <span>{toast.message}</span>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
