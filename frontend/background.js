import { uploadBackground } from "./api.js";
import { BASE } from "./base_url.js"

document.getElementById("bgInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
        const res = await uploadBackground(formData);

        if (res.url) {
            localStorage.setItem("garage_bg", res.url);
            applyGarageBackground(res.url);
            updateBgButtons();
        }
    } catch (err) {
        console.error("BG upload failed", err);
    }
});

export function applyGarageBackground(url) {
    const garage = document.getElementById("garage");

    if (!url) {
        garage.style.backgroundImage = "";
        return;
    }

    garage.style.backgroundImage = `url("${BASE}${url}")`;
}

export function updateBgButtons() {
    const hasBg = !!localStorage.getItem("garage_bg");
    const btn = document.getElementById("bgRemoveBtn");

    if (hasBg) {
        btn.classList.remove("disabled");
    } else {
        btn.classList.add("disabled");
    }
}