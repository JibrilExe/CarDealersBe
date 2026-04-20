import { setLoading } from "./loading.js";
import { uploadCars } from "./api.js";
import { loadCars } from "./render.js";
import { getSessionId } from "./sessionId.js";

export function uploadClick() {
    document.getElementById("fileInput").click();
}

export async function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setLoading(true);

    try {
        const formData = new FormData();
        files.forEach(file => {
            formData.append("images", file); 
        });
        const session_id = getSessionId();
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