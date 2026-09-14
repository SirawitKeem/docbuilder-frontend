import { ndaTemplate } from "./nda/schema";
import { distributorTemplate } from "./distributor/schema";
import { partnerTemplate } from "./partner/schema";
import { quotationTemplate } from "./quotation/schema";
import { notificationTemplate } from "./notification/schema";

import { createDynamicContractPage } from "@/components/document/DynamicContractPage";
import QuotationDocument from "@/components/document/quotation/QuotationDocument";

export const templateRegistry = {
  nda: {
    schema: { type: "contract", profileSchemaId: "contract", ...ndaTemplate },
    pages: [
      createDynamicContractPage("nda", 1),
      createDynamicContractPage("nda", 2),
      createDynamicContractPage("nda", 3),
      createDynamicContractPage("nda", 4),
    ],
  },
  distributor: {
    schema: { type: "contract", profileSchemaId: "contract", ...distributorTemplate },
    pages: [
      createDynamicContractPage("distributor", 1),
      createDynamicContractPage("distributor", 2),
      createDynamicContractPage("distributor", 3),
      createDynamicContractPage("distributor", 4),
      createDynamicContractPage("distributor", 5),
    ],
  },
  partner: {
    schema: { type: "contract", profileSchemaId: "contract", ...partnerTemplate },
    pages: [
      createDynamicContractPage("partner", 1),
      createDynamicContractPage("partner", 2),
      createDynamicContractPage("partner", 3),
      createDynamicContractPage("partner", 4),
      createDynamicContractPage("partner", 5),
    ],
  },
  notification: {
    schema: notificationTemplate,
    pages: [createDynamicContractPage("notification", 1)],
    DocumentComponent: createDynamicContractPage("notification", 1),
  },
  quotation: {
    schema: quotationTemplate,
    DocumentComponent: QuotationDocument,
  },
};

export function getCompletionStatus(values, templateId) {
  const entry = templateRegistry[templateId];
  if (!entry || !entry.schema.fields) return { total: 0, filled: 0, isComplete: true };
  const requiredFields = entry.schema.fields.filter((f) => f.required);
  const filled = requiredFields.filter((f) => {
    const val = values[f.id] || (f.sharedKey ? values[f.sharedKey] : "");
    return val && String(val).trim().length > 0;
  });
  return {
    total: requiredFields.length,
    filled: filled.length,
    isComplete: filled.length === requiredFields.length,
  };
}

export function getTemplatesByProfileSchema(schemaId) {
  return Object.values(templateRegistry)
    .map((entry) => entry.schema)
    .filter((schema) => schema.profileSchemaId === schemaId);
}