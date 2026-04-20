import { uploadCar, fetchCars, removeBackground, updateXY } from "./api.js";

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

    await loadCars();
    setLoading(false);
}

async function loadCars() {
    const cars = await fetchCars(session_id);

    renderCollection(cars);
    renderGarage(cars);
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
        const card = document.createElement("div");
        card.className = "car-card";

        if (selectedCar === car.id) {
            card.classList.add("selected");
        }

        const img = document.createElement("img");
        img.src = "http://localhost:5001" + (car.bg_removed_url || car.image_url);
        img.className = "car";

        const info = document.createElement("div");
        info.className = "car-info";
        info.innerHTML = `
            <b>${car.make || "Unknown"} ${car.model || ""}</b><br>
            Year: ${car.year || "-"}<br>
            Power: ${car.power ? car.power + " hp" : "-"}
        `;

        card.onclick = () => {
            selectedCar = car.id;
            loadCars();
        };

        card.draggable = true;

        card.ondragstart = (e) => {
            e.dataTransfer.setData("text/plain", car.id);
            e.dataTransfer.effectAllowed = "move";
        };

        card.appendChild(img);
        card.appendChild(info);
        el.appendChild(card);
    });
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
        console.log("Dropped carId:", carId);
        const rect = garage.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        await updateXY(carId, x, y);

        loadCars();
    };
}

function renderGarage(cars) {
    const garage = document.getElementById("garage");
    garage.innerHTML = "";

    cars.forEach(car => {
        console.log("Car coords: ", car.x, car.y);
        if (car.x == null || car.y == null) return;

        const img = document.createElement("img");
        img.src = "http://localhost:5001" + (car.bg_removed_url || car.image_url);
        img.className = "car";

        img.style.left = car.x + "px";
        img.style.top = car.y + "px";

        img.onclick = async () => {
            await updateXY(car.id, null, null);
            loadCars();
        };

        garage.appendChild(img);
    });
}

loadCars();
setupGarageDrop();