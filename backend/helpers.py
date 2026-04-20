import replicate
import requests
import os
from PIL import Image
import types
from pydantic import BaseModel
from google import genai

GEMINI_KEY = os.getenv("GEMINI_API_TOKEN")

#VMMR (vehicle make model recognition) return variables
class CarInfo(BaseModel):
    make: str
    model: str
    year: str
    displacement: int
    cylinders: int
    power: int
    zeroto100: int
    electric: bool


def get_car_mm(image_path: str):
    """
    Takes a local file path, asks google gemini to get make and model of vehicle.
    """

    client = genai.Client(api_key=GEMINI_KEY)

    img = Image.open(image_path)

    # 2. Send the bytes directly
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=[
            img,
            "Identify the make model and build year of this vehicle. From this build model and year can you also find the engine displacement, the number of cylinders, the power of the engine in kW, the 0-100km/h time and if the vehicle is electric if any of these values have multiple anwsers pick the most common one"
        ],
        config={
            "response_mime_type": "application/json",
            "response_schema": CarInfo,
        },
    ) 

    product = response.parsed
    return product

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
