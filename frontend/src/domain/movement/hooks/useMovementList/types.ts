import type { MovementListParams, MovementListResponse } from '../../types';

export interface UseMovementListOptions extends MovementListParams {
  enabled?: boolean;
}

export interface UseMovementListReturn {
  data: MovementListResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
