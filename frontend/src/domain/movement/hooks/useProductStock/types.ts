import type { ProductStock } from '../../types';

export interface UseProductStockOptions {
  idProduct: number;
  enabled?: boolean;
}

export interface UseProductStockReturn {
  data: ProductStock | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
