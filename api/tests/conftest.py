import tempfile
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app


@pytest.fixture()
def client() -> Iterator[TestClient]:
    """Cliente de teste com um banco SQLite isolado (arquivo temporário) por teste."""
    db_path = Path(tempfile.mkstemp(suffix=".db")[1])
    test_engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    def override_get_db() -> Iterator:
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    test_engine.dispose()
    try:
        db_path.unlink(missing_ok=True)
    except PermissionError:
        # No Windows o SQLite às vezes mantém o arquivo brevemente travado
        # mesmo depois do dispose(); não é um problema funcional, o arquivo
        # fica no diretório temporário do SO e é limpo depois.
        pass
