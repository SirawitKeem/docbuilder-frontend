/**
 * Centralized API Client for DocBuilder
 * Supports both internal Next.js API routes and decoupled Go Backend (via NEXT_PUBLIC_API_URL).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === "object" && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // Non-JSON response
    }
    throw new Error(errorMessage);
  }

  const json = await response.json();
  if (json && typeof json === "object" && "data" in json && "success" in json) {
    return json.data;
  }
  return json;
}

export const apiClient = {
  // Documents
  getDocuments: () => apiRequest("/api/documents"),
  getDocumentById: (id) => apiRequest(`/api/documents/${id}`),
  createDocument: (data) => apiRequest("/api/documents", { method: "POST", body: data }),
  updateDocument: (id, data) => apiRequest(`/api/documents/${id}`, { method: "PUT", body: data }),
  deleteDocument: (id) => apiRequest(`/api/documents/${id}`, { method: "DELETE" }),
  recordExportAction: (id, format) => apiRequest(`/api/documents/${id}/actions`, {
    method: "POST",
    body: { action: "export", format },
  }),

  // Quotations
  getQuotations: () => apiRequest("/api/quotations"),
  getQuotationById: (id) => apiRequest(`/api/quotations/${id}`),
  createQuotation: (data) => apiRequest("/api/quotations", { method: "POST", body: data }),
  updateQuotation: (id, data) => apiRequest(`/api/quotations/${id}`, { method: "PUT", body: data }),
  deleteQuotation: (id) => apiRequest(`/api/quotations/${id}`, { method: "DELETE" }),
  createQuotationRevision: (id) => apiRequest(`/api/quotations/${id}/revision`, { method: "POST" }),

  // Templates
  getTemplates: () => apiRequest("/api/templates"),
  getTemplateById: (id) => apiRequest(`/api/templates/${id}`),
  createTemplate: (data) => apiRequest("/api/templates", { method: "POST", body: data }),
  updateTemplate: (id, data) => apiRequest(`/api/templates/${id}`, { method: "PUT", body: data }),
  deleteTemplate: (id) => apiRequest(`/api/templates/${id}`, { method: "DELETE" }),

  // Categories
  getCategories: () => apiRequest("/api/categories"),
  getCategoryById: (id) => apiRequest(`/api/categories/${id}`),
  createCategory: (data) => apiRequest("/api/categories", { method: "POST", body: data }),
  updateCategory: (id, data) => apiRequest(`/api/categories/${id}`, { method: "PUT", body: data }),
  deleteCategory: (id) => apiRequest(`/api/categories/${id}`, { method: "DELETE" }),

  // Field Profiles (Data Presets)
  getFieldProfiles: () => apiRequest("/api/field-profiles"),
  getFieldProfileById: (id) => apiRequest(`/api/field-profiles/${id}`),
  createFieldProfile: (data) => apiRequest("/api/field-profiles", { method: "POST", body: data }),
  updateFieldProfile: (id, data) => apiRequest(`/api/field-profiles/${id}`, { method: "PUT", body: data }),
  deleteFieldProfile: (id) => apiRequest(`/api/field-profiles/${id}`, { method: "DELETE" }),

  // Sent History
  getSentHistory: () => apiRequest("/api/sent-history"),
  deleteSentHistory: (id) => apiRequest(`/api/sent-history?id=${id}`, { method: "DELETE" }),

  // Settings
  getSettings: () => apiRequest("/api/settings"),
  updateSettings: (data) => apiRequest("/api/settings", { method: "PATCH", body: data }),

  // Verification
  verifyDocument: (token) => apiRequest(`/api/verify/${token}`),
};

export default apiClient;
