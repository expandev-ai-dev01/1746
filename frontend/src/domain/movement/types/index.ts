export type MovementType =
  | 'ENTRADA'
  | 'SAIDA'
  | 'ADICAO_PRODUTO'
  | 'ALTERACAO_QUANTIDADE'
  | 'EXCLUSAO';

export type MovementStatus = 'DISPONIVEL' | 'EM_FALTA' | 'INATIVO';

export interface Movement {
  idMovement: number;
  movementType: MovementType;
  idProduct?: number;
  productName?: string;
  quantity: number;
  dateTime: string;
  idUser: number;
  userName?: string;
  observation?: string;
  reason?: string;
}

export interface MovementListParams {
  dateStart?: string;
  dateEnd?: string;
  idProduct?: number;
  movementType?: MovementType;
  idUser?: number;
  orderBy?: 'DATA_HORA_ASC' | 'DATA_HORA_DESC';
  pageSize?: number;
  page?: number;
}

export interface MovementListResponse {
  movements: Movement[];
  total: number;
}

export interface CreateMovementDto {
  movementType: MovementType;
  idProduct?: number;
  quantity: number;
  observation?: string;
  productName?: string;
  productDescription?: string;
  reason?: string;
}

export interface ProductStock {
  idProduct: number;
  productName: string;
  currentQuantity: number;
  totalEntries: number;
  totalExits: number;
  lastUpdate: string;
  status: MovementStatus;
}
