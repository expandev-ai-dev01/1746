import { format } from 'date-fns';
import { useMovementList } from '../../hooks/useMovementList';
import { LoadingSpinner } from '@/core/components/LoadingSpinner';
import { ErrorMessage } from '@/core/components/ErrorMessage';
import type { MovementListProps } from './types';
import type { MovementType } from '../../types';

export const MovementList = ({ filters, onMovementClick }: MovementListProps) => {
  const { data, isLoading, error, refetch } = useMovementList(filters);

  const movementTypeLabels: Record<MovementType, string> = {
    ENTRADA: 'Entrada',
    SAIDA: 'Saída',
    ADICAO_PRODUTO: 'Adição de Produto',
    ALTERACAO_QUANTIDADE: 'Alteração de Quantidade',
    EXCLUSAO: 'Exclusão',
  };

  const movementTypeColors: Record<MovementType, string> = {
    ENTRADA: 'bg-green-100 text-green-800',
    SAIDA: 'bg-red-100 text-red-800',
    ADICAO_PRODUTO: 'bg-blue-100 text-blue-800',
    ALTERACAO_QUANTIDADE: 'bg-yellow-100 text-yellow-800',
    EXCLUSAO: 'bg-gray-100 text-gray-800',
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Erro ao carregar movimentações"
        message={error.message}
        onRetry={refetch}
      />
    );
  }

  if (!data || data.movements.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Nenhuma movimentação encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Observação
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.movements.map((movement) => (
                <tr
                  key={movement.idMovement}
                  onClick={() => onMovementClick?.(movement.idMovement)}
                  className={onMovementClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(movement.dateTime), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        movementTypeColors[movement.movementType]
                      }`}
                    >
                      {movementTypeLabels[movement.movementType]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {movement.productName || `Produto #${movement.idProduct}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {movement.quantity.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {movement.observation || movement.reason || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Total de <span className="font-medium">{data.total}</span> movimentações
        </p>
      </div>
    </div>
  );
};
