const API = "http://localhost:5001";

export async function uploadCar(formData) {
    return fetch(`${API}/upload`, {
        method: "POST",
        body: formData
    });
}

export async function fetchCars(session_id) {
    const res = await fetch(`${API}/cars?session_id=${session_id}`);
    return res.json();
}

export async function removeBackground(car_id) {
    return fetch(`${API}/remove-bg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ car_id })
    });
}