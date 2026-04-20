import replicate
import requests
import os
from PIL import Image
from pydantic import BaseModel
from google import genai

GEMINI_KEY = os.getenv("GEMINI_API_TOKEN")
GEMINI_API_PAID_TOKEN = os.getenv("GEMINI_API_PAID_TOKEN")

#VMMR (vehicle make model recognition) return variables
class CarInfo(BaseModel):
    make: str
    model: str
    year: str
    displacement: int
    cylinders: int
    power: int
    zeroto100: float
    electric: bool
    eur_value: float


def get_car_mm(image_path: str):
    print("IN CARMM", flush=True)

    client = genai.Client(api_key=GEMINI_API_PAID_TOKEN)
    img = Image.open(image_path)
    img.thumbnail((1024, 1024)) # we want to reduce bytes sent
    
    system_prompt = (
        "You are an expert automotive identification assistant. "
        "Your task is to identify vehicle make, model, and year from images. "
        "If you are not 100% certain, provide your best educated estimate based on visual cues. "
        "Under no circumstances should you return 'unknown' if a plausible match exists. "
        "Prioritize the most common engine and performance specifications for the identified model."
    )

    user_prompt = (
        "Identify the make, model, and build year of this vehicle. "
        "Based on this, provide the engine displacement, number of cylinders, an estimate of the current car value in euros, "
        "power in kW, and 0-100km/h time (in seconds formatted as a decimal number, e.g., 9.81). If electric, fill in relevant fields."
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[img, user_prompt],
        config={
            "response_mime_type": "application/json",
            "response_schema": CarInfo,
            "system_instruction": system_prompt,
            "temperature": 0.1,
        },
    )

    # --- DEBUGGING BLOCK --- # TODO: remove debug prints for final submission?
    print("\n--- RAW GEMINI RESPONSE ---")
    print(response.text, flush=True)
    print("---------------------------\n")

    return response.parsed

def remove_background(image_path: str, output_path: str):
    """
    Takes a local file path, runs AI background removal,
    saves result to output_path, returns output_path.
    """
    with open(image_path, "rb") as file:
        output = replicate.run(
            "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
            input={
                "image": file
            }
        )

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

def delete_file(url):
    if not url:
        return
    try:
        path = url.replace("/static/", "static/")
        if os.path.exists(path):
            os.remove(path)
    except Exception as e:
        print("File delete error:", e)