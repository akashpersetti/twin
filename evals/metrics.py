import math
from typing import List, Optional


def recall_at_k(retrieved_ids: List[str], relevant_ids: List[str], k: int) -> Optional[float]:
    if not relevant_ids:
        return None
    retrieved_top_k = set(retrieved_ids[:k])
    relevant_set = set(relevant_ids)
    return len(retrieved_top_k & relevant_set) / len(relevant_set)


def ndcg_at_k(retrieved_ids: List[str], relevant_ids: List[str], k: int) -> Optional[float]:
    if not relevant_ids:
        return None
    relevant_set = set(relevant_ids)
    dcg = sum(
        (1.0 if chunk_id in relevant_set else 0.0) / math.log2(i + 2)
        for i, chunk_id in enumerate(retrieved_ids[:k])
    )
    ideal_hits = min(len(relevant_set), k)
    idcg = sum(1.0 / math.log2(i + 2) for i in range(ideal_hits))
    return dcg / idcg if idcg > 0 else 0.0


def precision_at_k(retrieved_ids: List[str], relevant_ids: List[str], k: int) -> Optional[float]:
    if not relevant_ids:
        return None
    retrieved_top_k = retrieved_ids[:k]
    if not retrieved_top_k:
        return 0.0
    relevant_set = set(relevant_ids)
    hits = sum(1 for chunk_id in retrieved_top_k if chunk_id in relevant_set)
    return hits / len(retrieved_top_k)


def mrr(retrieved_ids: List[str], relevant_ids: List[str]) -> Optional[float]:
    if not relevant_ids:
        return None
    relevant_set = set(relevant_ids)
    for i, chunk_id in enumerate(retrieved_ids):
        if chunk_id in relevant_set:
            return 1.0 / (i + 1)
    return 0.0


def f1_at_k(retrieved_ids: List[str], relevant_ids: List[str], k: int) -> Optional[float]:
    precision = precision_at_k(retrieved_ids, relevant_ids, k)
    recall = recall_at_k(retrieved_ids, relevant_ids, k)
    if precision is None or recall is None:
        return None
    if precision + recall == 0:
        return 0.0
    return 2 * precision * recall / (precision + recall)
