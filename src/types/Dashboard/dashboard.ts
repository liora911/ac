/**
 * Dashboard-related types (weather, health, etc.)
 */

export interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
}

export interface HealthStatus {
  database: "healthy" | "warning" | "error";
  api: "healthy" | "warning" | "error";
  storage: "healthy" | "warning" | "error";
}
