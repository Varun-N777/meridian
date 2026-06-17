import logging
import uuid
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.models import DecisionEfficiency

logger = logging.getLogger(__name__)

class EfficiencyEngine:
    """
    Computes the Decision Compression Score: Value / Compute.
    """
    def __init__(self):
        logger.info("Efficiency Engine initialized.")

    def score_decision(
        self,
        db: Session,
        request_id: str,
        tier: str,
        latency_ms: float,
        business_value: float
    ) -> float:
        """
        Calculates and stores the Decision Compression Score.
        Returns the score (0-100).
        """
        # Base compute cost estimation based on tier
        if "Tier 3" in tier or "LLM" in tier:
            compute_cost = 5.0 # High cost
        elif "Tier 2" in tier or "ML" in tier:
            compute_cost = 1.0 # Medium cost
        else:
            compute_cost = 0.1 # Low cost (Rules/Cache)

        # Apply latency penalty (slower = more expensive)
        latency_penalty = latency_ms / 1000.0 
        total_cost = compute_cost + latency_penalty

        # Compute Score: (Value / Cost) normalized to 0-100
        # If value is 0, score is 0. If cost is very low, score is high.
        raw_score = (business_value / total_cost) * 10
        
        # Normalize to 0-100 curve
        score = min(100.0, max(0.0, raw_score))

        # Store in DB
        eff_record = DecisionEfficiency(
            id=str(uuid.uuid4()),
            request_id=request_id,
            tier=tier,
            latency=latency_ms,
            cost=total_cost,
            score=score,
            timestamp=datetime.utcnow()
        )
        db.add(eff_record)
        db.commit()

        return score

    def get_observability_metrics(self, db: Session) -> Dict[str, Any]:
        """
        Aggregates metrics for the Observability UI.
        """
        records = db.query(DecisionEfficiency).all()
        if not records:
            return {
                "avg_compression_score": 0,
                "llm_avoidance": 0,
                "tier_distribution": {"Tier 1": 0, "Tier 2": 0, "Tier 3": 0},
                "recent_trend": []
            }

        total_score = sum(r.score for r in records if r.score)
        avg_score = total_score / len(records)

        tier_1 = sum(1 for r in records if "Tier 1" in (r.tier or ""))
        tier_2 = sum(1 for r in records if "Tier 2" in (r.tier or ""))
        tier_3 = sum(1 for r in records if "Tier 3" in (r.tier or ""))
        
        total = tier_1 + tier_2 + tier_3
        llm_avoidance = ((tier_1 + tier_2) / total * 100) if total > 0 else 0

        # Last 10 scores for trend sparkline
        trend = [r.score for r in sorted(records, key=lambda x: x.timestamp, reverse=True)[:10]]

        return {
            "avg_compression_score": round(avg_score, 1),
            "llm_avoidance": round(llm_avoidance, 1),
            "tier_distribution": {
                "Tier 1 (Rules)": tier_1,
                "Tier 2 (ML)": tier_2,
                "Tier 3 (LLM)": tier_3
            },
            "recent_trend": trend[::-1] # chronological order
        }

efficiency_engine = EfficiencyEngine()
