/**
 * External API service layer for Traveloop.
 * All map APIs are free (no key). Weather uses OPENWEATHER_API_KEY (free tier).
 */

// ── 1. searchCity ─────────────────────────────────────────────
async function searchCity(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Traveloop/1.0 (hackathon project)" },
  });

  if (!res.ok) throw new Error(`Nominatim request failed: ${res.status}`);

  const data = await res.json();

  return data.map((item) => ({
    city_name:
      item.address?.city ||
      item.address?.town ||
      item.address?.village ||
      item.name,
    country: item.address?.country || "",
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    display_name: item.display_name,
  }));
}

// ── 2. getRouteInfo ───────────────────────────────────────────
async function getRouteInfo(stops) {
  if (!stops || stops.length < 2) return [];

  const coordinates = stops.map((s) => `${s.lng},${s.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM request failed: ${res.status}`);

  const data = await res.json();

  if (data.code !== "Ok" || !data.routes?.[0]?.legs) {
    throw new Error("OSRM returned no valid route");
  }

  return data.routes[0].legs.map((leg, i) => ({
    from_index: i,
    to_index: i + 1,
    distance_km: (leg.distance / 1000).toFixed(1),
    duration_hours: (leg.duration / 3600).toFixed(1),
  }));
}

// ── 3. getWeatherForecast ─────────────────────────────────────
async function getWeatherForecast(lat, lng, cityName) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) throw new Error("OPENWEATHER_API_KEY is not set");

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${key}&units=metric&cnt=40`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenWeather request failed: ${res.status}`);

  const data = await res.json();

  // Group by date
  const dayMap = {};
  for (const item of data.list) {
    const date = item.dt_txt.split(" ")[0]; // "YYYY-MM-DD"
    if (!dayMap[date]) {
      dayMap[date] = { temps: [], descriptions: [], icons: [] };
    }
    dayMap[date].temps.push(item.main.temp_min, item.main.temp_max);
    dayMap[date].descriptions.push(item.weather[0].description);
    dayMap[date].icons.push(item.weather[0].icon);
  }

  return Object.entries(dayMap)
    .slice(0, 5)
    .map(([date, info]) => ({
      date,
      temp_min: Math.min(...info.temps),
      temp_max: Math.max(...info.temps),
      description: info.descriptions[0],
      icon_code: info.icons[0],
    }));
}

// ── 4. getCityPhoto ───────────────────────────────────────────
async function getCityPhoto(cityName) {
  const url = `https://source.unsplash.com/800x400/?${encodeURIComponent(cityName + " city travel")}`;

  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Unsplash request failed: ${res.status}`);

  return res.url; // Final redirect URL
}

module.exports = { searchCity, getRouteInfo, getWeatherForecast, getCityPhoto };
