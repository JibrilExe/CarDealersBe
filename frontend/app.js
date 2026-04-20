import { uploadCars, fetchCars, removeBackground, updateXY } from "./api.js";
import { loadCars } from "./render.js"
import { initSidePanel } from "./charters.js"
import { race } from "./race.js"


let session_id = localStorage.getItem("session_id");
let selectedCar = null;
let loading = false;
let loadingInterval;

document.getElementById("fileInput").addEventListener("change", handleFileSelect);
document.getElementById("uploadBtn").addEventListener("click", uploadClick);
document.getElementById("raceBtn").addEventListener("click", race);

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