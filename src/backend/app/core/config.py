from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: int = 5432
    POSTGRES_HOST: str = "localhost"
    
    TELEMETRY_UPDATE_INTERVAL_MS: int = 1000
    TELEMETRY_LATENCY_TOLERANCE_MS: int = 250
    TELEMETRY_HEARTBEAT_INTERVAL_MS: int = 5000
    ESP_CONNECTION_TIMEOUT_MS: int = 5000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    @property
    def database_url(self) -> str:
        user = quote_plus(self.POSTGRES_USER)
        password = quote_plus(self.POSTGRES_PASSWORD)

        return (
            f"postgresql+psycopg://{user}:{password}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()
