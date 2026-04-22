from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException, status

from app.core.config import settings
from app.models.schemas import (
    MatchActionResponse,
    MatchCreateRequest,
    MatchDetail,
    MatchStatus,
    MatchSummary,
    TeamSide,
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class MatchService:
    def __init__(self) -> None:
        self._matches: dict[str, MatchDetail] = {}

    def list_matches(self) -> list[MatchSummary]:
        matches = sorted(
            self._matches.values(),
            key=lambda item: item.created_at,
            reverse=True,
        )
        return [self._to_summary(match) for match in matches]

    def get_match(self, match_id: str) -> MatchDetail:
        match = self._matches.get(match_id)
        if match is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Match not found.",
            )
        return match

    def create_match(self, payload: MatchCreateRequest) -> MatchDetail:
        timestamp = utc_now()
        match_id = str(uuid4())
        match = MatchDetail(
            id=match_id,
            title=payload.title,
            status=MatchStatus.ready,
            map_name=payload.map_name,
            best_of=payload.best_of,
            team_a=payload.team_a,
            team_b=payload.team_b,
            server_name=payload.server_name or settings.DEFAULT_SERVER_NAME,
            server_address=payload.server_address or settings.DEFAULT_SERVER_ADDRESS,
            created_at=timestamp,
            updated_at=timestamp,
            veto_required=payload.veto_required,
            knife_round=payload.knife_round,
            side_assignment=TeamSide.auto,
        )
        self._matches[match_id] = match
        return match

    def record_action(
        self,
        match_id: str,
        action: str,
        next_status: MatchStatus,
        executed_command: str | None = None,
        rcon_response: str | list[str] | None = None,
    ) -> MatchActionResponse:
        match = self.get_match(match_id)
        timestamp = utc_now()
        match.status = next_status
        match.updated_at = timestamp
        match.last_command = executed_command
        action_response = MatchActionResponse(
            match_id=match.id,
            status=next_status,
            action=action,
            executed_command=executed_command,
            rcon_response=rcon_response,
            timestamp=timestamp,
        )
        match.command_history.append(action_response)
        return action_response

    def dashboard(self) -> tuple[MatchDetail | None, list[MatchSummary]]:
        active_match = next(
            (
                match
                for match in self._matches.values()
                if match.status in {MatchStatus.live, MatchStatus.paused}
            ),
            None,
        )
        queued = [
            self._to_summary(match)
            for match in sorted(
                self._matches.values(),
                key=lambda item: item.created_at,
                reverse=True,
            )
            if active_match is None or match.id != active_match.id
        ]
        return active_match, queued

    @staticmethod
    def _to_summary(match: MatchDetail) -> MatchSummary:
        return MatchSummary(
            id=match.id,
            title=match.title,
            status=match.status,
            map_name=match.map_name,
            best_of=match.best_of,
            team_a=match.team_a,
            team_b=match.team_b,
            server_name=match.server_name,
            server_address=match.server_address,
            created_at=match.created_at,
            updated_at=match.updated_at,
            last_command=match.last_command,
        )


match_service = MatchService()
