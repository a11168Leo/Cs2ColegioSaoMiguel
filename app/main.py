from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.security import require_panel_access
from app.models.schemas import (
    DashboardResponse,
    MatchActionResponse,
    MatchCreateRequest,
    MatchDetail,
    MatchStatus,
    MatchSummary,
    PanelCommandRequest,
)
from app.services.match_service import match_service
from app.services.rcon_service import rcon_service


app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def healthcheck():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "simulation_mode": settings.RCON_SIMULATION_MODE,
    }


@app.get(f"{settings.API_PREFIX}/dashboard", response_model=DashboardResponse)
def get_dashboard(_: str = Depends(require_panel_access)):
    active_match, queued_matches = match_service.dashboard()
    return DashboardResponse(
        app_name=settings.APP_NAME,
        server_name=settings.DEFAULT_SERVER_NAME,
        server_address=settings.DEFAULT_SERVER_ADDRESS,
        simulation_mode=settings.RCON_SIMULATION_MODE,
        active_match=active_match,
        queued_matches=queued_matches,
    )


@app.get(f"{settings.API_PREFIX}/matches", response_model=list[MatchSummary])
def list_matches(_: str = Depends(require_panel_access)):
    return match_service.list_matches()


@app.get(f"{settings.API_PREFIX}/matches/{{match_id}}", response_model=MatchDetail)
def get_match(match_id: str, _: str = Depends(require_panel_access)):
    return match_service.get_match(match_id)


@app.post(f"{settings.API_PREFIX}/matches", response_model=MatchDetail, status_code=201)
def create_match(payload: MatchCreateRequest, _: str = Depends(require_panel_access)):
    return match_service.create_match(payload)


@app.post(
    f"{settings.API_PREFIX}/matches/{{match_id}}/start",
    response_model=MatchActionResponse,
)
def start_match(match_id: str, _: str = Depends(require_panel_access)):
    match = match_service.get_match(match_id)
    rcon_response = rcon_service.start_match(match.map_name)
    return match_service.record_action(
        match_id=match_id,
        action="start_match",
        next_status=MatchStatus.live,
        executed_command=f"changelevel {match.map_name}",
        rcon_response=rcon_response,
    )


@app.post(
    f"{settings.API_PREFIX}/matches/{{match_id}}/pause",
    response_model=MatchActionResponse,
)
def pause_match(match_id: str, _: str = Depends(require_panel_access)):
    rcon_response = rcon_service.pause_match()
    return match_service.record_action(
        match_id=match_id,
        action="pause_match",
        next_status=MatchStatus.paused,
        executed_command="mp_pause_match",
        rcon_response=rcon_response,
    )


@app.post(
    f"{settings.API_PREFIX}/matches/{{match_id}}/resume",
    response_model=MatchActionResponse,
)
def resume_match(match_id: str, _: str = Depends(require_panel_access)):
    rcon_response = rcon_service.resume_match()
    return match_service.record_action(
        match_id=match_id,
        action="resume_match",
        next_status=MatchStatus.live,
        executed_command="mp_unpause_match",
        rcon_response=rcon_response,
    )


@app.post(
    f"{settings.API_PREFIX}/matches/{{match_id}}/end",
    response_model=MatchActionResponse,
)
def end_match(match_id: str, _: str = Depends(require_panel_access)):
    rcon_response = rcon_service.end_match()
    return match_service.record_action(
        match_id=match_id,
        action="end_match",
        next_status=MatchStatus.finished,
        executed_command="mp_warmup_end",
        rcon_response=rcon_response,
    )


@app.post(
    f"{settings.API_PREFIX}/matches/{{match_id}}/command",
    response_model=MatchActionResponse,
)
def run_custom_command(
    match_id: str,
    payload: PanelCommandRequest,
    _: str = Depends(require_panel_access),
):
    rcon_response = rcon_service.send_command(payload.command)
    return match_service.record_action(
        match_id=match_id,
        action="custom_command",
        next_status=match_service.get_match(match_id).status,
        executed_command=payload.command,
        rcon_response=rcon_response,
    )
