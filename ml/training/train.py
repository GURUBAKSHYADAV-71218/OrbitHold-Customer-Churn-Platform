"""
OrbitHold — churn model training pipeline.

Trains a Logistic Regression churn classifier on the Telco Customer Churn
dataset and exports two artifacts consumed by the rest of the app:

  ml/models/model.json    — feature order, scaler stats, coefficients,
                             intercept, and category vocabularies. This is
                             the ONLY thing the production API needs; it
                             re-implements the same linear scoring in
                             TypeScript (see api/_lib/model.ts), so no
                             Python process is required after deployment.
  ml/models/metrics.json  — accuracy / precision / recall / f1 / ROC-AUC,
                             confusion matrix, dataset sizes, and global
                             feature importance, all computed on a real
                             held-out test split. Nothing here is
                             hand-typed into the UI.

Run:
    cd ml/training
    python3 train.py

Requires: pandas, numpy, scikit-learn (see ml/requirements.txt).
"""

import json
import pathlib

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "Telco-Customer-Churn.csv"
MODELS_DIR = ROOT / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

RANDOM_STATE = 42

NUMERIC_FEATURES = ["tenure", "MonthlyCharges", "TotalCharges"]

# Binary yes/no style columns -> encoded as 0/1
BINARY_FEATURES = [
    "gender",  # Male/Female
    "Partner",
    "Dependents",
    "PhoneService",
    "PaperlessBilling",
]

# Multi-category columns -> one-hot encoded (first level dropped to avoid
# collinearity; the dropped level is the implicit baseline).
CATEGORICAL_FEATURES = [
    "MultipleLines",
    "InternetService",
    "OnlineSecurity",
    "OnlineBackup",
    "DeviceProtection",
    "TechSupport",
    "StreamingTV",
    "StreamingMovies",
    "Contract",
    "PaymentMethod",
]


def load_and_clean(path: pathlib.Path) -> pd.DataFrame:
    df = pd.read_csv(path)

    # TotalCharges arrives as a string and has blanks for brand-new
    # (tenure == 0) customers. Coerce to numeric and fill those blanks
    # with 0, which is the correct value for a customer who has not yet
    # been billed — not an imputation guess.
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    df["TotalCharges"] = df["TotalCharges"].fillna(0.0)

    df["SeniorCitizen"] = df["SeniorCitizen"].astype(int)

    # Drop rows with no target label; keep everything else — no other
    # column in this dataset has missing values.
    df = df.dropna(subset=["Churn"])
    return df


def build_feature_frame(df: pd.DataFrame):
    """Returns (X: DataFrame of engineered features, feature_names: list,
    category_vocab: dict of column -> list of one-hot levels actually used)."""
    frame = pd.DataFrame(index=df.index)

    for col in NUMERIC_FEATURES:
        frame[col] = df[col].astype(float)

    binary_maps = {}
    for col in BINARY_FEATURES:
        if col == "gender":
            frame[col] = (df[col] == "Male").astype(int)
            binary_maps[col] = {"Male": 1, "Female": 0}
        else:
            frame[col] = (df[col] == "Yes").astype(int)
            binary_maps[col] = {"Yes": 1, "No": 0}
    frame["SeniorCitizen"] = df["SeniorCitizen"].astype(int)

    category_vocab = {}
    for col in CATEGORICAL_FEATURES:
        levels = sorted(df[col].unique().tolist())
        # Drop the first level alphabetically as baseline to match the
        # one-hot columns we generate below.
        baseline, kept_levels = levels[0], levels[1:]
        category_vocab[col] = {"baseline": baseline, "levels": kept_levels}
        for level in kept_levels:
            col_name = f"{col}__{level}"
            frame[col_name] = (df[col] == level).astype(int)

    feature_names = list(frame.columns)
    return frame, feature_names, binary_maps, category_vocab


def main():
    print(f"Loading dataset from {DATA_PATH} ...")
    df = load_and_clean(DATA_PATH)
    print(f"Loaded {len(df)} customer records.")

    y = (df["Churn"] == "Yes").astype(int).values
    X_frame, feature_names, binary_maps, category_vocab = build_feature_frame(df)
    X = X_frame.values.astype(float)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    # Scale only the numeric columns; one-hot / binary columns stay 0/1
    # so their coefficients remain directly interpretable as log-odds
    # shifts (needed for the explanation engine).
    numeric_idx = [feature_names.index(c) for c in NUMERIC_FEATURES]
    scaler = StandardScaler()
    X_train_scaled = X_train.copy()
    X_test_scaled = X_test.copy()
    X_train_scaled[:, numeric_idx] = scaler.fit_transform(X_train[:, numeric_idx])
    X_test_scaled[:, numeric_idx] = scaler.transform(X_test[:, numeric_idx])

    model = LogisticRegression(
        max_iter=2000, class_weight="balanced", random_state=RANDOM_STATE
    )
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_proba)
    cm = confusion_matrix(y_test, y_pred).tolist()  # [[TN, FP], [FN, TP]]

    coefs = model.coef_[0]
    intercept = float(model.intercept_[0])

    feature_importance = sorted(
        (
            {"feature": name, "coefficient": float(coef)}
            for name, coef in zip(feature_names, coefs)
        ),
        key=lambda item: abs(item["coefficient"]),
        reverse=True,
    )

    metrics = {
        "model_type": "Logistic Regression (class_weight=balanced)",
        "dataset_size": len(df),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "churn_distribution": {
            "churned": int(y.sum()),
            "retained": int(len(y) - y.sum()),
            "churn_rate": round(float(y.mean()), 4),
        },
        "accuracy": round(float(accuracy), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(roc_auc), 4),
        "confusion_matrix": {
            "true_negative": cm[0][0],
            "false_positive": cm[0][1],
            "false_negative": cm[1][0],
            "true_positive": cm[1][1],
        },
        "feature_importance": feature_importance,
    }

    model_artifact = {
        "model_type": "logistic_regression",
        "intercept": intercept,
        "feature_names": feature_names,
        "coefficients": [float(c) for c in coefs],
        "numeric_features": NUMERIC_FEATURES,
        "scaler": {
            "mean": {
                name: float(scaler.mean_[i])
                for i, name in enumerate(NUMERIC_FEATURES)
            },
            "scale": {
                name: float(scaler.scale_[i])
                for i, name in enumerate(NUMERIC_FEATURES)
            },
        },
        "binary_features": binary_maps,
        "categorical_features": category_vocab,
        "risk_thresholds": {"low_max": 0.30, "medium_max": 0.60},
    }

    with open(MODELS_DIR / "model.json", "w") as f:
        json.dump(model_artifact, f, indent=2)
    with open(MODELS_DIR / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print("\n=== Training complete ===")
    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1       : {f1:.4f}")
    print(f"ROC-AUC  : {roc_auc:.4f}")
    print(f"\nWrote {MODELS_DIR / 'model.json'}")
    print(f"Wrote {MODELS_DIR / 'metrics.json'}")


if __name__ == "__main__":
    main()
