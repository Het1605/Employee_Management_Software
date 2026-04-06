import React from 'react';
import AppRouter from './core/routing/AppRouter';
import './styles/Global.css';

import { ToastProvider } from './contexts/ToastContext';
import { CompanyProvider } from './contexts/CompanyContext';

function App() {
  return (
    <ToastProvider>
      <CompanyProvider>
        <AppRouter />
      </CompanyProvider>
    </ToastProvider>
  );
}

export default App;
