import { updateXY, fetchCars } from "./api.js";

const BASE = "http://localhost:5001";

export async function loadCars(session_id) {
    const cars = await fetchCars(session_id);

    window.currentCars = cars; // store so race can reach them.

    renderCollection(cars);
    renderGarage(cars, session_id);
}

function renderCollection(cars) {
    const el = document.getElementById("collection");
    el.innerHTML = "";

    cars.forEach(car => {
        const card = document.createElement("div");
        card.className = "car-card"; // for css

        const img = document.createElement("img");
        img.src = BASE + (car.bg_removed_url || car.image_url);
        img.className = "car";
        
        var powerString = "-";
        if(car.power){
            powerString = car.is_electric ? car.power + " kW" : Math.round(1.35962*car.power) + " hp"
        }
        console.log(powerString);
        console.log(car.power);
        console.log(car.is_electric);
        const info = document.createElement("div");
        info.className = "car-info";
        info.innerHTML = `
            <b>${car.make || "Unknown"} ${car.model || ""}</b><br>
            Year: ${car.year || "-"}<br>
            Power: ${powerString}
        `;

        card.draggable = true;
        card.ondragstart = (e) => {
            e.dataTransfer.setData("text/plain", car.id);
        };

        card.appendChild(img);
        card.appendChild(info);
        el.appendChild(card);
    });
}

function renderGarage(cars, session_id) {
    const garage = document.getElementById("garage");
    garage.innerHTML = "";

    cars.forEach(car => {
        if (car.x == null || car.y == null) return;

        const img = document.createElement("img");
        img.src = BASE + (car.bg_removed_url || car.image_url);
        img.className = "car";

        img.style.left = car.x + "px";
        img.style.top = car.y + "px";

        img.onclick = async () => {
            await updateXY(car.id, null, null);
            loadCars(session_id);
        };

        garage.appendChild(img);
    });
}