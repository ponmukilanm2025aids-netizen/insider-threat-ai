import csv
from collections import defaultdict
from src.config import (
    FEATURE_COLUMNS,
    RISK_LEVELS,
    LOGON_FILE,
    DEVICE_FILE,
    HTTP_FILE,
    EMAIL_FILE,
    FILE_ACTIVITY_FILE,
)
from src.models import InsiderThreatDetector

class ThreatRiskEngine:
    def __init__(self):
        self.detector = InsiderThreatDetector()
        self.detector.load_model()

    def calculate_session_risk(self, feature_dict: dict) -> dict:
        """
        Combines AI models + Heuristic anomaly rules to generate a comprehensive risk score.
        """
        feats = [float(feature_dict.get(c, 0.0)) for c in FEATURE_COLUMNS]
        ml_inference = self.detector.predict_user_session(feats)

        # Heuristic Rule Score (Domain Knowledge Layer)
        heuristic_score = 0.0
        explanations = []

        # Rule 1: After hours USB connection
        after_hrs_usb = float(feature_dict.get("after_hours_usb", 0))
        if after_hrs_usb > 0:
            pts = min(35.0, after_hrs_usb * 25.0)
            heuristic_score += pts
            explanations.append({
                "factor": "Unauthorized After-Hours USB Activity",
                "severity": "CRITICAL" if after_hrs_usb >= 2 else "HIGH",
                "impact_pts": round(pts, 1),
                "detail": f"{int(after_hrs_usb)} USB connection(s) established outside standard operating hours.",
            })

        # Rule 2: Cloud storage exfiltration
        cloud_uploads = float(feature_dict.get("cloud_storage_uploads", 0))
        upload_mb = float(feature_dict.get("bytes_uploaded_mb", 0))
        if cloud_uploads >= 3 or upload_mb > 100.0:
            pts = min(35.0, 15.0 + (upload_mb / 25.0))
            heuristic_score += pts
            explanations.append({
                "factor": "Massive Cloud Data Exfiltration",
                "severity": "CRITICAL" if upload_mb > 300 else "HIGH",
                "impact_pts": round(pts, 1),
                "detail": f"{upload_mb:.1f} MB uploaded across {int(cloud_uploads)} cloud storage requests.",
            })

        # Rule 3: Mass File Deletion / Sabotage
        files_deleted = float(feature_dict.get("files_deleted", 0))
        if files_deleted >= 5:
            pts = min(35.0, files_deleted * 3.5)
            heuristic_score += pts
            explanations.append({
                "factor": "Unusual Mass File Deletion",
                "severity": "CRITICAL" if files_deleted >= 15 else "HIGH",
                "impact_pts": round(pts, 1),
                "detail": f"{int(files_deleted)} critical files/backups deleted in a single shift.",
            })

        # Rule 4: High Sensitive File Reads
        sens_files = float(feature_dict.get("sensitive_files_accessed", 0))
        if sens_files >= 6:
            pts = min(20.0, sens_files * 2.0)
            heuristic_score += pts
            explanations.append({
                "factor": "Abnormal Sensitive Resource Access",
                "severity": "ELEVATED",
                "impact_pts": round(pts, 1),
                "detail": f"{int(sens_files)} restricted documents (PII, credentials, code) opened.",
            })

        # Rule 5: After hours logon & Peer deviation
        after_hrs_logon = float(feature_dict.get("after_hours_logons", 0))
        peer_dev = float(feature_dict.get("peer_deviation_score", 0))
        if after_hrs_logon > 0:
            heuristic_score += 10.0
            explanations.append({
                "factor": "Anomalous Shift Schedule",
                "severity": "MEDIUM",
                "impact_pts": 10.0,
                "detail": f"System accessed between 20:00 - 06:00 (Deviation Z-Score: {peer_dev:.1f}).",
            })

        # Unified Weighted Ensemble:
        # 35% Isolation Forest + 35% Autoencoder MSE + 30% Domain Heuristics
        iso_score = ml_inference["iso_risk_score"]
        ae_score = ml_inference["autoencoder_risk_score"]
        final_score = (iso_score * 0.35) + (ae_score * 0.35) + (heuristic_score * 0.30)
        final_score = min(100.0, max(0.0, final_score))

        # Determine Severity Level
        if final_score >= RISK_LEVELS["CRITICAL"]:
            severity = "CRITICAL"
        elif final_score >= RISK_LEVELS["HIGH"]:
            severity = "HIGH"
        elif final_score >= RISK_LEVELS["ELEVATED"]:
            severity = "ELEVATED"
        else:
            severity = "LOW"

        if not explanations:
            explanations.append({
                "factor": "Routine Operational Baseline",
                "severity": "LOW",
                "impact_pts": 0.0,
                "detail": "User activity aligns with normal departmental working profiles.",
            })

        return {
            "threat_score": round(final_score, 1),
            "severity": severity,
            "predicted_threat_type": ml_inference["predicted_threat_type"],
            "model_confidence": ml_inference["threat_confidence"],
            "isolation_forest_risk": iso_score,
            "autoencoder_risk": ae_score,
            "heuristic_risk": round(heuristic_score, 1),
            "explainability_breakdown": explanations,
        }

    def fetch_user_timeline(self, user_id: str, date_str: str) -> list:
        """
        Reconstructs the detailed chronological activity timeline for an incident investigation.
        """
        timeline = []

        def check_and_add(file_path, event_type_func):
            with open(file_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row.get("user_id") == user_id and row.get("timestamp", "").startswith(date_str):
                        event = event_type_func(row)
                        if event:
                            timeline.append(event)

        # Logon
        check_and_add(LOGON_FILE, lambda r: {
            "timestamp": r["timestamp"],
            "type": "AUTHENTICATION",
            "summary": f"User {r['activity']} at workstation {r['pc']}",
            "severity": "INFO",
        })

        # Device
        check_and_add(DEVICE_FILE, lambda r: {
            "timestamp": r["timestamp"],
            "type": "PERIPHERAL",
            "summary": f"USB Storage Device {r['activity']} on {r['pc']}",
            "severity": "WARNING",
        })

        # HTTP
        check_and_add(HTTP_FILE, lambda r: {
            "timestamp": r["timestamp"],
            "type": "NETWORK",
            "summary": f"HTTP {('Upload ' + str(round(float(r['bytes_uploaded'])/(1024*1024),1)) + 'MB') if int(r['is_cloud_storage']) else 'GET'} to {r['url']}",
            "severity": "CRITICAL" if int(r["is_cloud_storage"]) else "INFO",
        })

        # File
        check_and_add(FILE_ACTIVITY_FILE, lambda r: {
            "timestamp": r["timestamp"],
            "type": "FILESYSTEM",
            "summary": f"File {r['activity'].upper()}: {r['filename']}",
            "severity": "CRITICAL" if (r["activity"] == "delete" or int(r.get("is_sensitive", 0))) else "INFO",
        })

        # Sort timeline chronologically
        timeline.sort(key=lambda x: x["timestamp"])
        return timeline
