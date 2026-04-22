import os


class Settings:
    APP_NAME = os.getenv("APP_NAME", "CS2 Mini Faceit Panel")
    API_PREFIX = os.getenv("API_PREFIX", "/api")
    PANEL_API_TOKEN = os.getenv("PANEL_API_TOKEN", "dev-panel-token")
    RCON_SIMULATION_MODE = os.getenv("RCON_SIMULATION_MODE", "true").lower() == "true"
    RCON_HOST = os.getenv("RCON_HOST", "127.0.0.1")
    RCON_PORT = int(os.getenv("RCON_PORT", 27015))
    RCON_PASSWORD = os.getenv("RCON_PASSWORD", "")
    DEFAULT_SERVER_NAME = os.getenv("DEFAULT_SERVER_NAME", "CS2 Arena #1")
    DEFAULT_SERVER_ADDRESS = os.getenv("DEFAULT_SERVER_ADDRESS", "127.0.0.1:27015")

settings = Settings()
