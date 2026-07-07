from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)

class Settings(BaseSettings):
    model_config=SettingsConfigDict(env_file=".env", extra="ignore")
    setu_base_url:str
    x_client_id:str
    x_client_secret:str
    x_product_instance_id:str
    sign_redirect_url: str | None = None
    database_url: str | None = None

settings=Settings()