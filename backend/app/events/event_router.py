import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def route_event(event_data: Dict[str, Any]):
    """Route parsed event data to the appropriate intelligence services."""
    event_type = event_data.get("event_type")
    customer_id = event_data.get("customer_id")
    
    logger.info(f"Routing event: {event_type} for customer {customer_id}")
    
    # Lazy imports to avoid circular dependencies
    try:
        from app.intelligence.customer_state import state_engine
        from app.orchestration.journey_engine import journey_engine
    except ImportError:
        logger.warning("Intelligence modules not fully implemented yet. Event dropped.")
        return
        
    # Phase 2: Update Customer State Engine
    if event_type in ["purchase", "login", "campaign_interaction", "support_ticket", "order_completion"]:
        state_engine.process_event(event_data)
        
    # Phase 5: Trigger Journey Engine
    if event_type in ["cart_abandonment", "inactivity_threshold_crossed", "support_ticket"]:
        journey_engine.evaluate_triggers(event_data)
