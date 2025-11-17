import { dbRequest, ExpectedReturn } from '@/utils/database';
import {
  MovementCreateParams,
  MovementGetParams,
  MovementListParams,
  MovementResult,
  MovementDetail,
  MovementListResult,
} from './movementTypes';

/**
 * @summary
 * Creates a new stock movement record
 *
 * @function movementCreate
 * @module movement
 *
 * @param {MovementCreateParams} params - Movement creation parameters
 * @param {number} params.idAccount - Account identifier
 * @param {number} params.idUser - User identifier
 * @param {string} params.movementType - Movement type
 * @param {number} [params.idProduct] - Product identifier
 * @param {number} params.quantity - Movement quantity
 * @param {string} [params.observation] - Additional observations
 * @param {string} [params.productName] - Product name for ADICAO_PRODUTO
 * @param {string} [params.productDescription] - Product description for ADICAO_PRODUTO
 * @param {string} [params.reason] - Deletion reason for EXCLUSAO
 *
 * @returns {Promise<MovementResult>} Created movement identifier
 *
 * @throws {ValidationError} When parameters fail validation
 * @throws {BusinessRuleError} When business rules are violated
 * @throws {DatabaseError} When database operation fails
 *
 * @example
 * const movement = await movementCreate({
 *   idAccount: 1,
 *   idUser: 1,
 *   movementType: 'ENTRADA',
 *   idProduct: 123,
 *   quantity: 10.5
 * });
 */
export async function movementCreate(params: MovementCreateParams): Promise<MovementResult> {
  const result = await dbRequest(
    '[functional].[spMovementCreate]',
    {
      idAccount: params.idAccount,
      idUser: params.idUser,
      movementType: params.movementType,
      idProduct: params.idProduct || null,
      quantity: params.quantity,
      observation: params.observation || null,
      productName: params.productName || null,
      productDescription: params.productDescription || null,
      reason: params.reason || null,
    },
    ExpectedReturn.Single
  );

  return result;
}

/**
 * @summary
 * Retrieves a paginated list of stock movements with optional filters
 *
 * @function movementList
 * @module movement
 *
 * @param {MovementListParams} params - List parameters
 * @param {number} params.idAccount - Account identifier
 * @param {string} [params.dateStart] - Start date for filtering
 * @param {string} [params.dateEnd] - End date for filtering
 * @param {number} [params.idProduct] - Product identifier for filtering
 * @param {string} [params.movementType] - Movement type for filtering
 * @param {number} [params.idUser] - User identifier for filtering
 * @param {string} [params.orderBy] - Ordering
 * @param {number} [params.pageSize] - Page size
 * @param {number} [params.page] - Page number
 *
 * @returns {Promise<MovementListResult>} List of movements with pagination info
 *
 * @throws {ValidationError} When parameters fail validation
 * @throws {DatabaseError} When database operation fails
 *
 * @example
 * const movements = await movementList({
 *   idAccount: 1,
 *   page: 1,
 *   pageSize: 50
 * });
 */
export async function movementList(params: MovementListParams): Promise<MovementListResult> {
  const result = await dbRequest(
    '[functional].[spMovementList]',
    {
      idAccount: params.idAccount,
      dateStart: params.dateStart || null,
      dateEnd: params.dateEnd || null,
      idProduct: params.idProduct || null,
      movementType: params.movementType || null,
      idUser: params.idUser || null,
      orderBy: params.orderBy || 'DATA_HORA_DESC',
      pageSize: params.pageSize || 50,
      page: params.page || 1,
    },
    ExpectedReturn.Multi
  );

  const movements = result[0] || [];
  const total = movements.length > 0 ? movements[0].total : 0;

  return {
    movements: movements.map((m: any) => ({
      idMovement: m.idMovement,
      idProduct: m.idProduct,
      productName: m.productName,
      movementType: m.movementType,
      quantity: m.quantity,
      dateTime: m.dateTime,
      idUser: m.idUser,
      userName: m.userName,
      observation: m.observation,
      reason: m.reason,
    })),
    total,
  };
}

/**
 * @summary
 * Retrieves detailed information about a specific movement
 *
 * @function movementGet
 * @module movement
 *
 * @param {MovementGetParams} params - Get parameters
 * @param {number} params.idAccount - Account identifier
 * @param {number} params.idMovement - Movement identifier
 *
 * @returns {Promise<MovementDetail>} Movement details
 *
 * @throws {ValidationError} When parameters fail validation
 * @throws {DatabaseError} When database operation fails
 *
 * @example
 * const movement = await movementGet({
 *   idAccount: 1,
 *   idMovement: 123
 * });
 */
export async function movementGet(params: MovementGetParams): Promise<MovementDetail> {
  const result = await dbRequest(
    '[functional].[spMovementGet]',
    {
      idAccount: params.idAccount,
      idMovement: params.idMovement,
    },
    ExpectedReturn.Single
  );

  return result;
}
