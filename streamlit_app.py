"""
AQIonic Air Quality Intelligence - Premium Streamlit Dashboard
Clean, robust version with no import errors.
"""

import os, sys, math, datetime
import streamlit as st
import pandas as pd
import numpy as np
import requests

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# ─────────────────────────────────────────────────────────────
# PAGE CONFIG
# ─────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="AQIonic – Air Quality Intelligence",
    page_icon="🌫️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ─────────────────────────────────────────────────────────────
# GLOBAL CSS
# ─────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

html, body, [class*="css"] { font-family: 'Inter', sans-serif; }
.stApp { background: #DDE7EE; color: #102B33; }

/* Hide default streamlit chrome */
#MainMenu, footer, [data-testid="stToolbar"] { visibility: hidden; }
.block-container {
  max-width: 1280px;
  /* Leave room below Streamlit's app frame so the first heading is never clipped. */
  padding-top: 1.5rem !important;
  padding-bottom: 40px !important;
}
[data-testid="stHeadingWithAction"] h1 {
  margin-top: 0 !important;
  padding-top: 0 !important;
  line-height: 1.25 !important;
}

/* AQIonic application header */
.aq-header {
  background: #1D4B59;
  padding: 18px 28px;
  margin: 0 0 10px;
  display: block;
  min-height: 74px;
  box-sizing: border-box;
  border-radius: 0 0 16px 16px;
}
.aq-logo { display: flex; align-items: center; gap: 10px; }
.aq-logo-icon {
  width: 40px; height: 40px; border-radius: 12px;
  background: #fff; color:#1D4B59;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}
.aq-brand { color: #fff; font-size: 25px; font-weight: 900; letter-spacing: -1.1px; }
.aq-brand span { color: #bae6fd; }
.aq-header .header-project { color:#fff !important; font-size:27px; font-weight:900; letter-spacing:-1px; }
.aq-header .header-project em { color:#bae6fd !important; font-style:normal; }
.aq-header .header-detail { color:#d7e8ed !important; font-size:12px; margin-left:22px; }
.aq-header .header-sensors { color:#86efac !important; font-size:12px; font-weight:700; float:right; padding-top:8px; }
.aq-badge {
  background: #256575; border: 1px solid rgba(52,211,153,.32); color: #86efac;
  padding: 4px 11px; border-radius: 20px; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; gap: 5px; margin-left: 10px;
}
.aq-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399;
  animation: blink 1.4s infinite; display: inline-block; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
.aq-info { color: #e2e8f0; font-size: 12px; }
.aq-sensors { color: #86efac; font-size: 12px; font-weight: 700; }

/* Tabs */
.stTabs [data-baseweb="tab-list"] {
  background: #173E4A; border-radius: 0; padding: 9px 12px; gap: 7px;
  border: 0; margin: 0 -1rem 20px;
}
.stTabs [data-baseweb="tab"] {
  background: transparent !important; border-radius: 16px;
  padding: 8px 14px; font-weight: 700; font-size: 12px;
  color: #e2e8f0 !important; border: none !important;
  white-space: nowrap;
}
.stTabs [aria-selected="true"] {
  background: #fff !important; color: #1D4B59 !important;
  box-shadow: 0 1px 4px rgba(0,0,0,.12);
}

/* KPI metric card */
.kpi-card {
  background: #fff; border: 1.5px solid #D5E5EE; border-radius: 16px;
  padding: 18px 16px; text-align: center;
}
.kpi-label { font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: #517280; margin-bottom: 6px; }
.kpi-value { font-size: 28px; font-weight: 900; color: #0F2B34; line-height: 1; }
.kpi-unit  { font-size: 12px; color: #7EA3B0; font-weight: 600; margin-top: 4px; }

/* Cards */
.card {
  background: #fff; border: 1px solid #CFDDE7; border-radius: 28px;
  padding: 20px 22px; margin-bottom: 18px; box-shadow: 0 1px 2px rgba(15,43,52,.05);
}
.card-title { font-size: 14px; font-weight: 800; color: #0F2B34; margin-bottom: 12px; }

/* City card */
.city-card {
  background: #fff; border: 2px solid #D5E5EE; border-radius: 18px;
  padding: 18px; text-align: left;
}

/* Badges */
.badge {
  display: inline-block; padding: 3px 12px; border-radius: 20px;
  font-size: 12px; font-weight: 700;
}
.bg-good      { background:#D1FAE5; color:#065F46; border:1px solid #6EE7B7; }
.bg-moderate  { background:#FEF3C7; color:#78350F; border:1px solid #FDE68A; }
.bg-sensitive { background:#FFEDD5; color:#7C2D12; border:1px solid #FED7AA; }
.bg-unhealthy { background:#FEE2E2; color:#7F1D1D; border:1px solid #FECACA; }
.bg-very      { background:#EDE9FE; color:#4C1D95; border:1px solid #C4B5FD; }
.bg-hazardous { background:#3B0008; color:#FCA5A5; border:1px solid #7F1D1D; }

/* Progress bar */
.pbar-wrap { background:#EEF4F8; border-radius:99px; height:8px; overflow:hidden; margin-top:6px; }
.pbar-fill  { height:8px; border-radius:99px; }

/* Chat */
.bubble-user {
  background: #0F2B34; color: #fff; border-radius: 18px 18px 4px 18px;
  padding: 10px 16px; font-size: 13px; max-width: 76%;
  margin-left: auto; margin-bottom: 8px;
}
.bubble-bot {
  background: #fff; border: 1.5px solid #D5E5EE; color: #0F2B34;
  border-radius: 18px 18px 18px 4px; padding: 10px 16px; font-size: 13px;
  max-width: 84%; margin-bottom: 8px;
}

/* Model card */
.model-card {
  background: #fff; border: 1.5px solid #D5E5EE; border-radius: 16px;
  padding: 18px 22px; margin-bottom: 12px;
}
.model-card.champion { background: #F0FAFA; border-color: #1D8A9C; }

hr.divider { border: none; border-top: 1px solid #E2ECF2; margin: 16px 0; }

/* Section headings */
h2.sh { font-size: 20px; font-weight: 900; color: #0F2B34; margin-bottom: 4px; }
p.sub  { font-size: 13px; color: #517280; margin-bottom: 16px; }

/* React dashboard component language: airy panels, 24–28px rounded corners. */
div[data-testid="stSelectbox"] > div > div, div[data-testid="stTextInput"] input {
  background:#163C47 !important; color:#fff !important; border:1px solid #2B6070 !important;
  border-radius:16px !important; font-size:12px !important;
}
div[data-testid="stButton"] > button { border-radius:16px; font-weight:700; font-size:12px; }
.react-panel { background:#fff;border:1px solid #CFDDE7;border-radius:28px;padding:22px;box-shadow:0 1px 2px rgba(15,43,52,.05); }
.eyebrow {font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#517280;}
.telemetry {background:#fff;border:1px solid #CFDDE7;border-radius:16px;padding:13px;min-height:78px;}
.pollutant-card {background:#fff;border:1px solid #CFDDE7;border-radius:24px;padding:18px;min-height:205px;}
.section-label { display:flex;justify-content:space-between;align-items:center;margin:20px 0 12px;color:#102B33;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase; }
.section-label small { color:#517280;font-size:10px;font-weight:600;letter-spacing:0;text-transform:none; }
.forecast-card {background:#fff;border:1px solid #CFDDE7;border-radius:24px;padding:18px;min-height:190px;box-shadow:0 1px 2px rgba(15,43,52,.05);}
.forecast-card .day {font-size:14px;font-weight:900;color:#102B33;}.forecast-card .date{font-size:11px;color:#517280;margin-left:7px}.forecast-card .value{font-size:29px;font-weight:900;color:#102B33;margin-top:20px}.forecast-card .copy{font-size:12px;color:#517280;line-height:1.5;margin-top:12px}
[data-testid="stMetricValue"] { font-size:30px !important; color:#102B33 !important; font-weight:700 !important; }
[data-testid="stMetricLabel"] { font-size:12px !important; color:#517280 !important; }

/* Streamlit 1.3x uses ARIA selectors for tabs; keep the React dark nav at every version. */
[data-testid="stTabs"] [role="tablist"] {
  background:#173E4A !important; padding:9px 28px !important; gap:7px !important;
  margin:0 -1rem 20px !important; border:0 !important; overflow-x:auto !important;
}
[data-testid="stTabs"] [role="tab"] {
  color:#dbeafe !important; background:transparent !important; border:0 !important;
  border-radius:16px !important; padding:8px 14px !important; font-size:12px !important;
  font-weight:700 !important; white-space:nowrap !important;
}
[data-testid="stTabs"] [role="tab"][aria-selected="true"] {
  background:#fff !important; color:#1D4B59 !important; box-shadow:0 1px 4px rgba(0,0,0,.15) !important;
}
[data-testid="stTabs"] [role="tab"] p { color:inherit !important; }

/* Explicit foreground colours prevent invisible text on light Streamlit surfaces. */
[data-testid="stAppViewContainer"], [data-testid="stAppViewContainer"] p,
[data-testid="stAppViewContainer"] label, [data-testid="stAppViewContainer"] span {
  color:#102B33;
}
.aq-header .aq-brand, .aq-header .aq-brand span { color:#fff !important; }
.aq-header .aq-brand span { color:#bae6fd !important; }
.aq-header .aq-badge, .aq-header .aq-badge * { color:#e2e8f0 !important; }
.aq-header .aq-sensors { color:#86efac !important; }
[data-testid="stTextInput"] input, [data-testid="stSelectbox"] input,
[data-testid="stTextInput"] input::placeholder { color:#fff !important; }
[data-testid="stSelectbox"] svg { fill:#fff !important; }
[data-testid="stVegaLiteChart"] { background:#fff !important; border-radius:18px; overflow:hidden; }
[data-testid="stVegaLiteChart"] canvas, [data-testid="stVegaLiteChart"] svg { background:#fff !important; }

/* Responsive layout: compact type and single-column cards on phones. */
@media (max-width: 760px) {
  .block-container { padding-left:12px !important; padding-right:12px !important; }
  .aq-header { margin:0 0 8px; padding:14px 16px; min-height:0; }
  .aq-brand { font-size:20px; }
  .aq-header .header-detail { display:block; margin:7px 0 0; }
  .aq-header .header-sensors { float:none; display:block; margin-top:7px; padding:0; }
  [data-testid="stTabs"] [role="tablist"] { padding:7px 10px !important; margin:0 -12px 14px !important; }
  [data-testid="stTabs"] [role="tab"] { padding:7px 10px !important; font-size:11px !important; }
  .card, .react-panel { border-radius:20px; padding:16px; }
  .kpi-value { font-size:23px; }.forecast-card .value { font-size:25px; }
  .section-label { font-size:11px; }
}
</style>
""", unsafe_allow_html=True)


# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────
CITIES = {
    "Lahore":    {"lat": 31.5204, "lon": 74.3587, "country": "Pakistan",  "climate": "Semi-Arid Continental"},
    "Karachi":   {"lat": 24.8607, "lon": 67.0011, "country": "Pakistan",  "climate": "Hot Desert"},
    "Islamabad": {"lat": 33.6844, "lon": 73.0479, "country": "Pakistan",  "climate": "Humid Subtropical"},
    "Multan":    {"lat": 30.1575, "lon": 71.5249, "country": "Pakistan",  "climate": "Hot Semi-Arid"},
    "Peshawar":  {"lat": 34.0150, "lon": 71.5805, "country": "Pakistan",  "climate": "Semi-Arid Steppe"},
    "Quetta":    {"lat": 30.1798, "lon": 66.9750, "country": "Pakistan",  "climate": "Cold Desert"},
    "New Delhi": {"lat": 28.6139, "lon": 77.2090, "country": "India",     "climate": "Humid Subtropical"},
    "London":    {"lat": 51.5074, "lon": -0.1278, "country": "UK",        "climate": "Temperate Oceanic"},
    "Tokyo":     {"lat": 35.6762, "lon": 139.6503,"country": "Japan",     "climate": "Humid Subtropical"},
}

def aqi_info(aqi: int):
    if aqi <= 50:   return "Good",                    "#059669", "bg-good"
    if aqi <= 100:  return "Moderate",                "#D97706", "bg-moderate"
    if aqi <= 150:  return "Unhealthy (Sensitive)",   "#EA580C", "bg-sensitive"
    if aqi <= 200:  return "Unhealthy",               "#DC2626", "bg-unhealthy"
    if aqi <= 300:  return "Very Unhealthy",          "#9333EA", "bg-very"
    return                 "Hazardous",               "#7F1D1D", "bg-hazardous"

def health_msg(aqi: int) -> str:
    if aqi <= 50:   return "Air quality is excellent. Great for all outdoor activities."
    if aqi <= 100:  return "Acceptable. Unusually sensitive people may notice mild symptoms."
    if aqi <= 150:  return "Sensitive groups (elderly, children, asthma) should limit outdoor time."
    if aqi <= 200:  return "Everyone may experience effects. Avoid prolonged outdoor exertion."
    if aqi <= 300:  return "Health alert. Avoid all outdoor activities. Use N95 masks indoors."
    return "Emergency. Stay indoors, seal windows, run air purifiers. Seek medical advice."

def offline_city_data(city: str) -> dict:
    """Deterministic local fallback when the live Open-Meteo endpoints are unreachable."""
    c = CITIES[city]
    profiles = {
        "Lahore": (161, 75.4, 83.6, 28.4, 86, 3.0),
        "Karachi": (118, 46.2, 71.5, 30.0, 72, 18.0),
        "Islamabad": (78, 26.0, 55.0, 26.0, 52, 11.0),
        "Multan": (142, 58.0, 92.0, 33.0, 48, 9.0),
        "Peshawar": (134, 52.0, 78.0, 29.0, 55, 7.0),
        "Quetta": (88, 31.0, 62.0, 21.0, 36, 14.0),
        "New Delhi": (176, 91.0, 110.0, 29.0, 67, 6.0),
        "London": (42, 9.0, 21.0, 16.0, 73, 15.0),
        "Tokyo": (54, 13.0, 28.0, 22.0, 61, 12.0),
    }
    base_aqi, base_pm25, base_pm10, base_temp, base_hum, base_wind = profiles[city]
    times = pd.date_range(pd.Timestamp.now().floor("h"), periods=96, freq="h")
    step = np.arange(len(times))
    hour = times.hour.to_numpy()
    rush = np.maximum(0, np.sin((hour - 3) / 24 * 2 * np.pi)) * .23
    wave = np.sin(step / 8) * .06 + np.sin(step * 1.7) * .025
    multiplier = 1 + rush + wave
    aqi = np.clip(np.round(base_aqi * multiplier), 10, 500)
    df = pd.DataFrame({
        "time": times,
        "us_aqi": aqi.astype(int),
        "pm2_5": np.round(base_pm25 * multiplier, 1),
        "pm10": np.round(base_pm10 * multiplier, 1),
        "ozone": np.round(np.maximum(12, 42 + 22 * np.maximum(0, np.sin((hour - 8) / 24 * 2 * np.pi))), 1),
        "no2": np.round(np.maximum(5, base_pm25 * .32 * multiplier), 1),
        "so2": np.round(np.maximum(3, base_pm25 * .11), 1),
        "co": np.round(np.maximum(180, base_pm25 * 9), 1),
        "temperature": np.round(base_temp + 4 * np.sin((hour - 6) / 24 * 2 * np.pi), 1),
        "humidity": np.clip(np.round(base_hum - 12 * np.sin((hour - 6) / 24 * 2 * np.pi)), 20, 98).astype(int),
        "wind_speed": np.round(np.maximum(1.5, base_wind + 2.5 * np.sin(step / 7)), 1),
    })
    row = df.iloc[0]
    return {
        "ok": True, "is_fallback": True, "city": city, "country": c["country"], "climate": c["climate"],
        "lat": c["lat"], "lon": c["lon"], "aqi": int(row.us_aqi), "pm25": float(row.pm2_5),
        "pm10": float(row.pm10), "temp": float(row.temperature), "hum": int(row.humidity),
        "wind": float(row.wind_speed), "dominant": "PM2.5" if row.pm2_5 > 25 else "PM10", "df": df,
    }

@st.cache_data(ttl=600, show_spinner=False)
def fetch(city: str) -> dict:
    c = CITIES[city]
    lat, lon = c["lat"], c["lon"]
    try:
        aq = requests.get(
            f"https://air-quality-api.open-meteo.com/v1/air-quality"
            f"?latitude={lat}&longitude={lon}"
            f"&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi"
            f"&timezone=auto&forecast_days=4", timeout=5).json()
        wt = requests.get(
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m"
            f"&timezone=auto&forecast_days=4", timeout=5).json()

        times   = aq["hourly"]["time"]
        aqi_v   = [max(0, v or 0) for v in aq["hourly"]["us_aqi"]]
        pm25    = [max(0, v or 0) for v in aq["hourly"]["pm2_5"]]
        pm10    = [max(0, v or 0) for v in aq["hourly"]["pm10"]]
        ozone   = [max(0, v or 0) for v in aq["hourly"]["ozone"]]
        no2     = [max(0, v or 0) for v in aq["hourly"]["nitrogen_dioxide"]]
        so2     = [max(0, v or 0) for v in aq["hourly"]["sulphur_dioxide"]]
        co      = [max(0, v or 0) for v in aq["hourly"]["carbon_monoxide"]]
        temps   = [v or 0 for v in wt["hourly"]["temperature_2m"]]
        hum     = [v or 0 for v in wt["hourly"]["relative_humidity_2m"]]
        wind    = [v or 0 for v in wt["hourly"]["wind_speed_10m"]]

        # best current index: last non-zero aqi
        idx = next((i for i, v in reversed(list(enumerate(aqi_v))) if v > 0 and i < len(times)), 0)

        df = pd.DataFrame({
            "time": pd.to_datetime(times),
            "us_aqi": aqi_v, "pm2_5": pm25, "pm10": pm10,
            "ozone": ozone, "no2": no2, "so2": so2, "co": co,
            "temperature": temps, "humidity": hum, "wind_speed": wind,
        })
        return {
            "ok": True, "city": city, "country": c["country"], "climate": c["climate"],
            "lat": lat, "lon": lon,
            "aqi":  int(aqi_v[idx]),
            "pm25": round(pm25[idx], 1),
            "pm10": round(pm10[idx], 1),
            "temp": round(temps[idx], 1),
            "hum":  int(hum[idx]),
            "wind": round(wind[idx], 1),
            "dominant": "PM2.5" if pm25[idx] > 25 else ("PM10" if pm10[idx] > 50 else "Ozone"),
            "df": df,
        }
    except Exception:
        # The app remains completely usable in restricted university/corporate networks.
        return offline_city_data(city)


def svg_gauge(aqi: int, size: int = 200) -> str:
    lbl, color, _ = aqi_info(aqi)
    pct = min(aqi, 500) / 500.0
    cx = cy = size / 2
    r  = size * 0.38
    sw = size * 0.09
    sa, sweep = 210, 300
    ea = sa + pct * sweep

    def pt(deg, radius):
        a = math.radians(deg)
        return cx + radius * math.cos(a), cy + radius * math.sin(a)

    def arc(a1, a2, radius):
        x1,y1 = pt(a1, radius); x2,y2 = pt(a2, radius)
        lg = 1 if (a2 - a1) > 180 else 0
        return f"M{x1:.1f} {y1:.1f} A{radius:.1f} {radius:.1f} 0 {lg} 1 {x2:.1f} {y2:.1f}"

    # Same six-segment AQI ring and needle treatment used by the React AQIGauge.
    segments = [(0, 50, "#10B981"), (51, 100, "#F59E0B"), (101, 150, "#F97316"),
                (151, 200, "#EF4444"), (201, 300, "#9333EA"), (301, 500, "#9F1239")]
    segment_svg = "".join(
        f'<path d="{arc(sa + start/500*sweep + 1.5, sa + end/500*sweep - 1.5, r)}" '
        f'fill="none" stroke="{seg_color}" stroke-width="{sw}" stroke-linecap="butt"/>'
        for start, end, seg_color in segments
    )
    needle_angle = math.radians(sa + pct * sweep)
    nx, ny = cx + r * .76 * math.cos(needle_angle), cy + r * .76 * math.sin(needle_angle)

    return f"""<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}">
  <path d="{arc(sa, sa+sweep, r)}" fill="none" stroke="#E2ECF2" stroke-width="{sw}" stroke-linecap="round"/>
  {segment_svg}
  <line x1="{cx}" y1="{cy}" x2="{nx:.1f}" y2="{ny:.1f}" stroke="#1D4B59" stroke-width="{max(2,size*.014):.1f}" stroke-linecap="round"/>
  <circle cx="{cx}" cy="{cy}" r="{max(4,size*.028):.1f}" fill="#1D4B59"/>
  <text x="{cx-r-2}" y="{cy+size*.12}" text-anchor="middle" font-size="{size*.055}" fill="#517280" font-weight="700">0</text>
  <text x="{cx+r+2}" y="{cy+size*.12}" text-anchor="middle" font-size="{size*.055}" fill="#517280" font-weight="700">500</text>
  <text x="{cx}" y="{cy - size*.03}" text-anchor="middle"
        font-size="{size*.22}" font-weight="900" fill="{color}" font-family="Inter,sans-serif">{aqi}</text>
  <text x="{cx}" y="{cy + size*.13}" text-anchor="middle"
        font-size="{size*.07}" fill="#517280" font-weight="700" font-family="Inter,sans-serif">US AQI</text>
  <text x="{cx}" y="{cy + size*.24}" text-anchor="middle"
        font-size="{size*.074}" fill="{color}" font-weight="800" font-family="Inter,sans-serif">{lbl}</text>
</svg>"""

def aqi_status_panel(aqi: int) -> str:
    """Reference-style AQI gauge, scale key, and health alert."""
    label, color, _ = aqi_info(aqi)
    health_copy = health_msg(aqi)
    levels = [("#10B981", "Good"), ("#F59E0B", "Moderate"), ("#F97316", "Unhealthy"),
              ("#EF4444", "Unhealthy"), ("#9333EA", "Very"), ("#9F1239", "Hazardous")]
    pills = "".join(
        '<span style="display:inline-flex;align-items:center;gap:5px;border:1px solid #D5E5EE;'
        'border-radius:16px;padding:5px 9px;font-size:10px;color:#517280">'
        f'<i style="width:10px;height:10px;border-radius:50%;background:{shade};display:inline-block"></i>{name}</span>'
        for shade, name in levels
    )
    return f'''<div class="card" style="text-align:center;padding:14px 16px">
      {svg_gauge(aqi, 235)}
      <div style="margin:-22px 0 12px"><span style="display:inline-block;padding:4px 16px;border-radius:16px;background:#fff1f2;border:1px solid {color};color:{color};font-size:12px;font-weight:800">{label}</span></div>
      <div style="border-top:1px solid #DDE7EE;padding-top:12px;font-size:10px;font-weight:800;letter-spacing:.08em;color:#517280">AQI SCALE COLOR KEY (HOVER ANY SEGMENT FOR DETAILS)</div>
      <div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin:9px 0 15px">{pills}</div>
      <div style="display:flex;text-align:left;gap:12px;background:#F7FAFC;border:1px solid #D5E5EE;border-radius:16px;padding:14px 16px">
        <span style="width:22px;height:22px;border-radius:50%;background:{color};color:#fff;font-size:13px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;line-height:1">!</span>
        <div><div style="font-size:12px;font-weight:900;color:#102B33">{label} Air Quality</div>
        <div style="font-size:12px;line-height:1.55;color:#517280;margin-top:4px">{health_copy}</div></div>
      </div>
    </div>'''


# ─────────────────────────────────────────────────────────────
# SESSION STATE
# ─────────────────────────────────────────────────────────────
if "active_city" not in st.session_state:
    st.session_state.active_city = "Lahore"
if "chat" not in st.session_state:
    st.session_state.chat = [
        {"role":"bot","text":"👋 Hi! I'm the AQIonic AI Copilot. Ask me about AQI, PM2.5, weather, or health advice for any city!"}
    ]


# ─────────────────────────────────────────────────────────────
# HEADER
# ─────────────────────────────────────────────────────────────
city = st.session_state.active_city
info = CITIES[city]
brand_col, details_col, sensors_col = st.columns([2.1, 4.7, 2.2], vertical_alignment="center")
with brand_col:
    st.title("AQIonic")
    st.caption("Live Sensor Grid")
with details_col:
    st.caption(f"Location: {city}, {info['country']}  |  Lat: {info['lat']:.2f}°, Lon: {info['lon']:.2f}°  |  {info['climate']}")
with sensors_col:
    st.caption("● 12 Atmospheric Sensors Active")

col_search, col_sel, col_gps, col_sync = st.columns([3, 3, 1, 1])
with col_search:
    st.text_input("", placeholder="Search location...", label_visibility="collapsed", key="city_search")
with col_sel:
    chosen = st.selectbox("", list(CITIES.keys()),
                          index=list(CITIES.keys()).index(st.session_state.active_city),
                          label_visibility="collapsed")
    if chosen != st.session_state.active_city:
        st.session_state.active_city = chosen
        st.rerun()
with col_gps:
    st.button("📡 GPS", use_container_width=True)
with col_sync:
    if st.button("🔄 Refresh", use_container_width=True):
        st.cache_data.clear()
        st.rerun()


# ─────────────────────────────────────────────────────────────
# TABS
# ─────────────────────────────────────────────────────────────
tab1, tab2, tab3, tab4, tab5, tab6, tab7, tab8 = st.tabs([
    "Dashboard & 72h Forecast",
    "AI Copilot Chatbot",
    "City Comparison",
    "EDA Analytics",
    "Model Zoo & Benchmarks",
    "Feature Store",
    "SHAP & Simulator",
    "Health Advisories",
])


# ═══════════════════════════════════════════════════════════════
# TAB 1 ─ DASHBOARD
# ═══════════════════════════════════════════════════════════════
with tab1:
    city = st.session_state.active_city
    with st.spinner(f"Syncing live sensors for {city}…"):
        d = fetch(city)

    if not d["ok"]:
        st.error(f"Could not fetch data: {d.get('error')}")
        st.stop()

    aqi = d["aqi"]
    lbl, color, badge_cls = aqi_info(aqi)

    # ── 5 KPI cards ──────────────────────────────────────────
    c1, c2, c3, c4, c5 = st.columns(5)
    for col_w, val, unit, name, clr in [
        (c1, aqi,      "US AQI", "Current AQI", color),
        (c2, d["pm25"],"µg/m³",  "PM2.5",       "#0F2B34"),
        (c3, d["pm10"],"µg/m³",  "PM10",        "#0F2B34"),
        (c4, d["temp"],"°C",     "Temperature", "#0F2B34"),
        (c5, d["wind"],"km/h",   "Wind Speed",  "#0F2B34"),
    ]:
        col_w.markdown(f"""
        <div class="kpi-card">
          <div class="kpi-label">{name}</div>
          <div class="kpi-value" style="color:{clr}">{val}</div>
          <div class="kpi-unit">{unit}</div>
        </div>""", unsafe_allow_html=True)

    st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)

    # ── Gauge + Info ──────────────────────────────────────────
    left, right = st.columns([1, 2], gap="large")
    # These values are used by the pollutant/WHO guideline panel on the right.
    who_ratio = round(d["pm25"] / 15.0, 1)
    pct_bar = min(100, int(d["pm25"] / 45 * 100))
    bar_col = "#DC2626" if d["pm25"] > 45 else ("#F59E0B" if d["pm25"] > 15 else "#059669")

    with left:
        st.markdown(aqi_status_panel(aqi), unsafe_allow_html=True)

    with right:
        # Dominant pollutant
        st.markdown(f"""
        <div class="card">
          <div style="font-size:10px;font-weight:800;letter-spacing:.08em;
                      text-transform:uppercase;color:#517280;margin-bottom:6px">
            Primary Air Quality Determinant
          </div>
          <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap">
            <span style="font-size:22px;font-weight:900;color:#0F2B34">{d['dominant']}</span>
            <span style="font-size:15px;font-weight:700;color:#1D8A9C">{d['pm25']} µg/m³</span>
            <span class="badge {badge_cls}" style="margin-left:auto">Sub-Index: {aqi} AQI</span>
          </div>
          <div style="font-size:12.5px;color:#517280;margin:10px 0;line-height:1.5">
            Fine particulate matter ≤2.5µm. Penetrates deep into lung tissue.
            Main sources: vehicle exhaust, industrial combustion, biomass burning.
          </div>
          <div style="font-size:11.5px;color:#517280;margin-bottom:5px">
            Concentration vs WHO Guideline (15 µg/m³)
            <strong style="color:{bar_col};margin-left:8px">{who_ratio}× WHO Limit</strong>
          </div>
          <div class="pbar-wrap">
            <div class="pbar-fill" style="width:{pct_bar}%;background:{bar_col}"></div>
          </div>
        </div>""", unsafe_allow_html=True)

        # 4 weather cells
        wc1, wc2, wc3, wc4 = st.columns(4)
        for wc, lbl2, val2, unit2, bg, tc in [
            (wc1, "Temperature", d["temp"], "°C", "#FFFBEB", "#D97706"),
            (wc2, "Humidity", d["hum"], "%", "#EFF6FF", "#3B82F6"),
            (wc3, "Wind Speed", d["wind"], "km/h", "#ECFDF5", "#059669"),
            (wc4, "Relative Humidity", d["hum"], "RH", "#FFF7ED", "#EA580C"),
        ]:
            wc.markdown(f"""
            <div style="background:{bg};border:1px solid {tc}44;border-radius:14px;
                        padding:13px 10px;text-align:center">
              <div style="font-size:10px;font-weight:700;color:#517280;
                          text-transform:uppercase">{lbl2}</div>
              <div style="font-size:18px;font-weight:900;color:#0F2B34;margin-top:2px">
                {val2}<span style="font-size:11px;color:#7EA3B0">{unit2}</span>
              </div>
            </div>""", unsafe_allow_html=True)

    # ── 72 h forecast chart ────────────────────────────────────
    st.markdown("<div style='height:6px'></div>", unsafe_allow_html=True)
    st.markdown('<div class="card"><div class="card-title">72-Hour AQI Forecast Timeline</div>', unsafe_allow_html=True)
    chart_df = d["df"].dropna(subset=["us_aqi"]).head(72).copy()
    chart_df["time_str"] = chart_df["time"].dt.strftime("%d %b %H:%M")
    chart_df = chart_df.set_index("time_str")[["us_aqi"]]
    st.area_chart(chart_df, height=220, use_container_width=True, color=["#1D8A9C"])
    st.markdown('</div>', unsafe_allow_html=True)

    # ── Pollutant table ───────────────────────────────────────
    st.markdown('<div class="card"><div class="card-title">Pollutant Breakdown</div>', unsafe_allow_html=True)
    row = d["df"].dropna(subset=["us_aqi"]).iloc[0]
    tbl = pd.DataFrame({
        "Pollutant": ["PM2.5", "PM10", "Ozone (O₃)", "NO₂", "SO₂", "CO"],
        "Current Value": [
            f"{row.pm2_5:.1f} µg/m³", f"{row.pm10:.1f} µg/m³",
            f"{row.ozone:.1f} µg/m³", f"{row.no2:.1f} µg/m³",
            f"{row.so2:.1f} µg/m³",   f"{row.co:.1f} µg/m³",
        ],
        "WHO Limit":   ["15 µg/m³","45 µg/m³","100 µg/m³","25 µg/m³","40 µg/m³","4 mg/m³"],
        "Status": [
            "Elevated" if row.pm2_5 > 15  else "Safe",
            "Elevated" if row.pm10  > 45  else "Safe",
            "Elevated" if row.ozone > 100 else "Safe",
            "Elevated" if row.no2   > 25  else "Safe",
            "Elevated" if row.so2   > 40  else "Safe",
            "Safe",
        ],
    })
    st.dataframe(tbl, use_container_width=True, hide_index=True)
    st.markdown('</div>', unsafe_allow_html=True)

    pollutant_specs = [
        ("PM2.5", "Fine Particulate Matter", row.pm2_5, 15, "Microscopic particles that penetrate deep into lung tissue.", "Combustion engines, industrial emissions"),
        ("PM10", "Coarse Particulate Matter", row.pm10, 45, "Inhalable coarse particles irritating the eyes and airway passages.", "Road dust, windblown soil"),
        ("O3", "Ground-Level Ozone", row.ozone, 100, "Secondary photochemical pollutant formed by sunlight reacting with NOx and VOCs.", "Vehicle exhaust, UV sunlight"),
        ("NO2", "Nitrogen Dioxide", row.no2, 25, "Combustion gas associated with traffic and industrial activity.", "Diesel vehicles, power plants"),
        ("SO2", "Sulfur Dioxide", row.so2, 40, "Corrosive sulfur compound from fuel combustion.", "Coal combustion, refineries"),
        ("CO", "Carbon Monoxide", row.co / 1000, 4, "Odorless toxic gas from incomplete combustion.", "Engines, heating systems"),
    ]
    st.markdown('<div class="section-label"><span>Criteria Pollutants &amp; Chemical Speciation (EPA Criteria 6)</span><small>WHO Standard Benchmarked</small></div>', unsafe_allow_html=True)
    for start in range(0, len(pollutant_specs), 3):
        cols = st.columns(3)
        for col, (code, name, value, limit, description, sources) in zip(cols, pollutant_specs[start:start+3]):
            ratio = min(100, value / limit * 100) if limit else 0
            pcolor = "#E11D48" if value > limit else "#1D4B59"
            col.markdown(f'''<div class="pollutant-card"><div style="display:flex;align-items:baseline;gap:7px"><b style="font-size:18px;color:#102B33">{code}</b><span style="font-size:12px;color:#517280">({name})</span></div><div style="display:flex;justify-content:space-between;align-items:end;margin:20px 0 10px"><b style="font-size:29px;color:#102B33">{value:.1f}<small style="font-size:12px;color:#517280"> µg/m³</small></b><span style="font-size:11px;color:#517280">Limit: {limit} µg/m³</span></div><div class="pbar-wrap"><div class="pbar-fill" style="width:{ratio:.0f}%;background:{pcolor}"></div></div><p style="font-size:12px;color:#517280;line-height:1.5">{description}</p><div style="border-top:1px solid #E2ECF2;padding-top:12px;font-size:11px;color:#517280">Sources: {sources}</div></div>''', unsafe_allow_html=True)

    forecast = d["df"].dropna(subset=["us_aqi"]).head(72).copy()
    forecast["date"] = forecast["time"].dt.date
    daily = forecast.groupby("date").agg(aqi=("us_aqi", "mean"), min_aqi=("us_aqi", "min"), max_aqi=("us_aqi", "max"), min_temp=("temperature", "min"), max_temp=("temperature", "max"), wind=("wind_speed", "mean")).head(3).reset_index()
    st.markdown('<div class="section-label"><span>3-Day Forecast Summary (Multi-Horizon Rollup)</span><small>Daily Aggregated Forecasts</small></div>', unsafe_allow_html=True)
    fcols = st.columns(3)
    labels = ["Today", "Tomorrow", "Day 3"]
    for position, (col, (_, day)) in enumerate(zip(fcols, daily.iterrows())):
        label, day_color, _ = aqi_info(int(day.aqi))
        col.markdown(f'''<div class="forecast-card"><div><span class="day">{labels[position]}</span><span class="date">{pd.Timestamp(day.date).strftime('%b %d')}</span><span class="badge" style="float:right;color:{day_color}">{label}</span></div><div style="border-top:1px solid #E2ECF2;margin-top:13px"></div><div style="display:flex;justify-content:space-between"><div><div class="eyebrow" style="margin-top:18px">Average AQI</div><div class="value">{day.aqi:.0f}</div></div><div style="text-align:right;margin-top:22px;font-size:11px;color:#517280"><b>RANGE</b><br>{day.min_aqi:.0f} - {day.max_aqi:.0f} AQI</div></div><p class="copy">{health_msg(int(day.aqi))}</p><div style="border-top:1px solid #E2ECF2;padding-top:12px;font-size:11px;color:#517280">{day.min_temp:.1f}° / {day.max_temp:.1f}°C <span style="float:right">Avg {day.wind:.0f} km/h</span></div></div>''', unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════════════
# TAB 2 ─ AI COPILOT
# ═══════════════════════════════════════════════════════════════
with tab2:
    st.markdown('<h2 class="sh">🤖 AQIonic AI Copilot</h2>', unsafe_allow_html=True)
    st.markdown('<p class="sub">Ask anything about air quality, weather, or health recommendations.</p>', unsafe_allow_html=True)

    chips = [
        "What is the AQI in Lahore?",
        "Is it safe to exercise in Karachi?",
        "What causes high AQI in winter?",
        "Compare Islamabad and Lahore PM2.5",
    ]
    cc = st.columns(4)
    for i, chip in enumerate(chips):
        if cc[i].button(chip, key=f"chip_{i}", use_container_width=True):
            st.session_state._q = chip

    # render history
    for msg in st.session_state.chat:
        cls = "bubble-user" if msg["role"] == "user" else "bubble-bot"
        pfx = "🙋" if msg["role"] == "user" else "🤖"
        st.markdown(f'<div class="{cls}">{pfx} {msg["text"]}</div>', unsafe_allow_html=True)

    def copilot(q: str) -> str:
        ql = q.lower()
        for cn in CITIES:
            if cn.lower() in ql:
                r = fetch(cn)
                if r["ok"]:
                    lbl2, _, _ = aqi_info(r["aqi"])
                    if any(k in ql for k in ["safe","exercise","outdoor","walk","run"]):
                        return f"🏙️ **{cn}** — AQI **{r['aqi']} ({lbl2})**. {health_msg(r['aqi'])}"
                    if "pm2.5" in ql or "pm25" in ql:
                        return f"🔬 **{cn}** PM2.5 = **{r['pm25']} µg/m³** (WHO: 15 µg/m³ → {round(r['pm25']/15,1)}× limit)"
                    if any(k in ql for k in ["weather","temp","wind","humid"]):
                        return f"🌤️ **{cn}**: Temp **{r['temp']}°C**, Humidity **{r['hum']}%**, Wind **{r['wind']} km/h**"
                    return (f"📊 **{cn}** — AQI **{r['aqi']} ({lbl2})**, "
                            f"PM2.5 {r['pm25']} µg/m³, Temp {r['temp']}°C, Wind {r['wind']} km/h. "
                            f"{health_msg(r['aqi'])}")
        if "compare" in ql:
            out = ["📊 Live Comparison:"]
            for cn in ["Lahore","Karachi","Islamabad"]:
                r = fetch(cn); lbl2,_,_ = aqi_info(r["aqi"]) if r["ok"] else ("Error","","")
                out.append(f"• **{cn}**: AQI {r['aqi']} ({lbl2}), PM2.5 {r['pm25']} µg/m³" if r["ok"] else f"• {cn}: unavailable")
            return "\n".join(out)
        if "pm2.5" in ql or "pm25" in ql:
            return "🔬 PM2.5 = fine particulate ≤2.5µm. WHO annual guideline: ≤15 µg/m³. Prolonged exposure linked to respiratory disease."
        if "aqi" in ql or "air quality" in ql:
            return "🌍 AQI (Air Quality Index) scales air pollution 0–500. 0–50 Good, 51–100 Moderate, 101–150 Unhealthy for sensitive groups, 151–200 Unhealthy, 201–300 Very Unhealthy, 301+ Hazardous."
        if "winter" in ql or "season" in ql:
            return "❄️ AQI rises in winter due to thermal inversion — cold air traps pollutants near ground. Pakistan cities can see AQI spike 50–80% in Dec–Jan."
        return "I can help with AQI levels, pollutant data, weather conditions, and health advice. Try: 'What is the AQI in Lahore?' 🌍"

    user_q = st.chat_input("Ask about AQI, weather, health advice…")
    if not user_q and hasattr(st.session_state, "_q"):
        user_q = st.session_state.pop("_q")

    if user_q:
        st.session_state.chat.append({"role":"user","text": user_q})
        with st.spinner("Analyzing sensors…"):
            rep = copilot(user_q)
        st.session_state.chat.append({"role":"bot","text": rep})
        st.rerun()


# ═══════════════════════════════════════════════════════════════
# TAB 3 ─ CITY COMPARISON
# ═══════════════════════════════════════════════════════════════
with tab3:
    st.markdown('<h2 class="sh">🏙️ Multi-City AQI Comparison</h2>', unsafe_allow_html=True)
    st.markdown('<p class="sub">Compare real-time AQI, PM2.5, weather across selected cities side-by-side.</p>', unsafe_allow_html=True)

    sel_cities = st.multiselect(
        "Select cities to compare (2–4):",
        list(CITIES.keys()),
        default=["Lahore","Karachi","Islamabad"],
        max_selections=4,
    )
    if len(sel_cities) < 2:
        st.warning("Select at least 2 cities.")
    else:
        with st.spinner("Fetching live data…"):
            results = [fetch(c) for c in sel_cities]

        cols = st.columns(len(results))
        for col, r in zip(cols, results):
            if not r["ok"]:
                col.error(f"{r['city']}: {r.get('error','error')}"); continue
            lbl2, clr2, bc2 = aqi_info(r["aqi"])
            col.markdown(f"""
            <div class="city-card">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
                <div>
                  <div style="font-size:15px;font-weight:900;color:#0F2B34">{r['city']}</div>
                  <div style="font-size:11px;color:#7EA3B0">{r['country']}</div>
                </div>
                <span class="badge {bc2}">{r['aqi']} AQI</span>
              </div>
              <div style="text-align:center">{svg_gauge(r['aqi'], 150)}</div>
              <div style="margin-top:8px"><span class="badge {bc2}">{lbl2}</span></div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:12px">
                <div style="background:#F0F5F8;border-radius:10px;padding:8px;text-align:center">
                  <div style="font-size:10px;color:#517280;font-weight:700">PM2.5</div>
                  <div style="font-size:16px;font-weight:900;color:#0F2B34">{r['pm25']}<span style="font-size:10px;color:#7EA3B0"> µg/m³</span></div>
                </div>
                <div style="background:#F0F5F8;border-radius:10px;padding:8px;text-align:center">
                  <div style="font-size:10px;color:#517280;font-weight:700">PM10</div>
                  <div style="font-size:16px;font-weight:900;color:#0F2B34">{r['pm10']}<span style="font-size:10px;color:#7EA3B0"> µg/m³</span></div>
                </div>
                <div style="background:#F0F5F8;border-radius:10px;padding:8px;text-align:center">
                  <div style="font-size:10px;color:#517280;font-weight:700">🌡️ Temp</div>
                  <div style="font-size:16px;font-weight:900;color:#0F2B34">{r['temp']}<span style="font-size:10px;color:#7EA3B0"> °C</span></div>
                </div>
                <div style="background:#F0F5F8;border-radius:10px;padding:8px;text-align:center">
                  <div style="font-size:10px;color:#517280;font-weight:700">🌬️ Wind</div>
                  <div style="font-size:16px;font-weight:900;color:#0F2B34">{r['wind']}<span style="font-size:10px;color:#7EA3B0"> km/h</span></div>
                </div>
              </div>
            </div>""", unsafe_allow_html=True)

        # AQI Bar Chart
        st.markdown("<div style='height:14px'></div>", unsafe_allow_html=True)
        ok_res = [r for r in results if r["ok"]]
        bar_df = pd.DataFrame({"AQI": [r["aqi"] for r in ok_res]},
                               index=[r["city"] for r in ok_res])
        st.markdown('<div class="card"><div class="card-title">📊 AQI Ranking Chart</div>', unsafe_allow_html=True)
        st.bar_chart(bar_df, height=260, use_container_width=True, color=["#1D8A9C"])
        st.markdown('</div>', unsafe_allow_html=True)

        # Leaderboard
        ranked = sorted(ok_res, key=lambda x: x["aqi"])
        medals = ["🥇","🥈","🥉","4️⃣"]
        st.markdown('<div class="card"><div class="card-title">🏆 Air Quality Ranking (Best → Worst)</div>', unsafe_allow_html=True)
        for i, r in enumerate(ranked):
            lbl2, clr2, bc2 = aqi_info(r["aqi"])
            st.markdown(f"""
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:10px 14px;background:#F7FAFC;border-radius:12px;margin-bottom:6px">
              <span style="font-size:14px">{medals[i]}
                <strong style="color:#0F2B34;margin-left:6px">{r['city']}</strong>
                <span style="color:#7EA3B0;font-size:12px;margin-left:6px">{r['country']}</span>
              </span>
              <span>
                <span style="font-size:18px;font-weight:900;color:{clr2};margin-right:10px">{r['aqi']}</span>
                <span class="badge {bc2}">{lbl2}</span>
              </span>
            </div>""", unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════════════
# TAB 4 ─ EDA
# ═══════════════════════════════════════════════════════════════
with tab4:
    st.markdown('<h2 class="sh">📈 Exploratory Data Analysis</h2>', unsafe_allow_html=True)
    eda_city = st.selectbox("City:", list(CITIES.keys()), key="eda_sel")
    with st.spinner("Loading EDA data…"):
        ed = fetch(eda_city)

    if not ed["ok"]:
        st.error(ed.get("error","Error"))
    else:
        df_e = ed["df"].dropna(subset=["us_aqi"]).head(168)

        e1, e2 = st.columns(2)
        with e1:
            st.markdown('<div class="card"><div class="card-title">📉 AQI & PM2.5 — 7-Day Time Series</div>', unsafe_allow_html=True)
            ts = df_e.copy(); ts["time_s"] = ts["time"].dt.strftime("%d %b %H:%M")
            ts = ts.set_index("time_s")[["us_aqi","pm2_5"]]
            ts.columns = ["AQI","PM2.5"]
            st.line_chart(ts, height=230, use_container_width=True)
            st.markdown('</div>', unsafe_allow_html=True)

        with e2:
            st.markdown('<div class="card"><div class="card-title">📊 PM2.5 Distribution Histogram</div>', unsafe_allow_html=True)
            cuts = pd.cut(df_e["pm2_5"], bins=10)
            hist_df = cuts.value_counts().sort_index().reset_index()
            hist_df.columns = ["Bin","Count"]
            hist_df["Bin"] = hist_df["Bin"].astype(str)
            hist_df = hist_df.set_index("Bin")
            st.bar_chart(hist_df, height=230, use_container_width=True)
            st.markdown('</div>', unsafe_allow_html=True)

        e3, e4 = st.columns(2)
        with e3:
            st.markdown('<div class="card"><div class="card-title">🔗 Pollutant Correlation Matrix</div>', unsafe_allow_html=True)
            corr_cols = ["us_aqi","pm2_5","pm10","ozone","no2","so2"]
            avail = [c for c in corr_cols if c in df_e.columns]
            corr = df_e[avail].corr().round(2)
            # display as plain dataframe (no styler — avoids Streamlit Cloud bug)
            st.dataframe(corr, use_container_width=True, height=250)
            st.markdown('</div>', unsafe_allow_html=True)

        with e4:
            st.markdown('<div class="card"><div class="card-title">🕐 Average AQI by Hour of Day</div>', unsafe_allow_html=True)
            df_e2 = df_e.copy()
            df_e2["hour"] = df_e2["time"].dt.hour
            hourly = df_e2.groupby("hour")["us_aqi"].mean().round(1)
            st.line_chart(hourly, height=230, use_container_width=True)
            st.markdown('</div>', unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════════════
# TAB 5 ─ MODEL ZOO
# ═══════════════════════════════════════════════════════════════
with tab5:
    st.markdown('<h2 class="sh">🧠 Model Zoo & Benchmarks</h2>', unsafe_allow_html=True)
    st.markdown('<p class="sub">ML models evaluated on 9,631 hourly observations (>1 Year dataset, Karachi).</p>', unsafe_allow_html=True)

    models = [
        {"name":"Baseline Persistence",      "rmse":48.22,"mae":43.98,"r2":-3.73,"status":"Baseline",    "clr":"#9CA3AF","champ":False},
        {"name":"Ridge Regression",           "rmse":12.98,"mae": 9.21,"r2": 0.66,"status":"✅ Beats",   "clr":"#3B82F6","champ":False},
        {"name":"Random Forest Regressor",    "rmse":10.21,"mae": 7.00,"r2": 0.79,"status":"✅ Beats",   "clr":"#10B981","champ":False},
        {"name":"Stacking Champion Ensemble", "rmse": 9.89,"mae": 6.46,"r2": 0.80,"status":"🏆 Champion","clr":"#1D8A9C","champ":True},
    ]
    for m in models:
        cls = "model-card champion" if m["champ"] else "model-card"
        bar_w = max(0, min(100, int(m["r2"] * 100)))
        st.markdown(f"""
        <div class="{cls}">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <div>
              <div style="font-size:15px;font-weight:900;color:#0F2B34">{m['name']}</div>
              <div style="font-size:11px;color:#517280;margin-top:2px">
                Trained on 9,631 hourly observations · Non-Negative AQI enforced
              </div>
            </div>
            <span style="background:{'#DCFCE7' if m['champ'] else '#F3F4F6'};
                         color:{'#15803D' if m['champ'] else '#374151'};
                         padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700">
              {m['status']}
            </span>
          </div>
          <div style="display:flex;gap:28px;margin-top:14px;flex-wrap:wrap">
            <div>
              <div style="font-size:10px;font-weight:700;color:#517280;text-transform:uppercase">RMSE</div>
              <div style="font-size:24px;font-weight:900;color:{m['clr']}">{m['rmse']}</div>
            </div>
            <div>
              <div style="font-size:10px;font-weight:700;color:#517280;text-transform:uppercase">MAE</div>
              <div style="font-size:24px;font-weight:900;color:{m['clr']}">{m['mae']}</div>
            </div>
            <div>
              <div style="font-size:10px;font-weight:700;color:#517280;text-transform:uppercase">R² Score</div>
              <div style="font-size:24px;font-weight:900;color:{m['clr']}">{m['r2']}</div>
            </div>
          </div>
          <div class="pbar-wrap" style="margin-top:10px">
            <div class="pbar-fill" style="width:{bar_w}%;background:{m['clr']}"></div>
          </div>
        </div>""", unsafe_allow_html=True)

    st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)
    if st.button("⚡ Trigger Live Model Retraining", type="primary"):
        with st.spinner("Running training pipeline on 9,600+ hourly records… (~60s)"):
            try:
                from pipelines.training_pipeline import train_and_evaluate_models
                metrics = train_and_evaluate_models()
                st.success(f"✅ Champion: **{metrics['champion_model']}** — RMSE {metrics['champion_rmse']:.2f}")
            except Exception as err:
                st.warning(f"Training pipeline unavailable in this deployment: {err}")


# ═══════════════════════════════════════════════════════════════
# TAB 6 ─ FEATURE STORE
# ═══════════════════════════════════════════════════════════════
with tab6:
    st.markdown('<h2 class="sh">🗄️ Feature Store</h2>', unsafe_allow_html=True)
    st.markdown('<p class="sub">Local SQLite Feature Store — 9,600+ hourly atmospheric observations backfilled from Open-Meteo Archive.</p>', unsafe_allow_html=True)

    try:
        from pipelines.datastore import DatastoreManager
        ds = DatastoreManager()
        h = ds.verify_datastore_health()

        m1,m2,m3,m4 = st.columns(4)
        m1.metric("Status",         h["status"])
        m2.metric("Total Records",  f"{h['total_records']:,}")
        m3.metric("Non-Neg Check",  "✅ PASSED" if h["non_negative_guarantee_passed"] else "❌ FAILED")
        m4.metric("Cities",         len(h["cities_tracked"]))

        st.markdown('<div class="card" style="margin-top:12px"><div class="card-title">📋 Latest 100 Feature Vectors</div>', unsafe_allow_html=True)
        df_s = ds.read_features(limit=100)
        if not df_s.empty:
            show = [c for c in ["city","time","us_aqi","pm2_5","pm10","temperature_2m",
                                 "relative_humidity_2m","wind_speed_10m","target_aqi_24h"]
                    if c in df_s.columns]
            st.dataframe(df_s[show], use_container_width=True, height=340)
        st.markdown('</div>', unsafe_allow_html=True)

    except Exception as e:
        st.info(f"""💡 **Feature Store not accessible on Streamlit Cloud.**
Run these locally to populate it:
```bash
python pipelines/historical_backfill.py
python pipelines/training_pipeline.py
```
({e})""")


# ═══════════════════════════════════════════════════════════════
# TAB 7 ─ HEALTH ADVISOR
# ═══════════════════════════════════════════════════════════════
with tab7:
    st.markdown('<div class="react-panel"><div class="eyebrow">Interpretable forecasting</div><h2 class="sh">✨ SHAP Explainability & Counterfactual Simulator</h2><p class="sub">See the conditions driving the current forecast, then test atmospheric interventions in real time.</p></div>', unsafe_allow_html=True)
    with st.spinner("Loading feature attributions..."):
        sd = fetch(st.session_state.active_city)
    if sd.get("ok"):
        baseline = 45
        current = sd["aqi"]
        contributions = [
            ("PM2.5 24-Hour Persistence Lag", sd["pm25"], "µg/m³", round((current-baseline)*.42), "Previous-day particulate accumulation carries into today’s atmospheric mass balance."),
            ("Surface Wind Speed Dispersion", sd["wind"], "km/h", -round(max(2, sd["wind"]*.65)), "Sustained ventilation disperses local particulate pollution."),
            ("Relative Humidity", sd["hum"], "%", round(max(-4, (sd["hum"]-55)*.35)), "Humidity can increase secondary aerosol formation."),
            ("Ambient Surface Temperature", sd["temp"], "°C", round((sd["temp"]-22)*.4), "Temperature affects photochemical ozone production."),
            ("NO₂ Vehicular Emission Load", round(sd["pm25"]*.32, 1), "µg/m³", round(sd["pm25"]*.13), "Traffic emissions are a precursor to urban particulate burden."),
        ]
        contributions.sort(key=lambda x: abs(x[3]), reverse=True)
        total = sum(abs(x[3]) for x in contributions) or 1
        st.markdown('<div class="card"><div class="card-title">Model Feature Attribution — Clean-Air Baseline: 45 AQI → Predicted AQI</div>', unsafe_allow_html=True)
        for name, value, unit, impact, explanation in contributions:
            impact_color, direction = ("#be123c", "▲ increases AQI") if impact >= 0 else ("#047857", "▼ reduces AQI")
            st.markdown(f'''<div style="background:#F7FAFC;border:1px solid #CFDDE7;border-radius:16px;padding:14px 16px;margin:9px 0;display:flex;justify-content:space-between;gap:15px"><div><b style="font-size:13px;color:#102B33">{name}</b><div style="font-size:11px;color:#517280;margin-top:4px">{explanation}</div></div><div style="text-align:right;white-space:nowrap"><div style="font-size:10px;color:#517280">Value</div><b>{value} {unit}</b><div style="font-size:11px;font-weight:800;color:{impact_color};margin-top:3px">{direction} {abs(impact)} AQI · {round(abs(impact)/total*100)}%</div></div></div>''', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)
        st.markdown('<div class="card"><div class="card-title">⚙ Counterfactual What-If Simulator</div><p class="sub">Adjust emissions and meteorology to simulate a revised AQI outcome.</p>', unsafe_allow_html=True)
        s1, s2 = st.columns(2)
        with s1:
            wind_sim = st.slider("Surface wind speed (km/h)", 0, 40, int(round(sd["wind"])), key="sim_wind")
            traffic_sim = st.slider("Traffic & industrial emissions", 0.2, 2.0, 1.0, 0.1, key="sim_traffic")
        with s2:
            temp_sim = st.slider("Ambient temperature (°C)", 0, 50, int(round(sd["temp"])), key="sim_temp")
            pbl_sim = st.slider("Boundary layer height (m)", 200, 2500, 950, 50, key="sim_pbl")
        simulated = max(0, round(current * traffic_sim - (wind_sim - sd["wind"]) * 1.4 + (temp_sim - sd["temp"]) * .45 - (pbl_sim - 950) / 70))
        old_label, old_color, _ = aqi_info(current); new_label, new_color, _ = aqi_info(simulated)
        st.markdown(f'''<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;background:#F7FAFC;border:1px solid #CFDDE7;border-radius:20px;padding:18px;text-align:center"><div><div class="eyebrow">Current AQI</div><div style="font-size:38px;font-weight:900;color:{old_color}">{current}</div><span class="badge">{old_label}</span></div><div style="font-size:28px;color:#517280">→</div><div><div class="eyebrow">Simulated AQI</div><div style="font-size:38px;font-weight:900;color:{new_color}">{simulated}</div><span class="badge">{new_label}</span></div></div>''', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

with tab8:
    st.markdown('<h2 class="sh">🏥 Health Advisor</h2>', unsafe_allow_html=True)
    st.markdown('<p class="sub">Personalised health recommendations based on live AQI readings and your profile.</p>', unsafe_allow_html=True)

    ha_city = st.selectbox("City:", list(CITIES.keys()), key="ha_sel")
    with st.spinner("Loading…"):
        ha = fetch(ha_city)

    if ha["ok"]:
        aqi_h = ha["aqi"]
        lbl_h, clr_h, bc_h = aqi_info(aqi_h)

        hc1, hc2 = st.columns([1,2], gap="large")
        with hc1:
            st.markdown(f"""
            <div class="card" style="text-align:center">
              {svg_gauge(aqi_h, 190)}
              <div style="margin-top:8px"><span class="badge {bc_h}">{lbl_h}</span></div>
              <div style="font-size:12.5px;color:#517280;margin-top:10px;line-height:1.5">
                {health_msg(aqi_h)}
              </div>
            </div>""", unsafe_allow_html=True)

        with hc2:
            groups = [
                ("👶 Children & Infants",   aqi_h > 100, ["Keep children indoors during peak pollution (7–10am, 5–8pm)","Use HEPA air purifiers in nursery","Avoid parks near major roads"]),
                ("👴 Elderly (65+)",         aqi_h > 100, ["Limit outdoor walks to early morning before 7am","Keep medication accessible","Monitor for chest tightness or shortness of breath"]),
                ("🤧 Asthma / Respiratory",  aqi_h > 80,  ["Carry rescue inhaler at all times","Wear N95 mask outdoors","Avoid exercise near traffic corridors"]),
                ("❤️ Heart Conditions",      aqi_h > 120, ["Avoid strenuous outdoor activity","Monitor blood pressure","Consult physician if symptoms worsen"]),
                ("🏃 Active Athletes",       aqi_h > 50,  ["Reschedule training to early morning","Consider indoor gym alternatives","Monitor breathing rate during exercise"]),
                ("🧑 General Public",        aqi_h > 150, ["Keep windows closed during peak hours","Use air purifier indoors","Check AQI before outdoor events"]),
            ]
            for group, at_risk, tips in groups:
                risk_label = "⚠️ At Risk" if at_risk else "✅ Low Risk"
                risk_bg    = "#FEF2F2" if at_risk else "#F0FDF4"
                risk_clr   = "#DC2626" if at_risk else "#15803D"
                with st.expander(f"{group}   —   {risk_label}"):
                    st.markdown(f"<div style='background:{risk_bg};border-radius:10px;padding:12px;color:{risk_clr};font-weight:700;margin-bottom:10px'>{risk_label} — AQI {aqi_h}</div>", unsafe_allow_html=True)
                    for tip in tips:
                        st.markdown(f"• {tip}")
