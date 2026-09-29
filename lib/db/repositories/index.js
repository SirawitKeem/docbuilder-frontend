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

import {
  postgresFieldProfilesRepo,
  postgresDocumentsRepo,
  postgresSentHistoryRepo,
  postgresQuotationsRepo,
  postgresCategoriesRepo,
  postgresCustomTemplatesRepo,
  postgresSettingsRepo,
  postgresCustomTokensRepo,
  postgresNotificationsRepo,
  postgresOrganizationsRepo,
  postgresUsersRepo,
  postgresTemplateVersionsRepo,
  postgresOrganizationSignatoriesRepo,
  postgresCounterpartiesRepo,
  postgresTemplateBlocksRepo,
  postgresDocumentFieldValuesRepo,
  postgresDocumentTablesRepo,
} from "../adapters/postgres/index.js";

const DB_DRIVER = process.env.DB_ADAPTER || process.env.DB_DRIVER || "json";

function selectAdapters() {
  switch (DB_DRIVER.toLowerCase()) {
    case "postgres":
    case "pg":
    case "postgresql":
      return {
        fieldProfilesRepo: postgresFieldProfilesRepo,
        documentsRepo: postgresDocumentsRepo,
        sentHistoryRepo: postgresSentHistoryRepo,
        quotationsRepo: postgresQuotationsRepo,
        categoriesRepo: postgresCategoriesRepo,
        customTemplatesRepo: postgresCustomTemplatesRepo,
        settingsRepo: postgresSettingsRepo,
        customTokensRepo: postgresCustomTokensRepo,
        notificationsRepo: postgresNotificationsRepo,
        organizationsRepo: postgresOrganizationsRepo,
        usersRepo: postgresUsersRepo,
        templateVersionsRepo: postgresTemplateVersionsRepo,
        organizationSignatoriesRepo: postgresOrganizationSignatoriesRepo,
        counterpartiesRepo: postgresCounterpartiesRepo,
        templateBlocksRepo: postgresTemplateBlocksRepo,
        documentFieldValuesRepo: postgresDocumentFieldValuesRepo,
        documentTablesRepo: postgresDocumentTablesRepo,
      };
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
      throw new Error(`ไม่รู้จัก DB_DRIVER / DB_ADAPTER: "${DB_DRIVER}" (รองรับ: "json", "postgres")`);
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




