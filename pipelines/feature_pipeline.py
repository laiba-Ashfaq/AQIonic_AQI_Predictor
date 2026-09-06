"""
AQIonic Air Quality Intelligence - Hourly Feature Pipeline
Fetches raw weather & pollutant data, computes lag/rolling features, and writes to Datastore.
"""

import os
import sys
import datetime
import numpy as np
import pandas as pd
import requests

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from pipelines.datastore import DatastoreManager

def fetch_raw_data(lat: float = 24.8607, lon: float = 67.0011) -> pd.DataFrame:
    """Fetches real-time atmospheric and meteorological telemetry from Open-Meteo API."""
    aq_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&timezone=auto&forecast_days=4"
    weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation&timezone=auto&forecast_days=4"
    
    aq_res = requests.get(aq_url, timeout=10).json()
    w_res = requests.get(weather_url, timeout=10).json()
    
    df_aq = pd.DataFrame(aq_res['hourly'])
    df_w = pd.DataFrame(w_res['hourly'])
    
    df = pd.merge(df_aq, df_w, on='time')
    df['timestamp'] = pd.to_datetime(df['time'])
    return df

def compute_features(df: pd.DataFrame, city_name: str = "Karachi") -> pd.DataFrame:
    """Computes time-based features, lag indicators, rolling stats, and target labels."""
    df['city'] = city_name
    
    # Cyclical temporal features
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['month'] = df['timestamp'].dt.month
    df['sin_hour'] = np.sin(2 * np.pi * df['hour'] / 24.0)
    df['cos_hour'] = np.cos(2 * np.pi * df['hour'] / 24.0)
    
    # Derived Lags & Rolling Statistics
    df['pm25_lag_1h'] = df['pm2_5'].shift(1).bfill()
    df['pm25_lag_24h'] = df['pm2_5'].shift(24).fillna(df['pm2_5'])
    df['pm25_rolling_mean_6h'] = df['pm2_5'].rolling(window=6, min_periods=1).mean()
    df['wind_ventilation_idx'] = df['wind_speed_10m'] / (df['relative_humidity_2m'] + 1.0)
    
    # Target Labels for Multi-Horizon Prediction (1h, 24h, 72h)
    df['target_aqi_1h'] = df['us_aqi'].shift(-1).fillna(df['us_aqi'])
    df['target_aqi_24h'] = df['us_aqi'].shift(-24).fillna(df['us_aqi'])
    df['target_aqi_72h'] = df['us_aqi'].shift(-72).fillna(df['us_aqi'])
    
    # Enforce Non-Negativity
    aqi_cols = ['us_aqi', 'target_aqi_1h', 'target_aqi_24h', 'target_aqi_72h', 'pm2_5', 'pm10', 'ozone', 'nitrogen_dioxide', 'sulphur_dioxide', 'carbon_monoxide']
    for col in aqi_cols:
        if col in df.columns:
            df[col] = np.clip(df[col], 0, None)

    df['event_timestamp'] = (df['timestamp'].astype('int64') // 10**9).astype(int)
    return df

def run_hourly_feature_pipeline(city: str = "Karachi", lat: float = 24.8607, lon: float = 67.0011):
    print(f"[FEATURE PIPELINE] Fetching raw atmospheric telemetry for {city} ({lat}, {lon})...")
    raw_df = fetch_raw_data(lat, lon)
    feature_df = compute_features(raw_df, city_name=city)
    
    ds = DatastoreManager(use_hopsworks=bool(os.getenv("HOPSWORKS_API_KEY")))
    inserted = ds.write_features(feature_df)
    print(f"[FEATURE PIPELINE SUCCESS] Wrote {inserted} feature rows to Feature Store.")
    return feature_df

if __name__ == "__main__":
    run_hourly_feature_pipeline()
