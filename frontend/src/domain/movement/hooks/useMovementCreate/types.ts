import type { CreateMovementDto } from '../../types';

export interface UseMovementCreateOptions {
  onSuccess?: (data: { idMovement: number }) => void;
  onError?: (error: Error) => void;
}

export interface UseMovementCreateReturn {
  create: (data: CreateMovementDto) => Promise<{ idMovement: number }>;
  isCreating: boolean;
  error: Error | null;
}
