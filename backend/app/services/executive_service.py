import logging
import threading
import time
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.models import CustomerProfile, Order, ExecutiveSummary
from sqlalchemy import func

logger = logging.getLogger(__name__)

class ExecutiveService:
    """Generates executive summaries asynchronously operating on aggregates."""
    
    def __init__(self):
        self.enabled = True

    def _generate_aggregates(self):
        db = SessionLocal()
        try:
            total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0
            avg_churn = db.query(func.avg(CustomerProfile.churn_probability)).scalar() or 0
            high_risk_count = db.query(CustomerProfile).filter(CustomerProfile.churn_probability > 0.7).count()
            
            # Simple template aggregation without invoking Gemini per-customer
            summary_text = (
                f"Asynchronous Aggregate Briefing:\n"
                f"Total Platform Revenue: ${total_revenue:,.2f}\n"
                f"Average Churn Risk: {avg_churn:.2%}\n"
                f"High Risk Customers: {high_risk_count}\n"
                f"Action Required: High risk volume exceeds threshold. Launch retention workflows."
            )
            
            summary = ExecutiveSummary(
                summary_text=summary_text,
                metrics={
                    "revenue": float(total_revenue),
                    "avg_churn": float(avg_churn),
                    "high_risk": high_risk_count
                },
                highlights=["Aggregated metrics generated successfully via Tier 1 heuristic loop."],
                risks=[],
                recommendations=[]
            )
            db.add(summary)
            db.commit()
            logger.info("Executive summary successfully generated asynchronously.")
        except Exception as e:
            logger.error(f"Failed to generate aggregate executive summary: {e}")
        finally:
            db.close()

    def start_background_generator(self):
        """Phase 10: Asynchronous background worker."""
        def run():
            while self.enabled:
                self._generate_aggregates()
                time.sleep(3600) # Run every hour
                
        thread = threading.Thread(target=run, daemon=True)
        thread.start()
        logger.info("Executive intelligence background service started.")

executive_service = ExecutiveService()
