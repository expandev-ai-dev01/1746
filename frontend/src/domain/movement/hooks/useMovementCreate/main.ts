import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movementService } from '../../services/movementService';
import type { UseMovementCreateOptions, UseMovementCreateReturn } from './types';

export const useMovementCreate = (
  options: UseMovementCreateOptions = {}
): UseMovementCreateReturn => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: movementService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['product-stock'] });
      options.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options.onError?.(error);
    },
  });

  return {
    create: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
};
