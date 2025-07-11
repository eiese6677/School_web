from flask import Flask, request, jsonify, render_template
import json
import os

app = Flask(__name__, static_folder='static')

DATA_FILE = "data.json"

@app.route("/")
def home():
    return render_template('index.html')

@app.route("/save", methods=["POST"])
def save():
    new_data = request.json

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        data = {"members": {}, "last": []}

    if "last" in new_data and isinstance(new_data["last"], list):
        # Append the new arrangement to the history
        data.setdefault("last", []).append(new_data["last"])

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return jsonify({"status": "success"})

@app.route("/load", methods=["GET"])
def load():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        # If file doesn't exist or is empty, return a default structure
        data = {
            "members": {"men": [], "women": [], "no": []},
            "last": []
        }
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)