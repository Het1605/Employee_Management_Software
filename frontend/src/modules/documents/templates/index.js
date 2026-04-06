import { generateOfferLetterTemplate1 } from './offerLetter/OfferLetterTemplate/offerLetterTemplate1';
import { generateInternshipTemplate1 } from './internshipLetter/InternshipTemplate/internshipTemplate1';
import { generateExperienceTemplate1 } from './experienceLetter/ExperienceTemplate/experienceTemplate1';

// Central template resolver. For now, only offer letter template 1 is used.
export function generateTemplateContent(payload) {
  const { documentTypeId, documentTypeName } = payload || {};
  const isIntern = documentTypeName && documentTypeName.toLowerCase().includes('intern');
  const isExperience = documentTypeName && documentTypeName.toLowerCase().includes('experience');
  if (isExperience) {
    return generateExperienceTemplate1(payload);
  }
  if (isIntern) {
    return generateInternshipTemplate1(payload);
  }
  return generateOfferLetterTemplate1(payload);
}
