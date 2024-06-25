import os
import pandas as pd
import numpy as np
from flask import Flask, jsonify, render_template, session
import firebase_admin
from firebase_admin import credentials, firestore
import joblib
import traceback

app = Flask(__name__)
app.secret_key = "your_secret_key"


folder_path = os.path.join(
    os.path.dirname(__file__), "..", "firebase_credentials"
)  # Adjust based on your actual parent folder structure
json_file = next((f for f in os.listdir(folder_path) if f.endswith(".json")), None)

if not json_file:
    raise FileNotFoundError(f"No JSON file found in folder '{folder_path}'.")

# Construct the full path to the JSON file
json_path = os.path.join(folder_path, json_file)

# Initialize Firebase Admin with credentials from JSON file
cred = credentials.Certificate(json_path)
firebase_admin.initialize_app(cred)
db = firestore.client()


desired_columns_order = [
    "Time",
    "V1",
    "V2",
    "V3",
    "V4",
    "V5",
    "V6",
    "V7",
    "V8",
    "V9",
    "V10",
    "V11",
    "V12",
    "V13",
    "V14",
    "V15",
    "V16",
    "V17",
    "V18",
    "V19",
    "V20",
    "V21",
    "V22",
    "V23",
    "V24",
    "V25",
    "V26",
    "V27",
    "V28",
    "Amount",
    "Class",
]

# Load models
scaler = joblib.load("models/scaler.pkl")
model_traditional = joblib.load("models/model_traditional.pkl")
model_hybrid = joblib.load("models/model_hybrid.pkl")


def add_mechanistic_features(df):
    df["geographical_velocity"] = np.random.random(size=len(df))
    df["amount_std"] = df["Amount"].rolling(window=5).std().fillna(0)
    df["hour"] = df["Time"].apply(lambda x: (x % 86400) // 3600)
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    df["device_change"] = np.random.randint(0, 2, size=len(df))
    df["ip_change"] = np.random.randint(0, 2, size=len(df))
    return df


def preprocess(df):
    df = add_mechanistic_features(df)
    X_scaled = scaler.transform(df.drop(columns=["Class"]))
    return X_scaled


@app.route("/")
def index():
    return render_template("apateron.html")


@app.route("/fetch_and_process_transactions", methods=["GET"])
def fetch_and_process_transactions():
    try:
        transactions_ref = db.collection("transactions").stream()
        transactions = [trans.to_dict() for trans in transactions_ref]

        processed_transactions = []
        for transaction in transactions:
            try:
                # Create DataFrame from transaction and drop 'order_index' if present
                transaction_df = pd.DataFrame([transaction])
                if "order_index" in transaction_df.columns:
                    transaction_df = transaction_df.drop(columns=["order_index"])

                # Ensure columns are in desired order
                transaction_df = transaction_df.reindex(columns=desired_columns_order)

                # Perform preprocessing
                X_scaled = preprocess(transaction_df)

                # Make predictions
                prediction_traditional = model_traditional.predict(X_scaled[:, :30])[0]
                prediction_hybrid = model_hybrid.predict(X_scaled)[0]
                true_label = transaction["Class"]

                # Add predictions to transaction dict
                transaction["prediction_traditional"] = int(prediction_traditional)
                transaction["prediction_hybrid"] = int(prediction_hybrid)
                transaction["true_label"] = true_label

                # Append processed transaction to list
                processed_transactions.append(transaction)

            except Exception as e:
                print(f"Error processing transaction: {e}")
                print(f"Transaction details: {transaction}")
                print(traceback.format_exc())

        return jsonify(processed_transactions), 200

    except Exception as e:
        print(f"Error fetching transactions: {e}")
        print(traceback.format_exc())
        return jsonify({"error": "Failed to fetch and process transactions"}), 500


if __name__ == "__main__":
    app.run(port=5001, debug=True)  # Change to the desired port, e.g., 5001
