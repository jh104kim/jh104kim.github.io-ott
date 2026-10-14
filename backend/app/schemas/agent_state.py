from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class AgentState(BaseModel):
    user_id: str = "dev-admin"
    raw_query: str
    parsed_intent: Dict[str, Any] = {}
    detected_parent_genre: str = ""
    generated_subgenres: List[Dict[str, Any]] = []
    
    # Discovery candidates
    candidate_movies: List[Dict[str, Any]] = []
    candidate_series: List[Dict[str, Any]] = []
    
    # Scoring results
    scored_movies: List[Dict[str, Any]] = []
    scored_series: List[Dict[str, Any]] = []
    
    # Final synthesized items
    final_movies: List[Dict[str, Any]] = []
    final_series: List[Dict[str, Any]] = []
    
    # Metadata & Errors
    cost_reserved_usd: float = 0.0
    errors: List[str] = []
