"use client";

import React, { useState, useEffect } from "react";

interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
}

const Weather: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch("https://wttr.in/Jerusalem?format=j1");
        if (!response.ok) throw new Error("Failed to fetch weather");
        const data = await response.json();

        const current = data.current_condition[0];
        setWeather({
          temperature: parseInt(current.temp_C),
          condition: current.weatherDesc[0].value,
          location: data.nearest_area[0].areaName[0].value,
        });
      } catch (err) {
        setError("Unable to load weather data");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div
        className="flex items-center gap-2 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 animate-pulse"
        role="status"
        aria-live="polite"
      >
        <div
          className="w-6 h-6 bg-blue-300 rounded-full"
          aria-hidden="true"
        ></div>
        <div className="text-sm text-blue-600">Loading weather...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-4 rounded-lg bg-red-50 border border-red-200"
        role="alert"
      >
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-sm"
      role="region"
      aria-labelledby="weather-heading"
    >
      <h3 id="weather-heading" className="sr-only">
        Current weather
      </h3>
      <div className="flex items-center gap-3">
        <div className="text-2xl" aria-hidden="true">
          🌤️
        </div>
        <div>
          <div
            className="text-lg font-semibold text-gray-800"
            aria-label={`Temperature: ${weather?.temperature} degrees Celsius`}
          >
            {weather?.temperature}°C
          </div>
          <div
            className="text-sm text-gray-600"
            aria-label={`Weather condition: ${weather?.condition}`}
          >
            {weather?.condition}
          </div>
          <div
            className="text-xs text-gray-500"
            aria-label={`Location: ${weather?.location}`}
          >
            {weather?.location}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weather;
