import React from 'react';
import AppRouter from './core/routing/AppRouter';
import './styles/Global.css';

import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}

export default App;
