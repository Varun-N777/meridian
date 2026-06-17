import time
import random
import uuid
import logging
from typing import List, Dict, Any
from app.events.event_models import BaseEvent
from app.events.event_router import route_event
from app.intelligence.inference_router import inference_router

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger("MeridianSimulator")

EVENT_TYPES = ["login", "product_browsing", "purchase", "support_ticket", "cart_abandonment", "review_submitted"]
SENTIMENTS = ["happy", "neutral", "frustrated", "angry", "confused", "nuanced"]
STATES = ["NEW", "ENGAGED", "AT_RISK", "CHURNED", "UNKNOWN"]
CHURN_BANDS = ["Low", "Medium", "High", "Critical", "Unknown"]

def generate_random_event(customer_id: str) -> Dict[str, Any]:
    event_type = random.choice(EVENT_TYPES)
    payload = {}
    
    if event_type == "purchase":
        payload = {"amount": random.randint(100, 5000), "item": "Random Product"}
    elif event_type == "cart_abandonment":
        payload = {"amount": random.randint(50, 2000), "items": ["Item A", "Item B"]}
    elif event_type == "support_ticket":
        payload = {"issue": "General Query", "sentiment": random.choice(SENTIMENTS)}
    elif event_type == "product_browsing":
        payload = {"category": random.choice(["electronics", "clothing", "home", "toys"])}
    else:
        payload = {"device": random.choice(["mobile", "desktop", "tablet"])}
        
    return {
        "event_type": event_type,
        "payload": payload,
        "customer_id": customer_id
    }

def generate_random_context() -> Dict[str, Any]:
    """Generates random context for the inference engine."""
    state = random.choice(STATES)
    # If state is unknown, it forces Tier 3 LLM
    engagement_score = random.uniform(0.1, 1.0) if state != "UNKNOWN" else random.uniform(0.3, 0.7)
    
    context = {
        "state": state,
        "engagement_score": round(engagement_score, 2),
        "churn_band": random.choice(CHURN_BANDS),
        "sentiment_category": random.choice(SENTIMENTS),
        "complex_signal": state == "UNKNOWN" # Trigger Tier 3 LLM if complex
    }
    
    # Introduce deliberate duplicates sometimes to trigger Tier 1 Cache
    if random.random() > 0.6:
        # 40% chance of being identical to a "standard playbook" to trigger cache
        context = {
            "state": "AT_RISK",
            "engagement_score": 0.2,
            "churn_band": "High",
            "sentiment_category": "angry",
            "complex_signal": False
        }
        
    return context

def run_continuous_simulation():
    logger.info("--- Starting Meridian Continuous Traffic Simulation ---")
    logger.info("Press Ctrl+C to stop.")
    
    # Keep track of a few active customer IDs
    active_customers = [str(uuid.uuid4()) for _ in range(10)]
    
    try:
        while True:
            # 1. Pick a random customer
            customer_id = random.choice(active_customers)
            
            # 2. Fire 1-3 random events
            num_events = random.randint(1, 3)
            for _ in range(num_events):
                event_data = generate_random_event(customer_id)
                logger.info(f"[EVENT] 🧍 {customer_id[:8]}... triggered {event_data['event_type']}")
                event = BaseEvent(
                    event_type=event_data["event_type"],
                    customer_id=event_data["customer_id"],
                    payload=event_data["payload"]
                )
                route_event(event.dict())
                time.sleep(random.uniform(0.1, 0.5))
            
            # 3. Periodically run Inference (NBA or Sentiment)
            if random.random() > 0.3: # 70% chance to request an NBA decision
                context = generate_random_context()
                logger.info(f"[INFERENCE] Requesting decision for context: State={context['state']}, Churn={context['churn_band']}")
                
                decision = inference_router.evaluate(context, "next_best_action")
                tier = decision.get("tier_used", "Unknown")
                action = decision.get("decision", "No Action")
                
                # Visual indicators for logs
                icon = "⚡" if "Tier 1" in tier else ("🧠" if "Tier 2" in tier else "💎")
                logger.info(f"{icon} [DECISION] Routed via {tier}: {action}")
            
            # 4. Wait before next batch of traffic to simulate organic flow
            sleep_time = random.uniform(0.5, 2.0)
            time.sleep(sleep_time)
            
            # 5. Occasionally rotate customers
            if random.random() > 0.9:
                active_customers.pop(0)
                active_customers.append(str(uuid.uuid4()))
                
    except KeyboardInterrupt:
        logger.info("\n--- Simulation Stopped by User ---")

if __name__ == "__main__":
    run_continuous_simulation()
