let session_id = localStorage.getItem("session_id");
let selectedCar = null;
let loading = false;

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

    await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData
    });

    await loadCars();
    setLoading(false);
}

async function loadCars() {
    const res = await fetch(`http://localhost:5000/cars?session_id=${session_id}`);
    const cars = await res.json();

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    cars.forEach(car => {
        const card = document.createElement("div");
        card.className = "car-card";

        if (selectedCar === car.id) {
            card.classList.add("selected");
        }

        const img = document.createElement("img");
        img.src = "http://localhost:5000" + (car.bg_removed_url || car.image_url);
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

        card.appendChild(img);
        card.appendChild(info);
        gallery.appendChild(card);
    });
}

async function removeBg() {
    if (!selectedCar || loading) {
        alert("Select a car first");
        return;
    }

    setLoading(true);

    await fetch("http://localhost:5000/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ car_id: selectedCar })
    });

    await loadCars();
    setLoading(false);
}