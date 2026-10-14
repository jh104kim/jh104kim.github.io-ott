"""
Screen Intelligence Agent Orchestration Pipeline
Connects 4 subagent nodes:
1. Query Analyzer & Intent Node
2. Candidate Retrieval Node
3. Deterministic Verifier & Scoring Node
4. Detail Synthesizer & Video Curator Node
"""

from typing import Dict, Any, List, Optional
from app.agents.query_analyzer import query_analyzer_node
from app.agents.retrieval_agent import retrieval_agent_node
from app.agents.scoring_agent import scoring_agent_node
from app.agents.synthesizer_agent import synthesizer_agent_node
from app.core.rate_limiter import usage_manager

class RecommendationOrchestrator:
    def run_pipeline(
        self,
        raw_query: str,
        user_id: str = "dev-admin",
        subgenres: Optional[List[str]] = None,
        watched_ids: Optional[List[str]] = None,
        not_interested_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        # 1. Rate limiter & budget reservation
        allowed, status, cached = usage_manager.check_and_reserve(user_id, raw_query, subgenres or [])
        if not allowed:
            raise ValueError(f"RATE_LIMIT: {status}")
            
        if cached:
            return cached

        # 2. Initialize State
        state = {
            "user_id": user_id,
            "raw_query": raw_query,
            "watched_ids": watched_ids or [],
            "not_interested_ids": not_interested_ids or [],
            "errors": []
        }

        # 3. Pipeline execution
        state = query_analyzer_node.execute(state)
        state = retrieval_agent_node.execute(state)
        state = scoring_agent_node.execute(state)
        state = synthesizer_agent_node.execute(state)

        user_status = usage_manager.get_user_status(user_id)
        
        result = {
            "query": raw_query,
            "detected_parent_genre": state.get("detected_parent_genre", ""),
            "subgenres": state.get("generated_subgenres", []),
            "movies": state.get("final_movies", []),
            "series": state.get("final_series", []),
            "daily_remaining": user_status["daily_remaining"],
            "monthly_budget_remaining": round(user_status["monthly_budget_usd"] - user_status["monthly_spend_usd"], 2)
        }

        # 4. Record successful usage
        usage_manager.record_success(user_id, raw_query, subgenres or [], result)
        
        return result

orchestrator = RecommendationOrchestrator()
