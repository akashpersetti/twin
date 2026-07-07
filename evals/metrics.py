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
