"use strict";
// planner: a trip in, what to pack out. Asks geo where the city is, asks forecast what the
// weather will be there, and decides, day by day, what you will need.
//
//   GET /plan?city=Lisbon&days=3   →   { "city": "Lisbon, Portugal", "pack": ["umbrella"], "days": [ … ] }

const http = require("node:http");

const PORT = Number(process.env.PORT) || 7070;
const GEO_URL = process.env.GEO_URL || "http://localhost:7071";
const FORECAST_URL = process.env.FORECAST_URL || "http://localhost:7072";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** A call to one of the other two services: its answer, or why it failed, as the planner's own. */
async function ask(base, path) {
  const response = await fetch(`${base}${path}`);
  const body = await response.json();
  if (!response.ok) throw new HttpError(response.status === 404 ? 404 : 502, body.error || `${base}${path} answered ${response.status}`);
  return body;
}

/** What one day's weather calls for. */
function packFor(day) {
  const pack = [];
  if (day.rain >= 50) pack.push("umbrella");
  if (day.high >= 25) pack.push("sunscreen");
  if (day.low <= 5) pack.push("warm jacket");
  if (day.wind >= 40) pack.push("windbreaker");
  return pack;
}

async function plan(cityName, days) {
  const city = await ask(GEO_URL, `/city?name=${encodeURIComponent(cityName)}`);
  const forecast = await ask(FORECAST_URL, `/forecast?lat=${city.latitude}&lon=${city.longitude}&days=${days}`);
  const planned = forecast.days.map((day) => ({ ...day, pack: packFor(day) }));
  const pack = [...new Set(planned.flatMap((day) => day.pack))];
  return {
    city: `${city.name}, ${city.country}`,
    pack: pack.length > 0 ? pack : ["nothing special"],
    days: planned,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const send = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  try {
    if (req.method === "GET" && url.pathname === "/plan") {
      const city = (url.searchParams.get("city") || "").trim();
      const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 3, 1), 7);
      if (!city) throw new HttpError(400, "Say where you are going: /plan?city=Lisbon&days=3");
      return send(200, await plan(city, days));
    }
    send(404, { error: `No ${req.method} ${url.pathname} here. Try GET /plan?city=Lisbon&days=3` });
  } catch (err) {
    send(err.status || 500, { error: err.message });
  }
});

server.listen(PORT, () => console.log(`planner listening on http://localhost:${PORT}`));
