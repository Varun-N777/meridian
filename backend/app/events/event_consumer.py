import json
import logging
import redis
import time
import threading
from typing import Dict, Any
from app.config import get_settings
from app.events.event_router import route_event

logger = logging.getLogger(__name__)
settings = get_settings()

class EventConsumer:
    def __init__(self, group_name="meridian_processors", consumer_name="worker-1"):
        self.stream_name = "meridian_events"
        self.group_name = group_name
        self.consumer_name = consumer_name
        
        try:
            self.redis_client = redis.Redis.from_url(
                getattr(settings, "REDIS_URL", "redis://localhost:6379/0"),
                decode_responses=True
            )
            
            # Create consumer group if it doesn't exist
            try:
                self.redis_client.xgroup_create(self.stream_name, self.group_name, id='0', mkstream=True)
            except redis.exceptions.ResponseError as e:
                if "BUSYGROUP Consumer Group name already exists" not in str(e):
                    raise e
                    
            self.enabled = True
            logger.info(f"Meridian EventConsumer initialized on group {self.group_name}")
        except Exception as e:
            logger.warning(f"Meridian EventConsumer failed to connect to Redis. Error: {e}")
            self.enabled = False

    def consume_loop(self):
        """Runs continuously to consume events."""
        if not self.enabled:
            return
            
        logger.info("Starting to consume meridian_events...")
        while True:
            try:
                # Read new events for this consumer group (block for 2 seconds)
                messages = self.redis_client.xreadgroup(
                    self.group_name, 
                    self.consumer_name, 
                    {self.stream_name: '>'}, 
                    count=10, 
                    block=2000
                )
                
                for stream, msgs in messages:
                    for msg_id, msg_data in msgs:
                        try:
                            # Parse message
                            event_data = {
                                "event_id": msg_data.get("event_id"),
                                "event_type": msg_data.get("event_type"),
                                "customer_id": msg_data.get("customer_id"),
                                "timestamp": msg_data.get("timestamp"),
                                "payload": json.loads(msg_data.get("payload", "{}"))
                            }
                            
                            # Route the event to intelligent services
                            route_event(event_data)
                            
                            # Acknowledge the message
                            self.redis_client.xack(self.stream_name, self.group_name, msg_id)
                        except Exception as inner_e:
                            logger.error(f"Error processing message {msg_id}: {inner_e}")
                            
            except Exception as e:
                logger.error(f"Error in consumer loop: {e}")
                time.sleep(5) # Backoff

    def start_background(self):
        """Starts consumer in a background thread."""
        if self.enabled:
            thread = threading.Thread(target=self.consume_loop, daemon=True)
            thread.start()
            logger.info("Event consumer background thread started.")

consumer = EventConsumer()
