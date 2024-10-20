let barChartInstance = null;
let doughnutChartInstance = null;
let lineChartInstance = null;

document.addEventListener("DOMContentLoaded", function () {
  hideWeatherSections(); // Hide sections initially

  const storedCity = localStorage.getItem("selectedCity");
  const storedLat = localStorage.getItem("locationLat");
  const storedLon = localStorage.getItem("locationLon");

  if (storedCity || (storedLat && storedLon)) {
    localStorage.removeItem("selectedCity");
    localStorage.removeItem("locationLat");
    localStorage.removeItem("locationLon");
    document.getElementById("city-input").value = "";
    hideWeatherSections();
  }

  // Fetch weather based on city name
  document.getElementById("get-weather").addEventListener("click", function () {
    const city = document.getElementById("city-input").value;
    const apiKey = "6921a8f2b3242617002c59f4d0e4d2bd";

    getWeatherByCity(city, apiKey).then((isValid) => {
      if (isValid) {
        localStorage.setItem("selectedCity", city);
        localStorage.removeItem("locationLat");
        localStorage.removeItem("locationLon");
        showWeatherSections();
        getForecastByCity(city, apiKey);
      } else {
        hideWeatherSections();
      }
    });
  });

  // Fetch weather using geolocation
  document
    .getElementById("use-location")
    .addEventListener("click", function () {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const apiKey = "6921a8f2b3242617002c59f4d0e4d2bd";

            getWeatherByLocation(lat, lon, apiKey).then((locationData) => {
              if (locationData && locationData.name) {
                localStorage.setItem("locationLat", lat);
                localStorage.setItem("locationLon", lon);
                localStorage.setItem("selectedCity", locationData.name);
                document.getElementById("city-input").value = locationData.name;
                showWeatherSections();
                getForecastByLocation(lat, lon, apiKey);
              }
            });
          },
          function (error) {
            console.error("Error getting location:", error);
            document.getElementById("weather-details").innerHTML =
              "<p>Location access denied or unavailable!</p>";
          }
        );
      } else {
        document.getElementById("weather-details").innerHTML =
          "<p>Geolocation is not supported by this browser.</p>";
      }
    });

  // Listen for unit toggle change (Celsius/Fahrenheit)
  document
    .getElementById("unit-toggle")
    .addEventListener("change", function () {
      const city = document.getElementById("city-input").value;
      if (city) {
        const apiKey = "6921a8f2b3242617002c59f4d0e4d2bd";
        getWeatherByCity(city, apiKey);
        getForecastByCity(city, apiKey);
      }
    });
});

function showWeatherSections() {
  document.querySelector(".weather-widget").classList.remove("hidden");
  document.querySelector(".charts").classList.remove("hidden");
  document.querySelector(".forecast-section").classList.remove("hidden");
}

// Hide sections when city is invalid or not entered
function hideWeatherSections() {
  document.querySelector(".weather-widget").classList.add("hidden");
  document.querySelector(".charts").classList.add("hidden");
  document.querySelector(".forecast-section").classList.add("hidden");
}

function getWeatherByCity(city, apiKey) {
  const isFahrenheit = document.getElementById("unit-toggle").checked;
  const units = isFahrenheit ? "imperial" : "metric";
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;

  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.cod === 200) {
        const unitSymbol = isFahrenheit ? "°F" : "°C";
        const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        document.getElementById("weather-details").innerHTML = `
          <h2>${data.name}, ${data.sys.country}</h2>
          <p>Temperature: ${data.main.temp} ${unitSymbol}</p>
          <p>Humidity: ${data.main.humidity} %</p>
          <p>Wind Speed: ${data.wind.speed} ${isFahrenheit ? "mph" : "m/s"}</p>
          <p>Weather: ${data.weather[0].description}</p>
          <img src="${iconUrl}" alt="Weather Icon"> 
        `;
        changeWidgetBackground(data.weather[0].description.toLowerCase());

        // Update the search bar with the city name
        document.getElementById("city-input").value = data.name;

        return true;
      } else {
        clearChartsAndTable();
        return false;
      }
    })
    .catch((error) => {
      console.error("Error fetching weather data:", error);
      document.getElementById("weather-details").innerHTML =
        "<p>Error fetching weather data.</p>";
      clearChartsAndTable();
      return false;
    });
}

function createCharts(temperatures, labels, weatherConditions, isFahrenheit) {
  const unitSymbol = isFahrenheit ? "°F" : "°C";

  if (barChartInstance) {
    barChartInstance.destroy();
  }

  // Create Vertical Bar Chart
  const barCtx = document.getElementById("vertical-bar").getContext("2d");
  barChartInstance = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Temperature (${unitSymbol})`,
          data: temperatures,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 2,
        },
      ],
    },
    options: {
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 10,
            },
          },
        },
        y: {
          beginAtZero: true,
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  });

  if (doughnutChartInstance) {
    doughnutChartInstance.destroy();
  }

  // Create Doughnut Chart
  const doughnutCtx = document.getElementById("doughnut").getContext("2d");
  doughnutChartInstance = new Chart(doughnutCtx, {
    type: "doughnut",
    data: {
      labels: Object.keys(weatherConditions),
      datasets: [
        {
          data: Object.values(weatherConditions),
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
          hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        },
      ],
    },
  });

  if (lineChartInstance) {
    lineChartInstance.destroy();
  }

  // Create Line Chart
  const lineCtx = document.getElementById("line").getContext("2d");
  lineChartInstance = new Chart(lineCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Temperature (${unitSymbol})`,
          data: temperatures,
          fill: true,
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgba(255, 99, 132, 1)",
          pointBackgroundColor: "rgba(255, 99, 132, 1)",
          pointBorderColor: "#fff",
          pointRadius: 4,
          tension: 0.4,
          borderWidth: 2,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
        x: {
          ticks: {
            maxRotation: 45,
            font: {
              size: 10,
            },
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function getForecastByCity(city, apiKey) {
  const isFahrenheit = document.getElementById("unit-toggle").checked;
  const units = isFahrenheit ? "imperial" : "metric";
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${units}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.cod !== "200") {
        clearChartsAndTable();
        return;
      }

      const today = new Date().getDate();
      let temperatures = [];
      let labels = [];
      let weatherConditions = {};
      let seenDates = new Set();
      let forecastCount = 0;

      data.list.forEach((entry) => {
        const forecastDate = new Date(entry.dt_txt).getDate();
        const formattedDate = new Date(entry.dt_txt).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
          }
        );

        if (
          forecastDate !== today &&
          forecastCount < 5 &&
          !seenDates.has(forecastDate)
        ) {
          seenDates.add(forecastDate);
          forecastCount++;

          labels.push(formattedDate);
          temperatures.push(entry.main.temp);

          const condition = entry.weather[0].main;
          weatherConditions[condition] =
            (weatherConditions[condition] || 0) + 1;
        }
      });

      if (Object.keys(weatherConditions).length > 0) {
        createCharts(temperatures, labels, weatherConditions, isFahrenheit);
        displayForecast(data.list, isFahrenheit);
      } else {
        console.error("No weather conditions available");
      }
    })
    .catch((error) => {
      console.error("Error fetching forecast data:", error);
      clearChartsAndTable();
    });
}

// Fetch the 5-day weather forecast by location
function getForecastByLocation(lat, lon, apiKey) {
  const isFahrenheit = document.getElementById("unit-toggle").checked;
  const units = isFahrenheit ? "imperial" : "metric"; // Fahrenheit or Celsius
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.cod !== "200") {
        clearChartsAndTable();
        return;
      }

      const today = new Date().getDate(); // Get today's date
      let temperatures = [];
      let labels = [];
      let weatherConditions = {};
      let seenDates = new Set();
      let forecastCount = 0; // Track forecast day count

      data.list.forEach((entry) => {
        const forecastDate = new Date(entry.dt_txt).getDate();
        const formattedDate = new Date(entry.dt_txt).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
          }
        );

        if (
          forecastDate !== today &&
          forecastCount < 5 &&
          !seenDates.has(forecastDate)
        ) {
          seenDates.add(forecastDate);
          forecastCount++;

          labels.push(formattedDate);
          temperatures.push(entry.main.temp);

          const condition = entry.weather[0].main;
          weatherConditions[condition] =
            (weatherConditions[condition] || 0) + 1;
        }
      });

      if (Object.keys(weatherConditions).length > 0) {
        createCharts(temperatures, labels, weatherConditions, isFahrenheit);
        displayForecast(data.list, isFahrenheit);
      } else {
        console.error("No weather conditions available");
      }
    })
    .catch((error) => {
      console.error("Error fetching forecast data:", error);
      clearChartsAndTable();
    });
}

// Function to display forecast data in the forecast cards
function displayForecast(forecastData, isFahrenheit) {
  const unitSymbol = isFahrenheit ? "°F" : "°C";
  const today = new Date().getDate();
  let forecastCount = 0;
  let seenDates = new Set();

  forecastData.forEach((entry) => {
    const forecastDate = new Date(entry.dt_txt).getDate();
    const formattedDate = new Date(entry.dt_txt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    if (
      forecastDate !== today &&
      forecastCount < 5 &&
      !seenDates.has(forecastDate)
    ) {
      seenDates.add(forecastDate);

      const card = document.getElementById(`day${forecastCount + 1}`);

      if (card) {
        const weatherDescription = entry.weather[0].description.toLowerCase();

        // Update the forecast card content
        card.innerHTML = `
          <h4>${formattedDate}</h4>
          <p>Temp: ${entry.main.temp} ${unitSymbol}</p>
          <p>${entry.weather[0].description}</p>
          <img src="https://openweathermap.org/img/wn/${entry.weather[0].icon}.png" alt="Weather Icon">
        `;

        changeForecastBackground(weatherDescription, card);

        forecastCount++;

        if (forecastCount === 5) {
          return;
        }
      }
    }
  });
}

function clearChartsAndTable() {
  document.querySelector(".charts").classList.add("hidden");
  document.querySelector(".forecast-section").classList.add("hidden");
}

function changeWidgetBackground(weatherDescription) {
  const container = document.getElementById("weather-container");

  container.className = "";

  if (weatherDescription.includes("clear")) {
    container.classList.add("clear-sky");
  } else if (weatherDescription.includes("clouds")) {
    container.classList.add("cloudy");
  } else if (weatherDescription.includes("rain")) {
    container.classList.add("rainy");
  } else if (weatherDescription.includes("snow")) {
    container.classList.add("snow");
  } else if (
    weatherDescription.includes("haze") ||
    weatherDescription.includes("mist") ||
    weatherDescription.includes("fog")
  ) {
    container.classList.add("haze");
  } else {
    container.classList.add("other-weather");
  }
}

function changeForecastBackground(weatherDescription, card) {
  card.className = "forecast-card";

  if (weatherDescription.includes("clear")) {
    card.classList.add("clear-sky");
  } else if (weatherDescription.includes("clouds")) {
    card.classList.add("cloudy");
  } else if (weatherDescription.includes("rain")) {
    card.classList.add("rainy");
  } else if (weatherDescription.includes("snow")) {
    card.classList.add("snow");
  } else if (
    weatherDescription.includes("haze") ||
    weatherDescription.includes("mist") ||
    weatherDescription.includes("fog")
  ) {
    card.classList.add("haze");
  } else {
    card.classList.add("other-weather");
  }
}

// Fetch weather by location (latitude and longitude)
function getWeatherByLocation(lat, lon, apiKey) {
  const isFahrenheit = document.getElementById("unit-toggle").checked;
  const units = isFahrenheit ? "imperial" : "metric";
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;

  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.cod === 200) {
        const unitSymbol = isFahrenheit ? "°F" : "°C";
        const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        document.getElementById("weather-details").innerHTML = `
          <h2>${data.name}, ${data.sys.country}</h2>
          <p>Temperature: ${data.main.temp} ${unitSymbol}</p>
          <p>Humidity: ${data.main.humidity} %</p>
          <p>Wind Speed: ${data.wind.speed} ${isFahrenheit ? "mph" : "m/s"}</p>
          <p>Weather: ${data.weather[0].description}</p>
          <img src="${iconUrl}" alt="Weather Icon"> 
        `;
        changeWidgetBackground(data.weather[0].description.toLowerCase());

        document.getElementById("city-input").value = data.name;

        return data; // Return the location data
      } else {
        clearChartsAndTable();
        return false;
      }
    })
    .catch((error) => {
      console.error("Error fetching weather data by location:", error);
      document.getElementById("weather-details").innerHTML =
        "<p>Error fetching weather data by location.</p>";
      clearChartsAndTable();
      return false;
    });
}
