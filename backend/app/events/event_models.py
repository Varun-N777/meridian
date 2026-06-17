from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

class BaseEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    customer_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    payload: Dict[str, Any] = Field(default_factory=dict)
    
class LoginEvent(BaseEvent):
    event_type: str = "login"

class PurchaseEvent(BaseEvent):
    event_type: str = "purchase"

class CartAbandonmentEvent(BaseEvent):
    event_type: str = "cart_abandonment"

class SupportTicketEvent(BaseEvent):
    event_type: str = "support_ticket"

class CampaignInteractionEvent(BaseEvent):
    event_type: str = "campaign_interaction"

class InactivityThresholdCrossedEvent(BaseEvent):
    event_type: str = "inactivity_threshold_crossed"

class ProductBrowsingEvent(BaseEvent):
    event_type: str = "product_browsing"

class OrderCompletionEvent(BaseEvent):
    event_type: str = "order_completion"
