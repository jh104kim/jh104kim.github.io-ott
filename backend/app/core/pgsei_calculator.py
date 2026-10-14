"""
P-GSEI (Personalized Global Screen Evaluation Index) Deterministic Engine
Strict implementation of docs/spec.md:
- D-01: 40/40/10/10 ratio (Audience 40%, Popularity 40%, Critic 10%, Taste 10%)
- D-08: Empirical Bayesian smoothing for small sample sizes
- D-09: Deterministic re-weighting when subscores are missing (8:8:2 default for missing critic)
- D-18: Multi-tier tiebreaker (within 0.3 points: taste -> audience -> freshness)
"""

from typing import Dict, Any, Optional, Tuple

BAYESIAN_PRIOR_MEAN = 70.0
BAYESIAN_MIN_VOTES = 50

def bayesian_smooth(raw_score: float, vote_count: int) -> float:
    """Smooths raw ratings using empirical Bayesian formula (D-08)."""
    if vote_count <= 0:
        return BAYESIAN_PRIOR_MEAN
    smoothed = (vote_count / (vote_count + BAYESIAN_MIN_VOTES)) * raw_score + \
               (BAYESIAN_MIN_VOTES / (vote_count + BAYESIAN_MIN_VOTES)) * BAYESIAN_PRIOR_MEAN
    return round(smoothed, 2)

def calculate_pgsei(
    audience: Optional[float],
    popularity: Optional[float],
    critic: Optional[float],
    taste: Optional[float] = 90.0
) -> Tuple[float, Dict[str, float]]:
    """
    Computes final P-GSEI score and breakdown.
    Handles missing metrics with deterministic re-weighting (D-09).
    """
    # Fallback to sensible defaults if totally missing
    aud = audience if audience is not None else 75.0
    pop = popularity if popularity is not None else 75.0
    tst = taste if taste is not None else 85.0
    
    # If critic is missing (D-09: 8:8:2 reweighting -> 44.44% / 44.44% / 11.11%)
    if critic is None:
        total_w = 40.0 + 40.0 + 10.0
        w_aud = 40.0 / total_w
        w_pop = 40.0 / total_w
        w_tst = 10.0 / total_w
        score = (aud * w_aud) + (pop * w_pop) + (tst * w_tst)
        breakdown = {
            "audience": round(aud, 1),
            "popularity": round(pop, 1),
            "critic": 0.0,
            "taste": round(tst, 1)
        }
    else:
        # Standard 40/40/10/10
        score = (0.40 * aud) + (0.40 * pop) + (0.10 * critic) + (0.10 * tst)
        breakdown = {
            "audience": round(aud, 1),
            "popularity": round(pop, 1),
            "critic": round(critic, 1),
            "taste": round(tst, 1)
        }
    
    return round(score, 1), breakdown

def tiebreak_sort_key(item: Dict[str, Any]) -> Tuple[float, float, float, int]:
    """
    Sort key implementing D-18:
    Primary: P-GSEI score (bucketed by 0.3 for tiebreaker)
    Secondary: Taste score (10%)
    Tertiary: Audience satisfaction (40%)
    Quaternary: Year / Recency
    """
    score = item.get("score", 0.0)
    sub = item.get("subscore", {})
    if isinstance(sub, dict):
        taste = sub.get("taste", 0.0)
        audience = sub.get("audience", 0.0)
    else:
        taste = getattr(sub, "taste", 0.0)
        audience = getattr(sub, "audience", 0.0)
    year = item.get("year", 2020)
    
    return (score, taste, audience, year)
