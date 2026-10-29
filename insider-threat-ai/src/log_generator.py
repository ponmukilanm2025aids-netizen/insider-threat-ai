import csv
import random
from datetime import datetime, timedelta
from pathlib import Path
from src.config import (
    LOGON_FILE,
    DEVICE_FILE,
    HTTP_FILE,
    EMAIL_FILE,
    FILE_ACTIVITY_FILE,
    USER_METADATA_FILE,
)

DEPARTMENTS = {
    "Engineering": ["Software Engineer", "DevOps Engineer", "QA Lead"],
    "IT_Admin": ["Sysadmin", "Network Admin", "Database Administrator"],
    "Finance": ["Financial Analyst", "Accountant", "Payroll Specialist"],
    "HR": ["HR Manager", "Recruiter", "Talent Specialist"],
    "Sales": ["Account Executive", "Sales Representative", "BizDev Lead"],
}

SENSITIVE_FILES = [
    "confidential_source_code.tar.gz",
    "customer_pii_export.xlsx",
    "q4_financial_projections.pdf",
    "employee_salaries_2026.csv",
    "production_db_backup.sql",
    "api_private_keys.env",
    "merger_acquisition_brief.docx",
]

NORMAL_FILES = [
    "weekly_team_sync.docx",
    "project_specs_v2.pdf",
    "release_notes.txt",
    "meeting_agenda.docx",
    "onboarding_guide.pdf",
    "quarterly_goals.xlsx",
    "system_monitoring.log",
]

NORMAL_SITES = [
    ("https://github.com/company/repo", False),
    ("https://stackoverflow.com/questions", False),
    ("https://internal.jira.company.com", False),
    ("https://mail.google.com/a/company.com", False),
    ("https://news.ycombinator.com", False),
    ("https://docs.python.org", False),
    ("https://internal.wiki.company.com", False),
]

EXFIL_SITES = [
    ("https://mega.nz/upload", True),
    ("https://drive.google.com/personal-drive", True),
    ("https://dropbox.com/home/transfers", True),
    ("https://wetransfer.com/send", True),
    ("https://anonfiles.com/upload", True),
]

def generate_enterprise_data(
    num_users: int = 35,
    num_days: int = 14,
    start_date_str: str = "2026-10-01",
    seed: int = 42,
):
    """
    Generates synthetic multi-source log data mimicking CMU CERT UEBA datasets.
    """
    random.seed(seed)
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")

    # 1. Generate User Profiles
    users = []
    dept_names = list(DEPARTMENTS.keys())

    for i in range(1, num_users + 1):
        user_id = f"EMP{i:03d}"
        dept = dept_names[(i - 1) % len(dept_names)]
        role = random.choice(DEPARTMENTS[dept])
        first_names = ["Alex", "Jordan", "Taylor", "Morgan", "Sam", "Chris", "Pat", "Robin", "Casey", "Riley"]
        last_names = ["Smith", "Vance", "Miller", "Chen", "Patel", "Garcia", "Kim", "Muller", "Brown", "Davis"]
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        email = f"{name.lower().replace(' ', '.')}@megacorp.internal"

        # Embedded Insider Threat Actors
        # EMP014: Data Exfiltrator (Engineering)
        # EMP007: Saboteur (IT_Admin)
        # EMP028: Compromised Account (Finance)
        if user_id == "EMP014":
            threat_type = "DATA_EXFILTRATION"
            is_malicious = True
        elif user_id == "EMP007":
            threat_type = "PRIVILEGE_SABOTAGE"
            is_malicious = True
        elif user_id == "EMP028":
            threat_type = "ACCOUNT_COMPROMISE"
            is_malicious = True
        else:
            threat_type = "NORMAL"
            is_malicious = False

        users.append({
            "user_id": user_id,
            "name": name,
            "department": dept,
            "role": role,
            "email": email,
            "is_malicious": is_malicious,
            "threat_type": threat_type,
            "assigned_pc": f"PC-{1000 + i}",
        })

    # Containers for logs
    logon_logs = []
    device_logs = []
    http_logs = []
    email_logs = []
    file_logs = []

    log_id_counter = 1

    # 2. Daily Simulation
    for day_offset in range(num_days):
        current_day = start_date + timedelta(days=day_offset)
        is_weekend = current_day.weekday() >= 5

        for u in users:
            uid = u["user_id"]
            pc = u["assigned_pc"]
            u_threat = u["threat_type"]

            # Threat trigger conditions (activated on day 9 onwards for realism)
            is_active_attack_day = day_offset >= 9 and u["is_malicious"]

            # Standard attendance probability
            if is_weekend:
                attendance_prob = 0.05 if not is_active_attack_day else 0.90
            else:
                attendance_prob = 0.95

            if random.random() > attendance_prob and not is_active_attack_day:
                continue

            # Determine daily schedule
            if is_active_attack_day and u_threat == "DATA_EXFILTRATION":
                # Sneaks in late at night: 23:45 to 02:30
                logon_time = current_day.replace(hour=23, minute=random.randint(15, 55), second=random.randint(0, 59))
                session_duration_hours = random.uniform(2.5, 4.0)
            elif is_active_attack_day and u_threat == "PRIVILEGE_SABOTAGE":
                # Saboteur logs in at midnight: 01:10
                logon_time = current_day.replace(hour=1, minute=random.randint(10, 40), second=random.randint(0, 59))
                session_duration_hours = random.uniform(1.5, 2.5)
            elif is_active_attack_day and u_threat == "ACCOUNT_COMPROMISE":
                # Multiple odd hour spikes
                logon_time = current_day.replace(hour=3, minute=random.randint(5, 50), second=random.randint(0, 59))
                session_duration_hours = random.uniform(1.0, 3.0)
            else:
                # Normal employee: 08:30 to 09:30 AM
                logon_time = current_day.replace(
                    hour=random.randint(8, 9),
                    minute=random.randint(10, 55),
                    second=random.randint(0, 59)
                )
                session_duration_hours = random.uniform(7.5, 9.0)

            logoff_time = logon_time + timedelta(hours=session_duration_hours)

            # Record Logon / Logoff
            logon_logs.append({
                "id": f"LOG_{log_id_counter:07d}",
                "timestamp": logon_time.strftime("%Y-%m-%d %H:%M:%S"),
                "user_id": uid,
                "pc": pc if not (is_active_attack_day and u_threat == "ACCOUNT_COMPROMISE") else "PC-EXTERNAL-PROXY",
                "activity": "Logon",
            })
            log_id_counter += 1

            logon_logs.append({
                "id": f"LOG_{log_id_counter:07d}",
                "timestamp": logoff_time.strftime("%Y-%m-%d %H:%M:%S"),
                "user_id": uid,
                "pc": pc if not (is_active_attack_day and u_threat == "ACCOUNT_COMPROMISE") else "PC-EXTERNAL-PROXY",
                "activity": "Logoff",
            })
            log_id_counter += 1

            # A. Device (USB) Activity
            if is_active_attack_day and u_threat == "DATA_EXFILTRATION":
                # Malicious USB insertion after hours
                usb_time = logon_time + timedelta(minutes=random.randint(15, 30))
                device_logs.append({
                    "id": f"DEV_{log_id_counter:07d}",
                    "timestamp": usb_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "user_id": uid,
                    "pc": pc,
                    "activity": "Connect",
                })
                log_id_counter += 1
                device_logs.append({
                    "id": f"DEV_{log_id_counter:07d}",
                    "timestamp": (usb_time + timedelta(minutes=95)).strftime("%Y-%m-%d %H:%M:%S"),
                    "user_id": uid,
                    "pc": pc,
                    "activity": "Disconnect",
                })
                log_id_counter += 1
            else:
                # Normal USB: rare (e.g. 3% chance during day)
                if random.random() < 0.03:
                    usb_time = logon_time + timedelta(hours=random.uniform(1, 4))
                    device_logs.append({
                        "id": f"DEV_{log_id_counter:07d}",
                        "timestamp": usb_time.strftime("%Y-%m-%d %H:%M:%S"),
                        "user_id": uid,
                        "pc": pc,
                        "activity": "Connect",
                    })
                    log_id_counter += 1
                    device_logs.append({
                        "id": f"DEV_{log_id_counter:07d}",
                        "timestamp": (usb_time + timedelta(minutes=20)).strftime("%Y-%m-%d %H:%M:%S"),
                        "user_id": uid,
                        "pc": pc,
                        "activity": "Disconnect",
                    })
                    log_id_counter += 1

            # B. HTTP Activity
            num_http = random.randint(20, 60)
            if is_active_attack_day and u_threat in ["DATA_EXFILTRATION", "ACCOUNT_COMPROMISE"]:
                # High exfiltration volume to cloud storage
                num_http += random.randint(40, 80)
                for _ in range(num_http):
                    t = logon_time + timedelta(minutes=random.randint(5, int(session_duration_hours * 60)))
                    is_exfil = random.random() < 0.45
                    if is_exfil:
                        url, is_cloud = random.choice(EXFIL_SITES)
                        upload_bytes = random.randint(15_000_000, 85_000_000) # 15MB to 85MB per request
                    else:
                        url, is_cloud = random.choice(NORMAL_SITES)
                        upload_bytes = random.randint(500, 50_000)

                    http_logs.append({
                        "id": f"HTTP_{log_id_counter:07d}",
                        "timestamp": t.strftime("%Y-%m-%d %H:%M:%S"),
                        "user_id": uid,
                        "pc": pc,
                        "url": url,
                        "bytes_uploaded": upload_bytes,
                        "is_cloud_storage": int(is_cloud),
                    })
                    log_id_counter += 1
            else:
                # Normal HTTP
                for _ in range(num_http):
                    t = logon_time + timedelta(minutes=random.randint(5, int(session_duration_hours * 60)))
                    url, is_cloud = random.choice(NORMAL_SITES)
                    upload_bytes = random.randint(200, 15_000)
                    http_logs.append({
                        "id": f"HTTP_{log_id_counter:07d}",
                        "timestamp": t.strftime("%Y-%m-%d %H:%M:%S"),
                        "user_id": uid,
                        "pc": pc,
                        "url": url,
                        "bytes_uploaded": upload_bytes,
                        "is_cloud_storage": 0,
                    })
                    log_id_counter += 1

            # C. Email Activity
            num_emails = random.randint(3, 15)
            if is_active_attack_day and u_threat == "ACCOUNT_COMPROMISE":
                num_emails += random.randint(10, 25)

            for _ in range(num_emails):
                t = logon_time + timedelta(minutes=random.randint(5, int(session_duration_hours * 60)))
                if is_active_attack_day and u_threat == "ACCOUNT_COMPROMISE" and random.random() < 0.5:
                    to_addr = f"drop_inbox_{random.randint(100,999)}@protonmail.com"
                    attachments = random.choice(SENSITIVE_FILES)
                    size = random.randint(10_000_000, 45_000_000)
                else:
                    to_addr = f"colleague_{random.randint(1,10)}@megacorp.internal"
                    attachments = random.choice(NORMAL_FILES) if random.random() < 0.25 else "None"
                    size = random.randint(2_000, 500_000)

                email_logs.append({
                    "id": f"EM_{log_id_counter:07d}",
                    "timestamp": t.strftime("%Y-%m-%d %H:%M:%S"),
                    "user_id": uid,
                    "pc": pc,
                    "to": to_addr,
                    "from": u["email"],
                    "attachments": attachments,
                    "size_bytes": size,
                })
                log_id_counter += 1

            # D. File Activity
            if is_active_attack_day and u_threat == "PRIVILEGE_SABOTAGE":
                # Mass deletion of system backups & configs
                for _ in range(random.randint(30, 60)):
                    t = logon_time + timedelta(minutes=random.randint(10, 80))
                    file_logs.append({
                        "id": f"FIL_{log_id_counter:07d}",
                        "timestamp": t.strftime("%Y-%m-%d %H:%M:%S"),
                        "user_id": uid,
                        "pc": pc,
                        "filename": random.choice(SENSITIVE_FILES),
                        "activity": "delete",
                        "is_sensitive": 1,
                    })
                    log_id_counter += 1
            elif is_active_attack_day and u_threat == "DATA_EXFILTRATION":
                # Copying sensitive files to USB
                for _ in range(random.randint(20, 40)):
                    t = logon_time + timedelta(minutes=random.randint(20, 110))
                    file_logs.append({
                        "id": f"FIL_{log_id_counter:07d}",
                        "timestamp": t.strftime("%Y-%m-%d %H:%M:%S"),
                        "user_id": uid,
                        "pc": pc,
                        "filename": random.choice(SENSITIVE_FILES),
                        "activity": "copy",
                        "is_sensitive": 1,
                    })
                    log_id_counter += 1
            else:
                # Normal file reading/editing
                for _ in range(random.randint(5, 18)):
                    t = logon_time + timedelta(minutes=random.randint(10, int(session_duration_hours * 60)))
                    is_sens = 1 if (u["department"] in ["IT_Admin", "Finance"] and random.random() < 0.08) else 0
                    fname = random.choice(SENSITIVE_FILES) if is_sens else random.choice(NORMAL_FILES)
                    act = "read" if random.random() < 0.8 else "write"
                    file_logs.append({
                        "id": f"FIL_{log_id_counter:07d}",
                        "timestamp": t.strftime("%Y-%m-%d %H:%M:%S"),
                        "user_id": uid,
                        "pc": pc,
                        "filename": fname,
                        "activity": act,
                        "is_sensitive": is_sens,
                    })
                    log_id_counter += 1

    # Write CSV files
    _write_csv(USER_METADATA_FILE, users[0].keys(), users)
    _write_csv(LOGON_FILE, logon_logs[0].keys(), logon_logs)
    _write_csv(DEVICE_FILE, device_logs[0].keys(), device_logs)
    _write_csv(HTTP_FILE, http_logs[0].keys(), http_logs)
    _write_csv(EMAIL_FILE, email_logs[0].keys(), email_logs)
    _write_csv(FILE_ACTIVITY_FILE, file_logs[0].keys(), file_logs)

    print(f"[OK] Generated {len(users)} users across {num_days} days.")
    print(f"     - Logon logs: {len(logon_logs):,}")
    print(f"     - Device logs: {len(device_logs):,}")
    print(f"     - HTTP logs: {len(http_logs):,}")
    print(f"     - Email logs: {len(email_logs):,}")
    print(f"     - File logs: {len(file_logs):,}")
    return users

def _write_csv(file_path: Path, fieldnames, data):
    with open(file_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

if __name__ == "__main__":
    generate_enterprise_data()
