import csv
import numpy as np
import joblib
from pathlib import Path
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix

from src.config import (
    PROCESSED_FEATURES_FILE,
    MODEL_FILE,
    FEATURE_COLUMNS,
    THREAT_LABELS,
)

class InsiderThreatDetector:
    def __init__(self):
        self.scaler = StandardScaler()
        # 1. Unsupervised Anomaly Detector (Isolation Forest)
        self.iso_forest = IsolationForest(
            n_estimators=150,
            contamination=0.06,
            random_state=42,
            bootstrap=True,
        )
        # 2. Neural Autoencoder (Reconstruction error based anomaly scoring)
        # Compression: 15 features -> 8 -> 4 (bottleneck) -> 8 -> 15
        self.autoencoder = MLPRegressor(
            hidden_layer_sizes=(8, 4, 8),
            activation="relu",
            solver="adam",
            max_iter=500,
            tol=1e-3,
            random_state=42,
        )
        # 3. Supervised Threat Classifier
        self.classifier = RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            random_state=42,
        )
        self.label_map = {v: k for k, v in THREAT_LABELS.items()}
        self.is_trained = False

    def load_data(self):
        """Loads feature matrix X and target labels y from processed CSV."""
        X_rows = []
        y_binary = []
        y_classes = []
        metadata = []

        with open(PROCESSED_FEATURES_FILE, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                feat = [float(row[col]) for col in FEATURE_COLUMNS]
                X_rows.append(feat)
                is_threat = int(row["is_insider_threat"])
                y_binary.append(is_threat)
                threat_type = row.get("threat_type", "NORMAL")
                y_classes.append(self.label_map.get(threat_type, 0))
                metadata.append({
                    "user_id": row["user_id"],
                    "name": row["name"],
                    "department": row["department"],
                    "date": row["date"],
                    "threat_type": threat_type,
                })

        return np.array(X_rows), np.array(y_binary), np.array(y_classes), metadata

    def train(self):
        """Trains the ensemble detection system."""
        print("[*] Training AI Insider Threat Detection models...")
        X, y_bin, y_cls, _ = self.load_data()

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        # 1. Train Isolation Forest (unsupervised)
        self.iso_forest.fit(X_scaled)

        # 2. Train Autoencoder on mostly normal traffic
        normal_idx = np.where(y_bin == 0)[0]
        X_normal_scaled = X_scaled[normal_idx]
        self.autoencoder.fit(X_normal_scaled, X_normal_scaled)

        # 3. Train Classifier (supervised)
        self.classifier.fit(X, y_cls)

        self.is_trained = True
        self.save_model()
        print("[OK] All models successfully trained and persisted.")

    def evaluate(self):
        """Evaluates detection accuracy, AUC-ROC, and prints metrics."""
        if not self.is_trained:
            self.load_model()

        X, y_bin, y_cls, _ = self.load_data()
        X_scaled = self.scaler.transform(X)

        # Isolation Forest scoring
        # IsolationForest returns -1 for outlier, 1 for inlier
        iso_preds = self.iso_forest.predict(X_scaled)
        iso_binary = np.where(iso_preds == -1, 1, 0)

        # Autoencoder Reconstruction Error
        reconstructed = self.autoencoder.predict(X_scaled)
        mse = np.mean(np.square(X_scaled - reconstructed), axis=1)
        # Threshold: 95th percentile of normal MSE
        normal_idx = np.where(y_bin == 0)[0]
        threshold = np.percentile(mse[normal_idx], 95)
        ae_binary = np.where(mse > threshold, 1, 0)

        # Ensemble detection (flagged if either catches severe anomaly)
        ensemble_pred = np.maximum(iso_binary, ae_binary)

        # Supervised Classifier prediction
        clf_preds = self.classifier.predict(X)

        print("\n==================== EVALUATION REPORT ====================")
        print(f"Total Daily Sessions Evaluated: {len(y_bin)}")
        print(f"Total True Insider Attack Events: {int(np.sum(y_bin))}")
        print("\n[1] Unsupervised Anomaly Detection (Isolation Forest + Autoencoder):")
        print(classification_report(y_bin, ensemble_pred, target_names=["Normal", "Insider Threat"]))

        try:
            auc = roc_auc_score(y_bin, mse)
            print(f"Autoencoder Anomaly ROC-AUC Score: {auc:.4f}")
        except Exception:
            pass

        print("\n[2] Threat Vector Classification (Random Forest):")
        target_names = [THREAT_LABELS[i] for i in sorted(list(set(y_cls)))]
        print(classification_report(y_cls, clf_preds, target_names=target_names))
        print("===========================================================\n")

    def predict_user_session(self, feature_vector: list) -> dict:
        """
        Runs full inference on a single user session feature vector.
        """
        if not self.is_trained:
            self.load_model()

        x_raw = np.array(feature_vector).reshape(1, -1)
        x_scaled = self.scaler.transform(x_raw)

        # 1. Isolation Forest raw score (higher offset = more normal)
        iso_score = float(self.iso_forest.score_samples(x_scaled)[0])
        # Map score from [-0.8, -0.3] -> [0, 100]
        iso_risk = np.clip((-(iso_score + 0.35) / 0.40) * 100, 0, 100)

        # 2. Autoencoder Reconstruction MSE
        recon = self.autoencoder.predict(x_scaled)
        mse = float(np.mean(np.square(x_scaled - recon)))
        ae_risk = np.clip(mse * 20.0, 0, 100)

        # 3. Supervised Classification
        pred_class_idx = int(self.classifier.predict(x_raw)[0])
        pred_threat_name = THREAT_LABELS.get(pred_class_idx, "NORMAL")
        class_probs = self.classifier.predict_proba(x_raw)[0]

        return {
            "iso_risk_score": round(float(iso_risk), 2),
            "reconstruction_error": round(float(mse), 3),
            "autoencoder_risk_score": round(float(ae_risk), 2),
            "predicted_threat_type": pred_threat_name,
            "threat_confidence": round(float(np.max(class_probs)) * 100, 2),
        }

    def save_model(self):
        joblib.dump({
            "scaler": self.scaler,
            "iso_forest": self.iso_forest,
            "autoencoder": self.autoencoder,
            "classifier": self.classifier,
        }, MODEL_FILE)

    def load_model(self):
        if not MODEL_FILE.exists():
            self.train()
        else:
            bundle = joblib.load(MODEL_FILE)
            self.scaler = bundle["scaler"]
            self.iso_forest = bundle["iso_forest"]
            self.autoencoder = bundle["autoencoder"]
            self.classifier = bundle["classifier"]
            self.is_trained = True

if __name__ == "__main__":
    detector = InsiderThreatDetector()
    detector.train()
    detector.evaluate()
