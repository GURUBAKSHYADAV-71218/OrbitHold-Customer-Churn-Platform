# ==========================================
# STEP 2: Imports (जो आपने पहले ही कर लिया है)
# ==========================================
import pandas as pd
import joblib

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

from xgboost import XGBClassifier
from lightgbm import LGBMClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

from data_loader import load_dataset
from preprocessing import clean_data
from feature_engineering import encode_data, split_data


# ==========================================
# STEP 3: Load Data (डाटा लोड और प्रोसेस करना)
# ==========================================
print("Loading and preparing data...")
df = load_dataset()
df = clean_data(df)
df = encode_data(df)
X_train, X_test, y_train, y_test = split_data(df)


# ==========================================
# STEP 4: Create models dictionary
# ==========================================
models = {
    "Logistic Regression": LogisticRegression(max_iter=1000),
    "Decision Tree": DecisionTreeClassifier(random_state=42),
    "Random Forest": RandomForestClassifier(random_state=42),
    "XGBoost": XGBClassifier(eval_metric="logloss", random_state=42),
    "LightGBM": LGBMClassifier(random_state=42)
}


# ==========================================
# STEP 5 & 6: Empty list & Training loop
# ==========================================
results = []

for name, model in models.items():
    print(f"\nTraining {name}...")
    
    # मॉडल को ट्रेन करना
    model.fit(X_train, y_train)
    
    # प्रेडिक्शन (Predictions) निकालना
    pred = model.predict(X_test)
    prob = model.predict_proba(X_test)[:, 1]
    
    # मैट्रिक्स को लिस्ट में सेव करना
    results.append({
        "Model": name,
        "Accuracy": accuracy_score(y_test, pred),
        "Precision": precision_score(y_test, pred),
        "Recall": recall_score(y_test, pred),
        "F1": f1_score(y_test, pred),
        "ROC_AUC": roc_auc_score(y_test, prob)
    })


# ==========================================
# STEP 7: Create DataFrame and Sort
# ==========================================
results_df = pd.DataFrame(results)
results_df = results_df.sort_values(by="ROC_AUC", ascending=False)

print("\n--- Model Comparison Results ---")
print(results_df.to_string(index=False))  # साफ़ सुथरा टेबल प्रिंट करने के लिए


# ==========================================
# STEP 8: Save comparison report
# ==========================================
results_df.to_csv("reports/model_comparison.csv", index=False)
print("\nComparison Report Saved to reports/model_comparison.csv!")


# ==========================================
# STEP 9: Automatically save best model
# ==========================================
best_model_name = results_df.iloc[0]["Model"]
print(f"\nBest Model Based on ROC-AUC: {best_model_name}")

best_model = models[best_model_name]
joblib.dump(best_model, "models/best_model.pkl")
print("Best Model Saved to models/best_model.pkl!")