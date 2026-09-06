"""
AQIonic Air Quality Intelligence - Datastore Manager & Integrity Verification
Supports Hopsworks Cloud Feature Store & SQLite Local Datastore Fallback.
Guarantees Non-Negative AQI values and schema compliance.
"""

import os
import sys
import sqlite3
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, Optional

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass

try:
    import jks
except ImportError:
    pass

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "feature_store.db")
TMP_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "tmp")
os.makedirs(TMP_DIR, exist_ok=True)
os.environ["HOPSWORKS_CLIENT_TEMP_DIR"] = TMP_DIR

class DatastoreManager:
    def __init__(self, use_hopsworks: Optional[bool] = None, api_key: Optional[str] = None, project_name: Optional[str] = None):
        self.api_key = api_key or os.getenv("HOPSWORKS_API_KEY")
        self.use_hopsworks = use_hopsworks if use_hopsworks is not None else bool(self.api_key and self.api_key.strip())
        self.project_name = project_name or os.getenv("HOPSWORKS_PROJECT") or "aqi_pridector"
        self.db_path = DB_PATH
        self._init_local_db()

        if self.use_hopsworks and self.api_key and self.api_key.strip():
            print(f"[DATASTORE] Hopsworks Cloud Sync ENABLED. Target Project: '{self.project_name}'")
        else:
            print(f"[DATASTORE] Using Local SQLite Feature Store. (Set HOPSWORKS_API_KEY in .env to enable Hopsworks Cloud Sync)")

    def _init_local_db(self):
        """Initializes local SQLite Feature Store schema if not present."""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS aqi_features (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                city TEXT NOT NULL,
                event_timestamp INTEGER NOT NULL,
                time TEXT NOT NULL,
                pm2_5 REAL NOT NULL,
                pm10 REAL NOT NULL,
                ozone REAL NOT NULL,
                nitrogen_dioxide REAL NOT NULL,
                sulphur_dioxide REAL NOT NULL,
                carbon_monoxide REAL NOT NULL,
                us_aqi INTEGER NOT NULL,
                temperature_2m REAL NOT NULL,
                relative_humidity_2m REAL NOT NULL,
                wind_speed_10m REAL NOT NULL,
                wind_direction_10m REAL NOT NULL,
                surface_pressure REAL NOT NULL,
                hour INTEGER NOT NULL,
                day_of_week INTEGER NOT NULL,
                month INTEGER NOT NULL,
                sin_hour REAL NOT NULL,
                cos_hour REAL NOT NULL,
                pm25_lag_1h REAL NOT NULL,
                pm25_lag_24h REAL NOT NULL,
                pm25_rolling_mean_6h REAL NOT NULL,
                wind_ventilation_idx REAL NOT NULL,
                target_aqi_1h REAL NOT NULL,
                target_aqi_24h REAL NOT NULL,
                target_aqi_72h REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(city, event_timestamp)
            )
        """)
        conn.commit()
        conn.close()

    def get_hopsworks_project(self):
        """Connects to Hopsworks Cloud Feature Store if API key is configured."""
        if not self.api_key:
            raise ValueError("HOPSWORKS_API_KEY environment variable is missing in .env.")
        import hopsworks
        os.environ["HOPSWORKS_API_KEY"] = self.api_key
        try:
            return hopsworks.login(api_key_value=self.api_key, project=self.project_name)
        except Exception:
            return hopsworks.login(project=self.project_name)

    def write_features(self, df: pd.DataFrame) -> int:
        """
        Writes feature dataframe into Datastore (Hopsworks or Local SQLite).
        Enforces non-negativity on AQI and pollutant columns.
        """
        # Clean and enforce non-negativity constraint
        aqi_cols = ['us_aqi', 'target_aqi_1h', 'target_aqi_24h', 'target_aqi_72h', 'pm2_5', 'pm10', 'ozone', 'nitrogen_dioxide', 'sulphur_dioxide', 'carbon_monoxide']
        for col in aqi_cols:
            if col in df.columns:
                df[col] = np.clip(df[col], 0, None)

        rows_inserted = 0

        # Attempt Hopsworks Cloud Sync if enabled
        if self.use_hopsworks and self.api_key and self.api_key.strip():
            try:
                print(f"[HOPSWORKS] Logging in to Hopsworks Project '{self.project_name}'...")
                project = self.get_hopsworks_project()
                fs = project.get_feature_store()
                fg = fs.get_or_create_feature_group(
                    name="aqi_meteorology_features",
                    version=1,
                    primary_key=["city", "event_timestamp"],
                    event_time="event_timestamp",
                    description="Hourly atmospheric pollutant and weather feature store table.",
                    time_travel_format="HUDI"
                )
                df_hw = df.copy()
                for col_to_drop in ['id', 'created_at']:
                    if col_to_drop in df_hw.columns:
                        df_hw = df_hw.drop(columns=[col_to_drop])
                if 'precipitation' not in df_hw.columns:
                    df_hw['precipitation'] = 0.0
                if 'timestamp' in df_hw.columns:
                    df_hw['timestamp'] = pd.to_datetime(df_hw['timestamp'])
                type_casts = {
                    'relative_humidity_2m': 'int64',
                    'wind_direction_10m': 'int64',
                    'us_aqi': 'int64',
                    'hour': 'int32',
                    'day_of_week': 'int32',
                    'month': 'int32',
                    'event_timestamp': 'int64'
                }
                for col, dtype in type_casts.items():
                    if col in df_hw.columns:
                        df_hw[col] = df_hw[col].fillna(0).astype(dtype)
                fg.insert(df_hw, write_options={"wait_for_job": False})
                print(f"[HOPSWORKS SUCCESS] Inserted {len(df_hw)} records into Hopsworks Feature Group 'aqi_meteorology_features' (v1).")
            except Exception as e:
                print(f"[HOPSWORKS WARNING] Cloud sync failed ({e}). Saving to local SQLite feature store.")

        # Save to local SQLite feature store
        conn = sqlite3.connect(self.db_path)
        try:
            df_to_save = df.copy()
            if 'id' in df_to_save.columns:
                df_to_save = df_to_save.drop(columns=['id'])
            
            # Fetch existing table columns dynamically
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(aqi_features)")
            valid_cols = [row[1] for row in cursor.fetchall() if row[1] != 'id' and row[1] != 'created_at']
            
            # Filter DataFrame to valid columns
            cols_to_use = [c for c in df_to_save.columns if c in valid_cols]
            df_to_save = df_to_save[cols_to_use]
            
            placeholders = ", ".join(["?"] * len(cols_to_use))
            col_names = ", ".join(cols_to_use)
            sql = f"INSERT OR REPLACE INTO aqi_features ({col_names}) VALUES ({placeholders})"
            
            records = df_to_save.values.tolist()
            cursor.executemany(sql, records)
            conn.commit()
            rows_inserted = len(records)
        except Exception as err:
            print(f"[DATASTORE ERROR] SQLite write error: {err}")
        finally:
            conn.close()

        return rows_inserted

    def save_model_to_hopsworks(self, model_path: str, model_name: str, metrics: Dict[str, Any]):
        """Uploads trained champion model to Hopsworks Model Registry."""
        if self.use_hopsworks and self.api_key and self.api_key.strip():
            try:
                print(f"[HOPSWORKS MODEL REGISTRY] Uploading {model_name} to Hopsworks Project '{self.project_name}'...")
                project = self.get_hopsworks_project()
                mr = project.get_model_registry()
                model = mr.python.create_model(
                    name="best_aqi_model",
                    metrics=metrics,
                    description="AQIonic Champion Model trained on 1+ Year dataset"
                )
                model.save(model_path)
                print(f"[HOPSWORKS MODEL REGISTRY SUCCESS] Uploaded {model_name} to Hopsworks Model Registry!")
            except Exception as e:
                print(f"[HOPSWORKS MODEL REGISTRY WARNING] Upload failed ({e}).")

    def read_features(self, city: Optional[str] = None, limit: int = 20000) -> pd.DataFrame:
        """Reads features from Datastore."""
        conn = sqlite3.connect(self.db_path)
        query = "SELECT * FROM aqi_features"
        params = []
        if city:
            query += " WHERE city = ?"
            params.append(city)
        query += " ORDER BY event_timestamp DESC LIMIT ?"
        params.append(limit)

        df = pd.read_sql_query(query, conn, params=params)
        conn.close()
        return df

    def verify_datastore_health(self) -> Dict[str, Any]:
        """Runs comprehensive health checks on local datastore."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM aqi_features")
        total_rows = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM aqi_features WHERE us_aqi < 0 OR target_aqi_24h < 0")
        negative_count = cursor.fetchone()[0]

        cursor.execute("SELECT DISTINCT city FROM aqi_features")
        cities = [r[0] for r in cursor.fetchall()]

        conn.close()

        is_healthy = negative_count == 0
        return {
            "status": "Healthy" if is_healthy else "Degraded",
            "hopsworks_configured": bool(self.api_key and self.api_key.strip()),
            "local_db_path": self.db_path,
            "total_records": total_rows,
            "cities_tracked": cities,
            "negative_aqi_violations": negative_count,
            "non_negative_guarantee_passed": negative_count == 0,
            "primary_keys": ["city", "event_timestamp"]
        }

if __name__ == "__main__":
    ds = DatastoreManager()
    health = ds.verify_datastore_health()
    print("Datastore Health Status:", health)
