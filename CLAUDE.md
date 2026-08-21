# CLAUDE.md — Task Manager

Stack: Angular (standalone components, signals) + FastAPI + SQLAlchemy + JWT

Gerenciador de tarefas com autenticação: cadastro, login, CRUD de tarefas
escopado por usuário. Monorepo com dois pacotes independentes: `api/`
(backend) e `web/` (frontend), cada um com seu próprio ciclo de
install/build/test.

---

## Arquitetura em uma linha

`web/` (Angular, `AuthService` + `TaskService` via `HttpClient`) → JWT no header `Authorization: Bearer` (anexado por um interceptor funcional) → `api/` (FastAPI, `get_current_user` decodifica o token) → SQLAlchemy → SQLite

---

## Backend (`api/`)

### Autenticação

- Senha nunca é guardada em texto puro: `bcrypt.hashpw` direto (sem `passlib`, que tem histórico de incompatibilidade com versões novas de `bcrypt`). Senha truncada em 72 bytes antes de hashear, porque é o limite do próprio algoritmo bcrypt.
- Login usa `OAuth2PasswordRequestForm` (campo `username` = e-mail, é o nome de campo padrão do FastAPI pra esse fluxo, não confundir com um campo de username separado).
- JWT com `python-jose`, `HS256`, `sub` = e-mail do usuário. `SECRET_KEY` vem de variável de ambiente, o valor default em `config.py` é só pra dev local e nunca deve ir pra produção sem trocar.

### Ownership de tarefas

Toda query de `Task` filtra por `owner_id == current_user.id`, inclusive
`GET/PATCH/DELETE /tasks/{id}`, que retornam 404 (não 403) se a tarefa
existir mas for de outro usuário, pra não revelar a existência do
recurso. Testado explicitamente em `tests/test_tasks.py::test_tasks_are_scoped_per_user`.

### `CORS_ORIGINS`: string simples, não lista JSON

`cors_origins` em `config.py` é `str`, separada por vírgula, com uma
property `cors_origins_list` que faz o split. **De propósito**: a primeira
versão usava `list[str]` (pydantic-settings decodifica como JSON), e isso
quebrou o primeiro deploy real no Render porque o valor foi digitado no
dashboard sem colchetes/aspas exatos. Um campo de texto de plataforma de
deploy não tem validação de sintaxe, então o formato mais tolerante venceu.
Não reverter pra `list[str]` sem um motivo forte.

### Banco: SQLite, sem Alembic

`Base.metadata.create_all()` roda no `lifespan` do FastAPI a cada startup.
Suficiente pro escopo atual (schema pequeno, projeto de demonstração). Se o
schema crescer ou for pra produção de verdade, aí sim vale migrar pra
Alembic. No Render free tier o disco é efêmero: dados somem a cada
redeploy/restart, isso é uma escolha consciente (ver README), não um bug a
corrigir.

### Testes

`tests/conftest.py` cria um SQLite em arquivo temporário por teste (não
`:memory:`, que teria problema de múltiplas conexões sem `StaticPool`) e
sobrescreve a dependency `get_db` do FastAPI. No Windows, o `unlink()` do
arquivo temporário pode falhar com `PermissionError` mesmo depois do
`engine.dispose()` (lock de arquivo do SQLite); isso é tratado como
best-effort, não deve derrubar a suíte.

---

## Frontend (`web/`)

### Sessão: `AuthService` + `useSyncExternalStore`-like via signal

`AuthService.currentUser` é um `signal<User | null>`. Um `Router` é
injetado direto no `AuthService` (não só nos componentes), porque
`logout()` precisa navegar pra `/login` de dentro do próprio service: se
esse redirecionamento não acontecer, o usuário fica numa tela autenticada
"fantasma" depois de deslogar. **Isso já foi um bug real** (a primeira
versão só limpava o token e o signal, sem navegar).

### Interceptor: anexa token E trata 401

`core/auth.interceptor.ts` faz duas coisas:
1. Anexa `Authorization: Bearer <token>` em toda requisição, se houver token.
2. Se qualquer resposta vier 401 **e não for de um endpoint `/auth/*`**,
   chama `auth.logout()` (que já redireciona). O `/auth/*` fica de fora de
   propósito: senha errada no login retorna 401 e deve só mostrar erro
   inline, sem deslogar/redirecionar quem nem estava logado.

### Guards funcionais

`authGuard` bloqueia `/tasks` pra quem não está autenticado (`isAuthenticated()`
checado via `computed` sobre `currentUser`). `guestGuard` faz o inverso em
`/login` e `/register`, redirecionando quem já está logado direto pra
`/tasks`.

### `environment.ts` + `fileReplacements`

`apiBaseUrl` é resolvido em build time via `angular.json` →
`fileReplacements` na configuration `development` (troca
`environment.ts` por `environment.development.ts`). O arquivo
`environment.ts` (usado por padrão, ou seja, em build de produção) tem a
URL real do Render hardcoded. **Se a API for recriada com outro nome no
Render, esse arquivo precisa ser atualizado manualmente e o front
rebuildado/redeployado** (não há variável de ambiente de runtime, é uma
SPA estática).

### Toolchain: Angular CLI e a versão do Node

`@angular/cli@22` exige Node `^22.22.3` ou superior. Esse ambiente roda
Node 20.19.4, que só é suportado até `@angular/cli@21.x`
(`engines.node: "^20.19.0 || ^22.12.0 || >=24.0.0"`). O projeto foi criado
travado em `@angular/cli@21`. Não rodar `ng update` pra major 22+ sem
confirmar a versão do Node disponível primeiro.

---

## O que evitar

- **Reverter `CORS_ORIGINS` pra `list[str]`/JSON** sem um motivo forte, ver seção acima.
- **Chamar `AuthService.logout()` sem que ele navegue** pra `/login`, isso já causou o bug da tela autenticada fantasma.
- **Tratar 401 de `/auth/login` como sessão expirada** no interceptor, isso quebraria a mensagem de erro inline de senha incorreta.
- **Assumir que o SQLite do Render persiste dados entre deploys.** Ele não persiste, é o comportamento esperado no plano free.
- **Atualizar `@angular/cli` pra major 22+ sem checar a versão do Node** disponível no ambiente.
