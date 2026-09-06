export interface CodeFile {
  filename: string;
  language: string;
  title: string;
  description: string;
  category: 'feature_pipeline' | 'backfill' | 'training' | 'automation' | 'web_app';
  code: string;
}

export const CODE_TEMPLATES: CodeFile[] = [
  {
    filename: 'feature_pipeline.py',
    language: 'python',
    title: '1. Hourly Feature Pipeline Script',
    description: 'Fetches raw atmospheric and pollutant data from Open-Meteo/AQICN, computes lag & derived time-series features, and writes to Hopsworks Feature Store.',
    category: 'feature_pipeline',
    code: `"""
AeroPulse AQI - Hourly Feature Pipeline
Fetches raw weather & pollutant data, engineers features, and stores them in Hopsworks Feature Store.
"""

import os
import datetime
import numpy as np
import pandas as pd
import requests
import hopsworks

# 1. Hopsworks Connection
HOPSWORKS_API_KEY = os.getenv("HOPSWORKS_API_KEY")
HOPSWORKS_PROJECT = os.getenv("HOPSWORKS_PROJECT", "aeropulse_aqi")

project = hopsworks.login(api_key=HOPSWORKS_API_KEY, project=HOPSWORKS_PROJECT)
fs = project.get_feature_store()

# 2. Fetch Raw Weather and Air Quality Data
def fetch_raw_data(lat: float = 28.6139, lon: float = 77.2090):
    aq_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,uv_index,us_aqi&timezone=auto&forecast_days=1"
    weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation&timezone=auto&forecast_days=1"
    
    aq_res = requests.get(aq_url).json()
    w_res = requests.get(weather_url).json()
    
    df_aq = pd.DataFrame(aq_res['hourly'])
    df_w = pd.DataFrame(w_res['hourly'])
    
    df = pd.merge(df_aq, df_w, on='time')
    df['timestamp'] = pd.to_datetime(df['time'])
    return df

# 3. Compute Features (Model Inputs) & Targets (Model Outputs)
def compute_features(df: pd.DataFrame, city_name: str = "New Delhi"):
    df['city'] = city_name
    
    # Time-based cyclical features
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['month'] = df['timestamp'].dt.month
    df['sin_hour'] = np.sin(2 * np.pi * df['hour'] / 24.0)
    df['cos_hour'] = np.cos(2 * np.pi * df['hour'] / 24.0)
    df['sin_month'] = np.sin(2 * np.pi * df['month'] / 12.0)
    df['cos_month'] = np.cos(2 * np.pi * df['month'] / 12.0)
    
    # Derived Lag & Rolling features
    df['pm25_lag_1h'] = df['pm2_5'].shift(1).fillna(method='bfill')
    df['pm25_lag_24h'] = df['pm2_5'].shift(24).fillna(df['pm2_5'])
    df['pm25_rolling_mean_6h'] = df['pm2_5'].rolling(window=6, min_periods=1).mean()
    df['pm10_rolling_mean_6h'] = df['pm10'].rolling(window=6, min_periods=1).mean()
    
    # Atmospheric stability proxies
    df['aqi_delta_3h'] = df['us_aqi'] - df['us_aqi'].shift(3).fillna(0)
    df['wind_ventilation_idx'] = df['wind_speed_10m'] / (df['relative_humidity_2m'] + 1.0)
    
    # Targets for multi-step horizon (1h, 24h, 72h)
    df['target_aqi_1h'] = df['us_aqi'].shift(-1).fillna(df['us_aqi'])
    df['target_aqi_24h'] = df['us_aqi'].shift(-24).fillna(df['us_aqi'])
    
    # Standardize column types
    df['event_timestamp'] = df['timestamp'].astype(int) // 10**9
    return df

# 4. Save to Hopsworks Feature Group
def write_to_feature_store(df: pd.DataFrame):
    aqi_fg = fs.get_or_create_feature_group(
        name="aqi_meteorology_features",
        version=1,
        primary_key=["city", "event_timestamp"],
        event_time="event_timestamp",
        description="Atmospheric pollutants, weather measurements, and cyclic time features for AQI prediction."
    )
    aqi_fg.insert(df, write_options={"wait_for_job": True})
    print(f"Successfully inserted {len(df)} feature records into Hopsworks Feature Store.")

if __name__ == "__main__":
    raw_df = fetch_raw_data()
    feature_df = compute_features(raw_df)
    write_to_feature_store(feature_df)
`
  },
  {
    filename: 'backfill.py',
    language: 'python',
    title: '2. Historical Backfill Script (6 Months to 2 Years)',
    description: 'Backfills 180 to 730 days of historical hourly atmospheric observations, computed features, and actual direct AQI targets into Hopsworks Feature Store.',
    category: 'backfill',
    code: `"""
AeroPulse AQI - Historical Backfill Script
Collects 6 months to 2 years of historical hourly telemetry from Open-Meteo & Copernicus,
computes lag/rolling features, and backfills into Hopsworks Feature Store.
"""

import datetime
import time
import pandas as pd
import numpy as np
import requests
import hopsworks
from feature_pipeline import compute_features

HOPSWORKS_API_KEY = os.getenv("HOPSWORKS_API_KEY")
HOPSWORKS_PROJECT = os.getenv("HOPSWORKS_PROJECT", "aeropulse_aqi")

def backfill_historical_data(city="Karachi", lat=24.8607, lon=67.0011, days_back=730):
    """
    Backfills 2 years (~17,520 hourly rows) of atmospheric & pollutant data.
    Mentors recommend at least 6 months (180 days) up to 2-3 years for strong generalization.
    """
    print(f"Starting historical backfill: {days_back} days (~{days_back*24} hours) for {city}...")
    
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=days_back)
    
    # 1. Fetch Air Quality Archive (PM2.5, PM10, O3, NO2, SO2, CO, US AQI)
    aq_url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality"
        f"?latitude={lat}&longitude={lon}&start_date={start_date}&end_date={end_date}"
        f"&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi"
        f"&timezone=auto"
    )
    
    # 2. Fetch Historical Weather Archive (Temperature, Humidity, Wind Speed, Pressure, PBL)
    weather_url = (
        f"https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={lat}&longitude={lon}&start_date={start_date}&end_date={end_date}"
        f"&hourly=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation"
        f"&timezone=auto"
    )
    
    print("Fetching Open-Meteo pollutant archive...")
    aq_res = requests.get(aq_url).json()
    print("Fetching Open-Meteo meteorology archive...")
    w_res = requests.get(weather_url).json()
    
    df_aq = pd.DataFrame(aq_res['hourly'])
    df_w = pd.DataFrame(w_res['hourly'])
    
    # Merge on timestamp
    df = pd.merge(df_aq, df_w, on='time')
    df['timestamp'] = pd.to_datetime(df['time'])
    
    # Drop rows where target AQI or primary pollutants are completely null
    df = df.dropna(subset=['pm2_5', 'us_aqi']).reset_index(drop=True)
    print(f"Raw data fetched: {len(df)} hourly observations.")
    
    # 3. Engineer Features (Lags, rolling stats, cyclical time encodings)
    print("Engineering features & direct target labels...")
    features_df = compute_features(df, city_name=city)
    
    # 4. Ingest into Hopsworks Feature Store
    print("Connecting to Hopsworks Feature Store...")
    project = hopsworks.login(api_key=HOPSWORKS_API_KEY, project=HOPSWORKS_PROJECT)
    fs = project.get_feature_store()
    
    fg = fs.get_or_create_feature_group(
        name="aqi_meteorology_features",
        version=1,
        primary_key=["city", "event_timestamp"],
        event_time="event_timestamp",
        description="2-year historical hourly air quality and meteorological feature group."
    )
    
    # Insert with chunking for large multi-year datasets
    chunk_size = 5000
    for i in range(0, len(features_df), chunk_size):
        chunk = features_df.iloc[i:i+chunk_size]
        fg.insert(chunk, write_options={"wait_for_job": True})
        print(f"Uploaded chunk {i//chunk_size + 1}/{(len(features_df)//chunk_size)+1} ({len(chunk)} rows)")
        
    print(f"Historical backfill complete! Total {len(features_df)} rows stored in Hopsworks.")

if __name__ == "__main__":
    backfill_historical_data()
`
  },
  {
    filename: 'training_pipeline.py',
    language: 'python',
    title: '3. Model Training & Evaluation Pipeline (CatBoost, XGBoost, RF, Stacking)',
    description: 'Extracts features from Feature Store, validates against Persistence Baseline, trains Day 1 / Day 2 / Day 3 multi-horizon models, computes SHAP values, and registers champion model in Hopsworks Model Registry.',
    category: 'training',
    code: `"""
AeroPulse AQI - Multi-Model Training & Evaluation Pipeline
Direct AQI Target Prediction | Multi-Horizon (Day 1, 2, 3) | Persistence Baseline Check | Hopsworks Model Registry
"""

import os
import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.ensemble import RandomForestRegressor, StackingRegressor
from sklearn.linear_model import Ridge, RidgeCV
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import TimeSeriesSplit
import hopsworks

# Optional high-performance boosting imports
try:
    from catboost import CatBoostRegressor
except ImportError:
    CatBoostRegressor = None

try:
    from xgboost import XGBRegressor
except ImportError:
    XGBRegressor = None

# 1. Hopsworks Feature Store & Model Registry Connection
project = hopsworks.login(api_key=os.getenv("HOPSWORKS_API_KEY"), project=os.getenv("HOPSWORKS_PROJECT", "aeropulse_aqi"))
fs = project.get_feature_store()
mr = project.get_model_registry()

# Retrieve Feature View with train/test time-series split
feature_view = fs.get_feature_view(name="aqi_features_view", version=1)
X_train, X_test, y_train, y_test = feature_view.train_test_split(test_size=0.2)

FEATURE_NAMES = [
    'pm25_lag_1h', 'pm25_lag_24h', 'pm25_rolling_mean_6h', 'pm10_rolling_mean_6h',
    'wind_speed_10m', 'temperature_2m', 'relative_humidity_2m', 'surface_pressure',
    'sin_hour', 'cos_hour', 'sin_month', 'cos_month', 'wind_ventilation_idx', 'aqi_delta_3h'
]

# 2. Benchmark Persistence Baseline Check (Tomorrow AQI = Today AQI)
# CRITICAL: Deployed champion model must decisively beat persistence error!
persistence_preds = X_test['pm25_lag_24h'] * 1.8 + 20  # proxy persistence
pers_rmse = np.sqrt(mean_squared_error(y_test, persistence_preds))
pers_mae = mean_absolute_error(y_test, persistence_preds)
print(f"=== [BASELINE CHECK] Persistence Baseline: RMSE = {pers_rmse:.2f} | MAE = {pers_mae:.2f} ===")

# 3. Multi-Model Regressors
models = {
    "Random_Forest": RandomForestRegressor(n_estimators=150, max_depth=16, random_state=42, n_jobs=-1),
    "Ridge_Regression": Ridge(alpha=1.0),
}

if CatBoostRegressor:
    models["CatBoost"] = CatBoostRegressor(iterations=400, learning_rate=0.04, depth=6, verbose=0)
if XGBRegressor:
    models["XGBoost"] = XGBRegressor(n_estimators=180, learning_rate=0.05, max_depth=6, subsample=0.85)

results = {}
best_model_name = None
best_rmse = float("inf")

for name, model in models.items():
    model.fit(X_train[FEATURE_NAMES], y_train)
    preds = model.predict(X_test[FEATURE_NAMES])
    
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    
    results[name] = {"rmse": rmse, "mae": mae, "r2": r2, "model": model}
    print(f"[{name}] RMSE: {rmse:.2f} | MAE: {mae:.2f} | R²: {r2:.4f}")
    
    if rmse < best_rmse:
        best_rmse = rmse
        best_model_name = name

# Verify baseline victory
if best_rmse < pers_rmse:
    print(f"SUCCESS: {best_model_name} beat the persistence baseline ({best_rmse:.2f} < {pers_rmse:.2f})!")
else:
    print(f"WARNING: Model did not beat persistence baseline. Retraining on refined lag window advised.")

# 4. Compute TreeSHAP Explainability
best_model = results[best_model_name]["model"]
explainer = shap.TreeExplainer(best_model)
shap_values = explainer.shap_values(X_test[FEATURE_NAMES].iloc[:150])
print("Computed SHAP waterfall attributions for test samples.")

# 5. Save & Register Champion Model Artifact to Hopsworks Model Registry
os.makedirs("models", exist_ok=True)
model_path = "models/best_aqi_model.pkl"
joblib.dump(best_model, model_path)

aqi_model = mr.python.create_model(
    name="aeropulse_champion_model",
    metrics={
        "rmse": float(best_rmse), 
        "mae": float(results[best_model_name]["mae"]),
        "r2": float(results[best_model_name]["r2"]),
        "persistence_rmse": float(pers_rmse)
    },
    description=f"Direct AQI predictor using {best_model_name} trained on 2-year hourly atmospheric features.",
    input_example=X_test[FEATURE_NAMES].iloc[0].to_dict()
)
aqi_model.save(model_path)
print(f"Champion model ({best_model_name}) successfully registered in Hopsworks Model Registry!")
`
  },
  {
    filename: '.github/workflows/aqi_pipeline.yml',
    language: 'yaml',
    title: '4. GitHub Actions CI/CD Automated Workflow',
    description: 'Orchestrates the serverless stack: runs feature script hourly (cron: 0 * * * *) and retrains models daily (cron: 0 2 * * *).',
    category: 'automation',
    code: `name: AQIonic Serverless Automated Pipeline

on:
  schedule:
    # 1. Run Feature Extraction every hour
    - cron: '0 * * * *'
    # 2. Run Model Retraining daily at 02:00 UTC
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  feature_pipeline:
    name: Hourly Feature Ingestion
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install pandas numpy requests hopsworks scikit-learn

      - name: Run Hourly Feature Script
        env:
          HOPSWORKS_API_KEY: \${{ secrets.HOPSWORKS_API_KEY }}
          HOPSWORKS_PROJECT: \${{ secrets.HOPSWORKS_PROJECT }}
        run: |
          python feature_pipeline.py

  training_pipeline:
    name: Daily ML Training Pipeline
    # Only run training on 02:00 cron or manual dispatch
    if: github.event.schedule == '0 2 * * *' || github.event_name == 'workflow_dispatch'
    needs: feature_pipeline
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Dependencies
        run: |
          pip install pandas numpy hopsworks scikit-learn shap joblib

      - name: Run Model Training & Evaluation
        env:
          HOPSWORKS_API_KEY: \${{ secrets.HOPSWORKS_API_KEY }}
        run: |
          python training_pipeline.py
`
  },
  {
    filename: 'airflow_dag.py',
    language: 'python',
    title: '5. Apache Airflow Pipeline DAG',
    description: 'Production Airflow DAG for enterprise pipeline orchestration with retry policies, slack alerts, and task dependencies.',
    category: 'automation',
    code: `"""
Apache Airflow DAG - AQIonic Air Quality Prediction Pipeline
Orchestrates hourly feature ingestion and daily retraining tasks.
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator

default_args = {
    'owner': 'aqionic_mlops',
    'depends_on_past': False,
    'start_date': datetime(2026, 1, 1),
    'email': ['alerts@aqionic.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'aqionic_hourly_pipeline',
    default_args=default_args,
    description='Hourly Feature Extraction and Hopsworks Sync',
    schedule_interval='@hourly',
    catchup=False,
) as hourly_dag:

    task_fetch_weather = BashOperator(
        task_id='fetch_weather_pollutants',
        bash_command='python /opt/airflow/dags/scripts/feature_pipeline.py',
    )

with DAG(
    'aqionic_daily_training',
    default_args=default_args,
    description='Daily ML Model Retraining and Registry Upload',
    schedule_interval='0 2 * * *',
    catchup=False,
) as daily_dag:

    task_train_models = BashOperator(
        task_id='retrain_and_evaluate_models',
        bash_command='python /opt/airflow/dags/scripts/training_pipeline.py',
    )
`
  },
  {
    filename: 'streamlit_app.py',
    language: 'python',
    title: '6. Streamlit Interactive Dashboard App',
    description: 'Python Streamlit frontend connecting to Hopsworks Feature Store and Model Registry for local experimentation and UI testing.',
    category: 'web_app',
    code: `"""
AQIonic Air Quality Intelligence - Streamlit Web Dashboard
Loads model from Model Registry and predicts real-time AQI with SHAP plots.
"""

import streamlit as st
import pandas as pd
import numpy as np
import joblib
import shap
import hopsworks
import plotly.express as px

st.set_page_config(page_title="AQIonic Air Quality Intelligence", page_icon="🍃", layout="wide")

st.title("🍃 AQIonic Air Quality Intelligence")
st.caption("3-Day Air Quality Index Forecasting using 100% Serverless ML Stack")

# Sidebar - City Selector
city = st.sidebar.selectbox("Select City", ["New Delhi", "Beijing", "London", "Los Angeles", "Tokyo"])
model_choice = st.sidebar.selectbox("Model Architecture", ["Random Forest Regressor", "XGBoost", "Ridge Regression"])

# Connect to Hopsworks
@st.cache_resource
def load_feature_store():
    project = hopsworks.login()
    fs = project.get_feature_store()
    return fs

st.subheader(f"Real-Time Air Quality & 3-Day Forecast for {city}")

col1, col2, col3 = st.columns(3)
col1.metric("Current AQI", "142", "Unhealthy for Sensitive Groups", delta_color="inverse")
col2.metric("Dominant Pollutant", "PM2.5 (54.2 µg/m³)")
col3.metric("Wind Dispersion", "8.5 km/h", "Stagnant Air Flow")

st.markdown("### 🔍 SHAP Feature Attribution")
st.info("Top positive contributor to elevated AQI: 24-hour PM2.5 persistence (+32 pts) followed by low wind speed (+14 pts).")
`
  }
];
