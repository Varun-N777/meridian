import json
import hashlib
import redis
import logging
from typing import Dict, Any, Optional
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class DecisionCache:
    """Redis-backed semantic cache for intelligence decisions."""
    
    def __init__(self):
        try:
            from app.utils.fake_redis import get_redis_client
            self.redis_client = get_redis_client(
                getattr(settings, "REDIS_URL", "redis://localhost:6379/0"),
                decode_responses=True
            )
            self.enabled = True
        except Exception as e:
            logger.warning(f"Meridian DecisionCache failed to initialize fallback. {e}")
            self.enabled = False

    def _generate_cache_key(self, context: Dict[str, Any]) -> str:
        """Generate a deterministic hash based on semantic criteria."""
        # We only care about specific fields for similarity
        # We only care about specific fields for similarity, bucketed to create semantic groupings
        semantic_key = {
            "state": context.get("state", ""),
            "churn_bucket": round(float(context.get("churn_probability", 0.0)), 1),
            "sentiment_bucket": round(float(context.get("sentiment_score", 0.0)) / 10.0) * 10,
            "engagement_bucket": round(float(context.get("engagement_score", 0.0)) / 10.0) * 10,
            "support_tickets": int(context.get("support_tickets", 0))
        }
        
        # Sort keys to ensure deterministic JSON string
        json_str = json.dumps(semantic_key, sort_keys=True)
        return f"meridian:decision:{hashlib.md5(json_str.encode()).hexdigest()}"

    def get_decision(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Look up a past successful intervention."""
        if not self.enabled:
            return None
            
        key = self._generate_cache_key(context)
        try:
            cached = self.redis_client.get(key)
            if cached:
                # Increment cache hit metric
                self.redis_client.incr("meridian:metrics:cache_hits")
                decision = json.loads(cached)
                logger.debug(f"Decision cache HIT for key {key}")
                return decision
                
            self.redis_client.incr("meridian:metrics:cache_misses")
            logger.debug(f"Decision cache MISS for key {key}")
            return None
        except Exception as e:
            logger.error(f"Error accessing decision cache: {e}")
            return None

    def store_decision(self, context: Dict[str, Any], decision: Dict[str, Any], ttl_seconds: int = 86400):
        """Store a successful decision in the cache."""
        if not self.enabled:
            return
            
        key = self._generate_cache_key(context)
        try:
            # Tag decision with cache source flag for future lookups
            decision["source"] = "tier_1_cache"
            self.redis_client.setex(key, ttl_seconds, json.dumps(decision))
            logger.debug(f"Stored decision in cache for key {key}")
        except Exception as e:
            logger.error(f"Error storing decision in cache: {e}")

decision_cache = DecisionCache()
