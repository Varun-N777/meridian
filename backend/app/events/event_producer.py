import json
import logging
import redis
from typing import Dict, Any
from app.events.event_models import BaseEvent
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class EventProducer:
    def __init__(self):
        try:
            self.redis_client = redis.Redis.from_url(
                getattr(settings, "REDIS_URL", "redis://localhost:6379/0"),
                decode_responses=True
            )
            # Test connection
            self.redis_client.ping()
            self.enabled = True
            logger.info("Meridian EventProducer connected to Redis.")
        except Exception as e:
            logger.warning(f"Meridian EventProducer failed to connect to Redis. Events will not be broadcasted. Error: {e}")
            self.enabled = False

    def publish_event(self, event: BaseEvent) -> bool:
        if not self.enabled:
            return False
            
        try:
            event_dict = event.dict()
            # Convert datetime to ISO string
            event_dict['timestamp'] = event_dict['timestamp'].isoformat()
            
            # Redis streams require mapping of strings
            stream_data = {
                "event_id": event_dict["event_id"],
                "event_type": event_dict["event_type"],
                "customer_id": event_dict["customer_id"],
                "timestamp": event_dict["timestamp"],
                "payload": json.dumps(event_dict["payload"])
            }
            
            self.redis_client.xadd("meridian_events", stream_data)
            logger.debug(f"Published event {event.event_type} to meridian_events stream")
            return True
        except Exception as e:
            logger.error(f"Failed to publish event {event.event_type}: {e}")
            return False

# Singleton instance
producer = EventProducer()

def publish(event: BaseEvent):
    return producer.publish_event(event)
