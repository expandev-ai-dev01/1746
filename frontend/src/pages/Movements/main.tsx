import { useState } from 'react';
import { MovementForm, MovementList } from '@/domain/movement';
import type { MovementListParams } from '@/domain/movement';

export const MovementsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<MovementListParams>({
    orderBy: 'DATA_HORA_DESC',
    pageSize: 50,
    page: 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimentações de Estoque</h1>
          <p className="mt-1 text-sm text-gray-600">
            Registre e consulte todas as movimentações do estoque
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancelar' : 'Nova Movimentação'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Nova Movimentação</h2>
          <MovementForm
            onSuccess={() => {
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Histórico de Movimentações</h2>
        <MovementList filters={filters} />
      </div>
    </div>
  );
};

export default MovementsPage;
