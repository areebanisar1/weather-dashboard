let currentPage = 1;
const entriesPerPage = 10;
let forecastData = [];
let originalForecastData = [];
let isCelsius = true;

function getForecastByCity(city) {
  const apiKey = "6921a8f2b3242617002c59f4d0e4d2bd";
  const units = isCelsius ? "metric" : "imperial";
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${units}`;

  $.ajax({
    url: url,
    method: "GET",
    dataType: "json",
    success: function (data) {
      if (data.cod !== "200") {
        alert("City not found!");
        return;
      }

      forecastData = [];
      originalForecastData = [];

      data.list.forEach((entry) => {
        const date = new Date(entry.dt_txt).toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        const forecastEntry = {
          date: date,
          temperature: entry.main.temp,
          condition: entry.weather[0].description,
          humidity: entry.main.humidity,
          windSpeed: entry.wind.speed,
        };

        forecastData.push(forecastEntry);
        originalForecastData.push(forecastEntry);
      });

      renderForecastTable();
    },
    error: function (error) {
      console.error("Error fetching forecast data:", error);
      alert("Error fetching forecast data.");
    },
  });
}

function getForecastByLocation(lat, lon) {
  const apiKey = "6921a8f2b3242617002c59f4d0e4d2bd";
  const units = isCelsius ? "metric" : "imperial";
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;

  $.ajax({
    url: url,
    method: "GET",
    dataType: "json",
    success: function (data) {
      if (data.cod !== "200") {
        alert("Location not found!");
        return;
      }

      forecastData = [];
      originalForecastData = []; // Clear the backup

      data.list.forEach((entry) => {
        const date = new Date(entry.dt_txt).toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        const forecastEntry = {
          date: date,
          temperature: entry.main.temp,
          condition: entry.weather[0].description,
          humidity: entry.main.humidity,
          windSpeed: entry.wind.speed,
        };

        forecastData.push(forecastEntry);
        originalForecastData.push(forecastEntry);
      });

      renderForecastTable();
    },
    error: function (error) {
      console.error("Error fetching forecast data:", error);
      alert("Error fetching forecast data.");
    },
  });
}

function restoreOriginalData() {
  forecastData = [...originalForecastData];
  renderForecastTable();
}

function sortTemperaturesAscending() {
  restoreOriginalData();
  forecastData.sort((a, b) => a.temperature - b.temperature);
  renderForecastTable();
}

function sortTemperaturesDescending() {
  restoreOriginalData();
  forecastData.sort((a, b) => b.temperature - a.temperature);
  renderForecastTable();
}

function filterRainyDays() {
  restoreOriginalData();
  forecastData = forecastData.filter((entry) =>
    entry.condition.toLowerCase().includes("rain")
  );
  renderForecastTable();
}

function findHighestTemperature() {
  restoreOriginalData();
  const highestTempDay = forecastData.reduce((max, entry) =>
    max.temperature > entry.temperature ? max : entry
  );
  forecastData = [highestTempDay];
  renderForecastTable();
}

function renderForecastTable() {
  const tableBody = $("#forecast-table tbody");
  tableBody.empty();

  const start = (currentPage - 1) * entriesPerPage;
  const end = start + entriesPerPage;
  const paginatedData = forecastData.slice(start, end);

  paginatedData.forEach((entry) => {
    const tempUnit = isCelsius ? "°C" : "°F";
    const windSpeedUnit = isCelsius ? "m/s" : "mph";
    const row = `
      <tr>
        <td>${entry.date}</td>
        <td>${entry.temperature.toFixed(1)}${tempUnit}</td>
        <td>${entry.condition}</td>
        <td>${entry.humidity}%</td>
        <td>${entry.windSpeed.toFixed(1)} ${windSpeedUnit}</td>
      </tr>
    `;
    tableBody.append(row);
  });

  $("#prev-page").prop("disabled", currentPage === 1);
  $("#next-page").prop("disabled", end >= forecastData.length);
}

$("#prev-page").on("click", function () {
  if (currentPage > 1) {
    currentPage--;
    renderForecastTable();
  }
});

$("#next-page").on("click", function () {
  if (currentPage * entriesPerPage < forecastData.length) {
    currentPage++;
    renderForecastTable();
  }
});

$(document).ready(function () {
  const city = localStorage.getItem("selectedCity");
  const lat = localStorage.getItem("locationLat");
  const lon = localStorage.getItem("locationLon");

  if (city) {
    getForecastByCity(city);
  } else if (lat && lon) {
    getForecastByLocation(lat, lon);
  } else {
    alert(
      "No location or city selected. Please go to the dashboard and select a city or location."
    );
  }
});

$("#unit-toggle").on("change", function () {
  isCelsius = !isCelsius;
  const city = localStorage.getItem("selectedCity");
  const lat = localStorage.getItem("locationLat");
  const lon = localStorage.getItem("locationLon");

  if (city) {
    getForecastByCity(city);
  } else if (lat && lon) {
    getForecastByLocation(lat, lon);
  }
});
