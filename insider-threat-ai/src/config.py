import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODELS_DIR = BASE_DIR / "saved_models"
WEB_DIR = BASE_DIR / "web"

# Ensure directories exist
for d in [RAW_DATA_DIR, PROCESSED_DATA_DIR, MODELS_DIR, WEB_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# File paths
LOGON_FILE = RAW_DATA_DIR / "logon.csv"
DEVICE_FILE = RAW_DATA_DIR / "device.csv"
HTTP_FILE = RAW_DATA_DIR / "http.csv"
EMAIL_FILE = RAW_DATA_DIR / "email.csv"
FILE_ACTIVITY_FILE = RAW_DATA_DIR / "file.csv"
USER_METADATA_FILE = RAW_DATA_DIR / "users.csv"

PROCESSED_FEATURES_FILE = PROCESSED_DATA_DIR / "user_daily_features.csv"
MODEL_FILE = MODELS_DIR / "insider_threat_model.joblib"

# Feature Column Names
FEATURE_COLUMNS = [
    "logon_count",
    "after_hours_logons",
    "weekend_activity",
    "usb_connections",
    "after_hours_usb",
    "http_requests",
    "cloud_storage_uploads",
    "bytes_uploaded_mb",
    "external_emails",
    "email_attachment_mb",
    "files_read",
    "files_copied",
    "files_deleted",
    "sensitive_files_accessed",
    "peer_deviation_score",
]

# Risk score thresholds
RISK_LEVELS = {
    "CRITICAL": 80.0,
    "HIGH": 65.0,
    "ELEVATED": 45.0,
    "LOW": 0.0,
}

# Threat classifications
THREAT_LABELS = {
    0: "NORMAL",
    1: "DATA_EXFILTRATION",
    2: "PRIVILEGE_SABOTAGE",
    3: "ACCOUNT_COMPROMISE",
}
