# Usage Guide

## Notes
- Anything marked with **(sound generation)** is optional.
- These components enable **dynamic engine sound generation**.
- If not installed, the application will **fall back to pre-generated sounds**.

---

## 📦 Dependencies

### ✅ Required
- Docker

### 🔊 Optional (Sound Generation Only)
- Python 3
- pip3
- Linux (required for sound generation)
- Wine

---

## ⚙️ Setup
Add a .env file to the root off the project
add the following lines with your api keys
```
REPLICATE_API_TOKEN={replicate api token}
GEMINI_API_PAID_TOKEN={gemini api token}
```

Run the following commands in the **project root directory**:

```bash
docker-compose build
````

### Optional: Sound Generation Setup

```bash
# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

## ▶️ Run

### Optional: Start Sound Generation

```bash
python test.py
```

### Start Application

In a separate terminal (project root):

```bash
docker-compose up
```

You should now have both the **backend and frontend running**.

---

## 🖥️ Usage

1. Open your browser and go to:

   ```
   http://localhost:8080
   ```

2. **Add Cars**

   * Click the **"Add"** button (top right).
   * Image processing takes ~20 seconds (depending on system).
   * Once complete, the car appears at the bottom with its make and model when you hover over it.

3. **Play Engine Sound**

   * Click the button on the **top-left of the car image**.

4. **Garage System**

   * Drag a car to the **center of the screen** to add it to your garage.
   * View total price of the garage at the top of the screen.
   * Use the **right-side menu** to compare specifications.

5. **Managing Cars**

   * **Left-click** a car → Remove from garage
   * **Right-click** a car from the collection on the bottom of the screen → Remove from app entirely

6. **Drag Racing**

   * Add multiple cars to your garage.
   * Click the **"Race"** button (left side) to compare acceleration.

7. **Customization**

   * Click **"Change Background"** (top) to set a custom garage background.

---

## Summary

* Docker handles the core app
* Optional Python setup enables dynamic sound generation
* Interactive UI for comparing and racing cars
