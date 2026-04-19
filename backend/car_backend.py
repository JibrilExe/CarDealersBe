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
import replicate
import requests
import time

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
        bg_removed_url TEXT
    )
    """)
    conn.commit()

init_db()

def remove_background(image_path: str, output_path: str):
    """
    Takes a local file path, runs AI background removal,
    saves result to output_path, returns output_path.
    """

    # Upload local file as file-like object
    with open(image_path, "rb") as file:
        output = replicate.run(
            "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
            input={
                "image": file
            }
        )

    # replicate returns a URL or file-like object depending on model
    # safest way: handle both cases

    if hasattr(output, "read"):
        # file-like
        with open(output_path, "wb") as f:
            f.write(output.read())
    else:
        # URL case
        r = requests.get(output.url)
        with open(output_path, "wb") as f:
            f.write(r.content)

    return output_path

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
        "SELECT id, image_url, bg_removed_url FROM cars WHERE session_id = %s",
        (session_id,)
    )
    rows = cursor.fetchall()

    cars = [
        {
            "id": r[0],
            "image_url": r[1],
            "bg_removed_url": r[2]
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

