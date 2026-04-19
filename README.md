# CarDealersBe

## Structure:
Frontend allows uploading images.
They are stored in static/uploads folder.

When user selects car and then clicks remove bg, the API will send a call to our backend model, it needed avg 5-10 seconds to complete during localhost tests. Upon completion, the image will be replaced with a version that has bg removed.

## How to setup:
Background removal model is hosted on replicate, thus a .env is needed with REPLICATE_API_TOKEN=your-api-token

Make sure you have docker.

OR:
Run it yourself.. you will need to configure postgres correctly and install the python reqs via the requirements.txt in backend..

Frontend is currently a simple HTML page with JS and CSS so just host that too local..

## How to run (with docker):
```
docker-compose build
docker-compose up
```