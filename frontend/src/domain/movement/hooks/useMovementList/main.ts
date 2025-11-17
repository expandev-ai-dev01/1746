import { useQuery } from '@tanstack/react-query';
import { movementService } from '../../services/movementService';
import type { UseMovementListOptions, UseMovementListReturn } from './types';

export const useMovementList = (options: UseMovementListOptions = {}): UseMovementListReturn => {
  const { enabled = true, ...params } = options;

  const query = useQuery({
    queryKey: ['movements', params],
    queryFn: () => movementService.list(params),
    enabled,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
