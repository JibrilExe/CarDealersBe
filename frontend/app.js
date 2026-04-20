import { uploadCar, fetchCars, removeBackground, updateXY } from "./api.js";
import { loadCars } from "./render.js"

let session_id = localStorage.getItem("session_id");
let selectedCar = null;
let loading = false;

document.getElementById("fileInput").addEventListener("change", handleFileSelect);
document.getElementById("uploadBtn").addEventListener("click", uploadClick);

if (!session_id) {
    session_id = crypto.randomUUID();
    localStorage.setItem("session_id", session_id);
}

function setLoading(state) {
    loading = state;
    document.getElementById("loading").style.display = state ? "block" : "none";
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
    const file = event.target.files[0];
    if (!file || loading) return;

    setLoading(true);

    try {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("session_id", session_id);
        const uploadRes = await uploadCar(formData);
        const car = await uploadRes.json();
        await loadCars(session_id);

    } catch (err) {
        console.error("Upload failed", err);
    }

    setLoading(false);

    // reset input so same file can be re-selected later
    event.target.value = "";
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
    const resultDiv = document.getElementById("raceResult");
    
    // Clear previous
    track.innerHTML = "";
    resultDiv.innerHTML = "";
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
    const resultDiv = document.getElementById("raceResult");
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
            
            // Find who won (the one with the highest position or shortest time)
            // Sorting cars by their zero-to-100 time
            const sortedCars = [...cars].sort((a, b) => (a.acceleration || 10) - (b.acceleration || 10));
            const winner = sortedCars[0];

            resultDiv.innerHTML = `🏆 Winner: ${winner.make} ${winner.model} (${winner.acceleration}s)`;
        }
    }, 50);
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

document.getElementById("closeRace").onclick = () => {
    document.getElementById("raceModal").classList.add("hidden");
    document.getElementById("raceResult").innerHTML = "";
};
document.getElementById("raceBtn").addEventListener("click", race);
loadCars(session_id);
setupGarageDrop();