import logging
import random
from typing import Dict, Any, Tuple, Optional
from app.intelligence.decision_cache import decision_cache
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

import os
import joblib
import pandas as pd
import google.generativeai as genai

class InferenceRouter:
    """
    Tiered intelligence router maximizing IPC (Intelligence Per Compute).
    Enforces AI Utilization Policy by routing through Rules -> ML -> Cache -> LLM.
    """
    
    def __init__(self):
        logger.info("Meridian InferenceRouter initialized.")
        self.tier2_model = None
        try:
            model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "tier2_model.pkl")
            if os.path.exists(model_path):
                self.tier2_model = joblib.load(model_path)
                logger.info("Tier 2 ML Model loaded successfully.")
        except Exception as e:
            logger.warning(f"Failed to load Tier 2 model: {e}")

    def _increment_metric(self, tier: str):
        """Helper to track which tier is resolving decisions."""
        try:
            if decision_cache.enabled:
                decision_cache.redis_client.incr(f"meridian:metrics:{tier}_decisions")
        except Exception:
            pass

    def evaluate(self, customer_context: Dict[str, Any], task_type: str) -> Dict[str, Any]:
        """
        Evaluate context and return an explainable decision.
        """
        logger.info(f"InferenceRouter evaluating task '{task_type}'")
        
        # 1. Tier 1: Check Cache First
        cached_decision = decision_cache.get_decision(customer_context)
        if cached_decision:
            self._increment_metric("tier1_cache")
            # Must always return explainable schema
            return self._build_explainable_response(
                decision=cached_decision.get("decision", "No Action"),
                confidence=0.99,
                signals_used=["semantic_cache_match"],
                tier_used="Tier 1 (Cache)",
                reasoning="Identical semantic context found in decision cache.",
                alternative_actions=cached_decision.get("alternative_actions", [])
            )

        # 1.5 Explicit Escalation for Complex Cases
        if customer_context.get("state") == "complex_case":
            logger.warning("Complex case detected. Escalating directly to Gemini (Tier 3).")
            tier3_decision = self._escalate_to_llm(customer_context, task_type)
            self._increment_metric("tier3_llm")
            decision_cache.store_decision(customer_context, tier3_decision)
            return tier3_decision

        # 2. Tier 1: Rules & Heuristics
        tier1_decision = self._apply_heuristics(customer_context, task_type)
        if tier1_decision and tier1_decision["confidence"] > 0.85:
            self._increment_metric("tier1_rules")
            decision_cache.store_decision(customer_context, tier1_decision)
            return tier1_decision

        # 3. Tier 2: ML Models (Lightweight Embeddings / XGBoost mocks)
        tier2_decision = self._apply_lightweight_ml(customer_context, task_type)
        if tier2_decision and tier2_decision["confidence"] > 0.75:
            self._increment_metric("tier2_ml")
            decision_cache.store_decision(customer_context, tier2_decision)
            return tier2_decision

        # 4. Tier 3: LLM Escalation (Gemini)
        logger.warning("Low confidence in Tiers 1 and 2. Escalating to Gemini (Tier 3).")
        tier3_decision = self._escalate_to_llm(customer_context, task_type)
        
        # Track LLM escalation
        self._increment_metric("tier3_llm")
        decision_cache.store_decision(customer_context, tier3_decision)
        return tier3_decision

    def _build_explainable_response(self, decision: str, confidence: float, signals_used: list, tier_used: str, reasoning: str, alternative_actions: list = None) -> Dict[str, Any]:
        return {
            "decision": decision,
            "confidence": confidence,
            "signals_used": signals_used,
            "tier_used": tier_used,
            "reasoning": reasoning,
            "alternative_actions": alternative_actions or []
        }

    def _apply_heuristics(self, context: Dict[str, Any], task_type: str) -> Optional[Dict[str, Any]]:
        """Tier 1: Fast rules-based logic."""
        if task_type == "next_best_action":
            # Example heuristic: High churn risk + low engagement = Send Discount
            if context.get("state") == "AT_RISK" and float(context.get("engagement_score", 0)) < 30.0:
                return self._build_explainable_response(
                    decision="Send 20% Win-back Discount",
                    confidence=0.90,
                    signals_used=["state=AT_RISK", "engagement_score<30.0"],
                    tier_used="Tier 1 (Rules)",
                    reasoning="Customer is at risk with very low recent engagement. Aggressive discount is standard playbook.",
                    alternative_actions=["Send Check-in Email"]
                )
            
            # Heuristic: Customer is absolutely dormant with zero risk -> Do nothing, save compute
            churn_risk = float(context.get("churn_probability", context.get("churn_score", 0.5)))
            engagement = float(context.get("engagement_score", 50.0))
            if churn_risk <= 0.05 and engagement < 10.0 and context.get("state") == "SLEEPING":
                return self._build_explainable_response(
                    decision="Monitor / Do Nothing",
                    confidence=0.95,
                    signals_used=[f"churn_risk={churn_risk:.2f}", f"engagement={engagement:.1f}"],
                    tier_used="Tier 1 (Rules)",
                    reasoning="Customer shows negligible churn risk but is completely dormant. No immediate action required, conserving resources.",
                    alternative_actions=["Send Check-in Email"]
                )
        return None

    def _apply_lightweight_ml(self, context: Dict[str, Any], task_type: str) -> Optional[Dict[str, Any]]:
        """Tier 2: Real Scikit-Learn RandomForestClassifier."""
        if task_type == "next_best_action" and self.tier2_model:
            try:
                # Extract features safely
                engagement = float(context.get("engagement_score", 0.5))
                order_count = float(context.get("order_count", 2))
                revenue = float(context.get("revenue", 150.0))
                tickets = float(context.get("support_tickets", 0))
                sentiment = float(context.get("sentiment_score", 0.0))
                
                df = pd.DataFrame([{
                    "engagement_score": engagement,
                    "order_count": order_count,
                    "revenue": revenue,
                    "support_tickets": tickets,
                    "sentiment_score": sentiment
                }])
                
                probs = self.tier2_model.predict_proba(df)[0]
                prediction = int(self.tier2_model.predict(df)[0])
                confidence = float(max(probs))
                
                actions = {
                    0: "Do Nothing",
                    1: "Retention Campaign",
                    2: "Upsell Campaign",
                    3: "VIP Support"
                }
                
                if confidence > 0.75:
                    # Generate dynamic, explainable reasoning based on feature values
                    reason_parts = []
                    if engagement > 50:
                        reason_parts.append(f"high engagement ({engagement:.0f})")
                    elif engagement < 30:
                        reason_parts.append(f"low engagement ({engagement:.0f})")
                        
                    if order_count >= 5:
                        reason_parts.append(f"frequent orders ({order_count:.0f})")
                    elif order_count == 0:
                        reason_parts.append("no purchase history")
                        
                    if tickets > 0:
                        reason_parts.append(f"recent support tickets ({tickets:.0f})")
                        
                    if sentiment > 0.5:
                        reason_parts.append("positive sentiment")
                    elif sentiment < -0.2:
                        reason_parts.append("negative sentiment")
                    
                    if revenue > 1000:
                        reason_parts.append(f"high historical revenue (₹{revenue:.0f})")
                        
                    factors = ", ".join(reason_parts) if reason_parts else "historical baselines"
                    dynamic_reasoning = f"RandomForest ensemble predicts {actions[prediction]} with {confidence*100:.1f}% probability, driven primarily by {factors}."

                    return self._build_explainable_response(
                        decision=actions[prediction],
                        confidence=round(confidence, 2),
                        signals_used=["engagement", "orders", "revenue", "tickets", "sentiment"],
                        tier_used="Tier 2 (RandomForest ML)",
                        reasoning=dynamic_reasoning,
                        alternative_actions=["Retention Campaign" if prediction == 0 else "Do Nothing"]
                    )
            except Exception as e:
                logger.error(f"Tier 2 ML error: {e}")
        return None

    def _escalate_to_llm(self, context: Dict[str, Any], task_type: str) -> Dict[str, Any]:
        """Tier 3: Expensive, high-latency Gemini call with graceful fallback."""
        try:
            # For demonstration, we bypass the actual API key check since we are mocking the LLM output.
            # In a real setup, we would do:
            # api_key = getattr(settings, "GEMINI_API_KEY", None)
            # genai.configure(api_key=api_key)
            # model = genai.GenerativeModel('gemini-1.5-flash')
            
            return self._build_explainable_response(
                decision="Personalized Executive Apology Email",
                confidence=0.95,
                signals_used=["raw_support_transcripts", "complex_sentiment_analysis"],
                tier_used="Tier 3 (Gemini LLM)",
                reasoning="Customer expressed nuanced frustration with product longevity that standard heuristics could not classify. A personalized apology is required.",
                alternative_actions=["Schedule Support Call"]
            )
        except Exception as e:
            logger.warning(f"Tier 3 LLM Escalation Failed: {e}. Degrading to Tier 1.")
            return self._build_explainable_response(
                decision="Escalate to Human Agent",
                confidence=1.0,
                signals_used=["system_failure_fallback"],
                tier_used="Tier1-Fallback",
                reasoning="Tier 3 AI subsystem unavailable. Failsafe routing to human operator.",
                alternative_actions=["Send automated acknowledgment"]
            )

inference_router = InferenceRouter()
