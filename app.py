import os
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify, render_template, session
from werkzeug.utils import secure_filename
import joblib
import traceback

app = Flask(__name__)
app.secret_key = "your_secret_key"
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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
    return render_template("index.html")


@app.route("/orders")
def orders():
    return render_template("orders.html")


@app.route("/sales")
def sales():
    return render_template("sales.html")


@app.route("/apateron")
def apateron():
    return render_template("apateron.html")


@app.route("/upload", methods=["POST"])
def upload():
    try:
        file = request.files["file"]
        if not file:
            return jsonify({"error": "No file uploaded"}), 400

        filepath = os.path.join(UPLOAD_FOLDER, secure_filename(file.filename))
        file.save(filepath)

        session["file_path"] = filepath
        session["index"] = 0

        return jsonify({"message": "File uploaded successfully"}), 200
    except Exception as e:
        print(f"Error in upload endpoint: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route("/simulate", methods=["GET"])
def simulate():
    try:
        if "file_path" not in session:
            return (
                jsonify({"error": "No data to simulate. Please upload a file first."}),
                400,
            )

        index = session.get("index", 0)
        file_path = session["file_path"]
        data = pd.read_csv(file_path)

        if index >= len(data):
            return jsonify({"message": "Simulation complete"}), 200

        transaction = pd.DataFrame([data.iloc[index]])
        X_scaled = preprocess(transaction)

        prediction_traditional = model_traditional.predict(X_scaled[:, :30])[0]
        prediction_hybrid = model_hybrid.predict(X_scaled)[0]
        true_label = transaction["Class"].values[0]

        session["index"] = index + 1

        return (
            jsonify(
                {
                    "transaction": transaction.to_dict(orient="records")[0],
                    "prediction_traditional": int(prediction_traditional),
                    "prediction_hybrid": int(prediction_hybrid),
                    "true_label": int(true_label),
                }
            ),
            200,
        )
    except Exception as e:
        print(f"Error in simulate endpoint: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
