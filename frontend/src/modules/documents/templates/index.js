import { generateOfferLetterTemplate1 } from './offerLetter/OfferLetterTemplate/offerLetterTemplate1';
import { generateInternshipTemplate1 } from './internshipLetter/InternshipTemplate/internshipTemplate1';

// Central template resolver. For now, only offer letter template 1 is used.
export function generateTemplateContent(payload) {
  const { documentTypeId, documentTypeName } = payload || {};
  const isIntern = documentTypeName && documentTypeName.toLowerCase().includes('intern');
  if (isIntern) {
    return generateInternshipTemplate1(payload);
  }
  return generateOfferLetterTemplate1(payload);
}
