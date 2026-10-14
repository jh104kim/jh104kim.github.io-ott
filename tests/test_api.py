import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["auth_bypass"] is True
    assert data["version"] == "1.1.0"

def test_subgenres_endpoint():
    response = client.get("/api/subgenres?theme=spy")
    assert response.status_code == 200
    data = response.json()
    assert "첩보" in data["parent_genre"]
    assert len(data["subgenres"]) == 4

def test_recommendation_flow_and_caching():
    """D-05, D-34: Recommend API with dual ranking, YouTube curation, and 24h cache"""
    req_body = {
        "query": "2026년 첩보 미드 추천해줘",
        "selected_subgenres": ["정보기관·정치첩보"]
    }
    # First call -> consumes quota
    res1 = client.post("/api/recommend", json=req_body)
    assert res1.status_code == 200
    data1 = res1.json()
    assert "movies" in data1
    assert "series" in data1
    assert len(data1["movies"]) > 0
    assert len(data1["series"]) > 0
    
    # Check dual independent rankings (D-05)
    first_movie = data1["movies"][0]
    assert first_movie["type"] == "movie"
    assert first_movie["score"] > 80.0
    
    first_series = data1["series"][0]
    assert first_series["type"] == "series"
    assert first_series["season_guide"] is not None

    # Check curated youtube review channels (피드백 반영)
    yt_videos = first_movie.get("youtube_videos", [])
    if yt_videos:
        assert yt_videos[0]["channel"] in ["어퍼컷", "드림텔러", "무비트랩", "달콤리뷰", "영화세상"]
        assert "subscribers" in yt_videos[0]

    # Second call -> 24-hour cache hit (0 credit deduction)
    res2 = client.post("/api/recommend", json=req_body)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["query"] == req_body["query"]

def test_season_watch_toggle_api():
    """[개선 사항 1]: Individual season watch toggle endpoint verification"""
    payload = {
        "series_id": "s-001",
        "season_number": 3,
        "watched": True
    }
    res = client.post("/api/watched/season", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["series_id"] == "s-001"
    assert data["season_number"] == 3
    assert data["watched"] is True
    assert data["status"] == "SUCCESS"

def test_usage_ledger():
    """D-34, D-35: Usage status query"""
    res = client.get("/api/usage")
    assert res.status_code == 200
    usage = res.json()
    assert "daily_used" in usage
    assert "daily_remaining" in usage
    assert usage["max_daily"] == 10
