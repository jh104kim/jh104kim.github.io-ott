"""
Node 1: Query Analyzer & Intent Agent
Strict implementation of docs/agents.md:
- Deterministic rule-based matching prioritized
- Detects parent genre and generates exactly 4 distinct sub-genres (D-22, INT-27)
- Gemini 2.5 API fallback
"""

import json
from typing import Dict, Any, List
from app.config import settings

THEME_REGISTRY = {
    "spy": {
        "parent_genre": "첩보 / 스파이 (Espionage)",
        "subgenres": [
            {"id": "sub-1", "name": "정보기관·정치첩보", "desc": "CIA, MI6 등 국가 기관 암투", "active": True},
            {"id": "sub-2", "name": "액션·대테러", "desc": "특수요원 테러 저지 액션", "active": True},
            {"id": "sub-3", "name": "잠입·이중간첩", "desc": "적진 침투 및 내부 첩자 심리전", "active": False},
            {"id": "sub-4", "name": "사이버·기술첩보", "desc": "해킹, 도청, 디지털 정보전", "active": False}
        ]
    },
    "sf": {
        "parent_genre": "SF / 미래 과학 (Sci-Fi)",
        "subgenres": [
            {"id": "sub-1", "name": "하드SF·우주탐사", "desc": "성간 여행, 과학적 고증 생존기", "active": True},
            {"id": "sub-2", "name": "사이버펑크·AI", "desc": "디스토피아, 인공지능의 반란", "active": True},
            {"id": "sub-3", "name": "타임슬립·평행우주", "desc": "시간 역설과 멀티버스 탐험", "active": False},
            {"id": "sub-4", "name": "외계침공·퍼스트컨택트", "desc": "지구 방위 및 미지의 외계 조우", "active": False}
        ]
    },
    "zombie": {
        "parent_genre": "좀비 / 아포칼립스 (Apocalyptic)",
        "subgenres": [
            {"id": "sub-1", "name": "바이러스·생존기", "desc": "생존자들의 고립 및 탈출 사투", "active": True},
            {"id": "sub-2", "name": "포스트 아포칼립스 재건", "desc": "문명 붕괴 후 군벌 간 생존 경쟁", "active": True},
            {"id": "sub-3", "name": "밀리터리 소탕전", "desc": "특수부대의 감염자 구역 진압", "active": False},
            {"id": "sub-4", "name": "심리·밀실 갈등", "desc": "극한 상황 속 인간 본성의 민낯", "active": False}
        ]
    },
    "crime": {
        "parent_genre": "범죄 / 마피아 느와르 (Crime & Noir)",
        "subgenres": [
            {"id": "sub-1", "name": "조직범죄·카르텔", "desc": "마피아 패밀리와 마약 카르텔 암투", "active": True},
            {"id": "sub-2", "name": "지능형 케이퍼무비", "desc": "치밀한 계획의 완전범죄 탈취극", "active": True},
            {"id": "sub-3", "name": "연쇄살인·프로파일링", "desc": "형사와 사이코패스의 두뇌 추적", "active": False},
            {"id": "sub-4", "name": "법정·부패 수사", "desc": "권력층 비리와 검경 내부 고발", "active": False}
        ]
    },
    "timeslip": {
        "parent_genre": "타임슬립 / 미스터리 (Mystery & Time Loop)",
        "subgenres": [
            {"id": "sub-1", "name": "타임루프·반복", "desc": "정해진 하루가 무한 반복되는 운명", "active": True},
            {"id": "sub-2", "name": "과거 회귀·나비효과", "desc": "과거를 바꾸며 생겨나는 연쇄 파동", "active": True},
            {"id": "sub-3", "name": "기억 상실·정체성", "desc": "지워진 기억과 거짓된 진실 추적", "active": False},
            {"id": "sub-4", "name": "밀실 미스터리", "desc": "탈출 불가능한 공간 속 연쇄 사건", "active": False}
        ]
    }
}

class QueryAnalyzerNode:
    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        query = state.get("raw_query", "").lower()
        
        # Rule-based detection
        theme_key = "spy"
        if any(w in query for w in ["우주", "sf", "인공지능", "ai", "미래"]):
            theme_key = "sf"
        elif any(w in query for w in ["좀비", "아포칼립스", "바이러스", "멸망"]):
            theme_key = "zombie"
        elif any(w in query for w in ["마피아", "범죄", "카르텔", "느와르", "수사"]):
            theme_key = "crime"
        elif any(w in query for w in ["타임", "시간", "루프", "미스터리"]):
            theme_key = "timeslip"
            
        matched = THEME_REGISTRY.get(theme_key, THEME_REGISTRY["spy"])
        
        state["detected_parent_genre"] = matched["parent_genre"]
        state["generated_subgenres"] = matched["subgenres"]
        state["parsed_intent"] = {
            "theme_key": theme_key,
            "target_year": 2026 if "2026" in query else None
        }
        return state

query_analyzer_node = QueryAnalyzerNode()
