"use client";

import { useEffect, useState } from "react";

interface Forecast {
  day: string;
  max: number;
  min: number;
  emoji: string;
}

interface WeatherData {
  city: string;
  temp: number;
  feels_like: number;
  humidity: number;
  wind: number;
  precipitation: number;
  condition: string;
  emoji: string;
  forecast: Forecast[];
  updated: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short" });
}

function formatDayName(dateStr: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tmrw";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then((d) => { setWeather(d); setLoading(false); })
      .catch(() => setLoading(false));

    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="synth-panel flex min-h-[120px] items-center justify-center p-5">
        <span className="text-sm text-[#e6c3e8]">Loading weather...</span>
      </div>
    );
  }

  if (!weather || (weather as unknown as Record<string, unknown>).error) {
    return null;
  }

  return (
    <div
      className="synth-panel p-5"
      style={{
        background:
          "linear-gradient(180deg, rgba(44, 12, 68, 0.88) 0%, rgba(18, 5, 30, 0.9) 100%)",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(255,177,74,0.18),transparent_18%),radial-gradient(circle_at_36%_22%,rgba(255,79,216,0.15),transparent_24%)] opacity-90" />

      {/* Header: city + clock */}
      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-[0.24em] text-[#ffd0ef]">
            • {weather.city}
          </div>
          <div className="text-[2.15rem] font-extrabold leading-none tracking-tight text-white" style={{ letterSpacing: "-1px" }}>
            {formatTime(now)}
          </div>
          <div className="mt-1 text-xs text-[#f0bde5]">
            {formatDate(now)}
          </div>
        </div>

        {/* Current temp */}
        <div className="text-right">
          <div className="text-[3rem] leading-none drop-shadow-[0_0_18px_rgba(255,177,74,0.45)]">{weather.emoji}</div>
          <div className="text-[2rem] font-extrabold leading-tight text-white">
            {weather.temp}°F
          </div>
          <div className="mt-0.5 text-xs text-[#f6d8ef]">
            {weather.condition}
          </div>
        </div>
      </div>

      <div className="relative mb-4 flex gap-4 border-t border-[rgba(255,255,255,0.12)] pt-3">
        <div className="flex items-center gap-1.5 text-[0.8rem] text-[#f1d2ee]">
          <svg className="h-3.5 w-3.5 text-[#39e6ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Feels {weather.feels_like}°F
        </div>
        <div className="flex items-center gap-1.5 text-[0.8rem] text-[#f1d2ee]">
          <svg className="h-3.5 w-3.5 text-[#8ccfff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          {weather.humidity}%
        </div>
        <div className="flex items-center gap-1.5 text-[0.8rem] text-[#f1d2ee]">
          <svg className="h-3.5 w-3.5 text-[#d4d8ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12M3 12l3-3m0 6l-3-3m18 3l-3 3m0-6l3 3" />
          </svg>
          {weather.wind} mph
        </div>
      </div>

      <div className="relative flex gap-2">
        {weather.forecast.map((day, i) => (
          <div
            key={day.day}
            className="flex-1 rounded-2xl px-2 py-3 text-center"
            style={{
              background: i === 0
                ? "linear-gradient(180deg, rgba(89,150,214,0.3), rgba(44,12,68,0.65))"
                : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
              border: i === 0
                ? "1px solid rgba(57,230,255,0.25)"
                : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="mb-1 text-[0.7rem] text-[#f8caef]">{formatDayName(day.day, i)}</div>
            <div className="mb-1 text-xl leading-none">{day.emoji}</div>
            <div className="text-xs font-semibold text-white">{day.max}°</div>
            <div className="text-[0.7rem] text-[#d2afd9]">{day.min}°</div>
          </div>
        ))}
      </div>
    </div>
  );
}
