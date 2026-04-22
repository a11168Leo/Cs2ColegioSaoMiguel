from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class MatchStatus(str, Enum):
    draft = "draft"
    ready = "ready"
    live = "live"
    paused = "paused"
    finished = "finished"


class TeamSide(str, Enum):
    ct = "ct"
    t = "t"
    auto = "auto"


class TeamConfig(BaseModel):
    name: str = Field(..., min_length=2, max_length=40)
    tag: str = Field(..., min_length=2, max_length=8)
    logo_url: str | None = None


class MatchCreateRequest(BaseModel):
    title: str = Field(..., min_length=4, max_length=80)
    map_name: str = Field(..., min_length=2, max_length=40)
    best_of: int = Field(default=1, ge=1, le=5)
    team_a: TeamConfig
    team_b: TeamConfig
    veto_required: bool = True
    knife_round: bool = True
    server_name: str | None = None
    server_address: str | None = None


class PanelCommandRequest(BaseModel):
    command: str = Field(..., min_length=1, max_length=200)


class MatchActionResponse(BaseModel):
    match_id: str
    status: MatchStatus
    action: str
    executed_command: str | None = None
    rcon_response: str | list[str] | None = None
    timestamp: datetime


class MatchSummary(BaseModel):
    id: str
    title: str
    status: MatchStatus
    map_name: str
    best_of: int
    team_a: TeamConfig
    team_b: TeamConfig
    server_name: str
    server_address: str
    created_at: datetime
    updated_at: datetime
    last_command: str | None = None


class MatchDetail(MatchSummary):
    veto_required: bool
    knife_round: bool
    rounds_played: int = 0
    team_a_score: int = 0
    team_b_score: int = 0
    side_assignment: TeamSide = TeamSide.auto
    command_history: list[MatchActionResponse] = Field(default_factory=list)


class DashboardResponse(BaseModel):
    app_name: str
    server_name: str
    server_address: str
    simulation_mode: bool
    active_match: MatchDetail | None
    queued_matches: list[MatchSummary]
