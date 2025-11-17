import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMovementCreate } from '../../hooks/useMovementCreate';
import type { MovementFormProps } from './types';
import type { MovementType } from '../../types';

const movementSchema = z
  .object({
    movementType: z.enum([
      'ENTRADA',
      'SAIDA',
      'ADICAO_PRODUTO',
      'ALTERACAO_QUANTIDADE',
      'EXCLUSAO',
    ]),
    idProduct: z.number().optional(),
    quantity: z.number().positive('Quantidade deve ser maior que zero'),
    observation: z.string().max(500, 'Máximo de 500 caracteres').optional(),
    productName: z
      .string()
      .min(3, 'Mínimo de 3 caracteres')
      .max(100, 'Máximo de 100 caracteres')
      .optional(),
    productDescription: z.string().max(500, 'Máximo de 500 caracteres').optional(),
    reason: z.string().max(200, 'Máximo de 200 caracteres').optional(),
  })
  .refine(
    (data) => {
      if (data.movementType === 'ADICAO_PRODUTO') {
        return !!data.productName;
      }
      return true;
    },
    {
      message: 'Nome do produto é obrigatório para adição de produto',
      path: ['productName'],
    }
  )
  .refine(
    (data) => {
      if (data.movementType !== 'ADICAO_PRODUTO') {
        return !!data.idProduct;
      }
      return true;
    },
    {
      message: 'Produto é obrigatório para este tipo de movimentação',
      path: ['idProduct'],
    }
  )
  .refine(
    (data) => {
      if (data.movementType === 'EXCLUSAO') {
        return !!data.reason;
      }
      return true;
    },
    {
      message: 'Motivo é obrigatório para exclusão',
      path: ['reason'],
    }
  );

type MovementFormData = z.infer<typeof movementSchema>;

export const MovementForm = ({ onSuccess, onCancel }: MovementFormProps) => {
  const { create, isCreating } = useMovementCreate({
    onSuccess: (data) => {
      reset();
      onSuccess?.(data);
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      movementType: 'ENTRADA',
      quantity: 0,
    },
  });

  const movementType = watch('movementType');

  const onSubmit = async (data: MovementFormData) => {
    try {
      await create(data);
    } catch (error: unknown) {
      console.error('Erro ao criar movimentação:', error);
    }
  };

  const movementTypeLabels: Record<MovementType, string> = {
    ENTRADA: 'Entrada',
    SAIDA: 'Saída',
    ADICAO_PRODUTO: 'Adição de Produto',
    ALTERACAO_QUANTIDADE: 'Alteração de Quantidade',
    EXCLUSAO: 'Exclusão',
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="movementType" className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Movimentação *
        </label>
        <select
          id="movementType"
          {...register('movementType')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {Object.entries(movementTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.movementType && (
          <p className="mt-1 text-sm text-red-600">{errors.movementType.message}</p>
        )}
      </div>

      {movementType === 'ADICAO_PRODUTO' ? (
        <>
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Produto *
            </label>
            <input
              id="productName"
              type="text"
              {...register('productName')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.productName && (
              <p className="mt-1 text-sm text-red-600">{errors.productName.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="productDescription"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Descrição do Produto
            </label>
            <textarea
              id="productDescription"
              {...register('productDescription')}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.productDescription && (
              <p className="mt-1 text-sm text-red-600">{errors.productDescription.message}</p>
            )}
          </div>
        </>
      ) : (
        <div>
          <label htmlFor="idProduct" className="block text-sm font-medium text-gray-700 mb-1">
            Produto *
          </label>
          <input
            id="idProduct"
            type="number"
            {...register('idProduct', { valueAsNumber: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.idProduct && (
            <p className="mt-1 text-sm text-red-600">{errors.idProduct.message}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
          Quantidade *
        </label>
        <input
          id="quantity"
          type="number"
          step="0.01"
          {...register('quantity', { valueAsNumber: true })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
      </div>

      {movementType === 'EXCLUSAO' && (
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
            Motivo da Exclusão *
          </label>
          <textarea
            id="reason"
            {...register('reason')}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>}
        </div>
      )}

      <div>
        <label htmlFor="observation" className="block text-sm font-medium text-gray-700 mb-1">
          Observações
        </label>
        <textarea
          id="observation"
          {...register('observation')}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.observation && (
          <p className="mt-1 text-sm text-red-600">{errors.observation.message}</p>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isCreating}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? 'Salvando...' : 'Salvar Movimentação'}
        </button>
      </div>
    </form>
  );
};
