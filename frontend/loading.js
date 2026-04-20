let loadingInterval;

export function setLoading(state) {
    const el = document.getElementById("loading");

    if (state) {
        el.classList.remove("hidden");

        const messages = [
            "Removing background...",
            "Analyzing vehicle...",
            "Getting latest data...",
            "Estimating value...",
            "Almost done..."
        ];

        let i = 0;

        loadingInterval = setInterval(() => {
            document.getElementById("loadingText").innerText =
                messages[i % messages.length];
            i++;
        }, 1500);

    } else {
        el.classList.add("hidden");
        clearInterval(loadingInterval);
    }
}