import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  CrudController,
  errorResponse,
  StatusGeneralError,
  successResponse,
} from '@/middleware/crud';
import { productStockGet } from '@/services/product';

const securable = 'PRODUCT';

/**
 * @api {get} /api/v1/internal/product/:id/stock Get Product Stock
 * @apiName GetProductStock
 * @apiGroup Product
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieves current stock information for a specific product
 *
 * @apiParam {Number} id Product identifier
 *
 * @apiSuccess {Number} currentQuantity Current stock quantity
 * @apiSuccess {Number} totalEntries Total entries
 * @apiSuccess {Number} totalExits Total exits
 * @apiSuccess {String} lastUpdate Last movement date
 * @apiSuccess {String} status Product status (DISPONIVEL, EM_FALTA, INATIVO)
 *
 * @apiError {String} ValidationError Invalid parameters provided
 * @apiError {String} UnauthorizedError User lacks permission
 * @apiError {String} ServerError Internal server error
 */
export async function getHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  const operation = new CrudController([{ securable, permission: 'READ' }]);

  const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
  });

  const [validated, error] = await operation.read(req, paramsSchema);

  if (!validated) {
    return next(error);
  }

  try {
    const validatedData = validated as {
      credential: { idAccount: number; idUser: number };
      params: z.infer<typeof paramsSchema>;
    };

    const result = await productStockGet({
      idAccount: validatedData.credential.idAccount,
      idProduct: validatedData.params.id,
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
