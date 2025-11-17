import type { CreateMovementDto, MovementType } from '../../types';

export interface MovementFormProps {
  onSuccess?: (data: { idMovement: number }) => void;
  onCancel?: () => void;
}

export interface MovementFormData extends CreateMovementDto {}
