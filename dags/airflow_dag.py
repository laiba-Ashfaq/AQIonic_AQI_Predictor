"""
Apache Airflow DAG - AQIonic Air Quality Prediction System
Orchestrates hourly feature ingestion and daily retraining workflows.
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator

default_args = {
    'owner': 'aqionic_mlops',
    'depends_on_past': False,
    'start_date': datetime(2026, 1, 1),
    'email_on_failure': True,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'aqionic_hourly_feature_pipeline',
    default_args=default_args,
    description='Hourly Feature Extraction and Hopsworks/SQLite Sync',
    schedule_interval='@hourly',
    catchup=False,
) as hourly_dag:

    task_fetch_weather = BashOperator(
        task_id='fetch_weather_pollutants',
        bash_command='python /opt/airflow/dags/pipelines/feature_pipeline.py',
    )

with DAG(
    'aqionic_daily_training_pipeline',
    default_args=default_args,
    description='Daily ML Retraining & Model Registry Deployment',
    schedule_interval='0 2 * * *',
    catchup=False,
) as daily_dag:

    task_train_models = BashOperator(
        task_id='retrain_and_evaluate_models',
        bash_command='python /opt/airflow/dags/pipelines/training_pipeline.py',
    )
