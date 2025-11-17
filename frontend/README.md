# StockBox - Sistema de Controle de Estoque

Sistema para controlar itens no estoque: entradas, saídas e quantidade atual.

## Tecnologias

- React 19.2.0
- TypeScript 5.6.3
- Vite 5.4.11
- TailwindCSS 3.4.14
- React Router DOM 7.9.3
- TanStack Query 5.90.2
- Axios 1.12.2
- Zustand 5.0.8
- React Hook Form 7.63.0
- Zod 4.1.11

## Estrutura do Projeto

```
src/
├── app/                    # Configuração da aplicação
│   ├── App.tsx            # Componente raiz
│   ├── providers.tsx      # Provedores globais
│   └── router.tsx         # Configuração de rotas
├── assets/                # Recursos estáticos
│   └── styles/           # Estilos globais
├── core/                  # Componentes e utilitários compartilhados
│   ├── components/       # Componentes genéricos
│   ├── lib/              # Configurações de bibliotecas
│   └── utils/            # Funções utilitárias
├── domain/               # Domínios de negócio
└── pages/                # Páginas da aplicação
    └── layouts/          # Layouts compartilhados
```

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

3. Edite o arquivo `.env` com as configurações do backend:
```
VITE_API_URL=http://localhost:3000
VITE_API_VERSION=v1
VITE_API_TIMEOUT=30000
```

## Desenvolvimento

Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

## Build

Gere a versão de produção:
```bash
npm run build
```

Pré-visualize a build:
```bash
npm run preview
```

## Lint

Execute o linter:
```bash
npm run lint
```

## Integração com Backend

O frontend está configurado para se comunicar com o backend através de dois clientes HTTP:

- **publicClient**: Para endpoints públicos (`/api/v1/external/`)
- **authenticatedClient**: Para endpoints autenticados (`/api/v1/internal/`)

Os clientes estão configurados em `src/core/lib/api.ts`

## Próximos Passos

1. Implementar autenticação de usuários
2. Criar domínio de produtos
3. Criar domínio de movimentações
4. Implementar relatórios e dashboards
5. Adicionar testes unitários e de integração