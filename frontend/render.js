import { updateXY, fetchCars, deleteCar } from "./api.js";
import { renderChart, removeChart, METRICS, activeCharts, refreshCharts } from "./charters.js";

const BASE = "http://localhost:5001";

export async function loadCars(session_id) {
    const cars = await fetchCars(session_id);

    window.currentCars = cars; // store so race can reach them.

    renderCollection(cars, session_id);
    renderGarage(cars, session_id);
    updateGarageValue(cars);
}

function renderCollection(cars, session_id) {
    const el = document.getElementById("collection");
    el.innerHTML = "";

    cars.forEach(car => {
        const soundBtn = document.createElement("button");
        soundBtn.className = "sound-btn";
        soundBtn.innerHTML = "🔊";
        soundBtn.onclick = (e) => {
            e.stopPropagation(); // important so it doesn't trigger drag/click issues

            if (!car.sound_url) return;

            const audio = new Audio(BASE + car.sound_url);
            audio.volume = 0.7;
            audio.play().catch(err => {
                console.log("Audio play blocked:", err);
            });
        };
        const card = document.createElement("div");
        card.className = "car-card"; // for css

        const img = document.createElement("img");
        img.src = BASE + (car.bg_removed_url || car.image_url);
        img.className = "car";
        
        let powerString = "-";
        if(car.power){
            powerString = car.is_electric ? car.power + " kW" : Math.round(1.35962*car.power) + " hp"
        }
        let eur_value = ( car.eur_value + "€" || "Unknown" ) 
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

            // store offset so drop feels natural
            const rect = e.target.getBoundingClientRect();

            const offsetX = e.offsetX;
            const offsetY = e.offsetY;

            e.dataTransfer.setData("offsetX", offsetX);
            e.dataTransfer.setData("offsetY", offsetY);
        };

        card.addEventListener("contextmenu", async (e) => {
            e.preventDefault(); // we overtake right click for delete, left click would be too counter intuitive for new users?

            try {
                const res = await deleteCar(car.id);

                if (!res.ok) {
                    console.log("Delete failed:", res);
                    return;
                }

                card.remove();
                await loadCars(session_id);

            } catch (err) {
                console.log("Delete error:", err);
            }
        });
        card.appendChild(soundBtn);
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
        img.draggable = true;
        img.ondragstart = (e) => {
            e.dataTransfer.setData("text/plain", car.id);

            // mark origin
            e.dataTransfer.setData("from", "garage");

            const rect = e.target.getBoundingClientRect();

            const offsetX = e.offsetX;
            const offsetY = e.offsetY;

            e.dataTransfer.setData("offsetX", offsetX);
            e.dataTransfer.setData("offsetY", offsetY);
        };

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