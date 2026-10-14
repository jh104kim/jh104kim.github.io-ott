import json
from pathlib import Path
from typing import Dict, List, Any

FIXTURES_DIR = Path(__file__).parent / "fixtures"

class MockDataProvider:
    def __init__(self):
        self.titles = self._load_json("titles.json")
        self.ratings = self._load_json("ratings.json")
        self.availability = self._load_json("availability.json")
        self.youtube = self._load_json("youtube.json")

    def _load_json(self, filename: str) -> Any:
        p = FIXTURES_DIR / filename
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
        return [] if filename == "titles.json" else {}

    def get_candidates(self, media_type: str, query: str = "") -> List[Dict[str, Any]]:
        """Returns candidate items by type (movie or series)"""
        candidates = []
        raw_list = self.titles if isinstance(self.titles, list) else list(self.titles.values())
        
        for item in raw_list:
            if item.get("kind") == media_type:
                cid = item.get("media_id")
                # Merge ratings
                r = self.ratings.get(cid, {}) if isinstance(self.ratings, dict) else {}
                # Merge availability (list of platforms)
                av = self.availability.get(cid, []) if isinstance(self.availability, dict) else []
                platforms = []
                if isinstance(av, list):
                    platforms = [p.get("platform_name") for p in av if isinstance(p, dict) and p.get("platform_name")]
                elif isinstance(av, dict):
                    platforms = [p.get("platform_name") for p in av.get("platforms", []) if isinstance(p, dict)]
                
                if not platforms:
                    platforms = ["넷플릭스"]

                # Merge youtube
                yt = self.youtube.get(cid, []) if isinstance(self.youtube, dict) else []
                
                merged = {
                    "id": cid,
                    "type": item.get("kind"),
                    "title": item.get("title_ko"),
                    "orig_title": f"{item.get('title_en', '')} ({item.get('release_year', 2024)})",
                    "year": item.get("release_year", 2024),
                    "synopsis": item.get("synopsis", ""),
                    "platforms": platforms,
                    "ratings": r,
                    "youtube_videos": yt,
                    "season_label": item.get("season_label"),
                    "season_guide": item.get("season_guide"),
                    "subgenres": item.get("subgenres", [])
                }
                candidates.append(merged)
        return candidates

mock_provider = MockDataProvider()
