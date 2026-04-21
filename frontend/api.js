const API = "http://localhost:5001";

export async function uploadCars(formData) {
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

export async function updateXY(car_id, x, y){
    return fetch(`${API}/place-car`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ car_id: car_id, x, y })
    });
}

export async function deleteCar(car_id) {
    const res = await fetch(`${API}/delete-car`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ car_id })
    });

    return res.json();
}

export async function uploadBackground(formData) {
    const res = await fetch(`${API}/upload-bg`, {
        method: "POST",
        body: formData
    });
    return res.json();
}