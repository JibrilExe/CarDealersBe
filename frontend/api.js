const API = "http://localhost:5000";

async function uploadCar(formData) {
    return fetch(`${API}/upload`, {
        method: "POST",
        body: formData
    });
}

async function fetchCars(session_id) {
    const res = await fetch(`${API}/cars?session_id=${session_id}`);
    return res.json();
}

async function removeBackground(car_id) {
    return fetch(`${API}/remove-bg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ car_id })
    });
}