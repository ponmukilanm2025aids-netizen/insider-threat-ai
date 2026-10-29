import csv
from collections import defaultdict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel
from typing import Optional

from src.config import PROCESSED_FEATURES_FILE, WEB_DIR, USER_METADATA_FILE, FEATURE_COLUMNS
from src.risk_engine import ThreatRiskEngine

app = FastAPI(title="AI Insider Threat Detection SOC API", version="1.0.0")

# Enable CORS for local testing/frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

risk_engine = ThreatRiskEngine()

class SimulationRequest(BaseModel):
    logon_count: float = 1.0
    after_hours_logons: float = 1.0
    weekend_activity: float = 0.0
    usb_connections: float = 1.0
    after_hours_usb: float = 1.0
    http_requests: float = 120.0
    cloud_storage_uploads: float = 5.0
    bytes_uploaded_mb: float = 650.0
    external_emails: float = 2.0
    email_attachment_mb: float = 25.0
    files_read: float = 15.0
    files_copied: float = 25.0
    files_deleted: float = 0.0
    sensitive_files_accessed: float = 8.0
    peer_deviation_score: float = 3.5

@app.get("/")
def get_dashboard():
    index_path = WEB_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return HTMLResponse("<h1>AI Insider Threat Detection API is running.</h1>")

@app.get("/styles.css")
def get_css():
    css_path = WEB_DIR / "styles.css"
    if css_path.exists():
        return FileResponse(css_path, media_type="text/css")
    return HTMLResponse("")

@app.get("/dashboard.js")
def get_js():
    js_path = WEB_DIR / "dashboard.js"
    if js_path.exists():
        return FileResponse(js_path, media_type="application/javascript")
    return HTMLResponse("")

@app.get("/api/overview")
def get_overview():
    users_seen = set()
    days_seen = set()
    critical_count = 0
    high_count = 0
    elevated_count = 0
    total_sessions = 0
    dept_threats = defaultdict(int)
    daily_threats = defaultdict(int)

    with open(PROCESSED_FEATURES_FILE, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_sessions += 1
            uid = row["user_id"]
            date_str = row["date"]
            dept = row["department"]
            users_seen.add(uid)
            days_seen.add(date_str)

            res = risk_engine.calculate_session_risk(row)
            sev = res["severity"]
            if sev == "CRITICAL":
                critical_count += 1
                dept_threats[dept] += 1
                daily_threats[date_str] += 1
            elif sev == "HIGH":
                high_count += 1
                dept_threats[dept] += 1
                daily_threats[date_str] += 1
            elif sev == "ELEVATED":
                elevated_count += 1

    anomaly_rate = round(((critical_count + high_count) / max(total_sessions, 1)) * 100, 2)

    return {
        "monitored_users": len(users_seen),
        "monitoring_days": len(days_seen),
        "total_sessions_analyzed": total_sessions,
        "critical_threats": critical_count,
        "high_threats": high_count,
        "elevated_threats": elevated_count,
        "fleet_anomaly_rate": anomaly_rate,
        "department_distribution": dict(dept_threats),
        "daily_incident_trend": sorted([{"date": k, "incidents": v} for k, v in daily_threats.items()], key=lambda x: x["date"]),
    }

@app.get("/api/threats")
def get_threats():
    """Returns all users ranked by their peak threat score."""
    user_peak = {}

    with open(PROCESSED_FEATURES_FILE, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            uid = row["user_id"]
            assessment = risk_engine.calculate_session_risk(row)
            score = assessment["threat_score"]

            if uid not in user_peak or score > user_peak[uid]["threat_score"]:
                user_peak[uid] = {
                    "user_id": uid,
                    "name": row["name"],
                    "department": row["department"],
                    "role": row["role"],
                    "date": row["date"],
                    "threat_score": score,
                    "severity": assessment["severity"],
                    "threat_vector": assessment["predicted_threat_type"],
                    "model_confidence": assessment["model_confidence"],
                }

    ranked = sorted(user_peak.values(), key=lambda x: x["threat_score"], reverse=True)
    return {"users": ranked}

@app.get("/api/user/{user_id}")
def get_user_details(user_id: str):
    """Deep-dive investigation report for a specific employee."""
    all_rows = []
    user_rows = []
    dept_rows = defaultdict(list)

    with open(PROCESSED_FEATURES_FILE, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            all_rows.append(row)
            dept_rows[row["department"]].append(row)
            if row["user_id"] == user_id:
                user_rows.append(row)

    if not user_rows:
        raise HTTPException(status_code=404, detail="User not found")

    # Pick the peak risk date for this user
    scored_sessions = []
    for r in user_rows:
        risk = risk_engine.calculate_session_risk(r)
        scored_sessions.append((risk["threat_score"], r, risk))
    
    scored_sessions.sort(key=lambda x: x[0], reverse=True)
    peak_score, peak_row, peak_risk = scored_sessions[0]
    peak_date = peak_row["date"]
    user_dept = peak_row["department"]

    # Calculate department average baseline
    dept_baseline = {}
    dept_samples = dept_rows[user_dept]
    for col in FEATURE_COLUMNS:
        vals = [float(r[col]) for r in dept_samples]
        dept_baseline[col] = round(sum(vals) / max(len(vals), 1), 2)

    user_metrics = {col: float(peak_row[col]) for col in FEATURE_COLUMNS}

    # Fetch event timeline on the peak incident day
    timeline = risk_engine.fetch_user_timeline(user_id, peak_date)

    return {
        "user_id": user_id,
        "name": peak_row["name"],
        "department": user_dept,
        "role": peak_row["role"],
        "peak_incident_date": peak_date,
        "risk_assessment": peak_risk,
        "user_metrics": user_metrics,
        "department_baseline": dept_baseline,
        "activity_timeline": timeline,
    }

@app.post("/api/simulate")
def simulate_threat(req: SimulationRequest):
    """Real-time what-if attack simulator."""
    data = req.model_dump()
    result = risk_engine.calculate_session_risk(data)
    return {
        "input_features": data,
        "assessment": result,
    }
