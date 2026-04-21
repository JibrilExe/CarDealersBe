"""
Idea:
store only ids, names, model, .., metrics in postgres database
store images in filesystem, use ids as names
"""

from flask import Flask, request, jsonify
import uuid
import os
import psycopg2
from flask_cors import CORS
import time
from helpers import remove_background, get_car_mm, delete_file
from engine_generator import write_engine

DATABASE_URL = os.getenv("DATABASE_URL")
app = Flask(__name__, static_url_path='/static')
CORS(app, resources={r"/*": {"origins": "*"}})
UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

conn = None
cursor = None

def init_db():
    global conn, cursor

    while True:
        try:
            conn = psycopg2.connect(DATABASE_URL)
            cursor = conn.cursor()
            break
        except psycopg2.OperationalError:
            print("DB not ready yet, retrying...")
            time.sleep(2)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cars (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        image_url TEXT,
        bg_removed_url TEXT,
        make TEXT,
        model TEXT,
        year TEXT,
        acceleration FLOAT,
        power FLOAT,
        color TEXT,
        displacement FLOAT,
        cylinders INTEGER,
        is_electric BOOLEAN,
        x FLOAT,
        y FLOAT,
        eur_value FLOAT,
        sound_url TEXT
    )
    """)
    conn.commit()

init_db()

@app.route("/place-car", methods=["POST"])
def place_car():
    data = request.json
    car_id = data["car_id"]
    x = data["x"]
    y = data["y"]

    cursor.execute("""
        UPDATE cars
        SET x = %s, y = %s
        WHERE id = %s
    """, (x, y, car_id))

    conn.commit()

    return jsonify({"ok": True})

from concurrent.futures import ThreadPoolExecutor

# The Batch Route
@app.route("/upload", methods=["POST"])
def upload_batch():
    files = request.files.getlist("images") # Get multiple files
    session_id = request.form.get("session_id")

    # Use ThreadPoolExecutor to run process_single_car in parallel
    with ThreadPoolExecutor(max_workers=5) as executor:
        # Create a list of arguments for the executor
        results = list(executor.map(lambda f: process_single_car(f, session_id), files))

    return jsonify(results)


def process_single_car(file, session_id):
    car_id = str(uuid.uuid4())

    print("TEST PRINT", flush=True)

    # 1. Save original image
    filename = f"{car_id}.png"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    image_url = f"/static/uploads/{filename}"
    processed_path = filepath
    # 2. Try background removal immediately
    bg_removed_url = None
    try:
        removed_filename = f"{car_id}_nobg.png"
        removed_path = os.path.join(UPLOAD_FOLDER, removed_filename)

        remove_background(filepath, removed_path)

        bg_removed_url = f"/static/uploads/{removed_filename}"
        processed_path = removed_path
    except Exception as e:
        print("BG removal failed:", e)
    
    print("BG_REMOVAL WORKED", flush=True)

    make = model = year = displacement = cylinders = power = acceleration = isElectric = eur_value = None
    # 3. Try to get car info from gemini
    try:
        car_info = get_car_mm(processed_path)
        print(car_info, flush=True)
        make = car_info.make
        model = car_info.model
        year = car_info.year
        displacement = car_info.displacement
        cylinders = car_info.cylinders
        power = car_info.power
        acceleration = car_info.zeroto100
        isElectric = car_info.electric
        eur_value = car_info.eur_value

    except Exception as e:
        print("Gemini failed:", e, flush=True)

    sound_url = f"/static/engine/defaults/{cylinders}/generated_engine_rpm_1500_throttle_50_loop_5s.wav"
    if cylinders:
        if cylinders > 0 and not isElectric:
            print("Generating engine sound", flush=True)
            try:
                sound_url = write_engine(cylinders, car_id)
                print("Generated engine sound:", sound_url, flush=True)
            except Exception as e:
                print("Sound generation failed:", e, flush=True)

        file_path_sound = sound_url.lstrip("/")
        if not os.path.exists(str(file_path_sound)):
            print("Sound not found! using default sound for cylinder", flush=True)
            if(cylinders <= 1 or cylinders > 18 or isElectric):
                sound_url = f"/static/engine/defaults/1/generated_engine_rpm_1500_throttle_50_loop_5s.wav"
            else:
                sound_url = f"/static/engine/defaults/{cylinders}/generated_engine_rpm_1500_throttle_50_loop_5s.wav"

    # 4. Store everything
    cursor.execute("""
        INSERT INTO cars (
            id, session_id,
            image_url, bg_removed_url,
            make, model, year,
            acceleration, power, displacement,
            cylinders, is_electric, eur_value, sound_url
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        car_id,
        session_id,
        image_url,
        bg_removed_url,
        make,
        model,
        year,
        acceleration,
        power,
        displacement,
        cylinders,
        isElectric,
        eur_value,
        sound_url
    ))

    conn.commit()

    return {
        "id": car_id,
        "session_id": session_id,
        "image_url": image_url,
        "bg_removed_url": bg_removed_url,
        "make": make,
        "model": model,
        "year": year,
        "displacement": displacement,
        "cylinders": cylinders,
        "power": power,
        "acceleration": acceleration,
        "isElectric": isElectric,
        "eur_value": eur_value,
        "sound_url": sound_url
    }


@app.route("/cars", methods=["GET"])
def get_cars():
    session_id = request.args.get("session_id")
    cursor.execute(
        "SELECT id, image_url, bg_removed_url, make, model, year, power, is_electric, x, y, acceleration, eur_value, cylinders, displacement, sound_url FROM cars WHERE session_id = %s",
        (session_id,)
    )
    rows = cursor.fetchall()

    cars = [
        {
            "id": r[0],
            "image_url": r[1],
            "bg_removed_url": r[2],
            "make": r[3],
            "model": r[4],
            "year": r[5],
            "power": r[6],
            "is_electric": r[7],
            "x": r[8],
            "y": r[9],
            "acceleration": r[10],
            "eur_value": r[11],
            "cylinders": r[12],
            "displacement": r[13],
            "sound_url": r[14]
        }
        for r in rows
    ]
    
    return jsonify(cars)

@app.route("/delete-car", methods=["POST"])
def delete_car():
    data = request.json
    car_id = data.get("car_id")

    if not car_id:
        return jsonify({"error": "car_id required"}), 400

    cursor.execute("""
        SELECT image_url, bg_removed_url FROM cars WHERE id = %s
    """, (car_id,))
    row = cursor.fetchone()

    if not row:
        return jsonify({"error": "car not found"}), 404

    image_url, bg_removed_url = row
    delete_file(image_url)
    delete_file(bg_removed_url)

    cursor.execute("DELETE FROM cars WHERE id = %s", (car_id,))
    conn.commit()

    return jsonify({"ok": True})

@app.route("/upload-bg", methods=["POST"])
def upload_bg():
    file = request.files.get("image")

    if not file:
        return jsonify({"error": "No file"}), 400

    bg_id = str(uuid.uuid4())
    filename = f"{bg_id}_bg.png"
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    file.save(filepath)

    return jsonify({
        "url": f"/static/uploads/{filename}"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)

