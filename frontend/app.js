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

loadCars(session_id);
setupGarageDrop();