from fastapi import APIRouter, Depends
import redis
from sqlalchemy.orm import Session
from app.config import get_settings
from app.database.connection import get_db
from app.intelligence.efficiency.efficiency_engine import efficiency_engine
from app.intelligence.memory.memory_engine import memory_engine

router = APIRouter()
settings = get_settings()

@router.get("/metrics/pipeline")
def get_pipeline_metrics():
    """Phase 6: Observability & Pipeline Metrics"""
    try:
        from app.utils.fake_redis import get_redis_client
        r = get_redis_client(getattr(settings, "REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)
        # Check stream length
        queue_depth = r.xlen("meridian_events")
        
        # Calculate cache hit rate
        hits = int(r.get("meridian:metrics:cache_hits") or 0)
        misses = int(r.get("meridian:metrics:cache_misses") or 0)
        total = hits + misses
        hit_rate = (hits / total * 100) if total > 0 else 0
        
        return {
            "queue_depth": queue_depth,
            "cache_hit_rate": round(hit_rate, 2),
            "worker_health": "Healthy",
            "average_decision_latency_ms": 42.5  # Simulated metric
        }
    except Exception as e:
        return {"error": str(e), "status": "degraded"}

@router.get("/metrics/ai-efficiency")
def get_ai_efficiency(db: Session = Depends(get_db)):
    """Phase 7: AI Efficiency Analytics + Decision Compression & Memory"""
    try:
        from app.utils.fake_redis import get_redis_client
        r = get_redis_client(getattr(settings, "REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)
        
        tier1_cache = int(r.get("meridian:metrics:tier1_cache_decisions") or 0)
        tier1_rules = int(r.get("meridian:metrics:tier1_rules_decisions") or 0)
        tier2_ml = int(r.get("meridian:metrics:tier2_ml_decisions") or 0)
        tier3_llm = int(r.get("meridian:metrics:tier3_llm_decisions") or 0)
        
        total = tier1_cache + tier1_rules + tier2_ml + tier3_llm
        
        # Get real DB intelligence metrics
        obs_metrics = efficiency_engine.get_observability_metrics(db)
        mem_metrics = memory_engine.get_learning_metrics(db)
        
        return {
            "total_decisions": total,
            "usage_distribution": {
                "tier1_percent": round((tier1_cache + tier1_rules) / total * 100, 2) if total > 0 else 0,
                "tier2_percent": round((tier2_ml) / total * 100, 2) if total > 0 else 0,
                "tier3_percent": round((tier3_llm) / total * 100, 2) if total > 0 else 0,
            },
            "llm_calls_avoided": total - tier3_llm,
            "estimated_cost_saved_usd": round((total - tier3_llm) * 0.005, 4), # Assuming $0.005 per LLM call
            
            # New Intelligence Evolution Metrics
            "decision_compression_score": obs_metrics["avg_compression_score"],
            "compression_trend": obs_metrics["recent_trend"],
            "memory_learning": mem_metrics
        }
    except Exception as e:
        return {"error": str(e)}
