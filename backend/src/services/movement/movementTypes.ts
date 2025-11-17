/**
 * @interface MovementCreateParams
 * @description Parameters for creating a new movement
 *
 * @property {number} idAccount - Account identifier
 * @property {number} idUser - User identifier
 * @property {string} movementType - Movement type (ENTRADA, SAIDA, ADICAO_PRODUTO, ALTERACAO_QUANTIDADE, EXCLUSAO)
 * @property {number} [idProduct] - Product identifier (not required for ADICAO_PRODUTO)
 * @property {number} quantity - Movement quantity
 * @property {string} [observation] - Additional observations
 * @property {string} [productName] - Product name (required for ADICAO_PRODUTO)
 * @property {string} [productDescription] - Product description (optional for ADICAO_PRODUTO)
 * @property {string} [reason] - Deletion reason (required for EXCLUSAO)
 */
export interface MovementCreateParams {
  idAccount: number;
  idUser: number;
  movementType: 'ENTRADA' | 'SAIDA' | 'ADICAO_PRODUTO' | 'ALTERACAO_QUANTIDADE' | 'EXCLUSAO';
  idProduct?: number;
  quantity: number;
  observation?: string | null;
  productName?: string | null;
  productDescription?: string | null;
  reason?: string | null;
}

/**
 * @interface MovementResult
 * @description Result of movement creation
 *
 * @property {number} idMovement - Created movement identifier
 */
export interface MovementResult {
  idMovement: number;
}

/**
 * @interface MovementListParams
 * @description Parameters for listing movements
 *
 * @property {number} idAccount - Account identifier
 * @property {string} [dateStart] - Start date for filtering
 * @property {string} [dateEnd] - End date for filtering
 * @property {number} [idProduct] - Product identifier for filtering
 * @property {string} [movementType] - Movement type for filtering
 * @property {number} [idUser] - User identifier for filtering
 * @property {string} [orderBy] - Ordering (DATA_HORA_ASC or DATA_HORA_DESC)
 * @property {number} [pageSize] - Number of records per page
 * @property {number} [page] - Page number
 */
export interface MovementListParams {
  idAccount: number;
  dateStart?: string;
  dateEnd?: string;
  idProduct?: number;
  movementType?: 'ENTRADA' | 'SAIDA' | 'ADICAO_PRODUTO' | 'ALTERACAO_QUANTIDADE' | 'EXCLUSAO';
  idUser?: number;
  orderBy?: 'DATA_HORA_ASC' | 'DATA_HORA_DESC';
  pageSize?: number;
  page?: number;
}

/**
 * @interface MovementListItem
 * @description Movement list item
 *
 * @property {number} idMovement - Movement identifier
 * @property {number} idProduct - Product identifier
 * @property {string} productName - Product name
 * @property {string} movementType - Movement type
 * @property {number} quantity - Movement quantity
 * @property {Date} dateTime - Movement date and time
 * @property {number} idUser - User identifier
 * @property {string} userName - User name
 * @property {string | null} observation - Movement observation
 * @property {string | null} reason - Deletion reason
 */
export interface MovementListItem {
  idMovement: number;
  idProduct: number;
  productName: string;
  movementType: string;
  quantity: number;
  dateTime: Date;
  idUser: number;
  userName: string;
  observation: string | null;
  reason: string | null;
}

/**
 * @interface MovementListResult
 * @description Result of movement list operation
 *
 * @property {MovementListItem[]} movements - List of movements
 * @property {number} total - Total count of records
 */
export interface MovementListResult {
  movements: MovementListItem[];
  total: number;
}

/**
 * @interface MovementGetParams
 * @description Parameters for getting a specific movement
 *
 * @property {number} idAccount - Account identifier
 * @property {number} idMovement - Movement identifier
 */
export interface MovementGetParams {
  idAccount: number;
  idMovement: number;
}

/**
 * @interface MovementDetail
 * @description Detailed movement information
 *
 * @property {number} idMovement - Movement identifier
 * @property {number} idProduct - Product identifier
 * @property {string} productName - Product name
 * @property {string} productDescription - Product description
 * @property {string} movementType - Movement type
 * @property {number} quantity - Movement quantity
 * @property {Date} dateTime - Movement date and time
 * @property {number} idUser - User identifier
 * @property {string} userName - User name
 * @property {string | null} observation - Movement observation
 * @property {string | null} reason - Deletion reason
 */
export interface MovementDetail {
  idMovement: number;
  idProduct: number;
  productName: string;
  productDescription: string;
  movementType: string;
  quantity: number;
  dateTime: Date;
  idUser: number;
  userName: string;
  observation: string | null;
  reason: string | null;
}
