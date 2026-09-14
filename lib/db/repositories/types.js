/**
 * Repository interface สำหรับ Field Profiles (หลายชุด)
 * @typedef {Object} FieldProfilesRepo
 * @property {() => Promise<Array>} getAll
 * @property {(id: string) => Promise<Object|null>} getById
 * @property {(data: { name: string, values: Object }) => Promise<Object>} create
 * @property {(id: string, data: { name?: string, values?: Object }) => Promise<Object>} update
 * @property {(id: string) => Promise<void>} remove
 */

/**
 * Repository interface สำหรับ Documents
 * @typedef {Object} DocumentsRepo
 * @property {() => Promise<Array>} getAll
 * @property {(data: Object) => Promise<Object>} create
 * @property {(id: string) => Promise<Object>} delete
 */

export {};
