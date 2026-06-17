import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
import time
import uuid
from app.intelligence.inference_router import inference_router
from app.intelligence.memory.memory_engine import memory_engine
from app.intelligence.counterfactual.counterfactual_engine import counterfactual_engine
from app.intelligence.efficiency.efficiency_engine import efficiency_engine

logger = logging.getLogger(__name__)

class IPCEngine:
    """
    Central Intelligence Kernel for OmniPulse AI.
    All feature modules MUST route requests through this engine.
    """
    
    def __init__(self):
        logger.info("Meridian IPC Engine initialized as Central Kernel.")
        
    def route(self, request_type: str, payload: Dict[str, Any], db: Session = None) -> Dict[str, Any]:
        """
        Universal entry point for all intelligence operations.
        Now includes Self-Improving Memory, Counterfactual Simulation, and Efficiency Scoring.
        """
        logger.info(f"IPC Engine routing request: {request_type}")
        req_id = str(uuid.uuid4())
        start_time = time.time()
        
        # 1. Counterfactual Simulation (What if?)
        counterfactuals = counterfactual_engine.simulate_alternatives(request_type, payload, db)
        
        # 2. Main Intelligence Inference (The Decision)
        if request_type == "next_best_action":
            response = self._handle_nba(payload, db)
        elif request_type == "customer_intelligence":
            response = self._handle_customer_intelligence(payload, db)
        elif request_type == "churn_prediction":
            response = self._handle_churn_prediction(payload, db)
        elif request_type == "digital_twin":
            response = self._handle_digital_twin(payload, db)
        elif request_type == "executive_summary":
            response = self._handle_executive_summary(payload, db)
        else:
            response = self._build_standard_response(
                tier_used="Tier 1 (Rules)",
                result={"error": f"Unknown request type: {request_type}"},
                confidence=1.0,
                explanation="Failsafe catch for unknown route.",
                cost_saved=True
            )
            
        # 3. Inject Counterfactuals into final response
        response["counterfactuals"] = counterfactuals
        
        # 4. Measure Efficiency (Compute vs Value)
        latency_ms = (time.time() - start_time) * 1000
        # Estimate business value based on confidence and counterfactual baseline expected value
        business_value = counterfactuals.get("recommended", {}).get("expected_value", 50.0)
        
        if db:
            efficiency_score = efficiency_engine.score_decision(
                db=db,
                request_id=req_id,
                tier=response.get("tier_used", "Tier 1"),
                latency_ms=latency_ms,
                business_value=business_value
            )
            response["decision_compression_score"] = efficiency_score
            
            # 5. Store in Decision Memory
            customer_id = payload.get("customer_id", "unknown")
            memory_engine.store_decision(
                db=db,
                request_id=req_id,
                customer_id=customer_id,
                feature=request_type,
                decision=response.get("result", {}),
                tier_used=response.get("tier_used", "Tier 1"),
                confidence=response.get("confidence", 0.0),
                expected_outcome=counterfactuals.get("recommended", {})
            )
            
        return response

    def _build_standard_response(self, tier_used: str, result: Any, confidence: float, explanation: str, cost_saved: bool) -> Dict[str, Any]:
        return {
            "tier_used": tier_used,
            "result": result,
            "confidence": round(confidence, 2),
            "explanation": explanation,
            "cost_saved": cost_saved
        }

    # =========================================================================
    # HANDLERS
    # =========================================================================

    def _handle_nba(self, payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
        customer_id = payload.get("customer_id")
        
        # Build context from db for the InferenceRouter
        from app.models.models import CustomerProfile, Customer
        profile = db.query(CustomerProfile).filter(CustomerProfile.customer_id == customer_id).first()
        customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
        
        if not profile or not customer:
            return self._build_standard_response("Tier 1 (Rules)", {"error": "Customer not found"}, 1.0, "Missing data", True)
            
        context = {
            "state": profile.segment,
            "engagement_score": profile.engagement_score or 50.0,
            "order_count": profile.frequency or 0,
            "revenue": profile.monetary or 0.0,
            "support_tickets": customer.tickets.count() if hasattr(customer.tickets, "count") else 0,
            "sentiment_score": profile.happiness_score or 50.0,
            "churn_probability": profile.churn_probability or 0.0
        }
        
        # Delegate to InferenceRouter
        decision = inference_router.evaluate(context, "next_best_action")
        
        # Inject customer metrics so the frontend can display them in the NBA Center
        if isinstance(decision, dict):
            decision["customer_churn"] = profile.churn_probability or 0.0
            decision["customer_trust"] = profile.trust_score or 50.0
            decision["customer_engagement"] = profile.engagement_score or 50.0
            decision["customer_clv"] = profile.clv or 0.0
        
        return self._build_standard_response(
            tier_used=decision.get("tier_used", "Tier 1-Fallback") if isinstance(decision, dict) else "Tier 1-Fallback",
            result=decision,
            confidence=decision.get("confidence", 1.0) if isinstance(decision, dict) else 1.0,
            explanation=decision.get("reasoning", "No decision found") if isinstance(decision, dict) else "No decision found",
            cost_saved=not (isinstance(decision, dict) and "Gemini" in decision.get("tier_used", ""))
        )

    def _handle_customer_intelligence(self, payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
        customer_id = payload.get("customer_id")
        
        from app.models.models import Customer
        from app.services.realtime_ai import (
            compute_churn, compute_clv, compute_trust, compute_happiness,
            compute_risk, compute_nba, compute_campaign, compute_digital_twin,
            compute_executive_insights
        )
        
        customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
        if not customer:
            return self._build_standard_response("Tier 1", {"error": "Not found"}, 1.0, "", True)
            
        churn = compute_churn(customer_id, db)
        clv = compute_clv(customer_id, db)
        trust = compute_trust(customer_id, db)
        happiness = compute_happiness(customer_id, db, churn["churn_probability"], trust["trust_score"])
        risk = compute_risk(customer_id, db, churn, trust, clv)
        nba = compute_nba(customer_id, db, churn)
        campaign = compute_campaign(customer_id, db, churn, trust, happiness)
        twin = compute_digital_twin(customer_id, db, churn, clv, trust, nba)
        
        all_scores = {"churn": churn, "clv": clv, "trust": trust, "happiness": happiness, "risk": risk, "nba": nba, "campaign": campaign, "digital_twin": twin}
        exec_insights = compute_executive_insights(customer_id, db, all_scores)
        
        result = {
            "customer_id": customer_id,
            "customer_name": f"{customer.first_name} {customer.last_name}",
            "churn": churn,
            "clv": clv,
            "trust": trust,
            "happiness": happiness,
            "risk": risk,
            "nba": nba,
            "campaign": campaign,
            "digital_twin": twin,
            "executive_insights": exec_insights,
        }
        
        return self._build_standard_response(
            tier_used="Tier 2 (Ensemble ML/Rules)",
            result=result,
            confidence=0.92,
            explanation="Orchestrated 8 distinct intelligence models using fast Tier 2 execution.",
            cost_saved=True
        )

    def _handle_churn_prediction(self, payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
        # Example of a localized request
        customer_id = payload.get("customer_id")
        from app.services.realtime_ai import compute_churn
        result = compute_churn(customer_id, db)
        return self._build_standard_response(
            tier_used="Tier 2 (ML Heuristics)",
            result=result,
            confidence=0.88,
            explanation="Churn computed via localized statistical analysis.",
            cost_saved=True
        )
        
    def _handle_digital_twin(self, payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
        from app.routers.ai_router import simulate_twin
        from app.routers.ai_router import TwinSimRequest
        req = TwinSimRequest(customer_id=payload.get("customer_id"), intervention=payload.get("intervention"))
        result = simulate_twin(req, db)
        return self._build_standard_response(
            tier_used="Tier 2 (Simulation Matrix)",
            result=result,
            confidence=0.91,
            explanation="Digital Twin simulated successfully using deterministic heuristics.",
            cost_saved=True
        )
        
    def _handle_executive_summary(self, payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
        from app.routers.ai_router import executive_summary
        result = executive_summary(db)
        return self._build_standard_response(
            tier_used="Tier 3 (Gemini LLM) / Tier 1 Cache",
            result=result,
            confidence=0.95,
            explanation="Executive summary compiled using aggregated insights and LLM generation.",
            cost_saved=False # Requires LLM usually
        )

ipc_engine = IPCEngine()
