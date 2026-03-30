import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import API from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { handleApiError } from '../../utils/errorHandler';
import styles from '../../styles/SalaryStructure.module.css';
import SalaryComponents from './SalaryComponents';
import StructureInfo from './StructureInfo';

const SalaryStructureManagement = () => {
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [activeTab, setActiveTab] = useState('info');
    const { showToast } = useToast();

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await API.get('/companies/');
                setCompanies(res.data || []);
            } catch (err) {
                showToast("Failed to load companies: " + handleApiError(err), 'error');
            }
        };
        fetchCompanies();
    }, [showToast]);

    const handleCompanyChange = (e) => {
        setSelectedCompanyId(e.target.value);
    };

    const tabs = [
        { id: 'info', label: 'Structure Info' },
        { id: 'components', label: 'Components' },
        { id: 'rules', label: 'Calculation Rules' }
    ];

    return (
        <Layout title="Salary Structure Management">
            <div className={styles.container}>
                {/* Company Selection Header */}
                <div className={styles.headerCard}>
                    <div className={styles.headerLeft}>
                        <span className={styles.iconBuilding}>🏢</span>
                        <div className={`${styles.companySelectWrapper} ${!selectedCompanyId ? styles.placeholder : ''}`}>
                            <select 
                                value={selectedCompanyId} 
                                onChange={handleCompanyChange}
                                className={styles.companySelect}
                            >
                                <option value="" disabled>Select Company</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.name}
                                    </option>
                                ))}
                            </select>
                            <span className={styles.selectArrow}>▼</span>
                        </div>
                    </div>
                </div>

                {!selectedCompanyId ? (
                    <div className={`${styles.emptyState} ${styles.fadeIn}`}>
                        <div className={styles.emptyIcon}>💰</div>
                        <h3>Get Started</h3>
                        <p>Please select a company to manage its salary structures.</p>
                    </div>
                ) : (
                    <div className={styles.fadeIn}>
                        {/* Navigation Tabs */}
                        <div className={styles.tabsContainer}>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content Placeholder */}
                        <div className={`${styles.contentBody} ${styles.fadeIn}`}>
                            {activeTab === 'info' ? (
                                <StructureInfo companyId={selectedCompanyId} />
                            ) : activeTab === 'components' ? (
                                <SalaryComponents companyId={selectedCompanyId} />
                            ) : (
                                <div className={styles.comingSoon}>
                                    <span className={styles.placeholderIcon}>🛠️</span>
                                    <p>
                                        <strong>{tabs.find(t => t.id === activeTab).label}</strong> configuration for 
                                        <strong> {companies.find(c => String(c.id) === String(selectedCompanyId))?.name}</strong> is under development.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default SalaryStructureManagement;
