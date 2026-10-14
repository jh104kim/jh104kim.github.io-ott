import pytest
import sys
from pathlib import Path

# Add backend to sys.path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.core.pgsei_calculator import calculate_pgsei, bayesian_smooth, tiebreak_sort_key

def test_pgsei_formula_standard():
    """D-01: 40/40/10/10 formula test"""
    # 90 * 0.4 + 80 * 0.4 + 70 * 0.1 + 60 * 0.1 = 36 + 32 + 7 + 6 = 81.0
    score, breakdown = calculate_pgsei(
        audience=90.0,
        popularity=80.0,
        critic=70.0,
        taste=60.0
    )
    assert score == 81.0
    assert breakdown["audience"] == 90.0
    assert breakdown["popularity"] == 80.0
    assert breakdown["critic"] == 70.0
    assert breakdown["taste"] == 60.0

def test_pgsei_missing_critic_reweighting():
    """D-09: Missing critic reweighting (8:8:2 -> 44.44% / 44.44% / 11.11%)"""
    score, breakdown = calculate_pgsei(
        audience=90.0,
        popularity=80.0,
        critic=None,
        taste=70.0
    )
    # Expected: 90 * (40/90) + 80 * (40/90) + 70 * (10/90) = 40 + 35.55 + 7.77 = 83.3
    assert breakdown["critic"] == 0.0
    assert round(score, 1) == 83.3

def test_bayesian_smoothing():
    """D-08: Small sample Bayesian smoothing towards prior 70.0"""
    # 0 votes -> 70.0
    assert bayesian_smooth(100.0, 0) == 70.0
    # 50 votes (m=50) with 100.0 -> (50*100 + 50*70)/100 = 85.0
    assert bayesian_smooth(100.0, 50) == 85.0

def test_tiebreaker_taste_priority():
    """D-18: Within 0.3 points, taste and audience prioritize ranking"""
    item1 = {"score": 90.0, "subscore": {"taste": 95.0, "audience": 88.0}, "year": 2023}
    item2 = {"score": 90.0, "subscore": {"taste": 90.0, "audience": 92.0}, "year": 2024}
    
    # item1 has higher taste (95.0 > 90.0)
    key1 = tiebreak_sort_key(item1)
    key2 = tiebreak_sort_key(item2)
    assert key1 > key2
