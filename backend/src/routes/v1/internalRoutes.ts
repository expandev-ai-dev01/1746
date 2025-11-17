import { Router } from 'express';
import * as movementController from '@/api/v1/internal/movement/controller';
import * as movementDetailController from '@/api/v1/internal/movement/detail/controller';
import * as productStockController from '@/api/v1/internal/product/stock/controller';

const router = Router();

// Movement routes
router.post('/movement', movementController.postHandler);
router.get('/movement', movementController.getHandler);
router.get('/movement/:id', movementDetailController.getHandler);

// Product stock routes
router.get('/product/:id/stock', productStockController.getHandler);

export default router;
