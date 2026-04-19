import { uploadCar, fetchCars, removeBackground } from "./api.js";

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

    await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData
    });

    await loadCars();
    setLoading(false);
}

async function loadCars() {
    const res = await fetch(`http://localhost:5000/cars?session_id=${session_id}`);
    const cars = await res.json();

    renderCollection(cars);
    renderGarage(cars);
}

async function removeBg() {
    if (!selectedCar || loading) {
        alert("Select a car first");
        return;
    }

    setLoading(true);

    await fetch("http://localhost:5000/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ car_id: selectedCar })
    });

    await loadCars();
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
        // 1. Upload image
        const formData = new FormData();
        formData.append("image", file);
        formData.append("session_id", session_id);

        const uploadRes = await fetch("http://localhost:5000/upload", {
            method: "POST",
            body: formData
        });

        const car = await uploadRes.json();

        // 2. Try remove background
        try {
            await fetch("http://localhost:5000/remove-bg", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ car_id: car.id })
            });
        } catch (err) {
            console.warn("BG removal failed, keeping original image", err);
        }

        // 3. Reload UI (will show bg_removed if available)
        await loadCars();

    } catch (err) {
        console.error("Upload failed", err);
    }

    setLoading(false);

    // reset input so same file can be re-selected later
    event.target.value = "";
}

function renderCollection(cars) {
    const el = document.getElementById("collection");
    el.innerHTML = "";

    cars.forEach(car => {
        const img = document.createElement("img");
        img.src = "http://localhost:5000" + (car.bg_removed_url || car.image_url);
        img.className = "car";

        img.draggable = true;

        img.ondragstart = (e) => {
            e.dataTransfer.setData("carId", car.id);
        };

        el.appendChild(img);
    });
}

function setupGarageDrop() {
    const garage = document.getElementById("garage");

    garage.ondragover = (e) => e.preventDefault();

    garage.ondrop = async (e) => {
        e.preventDefault();

        const carId = e.dataTransfer.getData("carId");

        const rect = garage.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        await fetch("http://localhost:5000/place-car", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ car_id: carId, x, y })
        });

        loadCars();
    };
}

function renderGarage(cars) {
    const garage = document.getElementById("garage");
    garage.innerHTML = "";

    cars.forEach(car => {
        if (car.x == null || car.y == null) return;

        const img = document.createElement("img");
        img.src = "http://localhost:5000" + car.image_url;
        img.className = "car";

        img.style.left = car.x + "px";
        img.style.top = car.y + "px";

        garage.appendChild(img);
    });
}

loadCars();