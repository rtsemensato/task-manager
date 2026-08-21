from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Caminho absoluto pra raiz do backend (pasta api/), independente de onde o
# processo é iniciado (ex: uvicorn --app-dir a partir de outro diretório).
_API_ROOT = Path(__file__).resolve().parent.parent
_DEFAULT_DB_PATH = _API_ROOT / "task_manager.db"


class Settings(BaseSettings):
    """Configuração da aplicação, lida de variáveis de ambiente (ou .env local)."""

    model_config = SettingsConfigDict(env_file=str(_API_ROOT / ".env"), env_file_encoding="utf-8")

    secret_key: str = "dev-secret-key-troque-em-producao"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    database_url: str = f"sqlite:///{_DEFAULT_DB_PATH}"

    # String simples separada por vírgula (não lista), de propósito: um campo
    # de texto num dashboard de deploy é mais fácil de preencher errado se
    # exigir sintaxe JSON exata (ex: "[\"a\"]"). Em produção, apontar pra URL
    # real do frontend hospedado.
    cors_origins: str = "http://localhost:4200"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
