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
        console.log("Dropped carId:", carId);
        const rect = garage.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        await updateXY(carId, x, y);

        loadCars(session_id);
    };
}

function race() {
    const cars = window.currentCars || [];

    console.log(cars);
    const garageCars = cars.filter(c => c.x != null && c.y != null);

    if (garageCars.length < 2) {
        alert("Need at least 2 cars in garage");
        return;
    }

    const [c1, c2] = garageCars;

    openRaceModal(c1, c2);
}

function openRaceModal(car1, car2) {
    const modal = document.getElementById("raceModal");
    modal.classList.remove("hidden");

    const img1 = document.getElementById("car1");
    const img2 = document.getElementById("car2");

    img1.src = "http://localhost:5001" + (car1.bg_removed_url || car1.image_url);
    img2.src = "http://localhost:5001" + (car2.bg_removed_url || car2.image_url);

    startRace(car1, car2);
}

function startRace(c1, c2) {
    const car1El = document.getElementById("car1");
    const car2El = document.getElementById("car2");

    const acc1 = c1.acceleration || 10;
    const acc2 = c2.acceleration || 10;

    // lower = faster → convert to speed
    const speed1 = 1 / acc1;
    const speed2 = 1 / acc2;
    console.log(speed1, speed2);

    let pos1 = 0;
    let pos2 = 0;

    const interval = setInterval(() => {
        pos1 += speed1 * 5;
        pos2 += speed2 * 5;

        car1El.style.left = pos1 + "%";
        car2El.style.left = pos2 + "%";

        if (pos1 >= 90 || pos2 >= 90) {
            clearInterval(interval);

            const winner = pos1 > pos2 ? c1 : c2;

            document.getElementById("raceResult").innerHTML = `
                🏆 Winner: ${winner.make} ${winner.model}<br>
                0-100: ${winner.acceleration}s
            `;
        }
    }, 50);
}

document.getElementById("closeRace").onclick = () => {
    document.getElementById("raceModal").classList.add("hidden");
};
document.getElementById("raceBtn").addEventListener("click", race);
loadCars(session_id);
setupGarageDrop();

const panel = document.getElementById("sidePanel");
const button = document.getElementById("sidePanelButton");

let isOpen = false;

button.addEventListener("click", () => {
  isOpen = !isOpen;

  panel.classList.toggle("open");
  button.classList.toggle("open");

  // Change arrow direction
  button.textContent = isOpen ? "▶" : "◀";
});