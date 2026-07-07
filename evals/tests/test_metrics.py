import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import metrics


def test_recall_at_k_all_relevant_retrieved():
    assert metrics.recall_at_k(["a", "b", "c"], ["a", "b"], k=3) == 1.0


def test_recall_at_k_partial_match():
    assert metrics.recall_at_k(["a", "x", "y"], ["a", "b"], k=3) == 0.5


def test_recall_at_k_respects_k_cutoff():
    assert metrics.recall_at_k(["x", "y", "a"], ["a"], k=2) == 0.0


def test_recall_at_k_empty_relevant_returns_none():
    assert metrics.recall_at_k(["a", "b"], [], k=3) is None


def test_ndcg_at_k_perfect_ranking_is_one():
    result = metrics.ndcg_at_k(["a", "b", "x"], ["a", "b"], k=3)
    assert math.isclose(result, 1.0, rel_tol=1e-9)


def test_ndcg_at_k_worse_ranking_is_less_than_one():
    result = metrics.ndcg_at_k(["x", "a", "b"], ["a", "b"], k=3)
    expected_dcg = (1.0 / math.log2(3)) + (1.0 / math.log2(4))
    expected_idcg = (1.0 / math.log2(2)) + (1.0 / math.log2(3))
    assert math.isclose(result, expected_dcg / expected_idcg, rel_tol=1e-9)


def test_ndcg_at_k_empty_relevant_returns_none():
    assert metrics.ndcg_at_k(["a", "b"], [], k=3) is None


def test_ndcg_at_k_no_hits_is_zero():
    assert metrics.ndcg_at_k(["x", "y"], ["a"], k=2) == 0.0


def test_ndcg_at_k_respects_k_cutoff():
    # relevant item "a" only appears at index 2, beyond k=2, so no hits within the cutoff
    assert metrics.ndcg_at_k(["x", "y", "a"], ["a"], k=2) == 0.0
