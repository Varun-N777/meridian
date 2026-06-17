from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any

from app.database.connection import get_db
from app.intelligence.ipc_engine import ipc_engine

router = APIRouter()

class IPCRequest(BaseModel):
    type: str
    payload: Dict[str, Any]

@router.post("/route")
def route_intelligence(request: IPCRequest, db: Session = Depends(get_db)):
    """
    Unified entry point for all Meridian Intelligence operations.
    The IPC Engine intercepts the request, routes it through Tier 1/2/3,
    and returns a standardized response schema.
    """
    return ipc_engine.route(
        request_type=request.type,
        payload=request.payload,
        db=db
    )
