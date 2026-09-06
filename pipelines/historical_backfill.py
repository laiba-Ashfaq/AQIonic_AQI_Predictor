"""
AQIonic Air Quality Intelligence - Historical Data Backfill Script
Backfills 400+ days (>1 Year) of historical hourly atmospheric observations into Datastore.
"""

import os
import sys
import datetime
import pandas as pd
import requests

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from pipelines.feature_pipeline import compute_features
from pipelines.datastore import DatastoreManager

def backfill_historical_data(city: str = "Karachi", lat: float = 24.8607, lon: float = 67.0011, days_back: int = 400):
    """Backfills >1 Year (400 days / 9,600+ hours) of historical hourly data for training."""
    print(f"[BACKFILL] Starting 1+ Year historical backfill: {days_back} days (~{days_back*24} hours) for {city}...")
    
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=days_back)
    
    aq_url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality"
        f"?latitude={lat}&longitude={lon}&start_date={start_date}&end_date={end_date}"
        f"&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi"
        f"&timezone=auto"
    )
    
    weather_url = (
        f"https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={lat}&longitude={lon}&start_date={start_date}&end_date={end_date}"
        f"&hourly=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation"
        f"&timezone=auto"
    )
    
    print("[BACKFILL] Fetching pollutant archive...")
    aq_res = requests.get(aq_url, timeout=35).json()
    print("[BACKFILL] Fetching weather archive...")
    w_res = requests.get(weather_url, timeout=35).json()
    
    df_aq = pd.DataFrame(aq_res['hourly'])
    df_w = pd.DataFrame(w_res['hourly'])
    
    df = pd.merge(df_aq, df_w, on='time')
    df['timestamp'] = pd.to_datetime(df['time'])
    df = df.dropna(subset=['pm2_5', 'us_aqi']).reset_index(drop=True)
    
    print(f"[BACKFILL] 1+ Year dataset fetched: {len(df)} hourly observations.")
    features_df = compute_features(df, city_name=city)
    
    ds = DatastoreManager(use_hopsworks=bool(os.getenv("HOPSWORKS_API_KEY")))
    inserted = ds.write_features(features_df)
    print(f"[BACKFILL COMPLETE] Successfully backfilled {inserted} records (>1 Year training dataset) into Feature Store.")
    return features_df

if __name__ == "__main__":
    backfill_historical_data()
