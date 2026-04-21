function openRaceModal(cars) {
    const modal = document.getElementById("raceModal");
    const track = document.getElementById("raceTrack");
    
    // Clear previous
    track.innerHTML = "";
    modal.classList.remove("hidden");

    const carElements = [];
    cars.forEach((car, index) => {
        const lane = document.createElement("div");
        lane.className = "lane";
        
        const img = document.createElement("img");
        img.src = "http://localhost:5001" + (car.bg_removed_url || car.image_url);
        img.id = `race-car-${index}`;
        
        lane.appendChild(img);
        lane.appendChild(document.createElement("div")).className = "flag"; // Finish line
        track.appendChild(lane);
        
        carElements.push(img);
    });

    startRace(cars, carElements);
}

function startRace(cars, carElements) {
    const positions = new Array(cars.length).fill(0);
    // Speed: Lower time (0-100) = Faster speed
    const speeds = cars.map(c => (1 / (c.acceleration || 10)) * 20);

    const interval = setInterval(() => {
        let finished = false;

        cars.forEach((_, i) => {
            positions[i] += speeds[i];
            carElements[i].style.left = positions[i] + "%";

            if (positions[i] >= 90) finished = true;
        });

        if (finished) {
            clearInterval(interval);
            const sortedCars = [...cars].sort((a, b) => (a.acceleration || 10) - (b.acceleration || 10));
            const winner = sortedCars[0];
            showWinner(winner);
        }
    }, 50);
}

function showWinner(car) {
    const overlay = document.getElementById("winnerOverlay");
    const title = document.getElementById("winnerTitle");
    const img = document.getElementById("winnerImage");
    const stats = document.getElementById("winnerStats");

    title.innerText = `${car.make || "Unknown"} ${car.model || ""} (${car.year || "-"}) won 🏆`;

    img.src = "http://localhost:5001" + (car.bg_removed_url || car.image_url);

    let powerString = "-";
    if (car.power) {
        powerString = car.is_electric
            ? car.power + " kW"
            : Math.round(1.35962 * car.power) + " hp";
    }

    stats.innerHTML = `
        <b>Acceleration (0-100):</b> ${car.acceleration || "-"} s<br>
        <b>Power:</b> ${powerString}<br>
        <b>Cylinders:</b> ${car.cylinders || "-"}<br>
        <b>Displacement:</b> ${car.displacement || "-"} L<br>
        <b>Estimated Value:</b> ${car.eur_value || "-"} €<br>
        <b>Electric:</b> ${car.is_electric ? "Yes ⚡" : "No"}
    `;

    overlay.classList.remove("hidden");

    // click outside to close
    overlay.onclick = () => {
        overlay.classList.add("hidden");
        document.getElementById("raceModal").classList.add("hidden");
    };
}

export function race() {
    const cars = window.currentCars || [];
    const garageCars = cars.filter(c => c.x != null && c.y != null);

    if (garageCars.length < 2) {
        alert("Need at least 2 cars to race!");
        return;
    }
    console.log(garageCars);
    openRaceModal(garageCars);
}