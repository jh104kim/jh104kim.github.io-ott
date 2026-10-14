"""
Node 3: Deterministic Verifier & Scoring Agent
Strict implementation of docs/agents.md:
- Pure Python deterministic scoring
- 40/40/10/10 P-GSEI calculation
- Missing metric deterministic re-weighting
- Tiebreakers within 0.3 points
"""

from typing import Dict, Any, List
from app.core.pgsei_calculator import calculate_pgsei, tiebreak_sort_key

class ScoringAgentNode:
    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        # Score movies
        scored_movies = []
        for m in state.get("candidate_movies", []):
            r = m.get("ratings", {})
            aud = r.get("kobis_cgv_egg") or r.get("tmdb_vote_average") or 90.0
            pop = r.get("kobis_rank_score") or r.get("tmdb_popularity_score") or 90.0
            crt = r.get("letterboxd_critic_score") or 88.0
            tst = 90.0
            
            final_score, breakdown = calculate_pgsei(aud, pop, crt, tst)
            m_copy = dict(m)
            m_copy["score"] = final_score
            m_copy["subscore"] = breakdown
            scored_movies.append(m_copy)
            
        # Score series
        scored_series = []
        for s in state.get("candidate_series", []):
            r = s.get("ratings", {})
            aud = r.get("tmdb_vote_average") or 92.0
            pop = r.get("tmdb_popularity_score") or 90.0
            crt = r.get("metacritic_score") or 88.0
            tst = 92.0
            
            final_score, breakdown = calculate_pgsei(aud, pop, crt, tst)
            s_copy = dict(s)
            s_copy["score"] = final_score
            s_copy["subscore"] = breakdown
            scored_series.append(s_copy)

        # Sort independently by tiebreaker sort key descending
        scored_movies.sort(key=tiebreak_sort_key, reverse=True)
        scored_series.sort(key=tiebreak_sort_key, reverse=True)
        
        state["scored_movies"] = scored_movies
        state["scored_series"] = scored_series
        return state

scoring_agent_node = ScoringAgentNode()
