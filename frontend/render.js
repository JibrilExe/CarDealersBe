import { updateXY, fetchCars } from "./api.js";
import { renderChart, removeChart, METRICS, activeCharts, refreshCharts } from "./charters.js";

const BASE = "http://localhost:5001";

export async function loadCars(session_id) {
    const cars = await fetchCars(session_id);

    window.currentCars = cars; // store so race can reach them.

    renderCollection(cars);
    renderGarage(cars, session_id);
    updateGarageValue(cars);
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
        var eur_value = ( car.eur_value + "€" || "Unknown" ) 
        const info = document.createElement("div");
        info.className = "car-info";
        info.innerHTML = `
            <b>${car.make || "Unknown"} ${car.model || ""}</b><br>
            Year: ${car.year || "-"}<br>
            Power: ${powerString}<br>
            Est. value: ${eur_value}
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

function updateGarageValue(cars) {
    const display = document.getElementById("totalValueDisplay");    
    const garageCars = cars.filter(c => c.x != null && c.y != null);
    refreshCharts(garageCars);
    const total = garageCars.reduce((sum, car) => sum + (parseFloat(car.eur_value) || 0), 0);
    const formatted = "€" + total.toLocaleString();
    display.textContent = formatted;
}