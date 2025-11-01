import React, { useEffect, useState } from "react";
import { CloudSun, Droplets, Wind } from "lucide-react";

/**
 * WeatherInfo Component
 * - Fetches live weather using OpenWeatherMap (Free API)
 * - Displays short weather summaries for trip destinations
 */

const WeatherInfo = ({ destination }) => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");

  const API_KEY = "YOUR_OPENWEATHERMAP_KEY"; // get it free from https://openweathermap.org/api

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${destination}&units=metric&appid=${API_KEY}`
        );
        const data = await response.json();
        if (data.cod !== 200) throw new Error(data.message);
        setWeather(data);
      } catch (err) {
        setError("Weather data unavailable");
      }
    };
    fetchWeather();
  }, [destination]);

  if (error) return <p className="text-sm text-gray-500">{error}</p>;
  if (!weather) return <p className="text-sm text-gray-500">Loading weather...</p>;

  const { main, weather: weatherDetails, wind } = weather;

  return (
    <div className="mt-4 bg-blue-50 border border-blue-200 p-4 rounded-lg shadow-sm text-sm text-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudSun className="h-5 w-5 text-blue-600" />
          <span>{destination}</span>
        </div>
        <span className="font-semibold text-blue-700">{main.temp}°C</span>
      </div>
      <p className="mt-1 capitalize text-gray-600">
        {weatherDetails[0].description}
      </p>
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Droplets className="h-3 w-3" /> {main.humidity}%
        </div>
        <div className="flex items-center gap-1">
          <Wind className="h-3 w-3" /> {wind.speed} m/s
        </div>
      </div>
    </div>
  );
};

export default WeatherInfo;
