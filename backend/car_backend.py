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

app = Flask(__name__, static_url_path='/static')
CORS(app, origins=["http://localhost:8000"])
UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS cars (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    image_url TEXT
)
""")
conn.commit()

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
        "image_url": f"/static/uploads/{filename}"
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
        "SELECT id, image_url FROM cars WHERE session_id = %s",
        (session_id,)
    )
    rows = cursor.fetchall()

    cars = [{"id": r[0], "image_url": r[1]} for r in rows]
    return jsonify(cars)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

