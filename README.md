# Task Manager

Gerenciador de tarefas com autenticação JWT: cadastro, login e CRUD de tarefas
por usuário. Projeto pessoal pra praticar Angular (standalone components,
signals, forms reativos, guards e interceptor funcionais) no front-end e
FastAPI no back-end.

```
task-manager/
├── api/   → backend FastAPI + SQLAlchemy + JWT
└── web/   → frontend Angular
```

## Stack

- **Backend**: FastAPI, SQLAlchemy, SQLite (dev), autenticação JWT
  (python-jose) com senha hasheada em bcrypt.
- **Frontend**: Angular (standalone components, signals, reactive forms),
  guards e interceptor funcionais pra rota protegida e anexo automático do
  token nas requisições.

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

## Deploy

- **API**: Render (free tier). Configurar `SECRET_KEY`, `DATABASE_URL` e
  `CORS_ORIGINS` como variáveis de ambiente lá; não usar os valores padrão de
  desenvolvimento em produção.
- **Frontend**: Vercel ou Netlify. Ajustar `apiBaseUrl` em
  `web/src/environments/environment.ts` pra URL real da API antes do build de
  produção.

Sem Alembic por enquanto: as tabelas são criadas automaticamente no startup
(`Base.metadata.create_all`). Suficiente pro escopo atual; migrações formais
entram se o schema crescer.
