export * from './types';
export * from './services/movementService';
export * from './hooks/useMovementCreate';
export * from './hooks/useMovementList';
export * from './hooks/useProductStock';
export * from './components/MovementForm';
export * from './components/MovementList';

export const moduleMetadata = {
  name: 'movement',
  domain: 'functional',
  version: '1.0.0',
  publicComponents: ['MovementForm', 'MovementList'],
  publicHooks: ['useMovementCreate', 'useMovementList', 'useProductStock'],
  publicServices: ['movementService'],
  dependencies: {
    internal: ['@/core/components', '@/core/lib', '@/core/utils'],
    external: ['react', 'react-hook-form', 'zod', '@tanstack/react-query', 'date-fns'],
    domains: [],
  },
  exports: {
    components: ['MovementForm', 'MovementList'],
    hooks: ['useMovementCreate', 'useMovementList', 'useProductStock'],
    services: ['movementService'],
    types: [
      'Movement',
      'MovementType',
      'MovementStatus',
      'MovementListParams',
      'MovementListResponse',
      'CreateMovementDto',
      'ProductStock',
    ],
  },
} as const;
