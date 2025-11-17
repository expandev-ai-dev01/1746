import { useQuery } from '@tanstack/react-query';
import { movementService } from '../../services/movementService';
import type { UseProductStockOptions, UseProductStockReturn } from './types';

export const useProductStock = (options: UseProductStockOptions): UseProductStockReturn => {
  const { idProduct, enabled = true } = options;

  const query = useQuery({
    queryKey: ['product-stock', idProduct],
    queryFn: () => movementService.getProductStock(idProduct),
    enabled: enabled && !!idProduct,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
