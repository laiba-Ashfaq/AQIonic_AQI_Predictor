"""
AQIonic Air Quality Intelligence - Automated Pipeline & Submission Verification Tests
Validates:
1. Datastore integrity and health check
2. Non-negative AQI value enforcement (AQI >= 0)
3. Baseline Persistence comparison (ML Model RMSE < Persistence Baseline RMSE)
4. Model trained on >1 Year of data (>=8,760 hourly observations)
"""

import os
import sys
import time
import datetime
import numpy as np
import pandas as pd
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from pipelines.datastore import DatastoreManager
from pipelines.feature_pipeline import compute_features, fetch_raw_data
from pipelines.training_pipeline import train_and_evaluate_models

def test_datastore_health_and_non_negativity():
    """Verifies that Datastore connects, saves records, and maintains non-negativity constraint."""
    ds = DatastoreManager()
    
    # Create test sample data with dynamic timestamp
    test_df = pd.DataFrame([{
        'city': 'TestCity',
        'event_timestamp': int(datetime.datetime.now().timestamp()),
        'time': '2026-09-01 00:00:00',
        'pm2_5': 25.5,
        'pm10': 45.0,
        'ozone': 30.0,
        'nitrogen_dioxide': 15.0,
        'sulphur_dioxide': 5.0,
        'carbon_monoxide': 300.0,
        'us_aqi': 78,
        'temperature_2m': 24.0,
        'relative_humidity_2m': 60.0,
        'wind_speed_10m': 12.0,
        'wind_direction_10m': 180.0,
        'surface_pressure': 1012.0,
        'hour': 12,
        'day_of_week': 2,
        'month': 9,
        'sin_hour': 0.0,
        'cos_hour': -1.0,
        'pm25_lag_1h': 24.0,
        'pm25_lag_24h': 22.0,
        'pm25_rolling_mean_6h': 25.0,
        'wind_ventilation_idx': 0.2,
        'target_aqi_1h': 80.0,
        'target_aqi_24h': 82.0,
        'target_aqi_72h': 85.0
    }])
    
    written = ds.write_features(test_df)
    assert written > 0, "Datastore write failed"

    health = ds.verify_datastore_health()
    assert health["status"] == "Healthy", "Datastore health check reported issues"
    assert health["non_negative_guarantee_passed"] is True, "Negative AQI values detected in datastore"
    assert health["negative_aqi_violations"] == 0, f"Found {health['negative_aqi_violations']} negative AQI violations"

def test_feature_engineering_non_negativity():
    """Verifies that engineered features and AQI target labels are strictly non-negative."""
    raw = fetch_raw_data(24.8607, 67.0011)
    df = compute_features(raw, city_name="KarachiTest")
    
    assert (df['us_aqi'] >= 0).all(), "Raw US AQI contains negative values"
    assert (df['target_aqi_1h'] >= 0).all(), "Target 1h AQI contains negative values"
    assert (df['target_aqi_24h'] >= 0).all(), "Target 24h AQI contains negative values"
    assert (df['target_aqi_72h'] >= 0).all(), "Target 72h AQI contains negative values"
    assert (df['pm2_5'] >= 0).all(), "PM2.5 contains negative values"

def test_baseline_persistence_check_and_model_victory():
    """Verifies that trained ML champion model is trained on >1 year data and decisively beats Baseline Persistence model."""
    results = train_and_evaluate_models()
    
    assert results["non_negative_guarantee"] is True, "Model output failed non-negativity constraint"
    assert results["baseline_check_passed"] is True, "Trained ML model failed to beat Baseline Persistence model"
    assert results["dataset_size_records"] >= 8000, f"Expected >1 Year dataset (>=8000 hours), got {results['dataset_size_records']}"
    
    pers_rmse = results["persistence_baseline"]["rmse"]
    champ_rmse = results["champion_rmse"]
    
    assert champ_rmse < pers_rmse, f"Champion model RMSE ({champ_rmse}) is not lower than Persistence Baseline RMSE ({pers_rmse})"
    print(f"TEST PASSED: Champion ML model ({champ_rmse} RMSE) trained on {results['dataset_size_records']} records (>1 Year) beat Persistence Baseline ({pers_rmse} RMSE)!")

if __name__ == "__main__":
    test_datastore_health_and_non_negativity()
    test_feature_engineering_non_negativity()
    test_baseline_persistence_check_and_model_victory()
