
const countrySelect = document.getElementById("countrySelect");
const status = document.getElementById("status");

let countries = [];
let trendChart;
let dailyChart;

const format = n => n.toLocaleString("en-US");

async function loadData() {
    try {
        const response = await fetch("./covid-19.json");

        if (!response.ok) {
            throw new Error("Could not load JSON dataset");
        }

        const dataset = await response.json();
        countries = dataset.countries;

        if (!Array.isArray(countries)) {
            throw new Error("Invalid countries data");
        }

        countrySelect.innerHTML = "";

        countries.forEach(country => {
            const option = document.createElement("option");
            option.value = country.country;
            option.textContent = country.country;
            countrySelect.appendChild(option);
        });

        countrySelect.disabled = false;
        countrySelect.value = "China";

        console.log("Dataset loaded successfully", dataset);

        updateDashboard();

    } catch (error) {
        console.error(error);
        status.textContent = error.message;
    }
}

function updateDashboard() {
    const country = countries.find(
        c => c.country === countrySelect.value
    );

    if (!country) return;

    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;

    if (start > end) {
        status.textContent = "Start date must be before end date.";
        return;
    }

    const records = [...country.data]
        .sort((a, b) => a.date.localeCompare(b.date))
        .filter(r => r.date >= start && r.date <= end);

    if (records.length === 0) {
    for (const id of ["confirmed", "deaths", "recovered", "active"]) {
        const element = document.getElementById(id);
        element.textContent = "—";
    }
}

        if (trendChart) trendChart.destroy();
        if (dailyChart) dailyChart.destroy();

        status.textContent = "No observations available in this date range.";
        return;
    }

    const latest = records[records.length - 1];

    document.getElementById("confirmed").textContent =
        format(latest.confirmed);

    document.getElementById("deaths").textContent =
        format(latest.deaths);

    document.getElementById("recovered").textContent =
        format(latest.recovered);

    document.getElementById("active").textContent =
        format(latest.confirmed - latest.deaths - latest.recovered);

    status.textContent =
        `${country.country} | Latest observation: ${latest.date} | ${records.length} observations`;

    createTrendChart(records);
    createDailyChart(records);
}

function createTrendChart(records) {
    if (trendChart) trendChart.destroy();

    trendChart = new Chart(
        document.getElementById("trendChart"),
        {
            type: "line",
            data: {
                labels: records.map(r => r.date),
                datasets: [
                    {
                        label: "Confirmed",
                        data: records.map(r => r.confirmed),
                        borderColor: "#2878d0",
                        tension: 0.3
                    },
                    {
                        label: "Deaths",
                        data: records.map(r => r.deaths),
                        borderColor: "#dc5555",
                        tension: 0.3
                    },
                    {
                        label: "Recoveries",
                        data: records.map(r => r.recovered),
                        borderColor: "#20a477",
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: "index"
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }
    );
}

function createDailyChart(records) {
    if (dailyChart) dailyChart.destroy();

    // Difference between consecutive available observations.
    const changes = records.slice(1).map((record, index) => ({
        date: record.date,
        cases: record.confirmed - records[index].confirmed
    }));

    dailyChart = new Chart(
        document.getElementById("dailyChart"),
        {
            type: "bar",
            data: {
                labels: changes.map(r => r.date),
                datasets: [{
                    label: "Change in confirmed cases",
                    data: changes.map(r => r.cases),
                    backgroundColor: "#4386c8"
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }
    );
}

countrySelect.addEventListener("change", updateDashboard);

document.getElementById("startDate")
    .addEventListener("change", updateDashboard);

document.getElementById("endDate")
    .addEventListener("change", updateDashboard);

document.getElementById("resetDates").addEventListener("click", () => {
    document.getElementById("startDate").value = "2020-02-01";
    document.getElementById("endDate").value = "2020-03-31";
    updateDashboard();
});

loadData();
