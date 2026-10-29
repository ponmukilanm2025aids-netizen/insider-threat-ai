import sys
import argparse
import uvicorn
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.log_generator import generate_enterprise_data
from src.feature_extractor import extract_daily_features
from src.models import InsiderThreatDetector
from src.config import (
    LOGON_FILE,
    PROCESSED_FEATURES_FILE,
    MODEL_FILE,
)

def run_pipeline(generate=True, extract=True, train=True, eval_model=True):
    print("=" * 65)
    print("🛡️  CYBERSENTRY: AI INSIDER THREAT DETECTION & UEBA ENGINE")
    print("=" * 65)

    if generate or not LOGON_FILE.exists():
        print("\n[STEP 1/3] Generating synthetic enterprise activity logs...")
        generate_enterprise_data(num_users=35, num_days=14)

    if extract or not PROCESSED_FEATURES_FILE.exists():
        print("\n[STEP 2/3] Extracting behavioral features & department baselines...")
        extract_daily_features()

    detector = InsiderThreatDetector()
    if train or not MODEL_FILE.exists():
        print("\n[STEP 3/3] Training AI Detection Models (Isolation Forest + Autoencoder)...")
        detector.train()
    else:
        detector.load_model()

    if eval_model:
        detector.evaluate()

    print("\n✅ AI Pipeline is ready!")

def start_server(host="127.0.0.1", port=8000):
    print(f"\n🚀 Launching CyberSentry SOC Dashboard at http://{host}:{port}")
    print(f"👉 Press CTRL+C to stop the server.\n")
    uvicorn.run("src.api:app", host=host, port=port, app_dir=str(PROJECT_ROOT), reload=False)

def main():
    parser = argparse.ArgumentParser(description="AI Insider Threat Detection & UEBA System")
    parser.add_argument("--all", action="store_true", help="Run end-to-end pipeline and launch dashboard")
    parser.add_argument("--generate", action="store_true", help="Generate raw multi-source enterprise logs")
    parser.add_argument("--features", action="store_true", help="Extract behavioral features from logs")
    parser.add_argument("--train", action="store_true", help="Train Isolation Forest & Autoencoder models")
    parser.add_argument("--evaluate", action="store_true", help="Evaluate model performance metrics")
    parser.add_argument("--serve", action="store_true", help="Start the SOC dashboard server")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind dashboard server (default: 8000)")

    args = parser.parse_args()

    # If no flags passed, default to complete demo setup and run
    if len(sys.argv) == 1 or args.all:
        run_pipeline(generate=True, extract=True, train=True, eval_model=True)
        start_server(port=args.port)
        return

    if args.generate:
        generate_enterprise_data(num_users=35, num_days=14)

    if args.features:
        extract_daily_features()

    if args.train:
        detector = InsiderThreatDetector()
        detector.train()

    if args.evaluate:
        detector = InsiderThreatDetector()
        detector.load_model()
        detector.evaluate()

    if args.serve:
        if not MODEL_FILE.exists():
            print("[!] Model file not found. Running training first...")
            run_pipeline(generate=True, extract=True, train=True, eval_model=False)
        start_server(port=args.port)

if __name__ == "__main__":
    main()
