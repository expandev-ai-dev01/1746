/**
 * @interface ProductStockGetParams
 * @description Parameters for getting product stock information
 *
 * @property {number} idAccount - Account identifier
 * @property {number} idProduct - Product identifier
 */
export interface ProductStockGetParams {
  idAccount: number;
  idProduct: number;
}

/**
 * @interface ProductStockResult
 * @description Product stock information
 *
 * @property {number} idProduct - Product identifier
 * @property {number} currentQuantity - Current stock quantity
 * @property {number} totalEntries - Total entries
 * @property {number} totalExits - Total exits
 * @property {Date} lastUpdate - Last movement date
 * @property {string} status - Product status (DISPONIVEL, EM_FALTA, INATIVO)
 */
export interface ProductStockResult {
  idProduct: number;
  currentQuantity: number;
  totalEntries: number;
  totalExits: number;
  lastUpdate: Date;
  status: 'DISPONIVEL' | 'EM_FALTA' | 'INATIVO';
}
