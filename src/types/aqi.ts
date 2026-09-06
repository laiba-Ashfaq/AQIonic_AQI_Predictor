export type AQICategory = 
  | 'good' 
  | 'moderate' 
  | 'unhealthy_sensitive' 
  | 'unhealthy' 
  | 'very_unhealthy' 
  | 'hazardous';

export interface AQICategoryInfo {
  name: string;
  category: AQICategory;
  range: [number, number];
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  description: string;
  healthImplications: string;
  cautionaryStatement: string;
  advisoryList: string[];
}

export interface PollutantData {
  name: string;
  code: string;
  value: number; // in ug/m3 or ppm
  unit: string;
  standardLimit: number; // WHO or EPA 24h standard
  aqiContribution: number;
  status: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  description: string;
  sources: string[];
}

export interface WeatherData {
  temperature: number; // °C
  humidity: number; // %
  windSpeed: number; // km/h
  windDirection: number; // degrees
  pressure: number; // hPa
  uvIndex: number;
  precipitation: number; // mm
  cloudCover: number; // %
  boundaryLayerHeight?: number; // m
}

export interface HourlyForecastPoint {
  time: string; // ISO string
  timestamp: number;
  hour: number;
  dayName: string;
  aqi: number;
  aqiLower: number; // Confidence interval lower (90%)
  aqiUpper: number; // Confidence interval upper (90%)
  category: AQICategory;
  dominantPollutant: string;
  pm25: number;
  pm10: number;
  ozone: number;
  no2: number;
  so2: number;
  co: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  isDay: boolean;
}

export interface DailySummary {
  date: string;
  dayName: string;
  formattedDate: string;
  avgAqi: number;
  minAqi: number;
  maxAqi: number;
  dominantPollutant: string;
  category: AQICategory;
  advisory: string;
  weatherSummary: {
    tempMin: number;
    tempMax: number;
    humidityAvg: number;
    windSpeedAvg: number;
  };
}

export interface CityLocation {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  population?: string;
  climateZone?: string;
}

export interface MLModelMetrics {
  id: string;
  name: string;
  type: 'tree' | 'linear' | 'gradient_boost' | 'deep_learning' | 'ensemble';
  rmse: number;
  mae: number;
  r2: number;
  mape: number;
  trainingTimeMs: number;
  inferenceTimeMs: number;
  featuresUsed: number;
  bestFor: string;
  description: string;
  hyperparameters: Record<string, string | number>;
}

export interface SHAPAttribution {
  featureName: string;
  displayName: string;
  featureValue: number;
  unit: string;
  shapValue: number; // positive increases AQI (worse), negative decreases AQI (better)
  percentageContribution: number;
  category: 'meteorological' | 'pollutant_lag' | 'temporal' | 'derived';
  explanation: string;
}

export interface FeatureRecord {
  id: string;
  timestamp: string;
  city: string;
  pm25: number;
  pm10: number;
  usAqi: number;
  sin_hour: number;
  cos_hour: number;
  day_of_week: number;
  month: number;
  pm25_lag_1h: number;
  pm25_lag_24h: number;
  pm25_rolling_mean_6h: number;
  aqi_delta_3h: number;
  wind_speed: number;
  temperature: number;
  relative_humidity: number;
  boundary_layer_height: number;
  target_aqi_next_1h: number;
  target_aqi_next_24h: number;
  target_aqi_next_72h: number;
}

export interface FetchResult {
  city: CityLocation;
  currentAQI: number;
  currentCategory: AQICategory;
  dominantPollutant: string;
  pollutants: PollutantData[];
  weather: WeatherData;
  hourlyForecast: HourlyForecastPoint[];
  dailySummaries: DailySummary[];
  shapAttributions: SHAPAttribution[];
  isLive: boolean;
}

export interface PipelineExecutionLog {
  id: string;
  timestamp: string;
  stage: 'data_ingestion' | 'feature_generation' | 'feature_store_write' | 'model_training' | 'model_evaluation' | 'registry_deploy';
  status: 'running' | 'success' | 'warning' | 'error';
  message: string;
  durationMs: number;
  details?: Record<string, any>;
}
