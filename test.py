from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import subprocess
import platform

app = Flask(__name__, static_url_path='/static')
CORS(app, resources={r"/*": {"origins": "*"}})
UPLOAD_FOLDER = "static/uploads"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

ENGINE_DIR = os.path.join(
    BASE_DIR,
    "backend",
    "engine-sim-sound-exporter",
    "bin"
)

EXE_NAME = "engine-sim-exporter.exe"
EXE_PATH = os.path.join(ENGINE_DIR, EXE_NAME)

@app.route("/execute_gen_sound", methods=["GET"])
def gen_sound():
    name = request.args.get("name")
    if not name:
        return jsonify({"error": "missing name"}), 400

    script_path = os.path.abspath(
        os.path.join(BASE_DIR, "static", "engine", f"{name}-main.mr")
    )

    output_dir = os.path.abspath(
        os.path.join(BASE_DIR, "static", "engine", name)
    )
    base_cmd = [
        EXE_PATH,
        "--rpm", "1500",
        "--throttle", "50",
        "--no-startup",
        "--no-ignition-off",
        "--script", script_path,
        "--out", output_dir
    ]

    system = platform.system()
    if system == "Windows":
        cmd = base_cmd
        cwd = ENGINE_DIR
        print("🪟 WINDOWS MODE")

    else:
        # Linux / Mac: use Wine
        cmd = ["wine"] + base_cmd
        cwd = ENGINE_DIR
        print("🐧 UNIX/WINE MODE")

    print("ENGINE_DIR:", ENGINE_DIR, flush=True)
    print("EXE EXISTS:", os.path.exists(EXE_PATH), flush=True)
    print("SCRIPT:", script_path, flush=True)
    print("OUTPUT:", output_dir, flush=True)
    print("CMD:", cmd, flush=True)

    try:
        subprocess.run(
            cmd,
            cwd=cwd,
            check=True
        )
    except subprocess.CalledProcessError as e:
        return jsonify({
            "error": "sound generation failed",
            "details": str(e)
        }), 500

    return jsonify({
        "generation": "success",
        "sound": f"/static/engine/{name}/generated_engine_rpm_1500_throttle_50_loop_5s.wav"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)