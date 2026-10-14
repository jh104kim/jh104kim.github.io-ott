from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List

from app.config import settings
from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    SeasonWatchRequest
)
from app.agents.orchestrator import orchestrator
from app.agents.query_analyzer import THEME_REGISTRY
from app.core.rate_limiter import usage_manager

app = FastAPI(
    title="Screen Intelligence Agent API",
    description="개인 맞춤형 OTT & 극장 스마트 추천 에이전트 백엔드 (Gemini 2.5 오케스트레이션)",
    version="1.1.0"
)

# In-memory season watch store for dev session
user_season_watches: Dict[str, Dict[str, Dict[int, bool]]] = {}

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_user() -> str:
    if settings.AUTH_DEV_BYPASS:
        return "dev-admin"
    return "dev-admin"

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "version": "1.1.0",
        "provider_mode": settings.PROVIDER_MODE,
        "auth_bypass": settings.AUTH_DEV_BYPASS,
        "gemini_model": settings.GEMINI_MODEL
    }

@app.post("/api/recommend", response_model=RecommendationResponse)
def get_recommendations(
    req: RecommendationRequest,
    user_id: str = Depends(get_current_user)
):
    try:
        result = orchestrator.run_pipeline(
            raw_query=req.query,
            user_id=user_id,
            subgenres=req.selected_subgenres,
            watched_ids=req.watched_ids,
            not_interested_ids=req.not_interested_ids
        )
        return result
    except ValueError as e:
        if "RATE_LIMIT" in str(e):
            raise HTTPException(status_code=429, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/subgenres")
def get_subgenres_by_theme(theme: str = "spy"):
    theme_data = THEME_REGISTRY.get(theme, THEME_REGISTRY["spy"])
    return {
        "theme": theme,
        "parent_genre": theme_data["parent_genre"],
        "subgenres": theme_data["subgenres"]
    }

@app.post("/api/watched/season")
def update_season_watch_status(
    req: SeasonWatchRequest,
    user_id: str = Depends(get_current_user)
):
    """
    [개선 사항 1]: 개별 시즌 단위 시청 완료 상태 토글 (D-07 연계)
    """
    if user_id not in user_season_watches:
        user_season_watches[user_id] = {}
    if req.series_id not in user_season_watches[user_id]:
        user_season_watches[user_id][req.series_id] = {}
        
    user_season_watches[user_id][req.series_id][req.season_number] = req.watched
    
    return {
        "user_id": user_id,
        "series_id": req.series_id,
        "season_number": req.season_number,
        "watched": req.watched,
        "status": "SUCCESS"
    }

@app.get("/api/usage")
def get_usage(user_id: str = Depends(get_current_user)):
    return usage_manager.get_user_status(user_id)
