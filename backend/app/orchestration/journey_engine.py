import logging
from typing import Dict, Any
from app.orchestration.workflow_engine import workflow_engine

logger = logging.getLogger(__name__)

class JourneyEngine:
    """Dynamic customer journey generator based on state transitions."""
    
    def __init__(self):
        logger.info("Meridian JourneyEngine initialized.")
        
    def evaluate_triggers(self, event_data: Dict[str, Any]):
        """React to specific events by altering or triggering journeys."""
        event_type = event_data.get("event_type")
        customer_id = event_data.get("customer_id")
        
        if event_type == "cart_abandonment":
            workflow_engine.trigger_workflow("abandoned_cart_recovery", customer_id, event_data)
        elif event_type == "support_ticket":
            workflow_engine.trigger_workflow("high_priority_support", customer_id, event_data)

    def adapt_to_state_change(self, customer_id: str, old_state: str, new_state: str):
        """When CustomerStateEngine transitions a user, trigger workflows."""
        logger.info(f"Journey adapting to state change for {customer_id}: {old_state} -> {new_state}")
        
        if new_state == "AT_RISK":
            workflow_engine.trigger_workflow("retention_workflow", customer_id, {"state": new_state})
        elif new_state == "CHAMPION":
            workflow_engine.trigger_workflow("loyalty_reward_workflow", customer_id, {"state": new_state})

journey_engine = JourneyEngine()
