"""Unit tests for Predictive Churn Risk & Sentiment Trajectory Engine."""
from backend.core.churn_predictor import calculate_churn_risk


def test_high_risk_enterprise_churn_score():
    res = calculate_churn_risk(
        customer_tier="enterprise",
        urgency="HOT",
        body="I am frustrated and canceling my subscription, switching to a competitor immediately!"
    )
    assert res["churn_risk_score"] >= 70.0
    assert res["churn_risk_level"] == "HIGH_RISK"


def test_low_risk_standard_churn_score():
    res = calculate_churn_risk(
        customer_tier="standard",
        urgency="COLD",
        body="How do I change my profile photo?"
    )
    assert res["churn_risk_score"] < 40.0
    assert res["churn_risk_level"] == "LOW_RISK"
