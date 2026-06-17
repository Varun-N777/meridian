import logging
import random
from typing import Dict, Any, List
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class CounterfactualEngine:
    """
    Simulates alternative scenarios and predicts their outcomes before a decision is finalized.
    """
    def __init__(self):
        logger.info("Counterfactual Engine initialized.")

    def simulate_alternatives(self, request_type: str, payload: Dict[str, Any], db: Session = None) -> Dict[str, Any]:
        """
        Takes the current context, generates alternatives, scores them, and ranks them.
        """
        context = {}
        if db and payload.get("customer_id"):
            from app.models.models import CustomerProfile
            profile = db.query(CustomerProfile).filter(CustomerProfile.customer_id == payload["customer_id"]).first()
            if profile:
                context = {
                    "churn_probability": profile.churn_probability or 0.5,
                    "engagement_score": profile.engagement_score or 50.0
                }

        # Baseline outcome (if we do nothing or standard path)
        baseline = self._simulate_outcome("baseline", context)

        # Generate contextual alternatives based on request type
        alternatives = []
        if request_type in ["next_best_action", "churn_prediction", "customer_intelligence"]:
            alternatives = [
                self._simulate_outcome("offer_discount", context),
                self._simulate_outcome("delay_campaign", context),
                self._simulate_outcome("escalate_to_human", context)
            ]
        else:
            alternatives = [
                self._simulate_outcome("alternative_1", context),
                self._simulate_outcome("alternative_2", context)
            ]

        # Rank alternatives by expected value
        alternatives = sorted(alternatives, key=lambda x: x["expected_value"], reverse=True)

        # The recommended action is the top alternative (if it beats baseline)
        recommended = alternatives[0] if alternatives and alternatives[0]["expected_value"] > baseline["expected_value"] else baseline

        return {
            "baseline": baseline,
            "alternatives": alternatives,
            "recommended": recommended
        }

    def _simulate_outcome(self, action: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Mock simulation: In a real system, this calls ML models to predict P(churn) given Action X.
        """
        # Extract base risk from context
        base_risk = context.get("churn_probability", 0.5)
        engagement = context.get("engagement_score", 50.0) / 100.0

        if action == "baseline":
            risk = base_risk
            cost = 0.0
            value = (1 - risk) * engagement
        elif action == "offer_discount":
            risk = max(0.01, base_risk * 0.5)
            cost = 20.0
            value = ((1 - risk) * engagement * 100) - cost
        elif action == "delay_campaign":
            risk = min(0.99, base_risk * 1.2)
            cost = 0.0
            value = (1 - risk) * engagement * 100
        elif action == "escalate_to_human":
            risk = max(0.01, base_risk * 0.3)
            cost = 50.0
            value = ((1 - risk) * engagement * 100) - cost
        else:
            risk = base_risk * random.uniform(0.8, 1.2)
            cost = random.uniform(5.0, 15.0)
            value = ((1 - risk) * engagement * 100) - cost

        return {
            "action": action,
            "predicted_risk": round(risk, 2),
            "estimated_cost": round(cost, 2),
            "expected_value": round(value, 2),
            "confidence": round(random.uniform(0.7, 0.95), 2)
        }

counterfactual_engine = CounterfactualEngine()
