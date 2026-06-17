import asyncio
import logging
from app.websocket.manager import manager
from app.routers.metrics import get_pipeline_metrics, get_ai_efficiency

logger = logging.getLogger(__name__)

async def metrics_broadcaster_task():
    """Background task to broadcast metrics to all connected websocket clients."""
    logger.info("Metrics Broadcaster Started.")
    while True:
        try:
            # Check if there are active connections in 'admin' or 'global'
            has_connections = manager.connection_count > 0
            
            if has_connections:
                # Fetch metrics
                pipeline_data = get_pipeline_metrics()
                ai_data = get_ai_efficiency()
                
                # Broadcast payload
                payload = {
                    "pipeline": pipeline_data,
                    "ai_efficiency": ai_data
                }
                
                await manager.broadcast_event("metrics_update", payload)
            
        except asyncio.CancelledError:
            logger.info("Metrics Broadcaster Stopped.")
            break
        except Exception as e:
            logger.error(f"Error in Metrics Broadcaster: {e}")
            
        # Push every 2 seconds
        await asyncio.sleep(2)
