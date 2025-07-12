from flask import Flask, request, jsonify, render_template
import json
import os

app = Flask(__name__, static_folder='static')

DATA_FILE = "app_data.json"

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
        data = {"members": [], "last": {}}

    if "label" in new_data and "last" in new_data:
        label = new_data["label"]
        arrangement = new_data["last"]
        if isinstance(arrangement, list):
            data.setdefault("last", {})[label] = arrangement

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
            "members": [],
            "last": []
        }
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)
