"""
Idea:
store only ids, names, model, .., metrics in postgres database
store images in filesystem, use ids as names
"""

from flask import Flask, request, jsonify
import os
import uuid
import os
import psycopg2
from flask_cors import CORS
import time
from helpers import remove_background

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
        cc FLOAT,
        cylinders INTEGER,
        x FLOAT,
        y FLOAT
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

@app.route("/upload", methods=["POST"])
def upload():
    file = request.files["image"]
    session_id = request.form.get("session_id")

    filename = f"{uuid.uuid4()}.png"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    car = {
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "image_url": f"/static/uploads/{filename}",
        "bg_removed_url": None
    }

    cursor.execute(
        "INSERT INTO cars (id, session_id, image_url) VALUES (%s, %s, %s)",
        (car["id"], car["session_id"], car["image_url"])
    )
    conn.commit()

    return jsonify(car)


@app.route("/cars", methods=["GET"])
def get_cars():
    session_id = request.args.get("session_id")
    cursor.execute(
        "SELECT id, image_url, bg_removed_url, make, model, year, power, x, y FROM cars WHERE session_id = %s",
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
            "x": r[7],
            "y": r[8]
        }
        for r in rows
    ]
    return jsonify(cars)


@app.route("/remove-bg", methods=["POST"])
def remove_bg():
    car_id = request.json.get("car_id")

    cursor.execute("SELECT image_url FROM cars WHERE id = %s", (car_id,))
    row = cursor.fetchone()

    if not row:
        return jsonify({"error": "Car not found"}), 404

    image_url = row[0]
    filepath = image_url.replace("/static/", "static/")

    removed_filename = f"{car_id}_nobg.png"
    removed_path = f"static/uploads/{removed_filename}"

    remove_background(filepath, removed_path)

    bg_removed_url = f"/static/uploads/{removed_filename}"

    cursor.execute(
        "UPDATE cars SET bg_removed_url = %s WHERE id = %s",
        (bg_removed_url, car_id)
    )
    conn.commit()

    return jsonify({"bg_removed_url": bg_removed_url})



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

