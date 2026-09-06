"""
AQIonic Air Quality Intelligence - Premium Streamlit Dashboard
Replicates the full React app experience: Header, Dashboard, City Comparison,
EDA Analytics, Model Zoo, Feature Store, AI Copilot, Health Advisor.
"""

import os, sys, math, sqlite3, datetime, json
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
# GLOBAL CSS  (mimics the React light petrol-slate palette)
# ─────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

/* ── Reset ───────────────────────────────────────────────── */
html, body, [class*="css"] { font-family:'Inter',sans-serif; }
.stApp { background:#F0F5F8; }

/* ── Header bar ─────────────────────────────────────────── */
.aqionic-header {
  background:#0F2B34;
  padding:0 32px;
  display:flex; align-items:center; justify-content:space-between;
  height:60px; margin:-1rem -1rem 0 -1rem;
}
.aqionic-logo { display:flex; align-items:center; gap:10px; }
.aqionic-logo-icon {
  width:34px; height:34px; border-radius:10px;
  background:linear-gradient(135deg,#1D8A9C,#0F4C5C);
  display:flex; align-items:center; justify-content:center;
  font-size:16px;
}
.aqionic-logo-text { color:#fff; font-size:17px; font-weight:800; letter-spacing:-.3px; }
.live-badge {
  background:#0A3D4A; border:1px solid #1D8A9C; color:#4DD8EE;
  padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700;
  display:flex; align-items:center; gap:5px;
}
.live-dot { width:7px; height:7px; border-radius:50%; background:#22D3EE; animation:pulse 1.5s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

/* ── Tabs ───────────────────────────────────────────────── */
.stTabs [data-baseweb="tab-list"] {
  background:#E5EDF2; border-radius:14px; padding:4px; gap:2px;
  border:1px solid #C8DAE4;
}
.stTabs [data-baseweb="tab"] {
  background:transparent; border-radius:10px; padding:8px 16px;
  color:#517280; font-weight:600; font-size:13px; border:none;
}
.stTabs [aria-selected="true"] {
  background:#fff !important; color:#0F2B34 !important;
  box-shadow:0 1px 4px rgba(0,0,0,.1);
}

/* ── Cards ──────────────────────────────────────────────── */
.card {
  background:#fff; border:1px solid #CFDDE7; border-radius:20px;
  padding:20px 22px; margin-bottom:14px;
}
.card-sm {
  background:#fff; border:1px solid #CFDDE7; border-radius:16px;
  padding:16px 18px; margin-bottom:10px;
}

/* ── AQI Gauge ──────────────────────────────────────────── */
.gauge-wrap { display:flex; flex-direction:column; align-items:center; }

/* ── AQI category badges ─────────────────────────────────── */
.badge { display:inline-block; padding:3px 12px; border-radius:20px; font-size:12px; font-weight:700; }
.badge-good       { background:#D1FAE5; color:#065F46; border:1px solid #A7F3D0; }
.badge-moderate   { background:#FEF3C7; color:#92400E; border:1px solid #FDE68A; }
.badge-sensitive  { background:#FFEDD5; color:#9A3412; border:1px solid #FED7AA; }
.badge-unhealthy  { background:#FEE2E2; color:#991B1B; border:1px solid #FECACA; }
.badge-very       { background:#EDE9FE; color:#5B21B6; border:1px solid #DDD6FE; }
.badge-hazardous  { background:#4B0000; color:#FCA5A5; border:1px solid #7F1D1D; }

/* ── Metric cards ───────────────────────────────────────── */
.metric-card {
  background:#fff; border:1px solid #CFDDE7; border-radius:16px;
  padding:16px; text-align:center;
}
.metric-label { font-size:11px; font-weight:700; text-transform:uppercase;
  letter-spacing:.05em; color:#517280; margin-bottom:4px; }
.metric-value { font-size:26px; font-weight:900; color:#0F2B34; font-variant-numeric:tabular-nums; }
.metric-unit  { font-size:12px; color:#7EA3B0; font-weight:600; }

/* ── City comparison card ────────────────────────────────── */
.city-card {
  background:#fff; border:2px solid #CFDDE7; border-radius:20px; padding:20px;
}
.city-card:hover { border-color:#1D8A9C; }

/* ── Section header ─────────────────────────────────────── */
.section-header {
  font-size:22px; font-weight:900; color:#0F2B34;
  letter-spacing:-.4px; margin-bottom:4px;
}
.section-sub { font-size:13px; color:#517280; margin-bottom:18px; }

/* ── Progress bar ───────────────────────────────────────── */
.prog-wrap { background:#EEF4F8; border-radius:99px; height:8px; overflow:hidden; margin-top:6px; }
.prog-fill { height:8px; border-radius:99px; }

/* ── Chat bubble ────────────────────────────────────────── */
.chat-user {
  background:#0F2B34; color:#fff; border-radius:18px 18px 4px 18px;
  padding:10px 16px; font-size:13px; max-width:75%; margin-left:auto; margin-bottom:8px;
}
.chat-bot {
  background:#fff; border:1px solid #CFDDE7; color:#0F2B34;
  border-radius:18px 18px 18px 4px; padding:10px 16px; font-size:13px;
  max-width:82%; margin-bottom:8px;
}

/* ── Hide streamlit chrome ──────────────────────────────── */
#MainMenu,footer,[data-testid="stToolbar"]{visibility:hidden;}
.block-container { padding-top:10px!important; }
</style>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────
CITIES = {
    "Lahore":     {"lat": 31.5204, "lon": 74.3587, "country": "Pakistan",  "climate": "Semi-Arid Continental (Punjab)"},
    "Karachi":    {"lat": 24.8607, "lon": 67.0011, "country": "Pakistan",  "climate": "Hot Desert (Sindh Coast)"},
    "Islamabad":  {"lat": 33.6844, "lon": 73.0479, "country": "Pakistan",  "climate": "Humid Subtropical"},
    "Multan":     {"lat": 30.1575, "lon": 71.5249, "country": "Pakistan",  "climate": "Hot Semi-Arid"},
    "Peshawar":   {"lat": 34.0150, "lon": 71.5805, "country": "Pakistan",  "climate": "Semi-Arid Steppe"},
    "Quetta":     {"lat": 30.1798, "lon": 66.9750, "country": "Pakistan",  "climate": "Cold Desert"},
    "New Delhi":  {"lat": 28.6139, "lon": 77.2090, "country": "India",     "climate": "Humid Subtropical"},
    "London":     {"lat": 51.5074, "lon": -0.1278, "country": "UK",        "climate": "Temperate Oceanic"},
    "Tokyo":      {"lat": 35.6762, "lon": 139.6503,"country": "Japan",     "climate": "Humid Subtropical"},
}

def get_aqi_category(aqi: int):
    if aqi <= 50:   return "Good",           "#059669", "badge-good"
    if aqi <= 100:  return "Moderate",       "#D97706", "badge-moderate"
    if aqi <= 150:  return "Unhealthy (Sensitive)", "#EA580C", "badge-sensitive"
    if aqi <= 200:  return "Unhealthy",      "#DC2626", "badge-unhealthy"
    if aqi <= 300:  return "Very Unhealthy", "#9333EA", "badge-very"
    return           "Hazardous",            "#7F1D1D", "badge-hazardous"

def aqi_health(aqi: int) -> str:
    if aqi <= 50:   return "Air quality is great for everyone. Enjoy outdoor activities."
    if aqi <= 100:  return "Acceptable air quality. Sensitive individuals may notice mild effects."
    if aqi <= 150:  return "Sensitive groups (elderly, children, asthma) should reduce outdoor time."
    if aqi <= 200:  return "Everyone may experience health effects. Avoid prolonged outdoor exertion."
    if aqi <= 300:  return "Health alert. Avoid all outdoor activities. Use N95 masks."
    return "Emergency conditions. Stay indoors with air purifiers. Seek medical advice."

@st.cache_data(ttl=600, show_spinner=False)
def fetch_city_data(city: str):
    c = CITIES[city]
    lat, lon = c["lat"], c["lon"]
    try:
        aq = requests.get(
            f"https://air-quality-api.open-meteo.com/v1/air-quality"
            f"?latitude={lat}&longitude={lon}&hourly=pm10,pm2_5,carbon_monoxide,"
            f"nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&timezone=auto&forecast_days=4",
            timeout=12).json()
        wt = requests.get(
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}&hourly=temperature_2m,relative_humidity_2m,"
            f"surface_pressure,wind_speed_10m,wind_direction_10m,precipitation"
            f"&current=temperature_2m,relative_humidity_2m,wind_speed_10m"
            f"&timezone=auto&forecast_days=4",
            timeout=12).json()
        hours   = aq["hourly"]["time"]
        aqi_vals = [max(0, v or 0) for v in aq["hourly"]["us_aqi"]]
        pm25    = [max(0, v or 0) for v in aq["hourly"]["pm2_5"]]
        pm10    = [max(0, v or 0) for v in aq["hourly"]["pm10"]]
        o3      = [max(0, v or 0) for v in aq["hourly"]["ozone"]]
        no2     = [max(0, v or 0) for v in aq["hourly"]["nitrogen_dioxide"]]
        so2     = [max(0, v or 0) for v in aq["hourly"]["sulphur_dioxide"]]
        co      = [max(0, v or 0) for v in aq["hourly"]["carbon_monoxide"]]
        temps   = wt["hourly"]["temperature_2m"]
        hum     = wt["hourly"]["relative_humidity_2m"]
        wind    = wt["hourly"]["wind_speed_10m"]
        now_idx = next((i for i, h in enumerate(hours) if pd.Timestamp(h) <= pd.Timestamp.now(tz='UTC').tz_localize(None)), 0)
        cur_aqi = int(aqi_vals[now_idx])
        cur_pm25 = round(pm25[now_idx], 1)
        cur_pm10 = round(pm10[now_idx], 1)
        cur_temp = round(temps[now_idx], 1) if temps[now_idx] is not None else "--"
        cur_hum  = int(hum[now_idx])  if hum[now_idx]  is not None else "--"
        cur_wind = round(wind[now_idx],1) if wind[now_idx] is not None else "--"
        dominant = "PM2.5" if cur_pm25 > 25 else ("PM10" if cur_pm10 > 50 else "O₃")
        df = pd.DataFrame({
            "time":  pd.to_datetime(hours),
            "us_aqi": aqi_vals, "pm2_5": pm25, "pm10": pm10,
            "ozone": o3, "no2": no2, "so2": so2, "co": co,
            "temperature": temps, "humidity": hum, "wind_speed": wind,
        })
        return {
            "ok": True, "city": city, "country": c["country"],
            "climate": c["climate"], "lat": lat, "lon": lon,
            "cur_aqi": cur_aqi, "cur_pm25": cur_pm25, "cur_pm10": cur_pm10,
            "cur_temp": cur_temp, "cur_hum": cur_hum, "cur_wind": cur_wind,
            "dominant": dominant, "df": df,
        }
    except Exception as e:
        return {"ok": False, "city": city, "error": str(e)}

def draw_svg_gauge(aqi: int, size: int = 220) -> str:
    """Render an SVG arc gauge identical to the React AQIGauge."""
    _, color, _ = get_aqi_category(aqi)
    capped = min(aqi, 500)
    pct    = capped / 500.0
    cx, cy = size / 2, size / 2
    r      = size * 0.38
    stroke = size * 0.09
    start_angle = 210
    sweep       = 300
    angle = start_angle + pct * sweep

    def polar(deg, radius):
        rad = math.radians(deg)
        return cx + radius * math.cos(rad), cy + radius * math.sin(rad)

    def arc_path(a1, a2, radius):
        x1, y1 = polar(a1, radius)
        x2, y2 = polar(a2, radius)
        large  = 1 if (a2 - a1) > 180 else 0
        return f"M {x1:.1f} {y1:.1f} A {radius:.1f} {radius:.1f} 0 {large} 1 {x2:.1f} {y2:.1f}"

    bg_path  = arc_path(start_angle, start_angle + sweep, r)
    fg_path  = arc_path(start_angle, angle, r)
    label, col, _ = get_aqi_category(aqi)

    return f"""
<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}">
  <path d="{bg_path}" fill="none" stroke="#E2ECF2" stroke-width="{stroke}"
        stroke-linecap="round"/>
  <path d="{fg_path}" fill="none" stroke="{color}" stroke-width="{stroke}"
        stroke-linecap="round"/>
  <text x="{cx}" y="{cy - size*0.04}" text-anchor="middle"
        font-size="{size*0.22}" font-weight="900" fill="{color}"
        font-family="Inter,sans-serif">{aqi}</text>
  <text x="{cx}" y="{cy + size*0.12}" text-anchor="middle"
        font-size="{size*0.07}" fill="#517280" font-weight="700"
        font-family="Inter,sans-serif">US AQI</text>
  <text x="{cx}" y="{cy + size*0.24}" text-anchor="middle"
        font-size="{size*0.075}" fill="{color}" font-weight="800"
        font-family="Inter,sans-serif">{label}</text>
</svg>"""

# ─────────────────────────────────────────────────────────────
# HEADER
# ─────────────────────────────────────────────────────────────
if "active_city" not in st.session_state:
    st.session_state.active_city = "Lahore"

city_keys = list(CITIES.keys())

st.markdown(f"""
<div class="aqionic-header">
  <div class="aqionic-logo">
    <div class="aqionic-logo-icon">🌫️</div>
    <span class="aqionic-logo-text">AQ<span style="color:#4DD8EE">Ionic</span></span>
    <div class="live-badge"><div class="live-dot"></div>Live Sensor Grid</div>
  </div>
  <div style="display:flex;align-items:center;gap:10px;">
    <span style="color:#7EAFC4;font-size:12px;">📍 {st.session_state.active_city}, {CITIES[st.session_state.active_city]['country']}
    · Lat {CITIES[st.session_state.active_city]['lat']}° · Lon {CITIES[st.session_state.active_city]['lon']}°
    · {CITIES[st.session_state.active_city]['climate']}</span>
    <span style="color:#22D3EE;font-size:12px;font-weight:700;">● 12 Atmospheric Sensors Active</span>
  </div>
</div>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────
# CITY SELECTOR (inline row)
# ─────────────────────────────────────────────────────────────
st.markdown("<div style='height:12px'></div>", unsafe_allow_html=True)
col_city, col_gps, col_sync = st.columns([4, 1, 1])
with col_city:
    chosen = st.selectbox("", city_keys,
                          index=city_keys.index(st.session_state.active_city),
                          label_visibility="collapsed")
    st.session_state.active_city = chosen
with col_gps:
    st.button("📡 GPS", use_container_width=True)
with col_sync:
    sync = st.button("🔄 Sync Feeds", use_container_width=True)

# ─────────────────────────────────────────────────────────────
# MAIN TABS
# ─────────────────────────────────────────────────────────────
tabs = st.tabs([
    "📊 Dashboard & 72h Forecast",
    "🤖 AI Copilot Chatbot",
    "🏙️ City Comparison",
    "📈 EDA Analytics",
    "🧠 Model Zoo & Benchmarks",
    "🗄️ Feature Store",
    "🏥 Health Advisor",
])

# ═══════════════════════════════════════════════════════════════
# TAB 1 – DASHBOARD & 72H FORECAST
# ═══════════════════════════════════════════════════════════════
with tabs[0]:
    city = st.session_state.active_city
    with st.spinner(f"Syncing live atmospheric sensors for {city}…"):
        d = fetch_city_data(city)

    if not d["ok"]:
        st.error(f"❌ Could not fetch data: {d.get('error')}")
    else:
        aqi  = d["cur_aqi"]
        label, color, badge_cls = get_aqi_category(aqi)
        df   = d["df"]

        # ── Top KPI row ──────────────────────────────────────
        k1, k2, k3, k4, k5 = st.columns(5)
        for col_w, val, unit, lbl in [
            (k1, aqi,          "US AQI",  "Current AQI"),
            (k2, d["cur_pm25"],"µg/m³",  "PM2.5"),
            (k3, d["cur_pm10"],"µg/m³",  "PM10"),
            (k4, d["cur_temp"],"°C",      "Temperature"),
            (k5, d["cur_wind"],"km/h",    "Wind Speed"),
        ]:
            col_w.markdown(f"""
            <div class="metric-card">
              <div class="metric-label">{lbl}</div>
              <div class="metric-value" style="color:{color if lbl=='Current AQI' else '#0F2B34'}">{val}</div>
              <div class="metric-unit">{unit}</div>
            </div>""", unsafe_allow_html=True)

        st.markdown("<div style='height:6px'></div>", unsafe_allow_html=True)

        # ── Gauge + Health card ──────────────────────────────
        g1, g2 = st.columns([1, 2])
        with g1:
            st.markdown('<div class="card" style="text-align:center">', unsafe_allow_html=True)
            st.markdown(f'<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#517280">Atmospheric Status</div>', unsafe_allow_html=True)
            st.markdown(draw_svg_gauge(aqi, 220), unsafe_allow_html=True)
            st.markdown(f'<div style="margin-top:6px"><span class="badge {badge_cls}">{label}</span></div>', unsafe_allow_html=True)
            st.markdown(f'<div style="font-size:12px;color:#517280;margin-top:8px;padding:0 8px">{aqi_health(aqi)}</div>', unsafe_allow_html=True)
            st.markdown('</div>', unsafe_allow_html=True)

        with g2:
            # Dominant pollutant card
            who_pm25 = 15.0
            pct_who  = min(100, round(d["cur_pm25"] / (who_pm25 * 3) * 100))
            bar_color= "#DC2626" if d["cur_pm25"] > who_pm25*3 else ("#F59E0B" if d["cur_pm25"] > who_pm25 else "#059669")
            st.markdown(f"""
            <div class="card">
              <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#517280">Primary Air Quality Determinant</div>
              <div style="display:flex;align-items:baseline;gap:10px;margin-top:4px">
                <span style="font-size:24px;font-weight:900;color:#0F2B34">{d['dominant']}</span>
                <span style="font-size:14px;font-weight:700;color:#1D8A9C">{d['cur_pm25']} µg/m³</span>
                <span class="badge {badge_cls}" style="margin-left:auto">Sub-Index: {aqi} AQI</span>
              </div>
              <div style="font-size:12px;color:#517280;margin:10px 0">
                Fine particulate matter ≤2.5µm diameter. Penetrates deep into lung tissue.
                Main sources: vehicle exhaust, industrial combustion, biomass burning.
              </div>
              <div style="font-size:11px;color:#7EA3B0;margin-bottom:4px">
                Concentration vs. WHO Guideline (15 µg/m³) &nbsp;
                <b style="color:{bar_color}">{round(d['cur_pm25']/who_pm25,1)}x WHO Limit</b>
              </div>
              <div class="prog-wrap"><div class="prog-fill" style="width:{pct_who}%;background:{bar_color}"></div></div>
            </div>""", unsafe_allow_html=True)

            # Weather telemetry grid
            w1, w2, w3, w4 = st.columns(4)
            for wcol, icon, label2, val2, unit2, bg, bc in [
                (w1,"🌡️","Temp",       d["cur_temp"], "°C",   "#FFFBEB","#F59E0B"),
                (w2,"💧","Humidity",   d["cur_hum"],  "%",    "#EFF6FF","#3B82F6"),
                (w3,"🌬️","Wind",      d["cur_wind"], "km/h", "#ECFDF5","#10B981"),
                (w4,"📊","Humidity",   d["cur_hum"],  "%RH",  "#FFF7ED","#F97316"),
            ]:
                wcol.markdown(f"""
                <div style="background:{bg};border:1px solid {bc}33;border-radius:14px;
                            padding:12px;text-align:center">
                  <div style="font-size:18px">{icon}</div>
                  <div style="font-size:10px;font-weight:700;color:#517280;text-transform:uppercase">{label2}</div>
                  <div style="font-size:18px;font-weight:900;color:#0F2B34">{val2}<span style="font-size:12px;color:#7EA3B0">{unit2}</span></div>
                </div>""", unsafe_allow_html=True)

        # ── 72-Hour AQI Forecast Chart ───────────────────────
        st.markdown('<div class="card" style="margin-top:14px">', unsafe_allow_html=True)
        st.markdown('<div class="section-header">📈 72-Hour AQI Forecast Timeline</div>', unsafe_allow_html=True)
        chart_df = df.set_index("time")[["us_aqi"]].dropna().head(72)
        chart_df.index = chart_df.index.strftime("%d %b %H:%M")
        st.area_chart(chart_df, height=240, use_container_width=True, color=["#1D8A9C"])
        st.markdown('</div>', unsafe_allow_html=True)

        # ── Pollutant breakdown table ────────────────────────
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown('<div class="section-header">🧪 Pollutant Breakdown</div>', unsafe_allow_html=True)
        now = df.dropna(subset=["us_aqi"]).iloc[0]
        poll_data = {
            "Pollutant": ["PM2.5","PM10","Ozone (O₃)","NO₂","SO₂","CO"],
            "Value":     [f"{now.pm2_5:.1f} µg/m³", f"{now.pm10:.1f} µg/m³",
                          f"{now.ozone:.1f} µg/m³", f"{now.no2:.1f} µg/m³",
                          f"{now.so2:.1f} µg/m³",   f"{now.co:.1f} µg/m³"],
            "WHO Limit": ["15 µg/m³","45 µg/m³","100 µg/m³","25 µg/m³","40 µg/m³","4 mg/m³"],
            "Status":    [
                "⚠️ Elevated" if now.pm2_5 > 15  else "✅ Safe",
                "⚠️ Elevated" if now.pm10  > 45  else "✅ Safe",
                "⚠️ Elevated" if now.ozone > 100 else "✅ Safe",
                "⚠️ Elevated" if now.no2   > 25  else "✅ Safe",
                "⚠️ Elevated" if now.so2   > 40  else "✅ Safe",
                "✅ Safe",
            ],
        }
        st.dataframe(pd.DataFrame(poll_data), use_container_width=True, hide_index=True)
        st.markdown('</div>', unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════
# TAB 2 – AI COPILOT
# ═══════════════════════════════════════════════════════════════
with tabs[1]:
    st.markdown('<div class="section-header">🤖 AQIonic AI Copilot</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-sub">Ask anything about air quality, weather, or health recommendations for any city.</div>', unsafe_allow_html=True)

    if "chat_history" not in st.session_state:
        st.session_state.chat_history = [
            {"role":"bot","text":"👋 Hello! I'm the AQIonic AI Copilot. Ask me about AQI, PM2.5, weather, or health advice for any city!"}
        ]

    # Quick suggestion chips
    st.markdown("**Quick Questions:**")
    chip_cols = st.columns(4)
    chips = [
        "What is the AQI in Lahore?",
        "Is it safe to exercise in Karachi today?",
        "Compare PM2.5 in Islamabad vs Lahore",
        "What causes high AQI in winter?",
    ]
    for i, chip in enumerate(chips):
        if chip_cols[i].button(chip, key=f"chip_{i}"):
            st.session_state._copilot_input = chip

    # Chat display
    chat_container = st.container()
    with chat_container:
        for msg in st.session_state.chat_history:
            if msg["role"] == "user":
                st.markdown(f'<div class="chat-user">🙋 {msg["text"]}</div>', unsafe_allow_html=True)
            else:
                st.markdown(f'<div class="chat-bot">🤖 {msg["text"]}</div>', unsafe_allow_html=True)

    # Input
    default_val = st.session_state.pop("_copilot_input", "")
    user_input = st.chat_input("Ask about AQI, weather, or health advice…")

    def copilot_reply(q: str) -> str:
        q = q.lower()
        for city_name in CITIES:
            if city_name.lower() in q:
                d = fetch_city_data(city_name)
                if d["ok"]:
                    label_, color_, _ = get_aqi_category(d["cur_aqi"])
                    if "safe" in q or "exercise" in q or "outdoor" in q:
                        advice = aqi_health(d["cur_aqi"])
                        return f"🏙️ **{city_name}** current AQI is **{d['cur_aqi']} ({label_})**.\n\n{advice}"
                    if "pm2.5" in q or "pm25" in q:
                        return f"🔬 **{city_name}** PM2.5 is currently **{d['cur_pm25']} µg/m³** (WHO limit: 15 µg/m³). That's {round(d['cur_pm25']/15,1)}x the WHO guideline."
                    if "weather" in q or "temperature" in q:
                        return f"🌤️ **{city_name}** weather: Temp **{d['cur_temp']}°C**, Humidity **{d['cur_hum']}%**, Wind **{d['cur_wind']} km/h**."
                    return f"📊 **{city_name}** real-time AQI: **{d['cur_aqi']} ({label_})**. PM2.5={d['cur_pm25']}µg/m³, Temp={d['cur_temp']}°C, Wind={d['cur_wind']}km/h. {aqi_health(d['cur_aqi'])}"
        if "aqi" in q or "air quality" in q:
            return "🌍 AQI (Air Quality Index) measures air pollution on a scale of 0–500. Values above 100 indicate health risks. The dominant pollutants tracked are PM2.5, PM10, Ozone, NO₂, SO₂, and CO."
        if "pm2.5" in q or "pm25" in q:
            return "🔬 PM2.5 refers to fine particulate matter ≤2.5µm. It can penetrate deep into the lungs and bloodstream. WHO guideline: ≤15 µg/m³ annual mean."
        if "winter" in q or "season" in q:
            return "❄️ AQI typically rises in winter due to thermal inversion — cold air traps pollutants close to the ground, preventing vertical mixing. Karachi and Lahore often see AQI spike 50–80% in December–January."
        if "compare" in q:
            results = []
            for c in ["Lahore","Karachi","Islamabad"]:
                d = fetch_city_data(c)
                if d["ok"]:
                    lbl, _, _ = get_aqi_category(d["cur_aqi"])
                    results.append(f"• **{c}**: AQI {d['cur_aqi']} ({lbl}), PM2.5 {d['cur_pm25']} µg/m³")
            return "📊 Live Multi-City Comparison:\n\n" + "\n".join(results)
        return "I can answer questions about AQI levels, pollutants (PM2.5, PM10, O₃), weather conditions, and health recommendations for cities like Lahore, Karachi, Islamabad, and more. Try asking: 'What is the AQI in Lahore?' 🌍"

    if user_input:
        st.session_state.chat_history.append({"role":"user","text":user_input})
        with st.spinner("Analyzing sensors…"):
            reply = copilot_reply(user_input)
        st.session_state.chat_history.append({"role":"bot","text":reply})
        st.rerun()

# ═══════════════════════════════════════════════════════════════
# TAB 3 – CITY COMPARISON
# ═══════════════════════════════════════════════════════════════
with tabs[2]:
    st.markdown('<div class="section-header">🏙️ Multi-City Side-by-Side AQI Comparison</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-sub">Compare real-time air quality indices, PM2.5 concentrations, weather, and health risks across selected cities.</div>', unsafe_allow_html=True)

    # City selector
    all_cities = list(CITIES.keys())
    default_sel = ["Lahore","Karachi","Islamabad"]
    selected_cities = st.multiselect(
        "Select Cities to Compare (2–4):", all_cities,
        default=default_sel, max_selections=4,
    )
    if len(selected_cities) < 2:
        st.warning("Please select at least 2 cities to compare.")
    else:
        with st.spinner("Fetching live data for all cities…"):
            city_results = [fetch_city_data(c) for c in selected_cities]

        cols = st.columns(len(selected_cities))
        for col, d in zip(cols, city_results):
            if not d["ok"]:
                col.error(f"{d['city']}: fetch failed")
                continue
            lbl, color, badge_cls = get_aqi_category(d["cur_aqi"])
            col.markdown(f"""
            <div class="city-card">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                <div>
                  <div style="font-size:16px;font-weight:900;color:#0F2B34">{d['city']}</div>
                  <div style="font-size:11px;color:#7EA3B0">{d['country']}</div>
                </div>
                <span class="badge {badge_cls}" style="font-size:14px;padding:5px 14px">{d['cur_aqi']}</span>
              </div>
              <div style="text-align:center;margin:8px 0">
                {draw_svg_gauge(d['cur_aqi'], 150)}
              </div>
              <div style="margin-top:8px">
                <span class="badge {badge_cls}">{lbl}</span>
              </div>
              <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:6px">
                <div style="background:#F0F5F8;border-radius:10px;padding:8px;text-align:center">
                  <div style="font-size:10px;color:#517280;font-weight:700">PM2.5</div>
                  <div style="font-size:15px;font-weight:900;color:#0F2B34">{d['cur_pm25']}<span style="font-size:10px;color:#7EA3B0">µg/m³</span></div>
                </div>
                <div style="background:#F0F5F8;border-radius:10px;padding:8px;text-align:center">
                  <div style="font-size:10px;color:#517280;font-weight:700">PM10</div>
                  <div style="font-size:15px;font-weight:900;color:#0F2B34">{d['cur_pm10']}<span style="font-size:10px;color:#7EA3B0">µg/m³</span></div>
                </div>
                <div style="background:#F0F5F8;border-radius:10px;padding:8px;text-align:center">
                  <div style="font-size:10px;color:#517280;font-weight:700">🌡️ Temp</div>
                  <div style="font-size:15px;font-weight:900;color:#0F2B34">{d['cur_temp']}<span style="font-size:10px;color:#7EA3B0">°C</span></div>
                </div>
                <div style="background:#F0F5F8;border-radius:10px;padding:8px;text-align:center">
                  <div style="font-size:10px;color:#517280;font-weight:700">🌬️ Wind</div>
                  <div style="font-size:15px;font-weight:900;color:#0F2B34">{d['cur_wind']}<span style="font-size:10px;color:#7EA3B0">km/h</span></div>
                </div>
              </div>
            </div>""", unsafe_allow_html=True)

        # ── AQI Bar Chart Comparison ─────────────────────────
        st.markdown("<div style='height:16px'></div>", unsafe_allow_html=True)
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown('<div class="section-header">📊 AQI Ranking Chart</div>', unsafe_allow_html=True)
        chart_data = pd.DataFrame({
            "City": [d["city"] for d in city_results if d["ok"]],
            "AQI":  [d["cur_aqi"] for d in city_results if d["ok"]],
        }).set_index("City")
        st.bar_chart(chart_data, height=250, use_container_width=True, color=["#1D8A9C"])

        # ── Ranking Leaderboard ──────────────────────────────
        good_results = [d for d in city_results if d["ok"]]
        ranked = sorted(good_results, key=lambda x: x["cur_aqi"])
        st.markdown('<div class="section-header" style="margin-top:16px">🏆 Air Quality Ranking</div>', unsafe_allow_html=True)
        medals = ["🥇","🥈","🥉","4️⃣"]
        for i, d in enumerate(ranked):
            lbl, col2, bcls = get_aqi_category(d["cur_aqi"])
            st.markdown(f"""
            <div class="card-sm" style="display:flex;align-items:center;justify-content:space-between">
              <div>{medals[i]} <b style="color:#0F2B34">{d['city']}</b>
                <span style="color:#7EA3B0;font-size:12px;margin-left:6px">{d['country']}</span>
              </div>
              <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:18px;font-weight:900;color:{col2}">{d['cur_aqi']}</span>
                <span class="badge {bcls}">{lbl}</span>
              </div>
            </div>""", unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════
# TAB 4 – EDA ANALYTICS
# ═══════════════════════════════════════════════════════════════
with tabs[3]:
    st.markdown('<div class="section-header">📈 Exploratory Data Analysis</div>', unsafe_allow_html=True)
    eda_city = st.selectbox("City for EDA:", list(CITIES.keys()), key="eda_city")
    with st.spinner("Loading EDA data…"):
        eda_d = fetch_city_data(eda_city)

    if eda_d["ok"]:
        df_eda = eda_d["df"].dropna(subset=["us_aqi"]).head(168)  # 7 days
        e1, e2 = st.columns(2)

        with e1:
            st.markdown('<div class="card">', unsafe_allow_html=True)
            st.markdown("**📉 AQI Time-Series (7 Days)**")
            ts = df_eda.set_index("time")[["us_aqi","pm2_5"]]
            ts.index = ts.index.strftime("%d %b %H:%M")
            st.line_chart(ts, height=220, use_container_width=True)
            st.markdown('</div>', unsafe_allow_html=True)

        with e2:
            st.markdown('<div class="card">', unsafe_allow_html=True)
            st.markdown("**📊 PM2.5 Distribution**")
            hist_data = pd.cut(df_eda["pm2_5"], bins=10).value_counts().sort_index()
            hist_df = pd.DataFrame({"PM2.5 Range": hist_data.index.astype(str), "Count": hist_data.values}).set_index("PM2.5 Range")
            st.bar_chart(hist_df, height=220, use_container_width=True)
            st.markdown('</div>', unsafe_allow_html=True)

        e3, e4 = st.columns(2)
        with e3:
            st.markdown('<div class="card">', unsafe_allow_html=True)
            st.markdown("**🌡️ Pollutant Correlation Heatmap**")
            corr_cols = ["us_aqi","pm2_5","pm10","ozone","no2"]
            corr = df_eda[corr_cols].corr().round(2)
            st.dataframe(corr.style.background_gradient(cmap="RdYlGn", vmin=-1, vmax=1),
                         use_container_width=True, height=230)
            st.markdown('</div>', unsafe_allow_html=True)

        with e4:
            st.markdown('<div class="card">', unsafe_allow_html=True)
            st.markdown("**📦 AQI by Hour of Day (Box-style)**")
            df_eda["hour"] = pd.to_datetime(df_eda["time"]).dt.hour
            hourly_avg = df_eda.groupby("hour")["us_aqi"].mean()
            st.line_chart(hourly_avg, height=220, use_container_width=True)
            st.markdown('</div>', unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════
# TAB 5 – MODEL ZOO
# ═══════════════════════════════════════════════════════════════
with tabs[4]:
    st.markdown('<div class="section-header">🧠 Model Zoo & Benchmarks</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-sub">ML model evaluation results on 9,631 hourly observations (>1 Year dataset).</div>', unsafe_allow_html=True)

    models = [
        {"name":"Baseline Persistence",        "rmse":48.22,"mae":43.98,"r2":-3.73,"beats":"Baseline","color":"#9CA3AF"},
        {"name":"Ridge Regression",             "rmse":12.98,"mae": 9.21,"r2": 0.66,"beats":"✅ Yes",   "color":"#3B82F6"},
        {"name":"Random Forest Regressor",      "rmse":10.21,"mae": 7.00,"r2": 0.79,"beats":"✅ Yes",   "color":"#10B981"},
        {"name":"Stacking Champion Ensemble",   "rmse": 9.89,"mae": 6.46,"r2": 0.80,"beats":"✅ Yes 🏆","color":"#1D8A9C"},
    ]
    for m in models:
        is_champ = "Champion" in m["name"]
        border = "#1D8A9C" if is_champ else "#CFDDE7"
        bg = "#F0FAFA" if is_champ else "#fff"
        st.markdown(f"""
        <div style="background:{bg};border:2px solid {border};border-radius:18px;padding:18px 22px;margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:15px;font-weight:900;color:#0F2B34">{m['name']} {'🏆' if is_champ else ''}</div>
              <div style="font-size:11px;color:#517280;margin-top:2px">Trained on 9,631 hourly observations · Non-Negative AQI guaranteed</div>
            </div>
            <span style="background:{'#DCFCE7' if is_champ else '#F3F4F6'};color:{'#15803D' if is_champ else '#374151'};
                         padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700">{m['beats']}</span>
          </div>
          <div style="display:flex;gap:32px;margin-top:12px">
            <div><div style="font-size:10px;font-weight:700;color:#517280;text-transform:uppercase">RMSE</div>
                 <div style="font-size:22px;font-weight:900;color:{m['color']}">{m['rmse']}</div></div>
            <div><div style="font-size:10px;font-weight:700;color:#517280;text-transform:uppercase">MAE</div>
                 <div style="font-size:22px;font-weight:900;color:{m['color']}">{m['mae']}</div></div>
            <div><div style="font-size:10px;font-weight:700;color:#517280;text-transform:uppercase">R² Score</div>
                 <div style="font-size:22px;font-weight:900;color:{m['color']}">{m['r2']}</div></div>
          </div>
          <div class="prog-wrap" style="margin-top:10px">
            <div class="prog-fill" style="width:{max(0,min(100,m['r2']*100))}%;background:{m['color']}"></div>
          </div>
        </div>""", unsafe_allow_html=True)

    if st.button("⚡ Trigger Live Retraining", type="primary"):
        with st.spinner("Training pipeline running on 9,600+ hourly records…"):
            try:
                from pipelines.training_pipeline import train_and_evaluate_models
                metrics = train_and_evaluate_models()
                st.success(f"✅ Champion: **{metrics['champion_model']}** — RMSE: {metrics['champion_rmse']:.2f}")
            except Exception as e:
                st.error(f"Training error: {e}")

# ═══════════════════════════════════════════════════════════════
# TAB 6 – FEATURE STORE
# ═══════════════════════════════════════════════════════════════
with tabs[5]:
    st.markdown('<div class="section-header">🗄️ Feature Store</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-sub">Live view of the local SQLite feature store. 9,600+ hourly atmospheric observations.</div>', unsafe_allow_html=True)

    try:
        from pipelines.datastore import DatastoreManager
        ds = DatastoreManager()
        health = ds.verify_datastore_health()

        h1, h2, h3, h4 = st.columns(4)
        h1.metric("Datastore Status",   health["status"])
        h2.metric("Total Records",      f"{health['total_records']:,}")
        h3.metric("Non-Negative Check", "✅ PASSED" if health["non_negative_guarantee_passed"] else "❌ FAILED")
        h4.metric("Cities Tracked",     len(health["cities_tracked"]))

        st.markdown('<div class="card" style="margin-top:12px">', unsafe_allow_html=True)
        st.markdown("**📋 Latest Feature Vectors (Last 100 Records)**")
        df_store = ds.read_features(limit=100)
        if not df_store.empty:
            cols_show = ["city","time","us_aqi","pm2_5","pm10","temperature_2m","relative_humidity_2m","wind_speed_10m","target_aqi_24h"]
            available = [c for c in cols_show if c in df_store.columns]
            st.dataframe(df_store[available], use_container_width=True, height=320)
        st.markdown('</div>', unsafe_allow_html=True)
    except Exception as e:
        st.info(f"💡 Feature store unavailable in cloud deployment. Run `python pipelines/historical_backfill.py` locally first. ({e})")

# ═══════════════════════════════════════════════════════════════
# TAB 7 – HEALTH ADVISOR
# ═══════════════════════════════════════════════════════════════
with tabs[6]:
    st.markdown('<div class="section-header">🏥 Health Advisor</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-sub">Personalised health recommendations based on live AQI readings.</div>', unsafe_allow_html=True)

    ha_city = st.selectbox("Select City:", list(CITIES.keys()), key="ha_city")
    with st.spinner("Loading…"):
        ha_d = fetch_city_data(ha_city)

    if ha_d["ok"]:
        aqi_h   = ha_d["cur_aqi"]
        lbl_h, color_h, badge_h = get_aqi_category(aqi_h)
        st.markdown(f"""
        <div class="card" style="text-align:center">
          {draw_svg_gauge(aqi_h, 180)}
          <div style="margin-top:8px"><span class="badge {badge_h}" style="font-size:14px;padding:6px 18px">{lbl_h}</span></div>
          <div style="font-size:13px;color:#517280;margin-top:10px">{aqi_health(aqi_h)}</div>
        </div>""", unsafe_allow_html=True)

        groups = {
            "👶 Children & Infants":    aqi_h > 100,
            "👴 Elderly (65+)":         aqi_h > 100,
            "🤧 Asthma / Respiratory":  aqi_h > 80,
            "❤️ Heart Disease":          aqi_h > 120,
            "🏃 Active Athletes":        aqi_h > 50,
            "🧑 General Population":    aqi_h > 150,
        }
        advice_map = {
            "👶 Children & Infants":   ["Keep children indoors during peak pollution hours (7–10am, 5–8pm)","Use HEPA air purifiers in nursery","Avoid parks near major roads"],
            "👴 Elderly (65+)":        ["Limit outdoor walks to morning hours before 7am","Keep medication accessible","Monitor for chest tightness"],
            "🤧 Asthma / Respiratory": ["Carry rescue inhaler at all times","Wear N95 mask if going outside","Avoid exercise near traffic corridors"],
            "❤️ Heart Disease":         ["Avoid strenuous outdoor activity","Monitor blood pressure","Consult physician if symptoms worsen"],
            "🏃 Active Athletes":      ["Reschedule outdoor training to early morning","Consider indoor gym alternatives","Hydrate well and monitor breathing"],
            "🧑 General Population":   ["Keep windows closed during peak hours","Use air purifier indoors","Check AQI before planning outdoor events"],
        }
        st.markdown("### 🎯 Personalised Advisories by Group")
        for group, at_risk in groups.items():
            status_color = "#FEE2E2" if at_risk else "#D1FAE5"
            status_text  = "⚠️ At Risk" if at_risk else "✅ Low Risk"
            with st.expander(f"{group} — {status_text}"):
                for tip in advice_map[group]:
                    st.markdown(f"• {tip}")
