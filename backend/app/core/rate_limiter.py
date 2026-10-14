"""
In-Memory Rate Limiter and Ledger for Gemini API usage
Enforces D-34 (10 requests/day/user), D-35 (monthly budget cap $30),
and 24-hour cache rule (0 cost for repeat queries).
"""

import time
import hashlib
from typing import Dict, Tuple, Optional, Any
from app.config import settings

class UsageManager:
    def __init__(self):
        self.daily_counts: Dict[str, int] = {}
        self.monthly_spend_usd: float = 0.08
        self.query_cache: Dict[str, Tuple[float, dict]] = {} # hash -> (timestamp, result)
        self.max_daily = settings.MAX_DAILY_REQUESTS
        self.monthly_budget = settings.MONTHLY_BUDGET_USD
        self.cost_per_query = settings.ESTIMATED_COST_PER_QUERY_USD

    def _get_cache_key(self, user_id: str, query: str, subgenres: list) -> str:
        raw = f"{user_id}:{query.strip().lower()}:{sorted(subgenres or [])}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def check_and_reserve(self, user_id: str, query: str, subgenres: list) -> Tuple[bool, str, Optional[dict]]:
        """
        Checks rate limits. Returns (allowed, reason, cached_data_if_any).
        """
        cache_key = self._get_cache_key(user_id, query, subgenres)
        now = time.time()
        
        # 24-hour cache check (0 credit deduction)
        if cache_key in self.query_cache:
            ts, cached_result = self.query_cache[cache_key]
            if now - ts < 86400: # within 24h
                return True, "CACHE_HIT_0_CHARGE", cached_result

        # Daily user check
        current_daily = self.daily_counts.get(user_id, 0)
        if current_daily >= self.max_daily:
            return False, f"DAILY_LIMIT_EXCEEDED (Max {self.max_daily} requests/day)", None

        # Monthly service budget check
        if (self.monthly_spend_usd + self.cost_per_query) > self.monthly_budget:
            return False, f"SERVICE_BUDGET_EXCEEDED (Monthly cap ${self.monthly_budget} reached)", None

        return True, "ALLOWED", None

    def record_success(self, user_id: str, query: str, subgenres: list, result: dict):
        cache_key = self._get_cache_key(user_id, query, subgenres)
        self.query_cache[cache_key] = (time.time(), result)
        self.daily_counts[user_id] = self.daily_counts.get(user_id, 0) + 1
        self.monthly_spend_usd = round(self.monthly_spend_usd + self.cost_per_query, 4)

    def get_user_status(self, user_id: str) -> dict:
        used = self.daily_counts.get(user_id, 0)
        return {
            "daily_used": used,
            "daily_remaining": max(0, self.max_daily - used),
            "max_daily": self.max_daily,
            "monthly_spend_usd": self.monthly_spend_usd,
            "monthly_budget_usd": self.monthly_budget
        }

usage_manager = UsageManager()
