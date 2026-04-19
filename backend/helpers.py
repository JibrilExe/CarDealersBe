import replicate
import requests

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
