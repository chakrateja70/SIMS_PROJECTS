from __future__ import annotations
import os
from dotenv import load_dotenv
load_dotenv(override=True)

class Settings:
    """
    A centralized class to hold all application settings loaded from environment variables.
    """
    
    def __init__(self):
        self.HYPERBROWSER_API_KEY = self._get_required("HYPERBROWSER_API_KEY")
        self.GROQ_API_KEY = self._get_required("GROQ_API_KEY")
        self.GROQ_BASE_URL = "https://api.groq.com/openai/v1"
        self.GROQ_DEFAULT_MODEL = "openai/gpt-oss-20b"

    @staticmethod
    def _get_required(key: str) -> str:
        """Get a required environment variable or raise ValueError."""
        value = os.getenv(key)
        if not value:
            raise ValueError(f"{key} not found in environment variables. Please check your .env file.")
        return value


# Create a single instance of the settings to be imported across the application
settings = Settings()
