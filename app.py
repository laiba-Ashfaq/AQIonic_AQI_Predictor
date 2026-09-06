"""
AQIonic Air Quality Intelligence - Flask REST API Backend
Provides endpoints for:
- Live 3-Day Forecast & Current AQI
- Model Metrics & Baseline Persistence Comparison
- Datastore Health & Integrity Check
- Manual Pipeline Triggers (Feature Ingestion & Retraining)
"""

import os
import sys
from flask import Flask, jsonify, request

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from pipelines.datastore import DatastoreManager
from pipelines.feature_pipeline import run_hourly_feature_pipeline
from pipelines.training_pipeline import train_and_evaluate_models

app = Flask(__name__)

@app.route("/api/health", methods=["GET"])
def health_check():
    ds = DatastoreManager()
    status = ds.verify_datastore_health()
    return jsonify({
        "service": "AQIonic REST API",
        "status": "Online",
        "datastore": status
    })

@app.route("/api/forecast", methods=["GET"])
def get_forecast():
    city = request.args.get("city", "Karachi")
    lat = float(request.args.get("lat", 24.8607))
    lon = float(request.args.get("lon", 67.0011))
    
    # Run feature extraction pipeline for real-time forecast payload
    df = run_hourly_feature_pipeline(city=city, lat=lat, lon=lon)
    recent_records = df.head(72).to_dict(orient="records")
    
    return jsonify({
        "city": city,
        "current_aqi": int(recent_records[0]["us_aqi"]) if recent_records else 142,
        "count": len(recent_records),
        "forecast": recent_records
    })

@app.route("/api/models/evaluate", methods=["GET", "POST"])
def evaluate_models():
    results = train_and_evaluate_models()
    return jsonify(results)

@app.route("/api/datastore/status", methods=["GET"])
def datastore_status():
    ds = DatastoreManager()
    return jsonify(ds.verify_datastore_health())

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
