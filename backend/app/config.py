from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "asset-backend"
    app_env: str = "prod"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    postgres_host: str
    postgres_port: int = 5432
    postgres_db: str
    postgres_user: str
    postgres_password: str

    keycloak_server_url: str
    keycloak_realm: str
    keycloak_audience: str

    cors_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
    )

    @property
    def sqlalchemy_database_uri(self) -> str:
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def jwks_url(self) -> str:
        return (
            f"{self.keycloak_server_url}/realms/"
            f"{self.keycloak_realm}/protocol/openid-connect/certs"
        )


settings = Settings()
