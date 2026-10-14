import pytest
import sys
from pathlib import Path

backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.agents.query_analyzer import query_analyzer_node
from app.agents.retrieval_agent import retrieval_agent_node
from app.agents.scoring_agent import scoring_agent_node
from app.agents.synthesizer_agent import synthesizer_agent_node

def test_query_analyzer_theme_detection():
    """D-22, INT-27: Detect parent genre and generate 4 subgenres"""
    state = {"raw_query": "우주 SF 탐사 미드 추천해줘"}
    res = query_analyzer_node.execute(state)
    
    assert "SF" in res["detected_parent_genre"]
    assert len(res["generated_subgenres"]) == 4
    sub_names = [s["name"] for s in res["generated_subgenres"]]
    assert any("하드SF" in n for n in sub_names)

def test_retrieval_agent_exclusions():
    """D-05, D-32: Dual track retrieval with exclusions"""
    state = {
        "raw_query": "첩보",
        "watched_ids": ["m-001"],
        "not_interested_ids": ["s-002"]
    }
    res = retrieval_agent_node.execute(state)
    
    # m-001 should not be in candidate_movies
    movie_ids = [m["id"] for m in res["candidate_movies"]]
    assert "m-001" not in movie_ids
    assert "m-002" in movie_ids
    
    # s-002 should not be in candidate_series
    series_ids = [s["id"] for s in res["candidate_series"]]
    assert "s-002" not in series_ids
    assert "s-001" in series_ids

def test_scoring_and_synthesizer_pipeline():
    """D-01, D-02: Scoring and YouTube spoiler check"""
    state = {
        "candidate_movies": [
            {
                "id": "m-001",
                "title": "미션 임파서블",
                "year": 2023,
                "ratings": {"kobis_cgv_egg": 94, "kobis_rank_score": 92, "letterboxd_critic_score": 88}
            }
        ],
        "candidate_series": []
    }
    scored = scoring_agent_node.execute(state)
    assert len(scored["scored_movies"]) == 1
    m = scored["scored_movies"][0]
    assert m["score"] > 85.0
    assert "audience" in m["subscore"]
    
    synthesized = synthesizer_agent_node.execute(scored)
    assert len(synthesized["final_movies"]) == 1
    assert "관객 만족도" in synthesized["final_movies"][0]["reason"]
