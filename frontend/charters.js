export const METRICS = [
    { label: "Acceleration 0-100km/h (s)", key: "acceleration" },
    { label: "Power (kW)", key: "power" },
    { label: "Value", key: "eur_value"},
    { label: "Engine nr. of cylinders", key: "cylinders"}
];

export const activeCharts = {};

export function refreshCharts(cars) {    
    METRICS.forEach(metric => {
        const checkbox = document.querySelector(`input[data-key="${metric.key}"]`);
        
        if (checkbox && checkbox.checked) {
            renderChart(metric, cars);
        }
        else if (activeCharts[metric.key]) {
            removeChart(metric.key);
        }
    });
}

export function initSidePanel(onToggle) {
    const selectorContainer = document.getElementById("metricSelectors");
    
    METRICS.forEach(metric => {
        const wrapper = document.createElement("label");
        wrapper.innerHTML = `<input type="checkbox" data-key="${metric.key}"> ${metric.label}`;
        
        wrapper.querySelector("input").addEventListener("change", (e) => {
            const garageCars = window.currentCars.filter(c => c.x != null && c.y != null);
            refreshCharts(garageCars); 
        });
        
        selectorContainer.appendChild(wrapper);
    });
}

export function renderChart(metric, garageCars) {
    const container = document.getElementById("chartContainer");

    if (activeCharts[metric.key]) {
        const chart = activeCharts[metric.key];
        chart.data.labels = garageCars.map(c => `${c.make} ${c.model} (${c.year})`);
        chart.data.datasets[0].data = garageCars.map(c => c[metric.key] || 0);
        chart.update(); // Smoothly animate the changes
        return;
    }

   let wrapper = document.createElement("div");
    wrapper.className = "chart-wrapper";
    wrapper.id = `chart-wrapper-${metric.key}`;
    wrapper.innerHTML = `<canvas id="chart-${metric.key}"></canvas>`;
    container.appendChild(wrapper);

    const ctx = document.getElementById(`chart-${metric.key}`);
    activeCharts[metric.key] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: garageCars.map(c => `${c.make} ${c.model} (${c.year})`),
            datasets: [{
                label: metric.label,
                data: garageCars.map(c => c[metric.key] || 0),
                backgroundColor: '#3498db'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { labels: { color: 'white' } } },
            scales: { x: { ticks: { color: 'white' } }, y: { ticks: { color: 'white' } } }
        }
    });
}

export function removeChart(key) {
    if (activeCharts[key]) {
        activeCharts[key].destroy();
        delete activeCharts[key];
        const wrapper = document.getElementById(`chart-wrapper-${key}`);
        if (wrapper) wrapper.remove();
    }
}