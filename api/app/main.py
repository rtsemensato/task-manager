from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Projeto pequeno, sem Alembic: cria as tabelas direto no startup se
    # ainda não existirem.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Task Manager API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tasks.router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
