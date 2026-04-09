import { generateOfferLetterTemplate1 } from './offerLetter/OfferLetterTemplate/offerLetterTemplate1';
import { generateInternshipTemplate1 } from './internshipLetter/InternshipTemplate/internshipTemplate1';
import { generateExperienceTemplate1 } from './experienceLetter/ExperienceTemplate/experienceTemplate1';
import { generateSalarySlipTemplate1 } from './salarySlip/SalarySlipTemplate/salarySlipTemplate1';
import { generateSalarySlipTemplate2 } from './salarySlip/SalarySlipTemplate/salarySlipTemplate2';

// Central template resolver.
export function generateTemplateContent(payload) {
  const { documentTypeId, documentTypeName, form_data } = payload || {};
  const name = (documentTypeName || '').toLowerCase();
  const templateId = form_data?.template_id || 'template1';
  
  if (name.includes('experience')) {
    return generateExperienceTemplate1(payload);
  }
  if (name.includes('intern')) {
    return generateInternshipTemplate1(payload);
  }
  if (name.includes('salary slip')) {
    if (templateId === 'salaryTemplate2') {
      return generateSalarySlipTemplate2(payload);
    }
    return generateSalarySlipTemplate1(payload);
  }
  
  return generateOfferLetterTemplate1(payload);
}
