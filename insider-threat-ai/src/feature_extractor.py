import csv
import math
from datetime import datetime
from collections import defaultdict
from pathlib import Path
from src.config import (
    LOGON_FILE,
    DEVICE_FILE,
    HTTP_FILE,
    EMAIL_FILE,
    FILE_ACTIVITY_FILE,
    USER_METADATA_FILE,
    PROCESSED_FEATURES_FILE,
    FEATURE_COLUMNS,
)

# High-performance date cache: avoids slow strptime on 25k+ records
_WEEKDAY_CACHE = {}

def get_time_meta(ts_str: str):
    """
    Ultra-fast timestamp parser using string slicing.
    Format: 'YYYY-MM-DD HH:MM:SS'
    """
    date_key = ts_str[:10]
    hour = int(ts_str[11:13])
    after_hours = (hour >= 20 or hour < 6)

    if date_key not in _WEEKDAY_CACHE:
        _WEEKDAY_CACHE[date_key] = datetime.strptime(date_key, "%Y-%m-%d").weekday() >= 5
    is_weekend = _WEEKDAY_CACHE[date_key]

    return date_key, after_hours, is_weekend

def extract_daily_features():
    """
    Reads multi-source enterprise logs and aggregates user activity into daily behavioral vectors.
    """
    print("[*] Loading raw enterprise logs...")

    # Load users metadata
    users = {}
    with open(USER_METADATA_FILE, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            users[row["user_id"]] = {
                "name": row["name"],
                "department": row["department"],
                "role": row["role"],
                "is_malicious": row["is_malicious"] == "True",
                "threat_type": row["threat_type"],
            }

    daily_records = defaultdict(lambda: {
        "logon_count": 0,
        "after_hours_logons": 0,
        "weekend_activity": 0,
        "usb_connections": 0,
        "after_hours_usb": 0,
        "http_requests": 0,
        "cloud_storage_uploads": 0,
        "bytes_uploaded_mb": 0.0,
        "external_emails": 0,
        "email_attachment_mb": 0.0,
        "files_read": 0,
        "files_copied": 0,
        "files_deleted": 0,
        "sensitive_files_accessed": 0,
        "is_insider_threat": 0,
        "threat_type": "NORMAL",
    })

    # 1. Parse Logon Logs
    with open(LOGON_FILE, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            uid = row["user_id"]
            date_key, after_hours, is_weekend = get_time_meta(row["timestamp"])
            rec = daily_records[(uid, date_key)]

            if row["activity"] == "Logon":
                rec["logon_count"] += 1
                if after_hours:
                    rec["after_hours_logons"] += 1
                if is_weekend:
                    rec["weekend_activity"] = 1

    # 2. Parse Device Logs
    with open(DEVICE_FILE, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            uid = row["user_id"]
            date_key, after_hours, _ = get_time_meta(row["timestamp"])
            rec = daily_records[(uid, date_key)]

            if row["activity"] == "Connect":
                rec["usb_connections"] += 1
                if after_hours:
                    rec["after_hours_usb"] += 1

    # 3. Parse HTTP Logs
    with open(HTTP_FILE, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            uid = row["user_id"]
            date_key, _, _ = get_time_meta(row["timestamp"])
            rec = daily_records[(uid, date_key)]

            rec["http_requests"] += 1
            bytes_up = float(row.get("bytes_uploaded", 0))
            rec["bytes_uploaded_mb"] += bytes_up / (1024 * 1024)
            if int(row.get("is_cloud_storage", 0)) == 1:
                rec["cloud_storage_uploads"] += 1

    # 4. Parse Email Logs
    with open(EMAIL_FILE, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            uid = row["user_id"]
            date_key, _, _ = get_time_meta(row["timestamp"])
            rec = daily_records[(uid, date_key)]

            to_addr = row.get("to", "")
            if not to_addr.endswith("@megacorp.internal"):
                rec["external_emails"] += 1
                size_mb = float(row.get("size_bytes", 0)) / (1024 * 1024)
                rec["email_attachment_mb"] += size_mb

    # 5. Parse File Logs
    with open(FILE_ACTIVITY_FILE, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            uid = row["user_id"]
            date_key, _, _ = get_time_meta(row["timestamp"])
            rec = daily_records[(uid, date_key)]

            act = row.get("activity", "").lower()
            if act == "read":
                rec["files_read"] += 1
            elif act == "copy":
                rec["files_copied"] += 1
            elif act == "delete":
                rec["files_deleted"] += 1

            if int(row.get("is_sensitive", 0)) == 1:
                rec["sensitive_files_accessed"] += 1

    # 6. Compute Peer Baseline (Department Statistics for Z-Score Deviation)
    dept_metrics = defaultdict(lambda: defaultdict(list))
    for (uid, date_key), metrics in daily_records.items():
        dept = users[uid]["department"]
        composite_load = (
            metrics["after_hours_logons"] * 3.0 +
            metrics["usb_connections"] * 5.0 +
            metrics["bytes_uploaded_mb"] * 0.1 +
            metrics["files_deleted"] * 2.0 +
            metrics["sensitive_files_accessed"] * 4.0
        )
        dept_metrics[dept]["composite"].append(composite_load)

    dept_stats = {}
    for dept, metric_dict in dept_metrics.items():
        vals = metric_dict["composite"]
        mean = sum(vals) / max(len(vals), 1)
        variance = sum((x - mean) ** 2 for x in vals) / max(len(vals), 1)
        std = math.sqrt(variance)
        dept_stats[dept] = {"mean": mean, "std": std if std > 0.01 else 1.0}

    # 7. Finalize and assemble dataset rows
    dataset_rows = []
    for (uid, date_key), metrics in sorted(daily_records.items()):
        u_info = users[uid]
        dept = u_info["department"]
        
        composite_load = (
            metrics["after_hours_logons"] * 3.0 +
            metrics["usb_connections"] * 5.0 +
            metrics["bytes_uploaded_mb"] * 0.1 +
            metrics["files_deleted"] * 2.0 +
            metrics["sensitive_files_accessed"] * 4.0
        )
        z_score = (composite_load - dept_stats[dept]["mean"]) / dept_stats[dept]["std"]
        peer_dev = max(0.0, round(z_score, 2))

        day_num = int(date_key[8:10])
        is_attack = u_info["is_malicious"] and day_num >= 9
        threat_cat = u_info["threat_type"] if is_attack else "NORMAL"

        row = {
            "user_id": uid,
            "date": date_key,
            "department": dept,
            "role": u_info["role"],
            "name": u_info["name"],
            "logon_count": metrics["logon_count"],
            "after_hours_logons": metrics["after_hours_logons"],
            "weekend_activity": metrics["weekend_activity"],
            "usb_connections": metrics["usb_connections"],
            "after_hours_usb": metrics["after_hours_usb"],
            "http_requests": metrics["http_requests"],
            "cloud_storage_uploads": metrics["cloud_storage_uploads"],
            "bytes_uploaded_mb": round(metrics["bytes_uploaded_mb"], 2),
            "external_emails": metrics["external_emails"],
            "email_attachment_mb": round(metrics["email_attachment_mb"], 2),
            "files_read": metrics["files_read"],
            "files_copied": metrics["files_copied"],
            "files_deleted": metrics["files_deleted"],
            "sensitive_files_accessed": metrics["sensitive_files_accessed"],
            "peer_deviation_score": peer_dev,
            "is_insider_threat": 1 if is_attack else 0,
            "threat_type": threat_cat,
        }
        dataset_rows.append(row)

    # Save to CSV
    fieldnames = list(dataset_rows[0].keys())
    with open(PROCESSED_FEATURES_FILE, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(dataset_rows)

    print(f"[OK] Extracted daily behavior profiles: {len(dataset_rows)} daily user sessions.")
    print(f"     Saved to: {PROCESSED_FEATURES_FILE}")
    return dataset_rows

if __name__ == "__main__":
    extract_daily_features()
