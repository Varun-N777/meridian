import logging
from datetime import datetime
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class CustomerStateEngine:
    """Persistent customer lifecycle engine."""
    
    STATES = ["NEW", "ACTIVE", "ENGAGED", "LOYAL", "AT_RISK", "DORMANT", "RECOVERING", "CHAMPION"]
    
    def __init__(self):
        # In a real app, this would query the DB. We'll use a local dictionary for simulation.
        self._states: Dict[str, Dict[str, Any]] = {}
        logger.info("Meridian CustomerStateEngine initialized.")

    def get_state(self, customer_id: str) -> Dict[str, Any]:
        """Get the current state of a customer."""
        if customer_id not in self._states:
            self._states[customer_id] = {
                "current_state": "NEW",
                "state_confidence": 1.0,
                "state_history": [{"state": "NEW", "timestamp": datetime.utcnow().isoformat(), "reason": "initialization"}]
            }
        return self._states[customer_id]

    def _transition_state(self, customer_id: str, new_state: str, confidence: float, reason: str):
        """Internal method to transition a customer to a new state."""
        if new_state not in self.STATES:
            logger.error(f"Invalid state: {new_state}")
            return
            
        current = self.get_state(customer_id)
        if current["current_state"] != new_state:
            logger.info(f"Customer {customer_id} transitioning from {current['current_state']} to {new_state} (Reason: {reason})")
            
            # Update history
            current["state_history"].append({
                "state": new_state,
                "timestamp": datetime.utcnow().isoformat(),
                "reason": reason
            })
            
            # Keep history bounded
            if len(current["state_history"]) > 10:
                current["state_history"].pop(0)
                
            current["current_state"] = new_state
            current["state_confidence"] = confidence
            
            # Phase 5: Trigger journey adaptation
            try:
                from app.orchestration.journey_engine import journey_engine
                journey_engine.adapt_to_state_change(customer_id, current['current_state'], new_state)
            except ImportError:
                pass

    def process_event(self, event_data: Dict[str, Any]):
        """Evaluate events and update customer state accordingly."""
        event_type = event_data.get("event_type")
        customer_id = event_data.get("customer_id")
        
        current_state = self.get_state(customer_id)["current_state"]
        
        # Simple heuristics for state transition based on events
        if event_type == "purchase":
            if current_state in ["NEW", "ACTIVE", "RECOVERING"]:
                self._transition_state(customer_id, "ENGAGED", 0.85, "Purchase activity detected")
            elif current_state == "ENGAGED":
                self._transition_state(customer_id, "LOYAL", 0.90, "Repeated purchase activity")
                
        elif event_type == "support_ticket":
            # Just an example heuristic: Support tickets could mean risk if unresolved
            if current_state in ["LOYAL", "CHAMPION"]:
                # Drop them to engaged temporarily until ticket resolved
                self._transition_state(customer_id, "ENGAGED", 0.70, "Support ticket opened")
                
        elif event_type == "campaign_interaction":
            if current_state == "DORMANT":
                self._transition_state(customer_id, "RECOVERING", 0.80, "Interacted with win-back campaign")

state_engine = CustomerStateEngine()
