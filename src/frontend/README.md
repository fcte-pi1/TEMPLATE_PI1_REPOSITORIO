# Frontend — Micromouse

Interface web do projeto Micromouse permite acompanhar a telemetria do robô e visualizar e configurar o labirinto utilizado durante a execução.

## Tecnologias

- React 19 
- TypeScript
- Vite
- Tailwind CSS
- React Router

## Requisitos

- Node.js
- npm

## Instalação e execução

Na raiz do repositório, entre na pasta da aplicação:

```powershell
cd .\src\frontend\web-micromouse
```

Instale as dependências:

```powershell
npm ci
```

Inicie o servidor de desenvolvimento:

```powershell
npm run dev
```

Abra no navegador o endereço exibido pelo Vite, normalmente **http://localhost:5173**.

## Comandos disponíveis

Execute-os dentro de `src/frontend/web-micromouse`:

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento com atualização automática. |
| `npm run build` | Verifica os tipos TypeScript e gera a versão de produção em `dist/`. |
| `npm run preview` | Serve localmente a versão gerada em `dist/`. |
| `npm run lint` | Executa o ESLint. |

## Funcionalidades

- **Dashboard/Telemetria (`/`)**: apresenta bateria, velocidade, RPM dos motores, giroscópio e dados da execução.
- **Labirinto (`/labirinto`)**: permite selecionar o tamanho do labirinto e visualizar o percurso e os detalhes da execução.

No momento, a telemetria do dashboard é simulada no frontend; a interface ainda não busca esses dados de uma API. Os dados da página de labirinto também ainda não estão conectados ao backend.

## Organização

```text
web-micromouse/
├── assets/       # Imagens e ícones
└── src/
    ├── components/ # Componentes reutilizáveis da interface
    ├── hooks/      # Hooks React, incluindo a telemetria simulada
    ├── pages/      # Páginas da aplicação
    └── types/      # Tipos TypeScript
```

Para instruções de execução usando Docker Compose, consulte o [README da aplicação](./web-micromouse/README.md).
