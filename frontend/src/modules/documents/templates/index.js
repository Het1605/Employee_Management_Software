import { generateOfferLetterTemplate1 } from './offerLetter/OfferLetterTemplate/offerLetterTemplate1';

// Central template resolver. For now, only offer letter template 1 is used.
export function generateTemplateContent(payload) {
  // TODO: route based on documentTypeId/template choice
  return generateOfferLetterTemplate1(payload);
}
