from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import subprocess

app = Flask(__name__, static_url_path='/static')
CORS(app, resources={r"/*": {"origins": "*"}})
UPLOAD_FOLDER = "static/uploads"

@app.route("/execute_gen_sound", methods=["GET"])
def gen_sound():
    name = request.args.get("name")
    cmd = [
        "wine",
        "engine-sim-exporter.exe",
        "--rpm", "1500",
        "--throttle", "50",
        "--no-startup",
        "--no-ignition-off",
        "--script", f"../../../static/engine/{name}-main.mr",
        "--out", f"../../../static/engine/{name}"
    ]

    subprocess.run(cmd, check=True, cwd="backend/engine-sim-sound-exporter/bin")

    return {"generation": "succes"}
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)