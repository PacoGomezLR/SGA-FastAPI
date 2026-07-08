from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    app_env: str = "development"

    # 🔐 Seguridad
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )

    @field_validator("secret_key")
    @classmethod
    def secret_key_debe_ser_segura(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError(
                "SECRET_KEY debe tener al menos 32 caracteres. "
                'Generar con: python -c "import secrets; print(secrets.token_hex(32))"'
            )
        return v


settings = Settings()