import type { MovementListParams } from '../../types';

export interface MovementListProps {
  filters?: MovementListParams;
  onMovementClick?: (idMovement: number) => void;
}
