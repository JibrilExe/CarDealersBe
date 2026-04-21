import { uploadCars, fetchCars, removeBackground, updateXY } from "./api.js";
import { loadCars } from "./render.js";
import { initSidePanel } from "./charters.js";
import { race } from "./race.js";
import { setLoading } from "./loading.js";
import { handleFileSelect, uploadClick } from "./upload.js";
import { getSessionId } from "./sessionId.js";
import { applyGarageBackground, updateBgButtons } from "./background.js";

const savedBg = localStorage.getItem("garage_bg");
if (savedBg) {
    applyGarageBackground(savedBg);
}

document.getElementById("fileInput").addEventListener("change", handleFileSelect);
document.getElementById("uploadBtn").addEventListener("click", uploadClick);
document.getElementById("raceBtn").addEventListener("click", race);
document.getElementById("bgUploadBtn").onclick = () => {
    document.getElementById("bgInput").click();
};
document.getElementById("bgRemoveBtn").onclick = () => {
    localStorage.removeItem("garage_bg");
    applyGarageBackground(null);
    updateBgButtons();
};

const panel = document.getElementById("sidePanel");
const button = document.getElementById("sidePanelButton");

let isOpen = false;

button.addEventListener("click", () => {
  isOpen = !isOpen;

  panel.classList.toggle("open");
  button.classList.toggle("open");

  button.textContent = isOpen ? "▶" : "◀";
});

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

    loadCars(getSessionId());
};

initSidePanel();
updateBgButtons();
loadCars(getSessionId());