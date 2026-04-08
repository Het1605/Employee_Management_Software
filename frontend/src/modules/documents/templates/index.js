import { generateOfferLetterTemplate1 } from './offerLetter/OfferLetterTemplate/offerLetterTemplate1';
import { generateInternshipTemplate1 } from './internshipLetter/InternshipTemplate/internshipTemplate1';
import { generateExperienceTemplate1 } from './experienceLetter/ExperienceTemplate/experienceTemplate1';
import { generateSalarySlipTemplate1 } from './salarySlip/SalarySlipTemplate/salarySlipTemplate1';

// Central template resolver.
export function generateTemplateContent(payload) {
  const { documentTypeId, documentTypeName } = payload || {};
  const name = (documentTypeName || '').toLowerCase();
  
  if (name.includes('experience')) {
    return generateExperienceTemplate1(payload);
  }
  if (name.includes('intern')) {
    return generateInternshipTemplate1(payload);
  }
  if (name.includes('salary slip')) {
    return generateSalarySlipTemplate1(payload);
  }
  
  return generateOfferLetterTemplate1(payload);
}
