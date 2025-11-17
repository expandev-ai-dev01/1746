import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  CrudController,
  errorResponse,
  StatusGeneralError,
  successResponse,
} from '@/middleware/crud';
import { movementCreate, movementGet, movementList } from '@/services/movement';
import { zFK, zNullableString, zNumeric, zString } from '@/utils/zodValidation';

const securable = 'MOVEMENT';

/**
 * @api {post} /api/v1/internal/movement Create Movement
 * @apiName CreateMovement
 * @apiGroup Movement
 * @apiVersion 1.0.0
 *
 * @apiDescription Creates a new stock movement record
 *
 * @apiParam {String} movementType Movement type (ENTRADA, SAIDA, ADICAO_PRODUTO, ALTERACAO_QUANTIDADE, EXCLUSAO)
 * @apiParam {Number} [idProduct] Product identifier (not required for ADICAO_PRODUTO)
 * @apiParam {Number} quantity Movement quantity
 * @apiParam {String} [observation] Additional observations
 * @apiParam {String} [productName] Product name (required for ADICAO_PRODUTO)
 * @apiParam {String} [productDescription] Product description (optional for ADICAO_PRODUTO)
 * @apiParam {String} [reason] Deletion reason (required for EXCLUSAO)
 *
 * @apiSuccess {Number} idMovement Movement identifier
 *
 * @apiError {String} ValidationError Invalid parameters provided
 * @apiError {String} UnauthorizedError User lacks permission
 * @apiError {String} ServerError Internal server error
 */
export async function postHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  const operation = new CrudController([{ securable, permission: 'CREATE' }]);

  const bodySchema = z.object({
    movementType: z.enum([
      'ENTRADA',
      'SAIDA',
      'ADICAO_PRODUTO',
      'ALTERACAO_QUANTIDADE',
      'EXCLUSAO',
    ]),
    idProduct: zFK.optional(),
    quantity: zNumeric,
    observation: zNullableString(500),
    productName: zNullableString(100),
    productDescription: zNullableString(500),
    reason: zNullableString(200),
  });

  const [validated, error] = await operation.create(req, bodySchema);

  if (!validated) {
    return next(error);
  }

  try {
    const validatedData = validated as {
      credential: { idAccount: number; idUser: number };
      params: z.infer<typeof bodySchema>;
    };

    const result = await movementCreate({
      idAccount: validatedData.credential.idAccount,
      idUser: validatedData.credential.idUser,
      movementType: validatedData.params.movementType,
      idProduct: validatedData.params.idProduct,
      quantity: validatedData.params.quantity,
      observation: validatedData.params.observation,
      productName: validatedData.params.productName,
      productDescription: validatedData.params.productDescription,
      reason: validatedData.params.reason,
    });

    res.json(successResponse(result));
  } catch (error: any) {
    if (error.number === 51000) {
      res.status(400).json(errorResponse(error.message));
    } else {
      next(StatusGeneralError);
    }
  }
}

/**
 * @api {get} /api/v1/internal/movement List Movements
 * @apiName ListMovements
 * @apiGroup Movement
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieves a paginated list of stock movements with optional filters
 *
 * @apiParam {Date} [dateStart] Start date for filtering
 * @apiParam {Date} [dateEnd] End date for filtering
 * @apiParam {Number} [idProduct] Product identifier for filtering
 * @apiParam {String} [movementType] Movement type for filtering
 * @apiParam {Number} [idUser] User identifier for filtering
 * @apiParam {String} [orderBy] Ordering (DATA_HORA_ASC or DATA_HORA_DESC)
 * @apiParam {Number} [pageSize] Number of records per page (default 50, max 100)
 * @apiParam {Number} [page] Page number (default 1)
 *
 * @apiSuccess {Array} movements List of movements
 * @apiSuccess {Number} total Total count of records
 *
 * @apiError {String} ValidationError Invalid parameters provided
 * @apiError {String} UnauthorizedError User lacks permission
 * @apiError {String} ServerError Internal server error
 */
export async function getHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  const operation = new CrudController([{ securable, permission: 'READ' }]);

  const querySchema = z.object({
    dateStart: z.string().optional(),
    dateEnd: z.string().optional(),
    idProduct: zFK.optional(),
    movementType: z
      .enum(['ENTRADA', 'SAIDA', 'ADICAO_PRODUTO', 'ALTERACAO_QUANTIDADE', 'EXCLUSAO'])
      .optional(),
    idUser: zFK.optional(),
    orderBy: z.enum(['DATA_HORA_ASC', 'DATA_HORA_DESC']).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    page: z.coerce.number().int().min(1).optional(),
  });

  const [validated, error] = await operation.read(req, querySchema);

  if (!validated) {
    return next(error);
  }

  try {
    const validatedData = validated as {
      credential: { idAccount: number; idUser: number };
      params: z.infer<typeof querySchema>;
    };

    const result = await movementList({
      idAccount: validatedData.credential.idAccount,
      dateStart: validatedData.params.dateStart,
      dateEnd: validatedData.params.dateEnd,
      idProduct: validatedData.params.idProduct,
      movementType: validatedData.params.movementType,
      idUser: validatedData.params.idUser,
      orderBy: validatedData.params.orderBy || 'DATA_HORA_DESC',
      pageSize: validatedData.params.pageSize || 50,
      page: validatedData.params.page || 1,
    });

    res.json(successResponse(result));
  } catch (error: any) {
    if (error.number === 51000) {
      res.status(400).json(errorResponse(error.message));
    } else {
      next(StatusGeneralError);
    }
  }
}
