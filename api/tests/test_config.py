from app.config import Settings


def test_cors_origins_list_splits_comma_separated_string():
    settings = Settings(cors_origins="http://localhost:4200, https://app.vercel.app")
    assert settings.cors_origins_list == ["http://localhost:4200", "https://app.vercel.app"]


def test_cors_origins_list_handles_single_origin():
    settings = Settings(cors_origins="http://localhost:4200")
    assert settings.cors_origins_list == ["http://localhost:4200"]
