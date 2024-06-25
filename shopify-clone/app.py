import os
import pandas as pd
from flask import Flask, request, jsonify, render_template, session
from werkzeug.utils import secure_filename
import firebase_admin
from firebase_admin import credentials, firestore
import threading
import time
import traceback

app = Flask(__name__)
app.secret_key = "your_secret_key"
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

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

# Simulation state
simulation_state = {
    "running": False,
    "paused": False,
    "end_time": None,
    "index": 0,
    "file_path": None,
}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/orders")
def orders():
    return render_template("orders.html")


@app.route("/sales")
def sales():
    return render_template("sales.html")


@app.route("/upload", methods=["POST"])
def upload():
    try:
        file = request.files["file"]
        if not file:
            return jsonify({"error": "No file uploaded"}), 400

        filepath = os.path.join(
            app.config["UPLOAD_FOLDER"], secure_filename(file.filename)
        )
        file.save(filepath)

        session["file_path"] = filepath
        session["index"] = 0

        simulation_state["file_path"] = filepath
        simulation_state["index"] = 0

        return jsonify({"message": "File uploaded successfully"}), 200
    except Exception as e:
        print(f"Error in upload endpoint: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route("/simulate", methods=["POST"])
def simulate():
    try:
        data = request.json
        duration_hours = data.get("duration_hours", 0)
        if "file_path" not in simulation_state or not simulation_state["file_path"]:
            return (
                jsonify({"error": "No data to simulate. Please upload a file first."}),
                400,
            )

        simulation_state["running"] = True
        simulation_state["paused"] = False
        simulation_state["end_time"] = time.time() + duration_hours * 3600

        # Start the simulation in a new thread
        simulation_thread = threading.Thread(target=run_simulation)
        simulation_thread.start()

        return jsonify({"message": "Simulation started"}), 200
    except Exception as e:
        print(f"Error in simulate endpoint: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


def run_simulation():
    try:
        while (
            simulation_state["running"] and time.time() < simulation_state["end_time"]
        ):
            if simulation_state["paused"]:
                time.sleep(1)
                continue

            index = simulation_state["index"]
            file_path = simulation_state["file_path"]
            data = pd.read_csv(file_path)

            if index >= len(data):
                index = 0

            transaction = pd.DataFrame([data.iloc[index]])
            transaction_dict = transaction.to_dict(orient="records")[0]
            transaction_dict["order_index"] = index  # Adding order index

            # Save transaction to Firebase Firestore
            db.collection("transactions").add(transaction_dict)

            simulation_state["index"] = index + 1

            time.sleep(5)  # Adjust the sleep time to 5 seconds

    except Exception as e:
        print(f"Error in run_simulation: {e}")
        print(traceback.format_exc())


@app.route("/pause", methods=["POST"])
def pause_simulation():
    try:
        if simulation_state["running"]:
            simulation_state["paused"] = True
            return jsonify({"message": "Simulation paused"}), 200
        else:
            return jsonify({"error": "Simulation is not running"}), 400
    except Exception as e:
        print(f"Error pausing simulation: {e}")
        return jsonify({"error": "Failed to pause simulation"}), 500


@app.route("/resume", methods=["POST"])
def resume_simulation():
    try:
        if simulation_state["running"] and simulation_state["paused"]:
            simulation_state["paused"] = False
            return jsonify({"message": "Simulation resumed"}), 200
        else:
            return jsonify({"error": "Simulation is not paused or not running"}), 400
    except Exception as e:
        print(f"Error resuming simulation: {e}")
        return jsonify({"error": "Failed to resume simulation"}), 500


@app.route("/stop", methods=["POST"])
def stop_simulation():
    try:
        if simulation_state["running"]:
            simulation_state["running"] = False
            simulation_state["paused"] = False
            return jsonify({"message": "Simulation stopped"}), 200
        else:
            return jsonify({"error": "Simulation is not running"}), 400
    except Exception as e:
        print(f"Error stopping simulation: {e}")
        return jsonify({"error": "Failed to stop simulation"}), 500


@app.route("/fetch_transactions", methods=["GET"])
def fetch_transactions():
    try:
        transactions_ref = (
            db.collection("transactions").order_by("order_index").stream()
        )
        transactions = [trans.to_dict() for trans in transactions_ref]
        return jsonify(transactions), 200
    except Exception as e:
        print(f"Error fetching transactions: {e}")
        return jsonify({"error": "Failed to fetch transactions"}), 500


@app.route("/get_simulation_state", methods=["GET"])
def get_simulation_state():
    try:
        state = {
            "running": simulation_state["running"],
            "paused": simulation_state["paused"],
        }
        return jsonify(state), 200
    except Exception as e:
        print(f"Error fetching simulation state: {e}")
        return jsonify({"error": "Failed to fetch simulation state"}), 500


if __name__ == "__main__":
    app.run(debug=True)
