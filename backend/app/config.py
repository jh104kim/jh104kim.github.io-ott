import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    # Core LLM
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    GEMINI_PRO_MODEL: str = os.getenv("GEMINI_PRO_MODEL", "gemini-2.5-pro")
    
    # Dev & Auth Bypass
    AUTH_DEV_BYPASS: bool = os.getenv("AUTH_DEV_BYPASS", "true").lower() == "true"
    DEV_ADMIN_EMAIL: str = os.getenv("DEV_ADMIN_EMAIL", "dev-admin@local.test")
    
    # Provider Mode
    PROVIDER_MODE: str = os.getenv("PROVIDER_MODE", "mock")
    
    # Cost & Usage Guardrails (TASK-035, D-34, D-35)
    MAX_DAILY_REQUESTS: int = int(os.getenv("MAX_DAILY_REQUESTS", "10"))
    MONTHLY_BUDGET_USD: float = float(os.getenv("MONTHLY_BUDGET_USD", "30.0"))
    ESTIMATED_COST_PER_QUERY_USD: float = 0.008

settings = Settings()
