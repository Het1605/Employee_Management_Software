import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import API from '../core/api/apiClient';

const CompanyContext = createContext();
const STORAGE_KEY = 'selectedCompany';

export const CompanyProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const loadCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const res = await API.get('/companies');
        const list = res.data || [];
        setCompanies(list);
        
        // Auto-select if nothing selected
        if (!selectedCompany?.id && list.length > 0) {
          setSelectedCompanyId(list[0]);
        }
      } catch {
        setCompanies([]);
      } finally {
        setLoadingCompanies(false);
      }
    };
    loadCompanies();
  }, []);

  useEffect(() => {
    try {
      if (selectedCompany?.id) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedCompany));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (!selectedCompany?.id || companies.length === 0) return;
    const exists = companies.some((c) => String(c.id) === String(selectedCompany.id));
    if (!exists) {
      setSelectedCompany(null);
    }
  }, [companies, selectedCompany]);

  const selectedCompanyId = selectedCompany?.id || '';

  const setSelectedCompanyId = (company) => {
    if (!company) {
      setSelectedCompany(null);
      return;
    }

    if (typeof company === 'object') {
      setSelectedCompany({
        id: String(company.id),
        name: company.name || '',
      });
      return;
    }

    const found = companies.find((c) => String(c.id) === String(company));
    setSelectedCompany({
      id: String(company),
      name: found?.name || '',
    });
  };

  const value = useMemo(
    () => ({
      companies,
      loadingCompanies,
      selectedCompany,
      selectedCompanyId,
      setSelectedCompanyId,
    }),
    [companies, loadingCompanies, selectedCompany, selectedCompanyId]
  );

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompanyContext = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
};
