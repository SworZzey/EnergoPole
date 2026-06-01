from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # MongoDB
    mongo_url: str = "mongodb://localhost:27017"
    database_name: str = "fiels_survey_db"

    # JWT
    secret_key: str = "super"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080

    # Files
    upload_dir: str = "uploads"
    max_file_size: int = 10485760

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()