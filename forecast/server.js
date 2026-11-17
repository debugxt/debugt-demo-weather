"use strict";
// forecast: where in, the next days' weather out — through Open-Meteo's forecast API, which needs
// no key — each day summed up in words, with its high, low, chance of rain and wind.
//
//   GET /forecast?lat=38.72&lon=-9.13&days=3   →   { "days": [ { "date": "…", "summary": "Light rain", "high": 19, "low": 12, "rain": 60, "wind": 22 }, … ] }

const http = require("node:http");

const PORT = Number(process.env.PORT) || 7072;
const OPEN_METEO_URL = process.env.OPEN_METEO_URL || "https://api.open-meteo.com/v1/forecast";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** The weather codes Open-Meteo answers with (WMO's), in words. */
const WEATHER = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Heavy rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

function summarize(daily) {
  return daily.time.map((date, i) => ({
    date,
    summary: WEATHER[daily.weather_code[i]] || `Weather code ${daily.weather_code[i]}`,
    high: Math.round(daily.temperature_2m_max[i]),
    low: Math.round(daily.temperature_2m_min[i]),
    rain: daily.precipitation_probability_max[i],
    wind: Math.round(daily.wind_speed_10m_max[i]),
  }));
}

async function forecastFor(lat, lon, days) {
  const daily = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max";
  const url = `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}&daily=${daily}&timezone=auto&forecast_days=${days}`;
  const response = await fetch(url);
  if (!response.ok) throw new HttpError(502, `The forecast service answered ${response.status}`);
  const data = await response.json();
  // As many days as were asked for, whatever came back.
  return { timezone: data.timezone, days: summarize(data.daily).slice(0, days) };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const send = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  try {
    if (req.method === "GET" && url.pathname === "/forecast") {
      const lat = Number(url.searchParams.get("lat"));
      const lon = Number(url.searchParams.get("lon"));
      const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 3, 1), 7);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || url.searchParams.get("lat") === null || url.searchParams.get("lon") === null) {
        throw new HttpError(400, "Say where: /forecast?lat=38.72&lon=-9.13&days=3");
      }
      return send(200, await forecastFor(lat, lon, days));
    }
    send(404, { error: `No ${req.method} ${url.pathname} here. Try GET /forecast?lat=38.72&lon=-9.13&days=3` });
  } catch (err) {
    send(err.status || 500, { error: err.message });
  }
});

server.listen(PORT, () => console.log(`forecast listening on http://localhost:${PORT}`));
