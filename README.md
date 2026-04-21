# Premium Deluxe Motorsport
Gamified virtual garage builder.
Upload clear images of your favourite motor vehicle.
Choose your own garage background.
Compare your favourite cars with classic charts, or make them race.

(Soon you will also be able to hear your engine sounds.)

## App usage:
When user uploads car(s), a request is sent to our backend model, which will do a best effort to remove the background, and get all relevant car stats.
During development it needed avg 10-15 seconds to complete one upload. (May vary depending on our used tool loads)
Upon completion the car is displayed in the bottom collection tab.

From the collection tab, cars can be dragged to the garage == the box in middle of screen.
Cars in the garage can be compared with charts using the side panel on the right that can be expanded.
For quick stats on a car in collection, hover it.

Using the race button, all cars in garage are made to race. Upon end the winner stats are displayed in a popup.

Right click cars in the collection to remove them (adding them back will cost you time again).
Left click cars in the garage to remove them from garage only.

On top of the screen, the estimated total value of all cars in the garage is displayed.

Garage background can be set by user with the choose background button.
Trash can button can be used to reset to original background.

## How to host yourself:
Background removal model is hosted on replicate,
and the demo uses Gemini to guesstimate car stats.
Thus you need to set following API tokens in a .env located in the root of the project since docker-compose.yaml will look there.
```
REPLICATE_API_TOKEN=
GEMINI_API_PAID_TOKEN=
```

Get yourself a Docker capable machine.
It assumes that port 5001 is free for the database, and 8080 for the web app.

```
docker-compose build
docker-compose up
```