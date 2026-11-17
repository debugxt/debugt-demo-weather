"use strict";
// geo: a city's name in, where it is out — through Open-Meteo's geocoding API, which needs no key.
//
//   GET /city?name=Lisbon   →   { "name": "Lisbon", "country": "Portugal", "latitude": 38.72, "longitude": -9.13, "timezone": "Europe/Lisbon" }

const http = require("node:http");

const PORT = Number(process.env.PORT) || 7071;
const GEOCODING_URL = process.env.GEOCODING_URL || "https://geocoding-api.open-meteo.com/v1/search";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function findCity(name) {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new HttpError(502, `The geocoding service answered ${response.status}`);
  const data = await response.json();
  const place = data.results && data.results[0];
  if (!place) throw new HttpError(404, `No place called "${name}"`);
  return {
    name: place.name,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const send = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  try {
    if (req.method === "GET" && url.pathname === "/city") {
      const name = (url.searchParams.get("name") || "").trim();
      if (!name) throw new HttpError(400, "Say which city: /city?name=Lisbon");
      return send(200, await findCity(name));
    }
    send(404, { error: `No ${req.method} ${url.pathname} here. Try GET /city?name=Lisbon` });
  } catch (err) {
    send(err.status || 500, { error: err.message });
  }
});

server.listen(PORT, () => console.log(`geo listening on http://localhost:${PORT}`));
