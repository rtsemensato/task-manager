# Task Manager

Gerenciador de tarefas com autenticação JWT: cadastro, login e CRUD de tarefas
por usuário. Projeto pessoal pra praticar Angular (standalone components,
signals, forms reativos, guards e interceptor funcionais) no front-end e
FastAPI no back-end.

**Ao vivo**: [task-manager-pi-brown.vercel.app](https://task-manager-pi-brown.vercel.app)
(API no [Render free tier](https://task-manager-api-p427.onrender.com), o
primeiro acesso depois de um tempo sem uso pode levar ~30s pra responder
porque o servidor "dorme").

## Estrutura do repositório

```
task-manager/
├── api/
│   ├── app/
│   │   ├── main.py           # app FastAPI, CORS, lifespan (cria tabelas)
│   │   ├── config.py         # Settings (pydantic-settings), lidas de env vars
│   │   ├── database.py       # engine, SessionLocal, Base
│   │   ├── models.py         # User, Task (SQLAlchemy)
│   │   ├── schemas.py        # Pydantic: request/response
│   │   ├── security.py       # hash de senha (bcrypt), JWT (python-jose)
│   │   ├── deps.py           # get_current_user (decodifica o token)
│   │   └── routers/          # auth.py, tasks.py
│   └── tests/                # pytest + FastAPI TestClient
└── web/
    └── src/app/
        ├── core/              # AuthService, TaskService, guards, interceptor
        └── features/          # login/, register/, tasks/ (componentes standalone)
```

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Angular (standalone components, signals, reactive forms) |
| Backend | FastAPI, SQLAlchemy |
| Auth | JWT (python-jose), senha hasheada em bcrypt |
| Banco | SQLite |
| Testes | pytest (backend), Vitest (frontend) |

## Rodando localmente

### 1. Backend

```bash
cd api
python -m venv .venv
.venv/Scripts/activate       # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
cp .env.example .env         # ajustar SECRET_KEY antes de ir pra produção
uvicorn app.main:app --reload --port 8000
```

API sobe em [http://localhost:8000](http://localhost:8000). Docs interativas
(Swagger) em `/docs`.

### 2. Frontend

Em outro terminal:

```bash
cd web
npm install
npm start
```

Abre em [http://localhost:4200](http://localhost:4200).

## Testes

```bash
cd api && pytest -v                      # backend: auth, CRUD, isolamento entre usuários
cd web && npm test -- --watch=false      # frontend
```

## Endpoints principais

| Método | Rota            | Descrição                          |
|--------|-----------------|-------------------------------------|
| POST   | `/auth/register`| Cria uma conta                      |
| POST   | `/auth/login`    | Login, retorna token JWT            |
| GET    | `/auth/me`       | Dados do usuário autenticado        |
| GET    | `/tasks`         | Lista as tarefas do usuário         |
| POST   | `/tasks`         | Cria uma tarefa                     |
| PATCH  | `/tasks/{id}`    | Atualiza título, descrição ou status|
| DELETE | `/tasks/{id}`    | Remove uma tarefa                   |

Todas as rotas de `/tasks` exigem `Authorization: Bearer <token>` e só
enxergam tarefas do próprio usuário autenticado.

## Decisões técnicas

### Ownership de tarefas, sempre por query

Toda consulta de tarefa filtra por `owner_id`, inclusive busca por id.
Tentar acessar a tarefa de outro usuário retorna 404 (não 403), pra não
revelar que o recurso existe.

### `CORS_ORIGINS` como string separada por vírgula

A primeira versão usava uma lista JSON (`["http://..."]`), decodificada
automaticamente pelo pydantic-settings. Isso quebrou o primeiro deploy real
no Render, porque o valor foi digitado no dashboard sem colchetes/aspas
exatos. Um campo de texto de plataforma de deploy não valida sintaxe, então
trocamos para uma string simples separada por vírgula, mais tolerante a
erro de digitação.

### Logout precisa navegar, não só limpar o token

`AuthService.logout()` injeta `Router` e navega pra `/login` depois de
limpar a sessão. Sem isso, a tela de tarefas continuava visível (só sem o
botão "Sair") depois do logout, porque o guard de rota só roda em
navegações, não reage sozinho a mudança de estado de autenticação.

### Sem Alembic

As tabelas são criadas automaticamente no startup
(`Base.metadata.create_all`). Suficiente pro escopo atual; migrações formais
entram se o schema crescer.

## Deploy

- **API**: Render (free tier). Configurar `SECRET_KEY` e `CORS_ORIGINS` como
  variáveis de ambiente lá; não usar os valores padrão de desenvolvimento em
  produção. O banco é SQLite em arquivo local ao serviço: no free tier do
  Render o disco é efêmero, então os dados são apagados a cada redeploy ou
  restart. Aceitável pra uma demo, mas não é durável, é uma escolha
  consciente, não um bug.
- **Frontend**: Vercel ou Netlify. Ajustar `apiBaseUrl` em
  `web/src/environments/environment.ts` pra URL real da API antes do build de
  produção (não há variável de ambiente em runtime, é uma SPA estática).

Ver [`CLAUDE.md`](CLAUDE.md) para mais detalhes de arquitetura e convenções.
