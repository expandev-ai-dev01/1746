import { useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-900">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-gray-700">Página não encontrada</h2>
        <p className="mb-8 text-gray-600">
          A página que você está procurando não existe ou foi movida.
        </p>
        <button
          onClick={() => navigate('/')}
          className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
        >
          Voltar para Home
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
