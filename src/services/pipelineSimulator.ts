import { FeatureRecord, PipelineExecutionLog } from '../types/aqi';

export function generateFeatureStoreMockRecords(cityName: string): FeatureRecord[] {
  const records: FeatureRecord[] = [];
  const now = new Date();

  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getTime() - i * 3600 * 1000);
    const hour = d.getHours();
    const pm25 = Math.round(35 + Math.sin(hour / 4) * 20 + (i % 5) * 3);
    const wind = Number((8 + Math.cos(hour / 6) * 4).toFixed(1));
    const temp = Number((22 + Math.sin((hour - 8) / 4) * 6).toFixed(1));
    const humidity = Math.round(55 + Math.cos((hour - 8) / 4) * 15);
    const aqi = Math.round(pm25 * 1.8 + 20);

    const pm10 = Math.round(pm25 * 1.8 + 10);
    records.push({
      id: `feat-${cityName.toLowerCase().replace(/\s+/g, '_')}-${d.getTime()}`,
      timestamp: d.toISOString().replace('T', ' ').slice(0, 19),
      city: cityName,
      pm25: pm25,
      pm10: pm10,
      usAqi: aqi,
      sin_hour: Number(Math.sin((2 * Math.PI * hour) / 24).toFixed(3)),
      cos_hour: Number(Math.cos((2 * Math.PI * hour) / 24).toFixed(3)),
      day_of_week: d.getDay(),
      month: d.getMonth() + 1,
      pm25_lag_1h: pm25 + 2,
      pm25_lag_24h: pm25 - 4,
      pm25_rolling_mean_6h: Number((pm25 + 1.5).toFixed(1)),
      aqi_delta_3h: Number((Math.sin(i) * 8).toFixed(1)),
      wind_speed: wind,
      temperature: temp,
      relative_humidity: humidity,
      boundary_layer_height: Math.round(750 + Math.sin(hour / 3) * 250),
      target_aqi_next_1h: aqi + 3,
      target_aqi_next_24h: Math.round(aqi * 1.05),
      target_aqi_next_72h: Math.round(aqi * 0.95)
    });
  }

  return records;
}

export const INITIAL_PIPELINE_LOGS: PipelineExecutionLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600 * 1000).toLocaleTimeString(),
    stage: 'data_ingestion',
    status: 'success',
    message: 'Fetched live telemetry from Open-Meteo & Copernicus atmospheric APIs (24 observation points).',
    durationMs: 380,
    details: { payload_size: '42.8 KB', response_code: 200 }
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3550 * 1000).toLocaleTimeString(),
    stage: 'feature_generation',
    status: 'success',
    message: 'Engineered 18 features: sin/cos cyclical time stamps, 6h/24h rolling PM2.5 lags, and wind ventilation indices.',
    durationMs: 140,
    details: { computed_features_count: 18, row_count: 24 }
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 3500 * 1000).toLocaleTimeString(),
    stage: 'feature_store_write',
    status: 'success',
    message: 'Synchronized feature vector with Hopsworks Feature Group: "aqi_meteorology_features" (v1).',
    durationMs: 620,
    details: { destination: 'hopsworks://aqionic_aqi/feature_groups/v1', records_written: 24 }
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 3400 * 1000).toLocaleTimeString(),
    stage: 'model_evaluation',
    status: 'success',
    message: 'Daily training validation passed: Random Forest RMSE = 11.4 (target threshold < 15.0). Model promoted.',
    durationMs: 1120,
    details: { champion_model: 'RandomForestRegressor_v3.4', r2: 0.942 }
  }
];
