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
  jsonRolesRepo,
  jsonTemplateVersionsRepo,
  jsonOrganizationSignatoriesRepo,
  jsonCounterpartiesRepo,
  jsonTemplateBlocksRepo,
  jsonDocumentFieldValuesRepo,
  jsonDocumentTablesRepo,
  jsonDocumentTypesRepo,
  jsonTemplatePagesRepo,
  jsonDocumentPagesRepo,
  jsonDocumentAuthorizationsRepo,
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
  postgresRolesRepo,
  postgresTemplateVersionsRepo,
  postgresOrganizationSignatoriesRepo,
  postgresCounterpartiesRepo,
  postgresTemplateBlocksRepo,
  postgresDocumentFieldValuesRepo,
  postgresDocumentTablesRepo,
  postgresDocumentTypesRepo,
  postgresTemplatePagesRepo,
  postgresDocumentPagesRepo,
  postgresDocumentAuthorizationsRepo,
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
        rolesRepo: postgresRolesRepo,
        templateVersionsRepo: postgresTemplateVersionsRepo,
        organizationSignatoriesRepo: postgresOrganizationSignatoriesRepo,
        counterpartiesRepo: postgresCounterpartiesRepo,
        templateBlocksRepo: postgresTemplateBlocksRepo,
        documentFieldValuesRepo: postgresDocumentFieldValuesRepo,
        documentTablesRepo: postgresDocumentTablesRepo,
        documentTypesRepo: postgresDocumentTypesRepo,
        templatePagesRepo: postgresTemplatePagesRepo,
        documentPagesRepo: postgresDocumentPagesRepo,
        documentAuthorizationsRepo: postgresDocumentAuthorizationsRepo,
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
        rolesRepo: jsonRolesRepo,
        templateVersionsRepo: jsonTemplateVersionsRepo,
        organizationSignatoriesRepo: jsonOrganizationSignatoriesRepo,
        counterpartiesRepo: jsonCounterpartiesRepo,
        templateBlocksRepo: jsonTemplateBlocksRepo,
        documentFieldValuesRepo: jsonDocumentFieldValuesRepo,
        documentTablesRepo: jsonDocumentTablesRepo,
        documentTypesRepo: jsonDocumentTypesRepo,
        templatePagesRepo: jsonTemplatePagesRepo,
        documentPagesRepo: jsonDocumentPagesRepo,
        documentAuthorizationsRepo: jsonDocumentAuthorizationsRepo,
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
  rolesRepo,
  templateVersionsRepo,
  organizationSignatoriesRepo,
  counterpartiesRepo,
  templateBlocksRepo,
  documentFieldValuesRepo,
  documentTablesRepo,
  documentTypesRepo,
  templatePagesRepo,
  documentPagesRepo,
  documentAuthorizationsRepo,
} = selectAdapters();

export const templatesRepo = customTemplatesRepo;




