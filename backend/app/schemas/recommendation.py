from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class SubscoreBreakdown(BaseModel):
    audience: float = Field(..., description="관객 평점 (40%)")
    popularity: float = Field(..., description="대중적 인기/화제성 (40%)")
    critic: float = Field(..., description="전문가/평론가 평점 (10%)")
    taste: float = Field(..., description="사용자 개인 취향 일치도 (10%)")

class SeasonInfo(BaseModel):
    season: int
    year: str
    episodes: str
    score: float
    watched: bool = False
    is_current_target: bool = False
    desc: str

class SeasonGuide(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    badge: str
    guide_type: str = Field(..., alias="type") # continuous | standalone
    advice: str
    trend: str
    seasons: List[SeasonInfo] = []

class CuratedYouTubeVideo(BaseModel):
    channel: str
    badge_color: str
    title: str
    time: str
    views: str
    subscribers: Optional[str] = "공식 파트너"
    thumbnail_url: Optional[str] = None
    is_spoiler: bool
    url: str

class RecommendationItem(BaseModel):
    id: str
    type: str # movie | series
    title: str
    orig_title: str
    year: int
    score: float
    reliability: str = "High"
    subscore: SubscoreBreakdown
    platforms: List[str]
    season_label: Optional[str] = None
    season_guide: Optional[SeasonGuide] = None
    reason: str
    synopsis: str
    youtube_videos: List[CuratedYouTubeVideo] = []

class SubgenreItem(BaseModel):
    id: str
    name: str
    desc: str
    active: bool = True

class SubgenreResponse(BaseModel):
    parent_genre: str
    subgenres: List[SubgenreItem]

class RecommendationRequest(BaseModel):
    query: str
    parent_genre: Optional[str] = None
    selected_subgenres: Optional[List[str]] = None
    watched_ids: Optional[List[str]] = None
    not_interested_ids: Optional[List[str]] = None

class RecommendationResponse(BaseModel):
    query: str
    detected_parent_genre: str
    subgenres: List[SubgenreItem]
    movies: List[RecommendationItem]
    series: List[RecommendationItem]
    daily_remaining: int
    monthly_budget_remaining: float

class SeasonWatchRequest(BaseModel):
    series_id: str
    season_number: int
    watched: bool
