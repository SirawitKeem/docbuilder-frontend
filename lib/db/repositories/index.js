import {
  jsonFieldProfilesRepo,
  jsonDocumentsRepo,
  jsonSentHistoryRepo,
  jsonQuotationsRepo,
  jsonCategoriesRepo,
  jsonCustomTemplatesRepo,
  jsonSettingsRepo,
  jsonCustomTokensRepo,
  jsonNotificationsRepo,
  jsonOrganizationsRepo,
  jsonUsersRepo,
  jsonTemplateVersionsRepo,
  jsonOrganizationSignatoriesRepo,
  jsonCounterpartiesRepo,
  jsonTemplateBlocksRepo,
  jsonDocumentFieldValuesRepo,
  jsonDocumentTablesRepo,
} from "../adapters/json/index.js";

const DB_DRIVER = process.env.DB_DRIVER || "json";

function selectAdapters() {
  switch (DB_DRIVER) {
    case "json":
      return {
        fieldProfilesRepo: jsonFieldProfilesRepo,
        documentsRepo: jsonDocumentsRepo,
        sentHistoryRepo: jsonSentHistoryRepo,
        quotationsRepo: jsonQuotationsRepo,
        categoriesRepo: jsonCategoriesRepo,
        customTemplatesRepo: jsonCustomTemplatesRepo,
        settingsRepo: jsonSettingsRepo,
        customTokensRepo: jsonCustomTokensRepo,
        notificationsRepo: jsonNotificationsRepo,
        organizationsRepo: jsonOrganizationsRepo,
        usersRepo: jsonUsersRepo,
        templateVersionsRepo: jsonTemplateVersionsRepo,
        organizationSignatoriesRepo: jsonOrganizationSignatoriesRepo,
        counterpartiesRepo: jsonCounterpartiesRepo,
        templateBlocksRepo: jsonTemplateBlocksRepo,
        documentFieldValuesRepo: jsonDocumentFieldValuesRepo,
        documentTablesRepo: jsonDocumentTablesRepo,
      };
    default:
      throw new Error(`ไม่รู้จัก DB_DRIVER: "${DB_DRIVER}"`);
  }
}

export const {
  fieldProfilesRepo,
  documentsRepo,
  sentHistoryRepo,
  quotationsRepo,
  categoriesRepo,
  customTemplatesRepo,
  settingsRepo,
  customTokensRepo,
  notificationsRepo,
  organizationsRepo,
  usersRepo,
  templateVersionsRepo,
  organizationSignatoriesRepo,
  counterpartiesRepo,
  templateBlocksRepo,
  documentFieldValuesRepo,
  documentTablesRepo,
} = selectAdapters();




