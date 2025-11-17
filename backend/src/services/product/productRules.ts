import { dbRequest, ExpectedReturn } from '@/utils/database';
import { ProductStockGetParams, ProductStockResult } from './productTypes';

/**
 * @summary
 * Retrieves current stock information for a specific product
 *
 * @function productStockGet
 * @module product
 *
 * @param {ProductStockGetParams} params - Stock get parameters
 * @param {number} params.idAccount - Account identifier
 * @param {number} params.idProduct - Product identifier
 *
 * @returns {Promise<ProductStockResult>} Product stock information
 *
 * @throws {ValidationError} When parameters fail validation
 * @throws {DatabaseError} When database operation fails
 *
 * @example
 * const stock = await productStockGet({
 *   idAccount: 1,
 *   idProduct: 123
 * });
 */
export async function productStockGet(params: ProductStockGetParams): Promise<ProductStockResult> {
  const result = await dbRequest(
    '[functional].[spProductStockGet]',
    {
      idAccount: params.idAccount,
      idProduct: params.idProduct,
    },
    ExpectedReturn.Single
  );

  return result;
}
