import { authenticatedClient } from '@/core/lib/api';
import type {
  Movement,
  MovementListParams,
  MovementListResponse,
  CreateMovementDto,
  ProductStock,
} from '../types';

export const movementService = {
  async create(data: CreateMovementDto): Promise<{ idMovement: number }> {
    const response = await authenticatedClient.post('/movement', data);
    return response.data.data;
  },

  async list(params: MovementListParams): Promise<MovementListResponse> {
    const response = await authenticatedClient.get('/movement', { params });
    return response.data.data;
  },

  async getById(id: number): Promise<Movement> {
    const response = await authenticatedClient.get(`/movement/${id}`);
    return response.data.data;
  },

  async getProductStock(idProduct: number): Promise<ProductStock> {
    const response = await authenticatedClient.get(`/product/${idProduct}/stock`);
    return response.data.data;
  },
};
