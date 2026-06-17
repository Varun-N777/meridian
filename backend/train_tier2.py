import os
import sqlite3
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
logger = logging.getLogger("Tier2Trainer")

def train_tier2_model():
    logger.info("Initializing Tier 2 ML Model Training...")
    
    # We will generate a synthetic dataset representing customer states
    # Features: engagement_score, order_count, revenue, support_tickets, sentiment_score
    # Labels (Actions): 0 = Do Nothing, 1 = Retention Campaign, 2 = Upsell Campaign, 3 = VIP Support
    
    np.random.seed(42)
    n_samples = 2000
    
    # Generate features matching the DB schema ranges
    engagement_scores = np.random.uniform(0.0, 100.0, n_samples)
    order_counts = np.random.poisson(lam=5, size=n_samples)
    revenues = order_counts * np.random.uniform(100, 1000, n_samples)
    support_tickets = np.random.poisson(lam=1, size=n_samples)
    sentiment_scores = np.random.uniform(0.0, 100.0, n_samples)
    
    # Generate labels based on heuristics to train the ML model to learn the pattern
    labels = []
    for i in range(n_samples):
        # High tickets and low happiness -> VIP Support
        if support_tickets[i] >= 2 and sentiment_scores[i] < 40.0:
            labels.append(3) # VIP Support
        # Low engagement, low orders -> Retention Campaign
        elif engagement_scores[i] < 40.0 and order_counts[i] <= 3:
            labels.append(1) # Retention Campaign
        # High engagement, high revenue -> Upsell Campaign
        elif engagement_scores[i] > 70.0 and revenues[i] > 2000:
            labels.append(2) # Upsell Campaign
        # Otherwise -> Do Nothing
        else:
            labels.append(0) # Do Nothing
            
    df = pd.DataFrame({
        "engagement_score": engagement_scores,
        "order_count": order_counts,
        "revenue": revenues,
        "support_tickets": support_tickets,
        "sentiment_score": sentiment_scores,
        "action": labels
    })
    
    X = df.drop("action", axis=1)
    y = df["action"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    logger.info(f"Training RandomForestClassifier on {len(X_train)} samples...")
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    logger.info(f"Model Training Complete. Accuracy: {accuracy:.4f}")
    
    # Save the model
    model_path = os.path.join(os.path.dirname(__file__), "tier2_model.pkl")
    joblib.dump(model, model_path)
    logger.info(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_tier2_model()
