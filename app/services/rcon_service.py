try:
    from valve.rcon import RCON
except ImportError:  # pragma: no cover - fallback for local bootstrap
    RCON = None

from app.core.config import settings


class RconService:
    def send_command(self, command: str):
        if settings.RCON_SIMULATION_MODE or not settings.RCON_PASSWORD or RCON is None:
            return (
                f"Simulation mode enabled. Command '{command}' was not sent to the game server."
            )

        with RCON((settings.RCON_HOST, settings.RCON_PORT), settings.RCON_PASSWORD) as rcon:
            return rcon.execute(command)

    def start_match(self, map_name: str):
        return self.send_command(f"changelevel {map_name}")

    def pause_match(self):
        return self.send_command("mp_pause_match")

    def resume_match(self):
        return self.send_command("mp_unpause_match")

    def end_match(self):
        return self.send_command("mp_warmup_end")


rcon_service = RconService()
