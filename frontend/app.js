import { uploadCars, fetchCars, removeBackground, updateXY } from "./api.js";
import { loadCars } from "./render.js"
import { initSidePanel } from "./charters.js"

let session_id = localStorage.getItem("session_id");
let selectedCar = null;
let loading = false;
let loadingInterval;
let abortedRace = false;

document.getElementById("fileInput").addEventListener("change", handleFileSelect);
document.getElementById("uploadBtn").addEventListener("click", uploadClick);

if (!session_id) {
    session_id = crypto.randomUUID();
    localStorage.setItem("session_id", session_id);
}


function setLoading(state) {
    const el = document.getElementById("loading");

    if (state) {
        el.classList.remove("hidden");

        const messages = [
            "Removing background...",
            "Analyzing vehicle...",
            "Getting latest data...",
            "Estimating value...",
            "Almost done..."
        ];

        let i = 0;

        loadingInterval = setInterval(() => {
            document.getElementById("loadingText").innerText =
                messages[i % messages.length];
            i++;
        }, 1500);

    } else {
        el.classList.add("hidden");
        clearInterval(loadingInterval);
    }
}

async function upload() {
    const file = document.getElementById("fileInput").files[0];
    if (!file || loading) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("session_id", session_id);

    const uploadRes = uploadCar(formData);
    await uploadRes.json();

    await loadCars(session_id);
    setLoading(false);
}

function uploadClick() {
    document.getElementById("fileInput").click();
}

async function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0 || loading) return;

    setLoading(true);

    try {
        const formData = new FormData();
        files.forEach(file => {
            formData.append("images", file); 
        });
        formData.append("session_id", session_id);
        const response = await uploadCars(formData);
        const newCars = await response.json();
        await loadCars(session_id);

    } catch (err) {
        console.error("Batch upload failed", err);
    } finally {
        setLoading(false);
    }
}

function setupGarageDrop() {
    const garage = document.getElementById("garage");

    garage.ondragover = (e) => e.preventDefault();

    garage.ondragenter = () => garage.classList.add("drag-over");
    garage.ondragleave = () => garage.classList.remove("drag-over");

    garage.ondrop = async (e) => {
        e.preventDefault();
        garage.classList.remove("drag-over");

        const carId = e.dataTransfer.getData("text/plain");
        const rect = garage.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        await updateXY(carId, x, y);

        loadCars(session_id);
    };
}

function openRaceModal(cars) {
    const modal = document.getElementById("raceModal");
    const track = document.getElementById("raceTrack");
    
    // Clear previous
    track.innerHTML = "";
    modal.classList.remove("hidden");

    const carElements = [];
    cars.forEach((car, index) => {
        const lane = document.createElement("div");
        lane.className = "lane";
        
        const img = document.createElement("img");
        img.src = "http://localhost:5001" + (car.bg_removed_url || car.image_url);
        img.id = `race-car-${index}`;
        
        lane.appendChild(img);
        lane.appendChild(document.createElement("div")).className = "flag"; // Finish line
        track.appendChild(lane);
        
        carElements.push(img);
    });

    startRace(cars, carElements);
}

function startRace(cars, carElements) {
    abortedRace = false;
    const positions = new Array(cars.length).fill(0);
    // Speed: Lower time (0-100) = Faster speed
    const speeds = cars.map(c => (1 / (c.acceleration || 10)) * 20);

    const interval = setInterval(() => {
        let finished = false;

        cars.forEach((_, i) => {
            positions[i] += speeds[i];
            carElements[i].style.left = positions[i] + "%";

            if (positions[i] >= 90) finished = true;
        });

        if (finished) {
            clearInterval(interval);
            const sortedCars = [...cars].sort((a, b) => (a.acceleration || 10) - (b.acceleration || 10));
            const winner = sortedCars[0];
            if (!abortedRace){
                showWinner(winner);
            }
        }
    }, 50);
}

function showWinner(car) {
    const overlay = document.getElementById("winnerOverlay");
    const title = document.getElementById("winnerTitle");
    const img = document.getElementById("winnerImage");
    const stats = document.getElementById("winnerStats");

    title.innerText = `${car.make || "Unknown"} ${car.model || ""} (${car.year || "-"}) won 🏆`;

    img.src = "http://localhost:5001" + (car.bg_removed_url || car.image_url);

    let powerString = "-";
    if (car.power) {
        powerString = car.is_electric
            ? car.power + " kW"
            : Math.round(1.35962 * car.power) + " hp";
    }

    stats.innerHTML = `
        <b>Acceleration (0-100):</b> ${car.acceleration || "-"} s<br>
        <b>Power:</b> ${powerString}<br>
        <b>Cylinders:</b> ${car.cylinders || "-"}<br>
        <b>Displacement:</b> ${car.displacement || "-"} L<br>
        <b>Estimated Value:</b> ${car.eur_value || "-"} €<br>
        <b>Electric:</b> ${car.is_electric ? "Yes ⚡" : "No"}
    `;

    overlay.classList.remove("hidden");

    // click outside to close
    overlay.onclick = () => {
        overlay.classList.add("hidden");
        document.getElementById("raceModal").classList.add("hidden");
    };
}

function race() {
    const cars = window.currentCars || [];
    const garageCars = cars.filter(c => c.x != null && c.y != null);

    if (garageCars.length < 2) {
        alert("Need at least 2 cars to race!");
        return;
    }
    console.log(garageCars);
    openRaceModal(garageCars);
}

document.getElementById("raceBtn").addEventListener("click", race);

initSidePanel();
loadCars(session_id);
setupGarageDrop();

const panel = document.getElementById("sidePanel");
const button = document.getElementById("sidePanelButton");

let isOpen = false;

button.addEventListener("click", () => {
  isOpen = !isOpen;

  panel.classList.toggle("open");
  button.classList.toggle("open");

  button.textContent = isOpen ? "▶" : "◀";
});