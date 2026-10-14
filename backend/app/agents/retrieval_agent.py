"""
Node 2: Candidate Discovery & Retrieval Agent
Strict implementation of docs/agents.md:
- Dual-track retrieval: Movies and Series retrieved independently (D-05)
- Filters out user watched list and not-interested list (D-32)
"""

from typing import Dict, Any, List
from app.providers.mock_provider import mock_provider

class RetrievalAgentNode:
    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        raw_query = state.get("raw_query", "")
        watched_ids = set(state.get("watched_ids", []))
        not_interested_ids = set(state.get("not_interested_ids", []))
        
        # 1. Fetch movies
        all_movies = mock_provider.get_candidates("movie", raw_query)
        candidate_movies = [
            m for m in all_movies
            if m["id"] not in watched_ids and m["id"] not in not_interested_ids
        ]
        
        # 2. Fetch series
        all_series = mock_provider.get_candidates("series", raw_query)
        candidate_series = [
            s for s in all_series
            if s["id"] not in watched_ids and s["id"] not in not_interested_ids
        ]
        
        state["candidate_movies"] = candidate_movies
        state["candidate_series"] = candidate_series
        return state

retrieval_agent_node = RetrievalAgentNode()
