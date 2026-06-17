import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import DecisionMemory

logger = logging.getLogger(__name__)

class MemoryEngine:
    """
    Records decisions and learns from real-world outcomes over time.
    """
    def __init__(self):
        logger.info("Memory Engine initialized.")

    def store_decision(
        self,
        db: Session,
        request_id: str,
        customer_id: str,
        feature: str,
        decision: Dict[str, Any],
        tier_used: str,
        confidence: float,
        expected_outcome: Dict[str, Any]
    ) -> str:
        """
        Stores a decision made by the IPC engine into the memory bank.
        """
        mem_id = str(uuid.uuid4())
        memory_record = DecisionMemory(
            id=mem_id,
            request_id=request_id,
            customer_id=customer_id,
            feature=feature,
            decision=decision,
            tier_used=tier_used,
            confidence=confidence,
            expected_outcome=expected_outcome,
            execution_timestamp=datetime.utcnow()
        )
        db.add(memory_record)
        db.commit()
        return mem_id

    def evaluate_outcome(self, db: Session, request_id: str, actual_outcome: Dict[str, Any]):
        """
        Evaluates a past decision against the actual real-world outcome.
        Updates the memory record with the delta.
        """
        record = db.query(DecisionMemory).filter(DecisionMemory.request_id == request_id).first()
        if not record:
            return

        record.actual_outcome = actual_outcome
        record.evaluation_timestamp = datetime.utcnow()
        record.learned = True

        # Calculate outcome delta (simplified example: difference in retention probability)
        expected_retention = record.expected_outcome.get("expected_retention", 0.0)
        actual_retention = actual_outcome.get("actual_retention", 0.0)
        
        # Delta: Positive means the AI under-predicted the benefit, negative means over-predicted
        record.outcome_delta = actual_retention - expected_retention
        
        db.commit()

    def get_learning_metrics(self, db: Session) -> Dict[str, Any]:
        """
        Aggregates learning metrics for the UI.
        """
        total_decisions = db.query(DecisionMemory).count()
        learned_decisions = db.query(DecisionMemory).filter(DecisionMemory.learned == True).count()
        
        # Calculate prediction accuracy (1 - abs(delta))
        evaluated = db.query(DecisionMemory).filter(DecisionMemory.learned == True).all()
        accuracy = 0.0
        if evaluated:
            total_delta = sum(abs(r.outcome_delta or 0.0) for r in evaluated)
            accuracy = 1.0 - (total_delta / len(evaluated))
            
        return {
            "decisions_learned_today": learned_decisions,
            "prediction_accuracy": round(max(0.0, accuracy) * 100, 1),
            "memory_growth": total_decisions
        }

memory_engine = MemoryEngine()
