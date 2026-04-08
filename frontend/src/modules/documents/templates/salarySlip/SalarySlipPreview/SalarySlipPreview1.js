import React from 'react';
import styles from '../../../pages/styles/DocumentsPage.module.css';
import { generateSalarySlipTemplate1 } from '../SalarySlipTemplate/salarySlipTemplate1';

export const SalarySlipPreview1 = (props) => {
  const html = generateSalarySlipTemplate1(props);
  
  return (
    <div className={styles.previewColumn}>
      <div 
        className={styles.a4Preview}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};
