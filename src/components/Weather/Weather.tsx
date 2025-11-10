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
        // Using wttr.in for public weather data (no API key required)
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
      <div className="flex items-center gap-2 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 animate-pulse">
        <div className="w-6 h-6 bg-blue-300 rounded-full"></div>
        <div className="text-sm text-blue-600">Loading weather...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="text-2xl">🌤️</div>
        <div>
          <div className="text-lg font-semibold text-gray-800">
            {weather?.temperature}°C
          </div>
          <div className="text-sm text-gray-600">{weather?.condition}</div>
          <div className="text-xs text-gray-500">{weather?.location}</div>
        </div>
      </div>
    </div>
  );
};

export default Weather;
