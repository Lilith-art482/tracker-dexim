"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Cloud,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

/* ─────────── Types ─────────── */

interface WeatherData {
  city: string;
  country: string;
  weatherCode: number;
  tempC: number;
  feelsLikeC: number;
  condition: string;
  humidity: number;
  windKph: number;
  pressure: number;
  tempHigh: number;
  tempLow: number;
  hourly: { time: string; tempC: number; weatherCode: number }[];
  daily: {
    day: string;
    date: string;
    high: number;
    low: number;
    weatherCode: number;
  }[];
}

interface GeoCity {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

/* ─────────── Constants ─────────── */

const DEFAULT_CITIES: GeoCity[] = [
  { name: "Москва", country: "RU", latitude: 55.7558, longitude: 37.6173 },
  {
    name: "Санкт-Петербург",
    country: "RU",
    latitude: 59.9343,
    longitude: 30.3351,
  },
  { name: "Новосибирск", country: "RU", latitude: 55.0084, longitude: 82.9357 },
  { name: "Казань", country: "RU", latitude: 55.7887, longitude: 49.1221 },
  { name: "Сочи", country: "RU", latitude: 43.6028, longitude: 39.7342 },
  {
    name: "Екатеринбург",
    country: "RU",
    latitude: 56.8389,
    longitude: 60.6057,
  },
];

/* ─────────── Weather Condition Labels ─────────── */

const WMO_LABELS: Record<number, string> = {
  0: "Ясно",
  1: "Малооблачно",
  2: "Облачно",
  3: "Пасмурно",
  45: "Туман",
  48: "Инейный туман",
  51: "Морось",
  53: "Морось",
  55: "Сильная морось",
  61: "Дождь",
  63: "Дождь",
  65: "Сильный дождь",
  71: "Снег",
  73: "Снег",
  75: "Сильный снег",
  80: "Ливень",
  81: "Ливень",
  82: "Сильный ливень",
  95: "Гроза",
  96: "Гроза с градом",
  99: "Гроза с градом",
};

function getWeatherLabel(code: number) {
  return WMO_LABELS[code] || "Неизвестно";
}

function WeatherSvgIcon({ code, size = 20 }: { code: number; size?: number }) {
  const isNight = new Date().getHours() >= 20 || new Date().getHours() < 6;

  if (code === 0) {
    return isNight ? (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
          fill="#a5b4fc"
          stroke="#818cf8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ) : (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="5"
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth="1.5"
        />
        <line
          x1="12"
          y1="1"
          x2="12"
          y2="3"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="12"
          y1="21"
          x2="12"
          y2="23"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="4.22"
          y1="4.22"
          x2="5.64"
          y2="5.64"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="18.36"
          y1="18.36"
          x2="19.78"
          y2="19.78"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="1"
          y1="12"
          x2="3"
          y2="12"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="21"
          y1="12"
          x2="23"
          y2="12"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="4.22"
          y1="19.78"
          x2="5.64"
          y2="18.36"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="18.36"
          y1="5.64"
          x2="19.78"
          y2="4.22"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (code === 1) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle
          cx="10"
          cy="10"
          r="4"
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth="1.5"
        />
        <line
          x1="10"
          y1="2"
          x2="10"
          y2="4"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="10"
          y1="16"
          x2="10"
          y2="18"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="3.5"
          y1="10"
          x2="5.5"
          y2="10"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M17 18a4 4 0 0 0-4-4 4 4 0 0 0-3.5 2A3 3 0 0 0 10 19h7a3 3 0 0 0 0-6"
          fill="#e2e8f0"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (code === 2) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle
          cx="8"
          cy="8"
          r="3.5"
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth="1.2"
        />
        <path
          d="M19 17a4 4 0 0 0-4-4 4 4 0 0 0-3 1.5A3.5 3.5 0 0 0 8 15a3.5 3.5 0 0 0 0 7h11a3 3 0 0 0 0-5"
          fill="#e2e8f0"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (code === 3) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M18 10a5 5 0 0 0-5-5 5 5 0 0 0-4.5 2.8A4 4 0 0 0 5 11.5 3.5 3.5 0 0 0 5 18h12a3.5 3.5 0 0 0 0-7"
          fill="#cbd5e1"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (code >= 45 && code <= 48) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M5 17h14M7 13h10M9 9h6"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M18 10a5 5 0 0 0-5-5 5 5 0 0 0-4.5 2.8A4 4 0 0 0 5 11.5 3.5 3.5 0 0 0 5 18h12a3.5 3.5 0 0 0 0-7"
          fill="#e2e8f0"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (code >= 51 && code <= 67) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M18 10a5 5 0 0 0-5-5 5 5 0 0 0-4.5 2.8A4 4 0 0 0 5 11.5 3.5 3.5 0 0 0 5 18h12a3.5 3.5 0 0 0 0-7"
          fill="#94a3b8"
          stroke="#64748b"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="8"
          y1="19"
          x2="7"
          y2="22"
          stroke="#60a5fa"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="12"
          y1="19"
          x2="11"
          y2="22"
          stroke="#60a5fa"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="16"
          y1="19"
          x2="15"
          y2="22"
          stroke="#60a5fa"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (code >= 71 && code <= 77) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M18 10a5 5 0 0 0-5-5 5 5 0 0 0-4.5 2.8A4 4 0 0 0 5 11.5 3.5 3.5 0 0 0 5 18h12a3.5 3.5 0 0 0 0-7"
          fill="#94a3b8"
          stroke="#64748b"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="20" r="1" fill="#bfdbfe" />
        <circle cx="12" cy="21" r="1" fill="#bfdbfe" />
        <circle cx="16" cy="19.5" r="1" fill="#bfdbfe" />
        <circle cx="10" cy="22" r="0.8" fill="#bfdbfe" />
        <circle cx="14" cy="22.5" r="0.8" fill="#bfdbfe" />
      </svg>
    );
  }
  if (code >= 80 && code <= 82) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M18 10a5 5 0 0 0-5-5 5 5 0 0 0-4.5 2.8A4 4 0 0 0 5 11.5 3.5 3.5 0 0 0 5 18h12a3.5 3.5 0 0 0 0-7"
          fill="#64748b"
          stroke="#475569"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="7"
          y1="19"
          x2="5"
          y2="23"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="12"
          y1="19"
          x2="10"
          y2="23"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="17"
          y1="19"
          x2="15"
          y2="23"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (code >= 95) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M18 10a5 5 0 0 0-5-5 5 5 0 0 0-4.5 2.8A4 4 0 0 0 5 11.5 3.5 3.5 0 0 0 5 18h12a3.5 3.5 0 0 0 0-7"
          fill="#475569"
          stroke="#334155"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="13 17 11 21 14 21 12 25"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="#e2e8f0"
        stroke="#94a3b8"
        strokeWidth="1.5"
      />
      <path
        d="M8 12a4 4 0 0 1 8 0"
        stroke="#64748b"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─────────── Main Component ─────────── */

export function WeatherSidebarWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<GeoCity>(DEFAULT_CITIES[0]);
  const [citySearchOpen, setCitySearchOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [geoResults, setGeoResults] = useState<GeoCity[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchCities = useCallback(async (query: string) => {
    if (query.length < 2) {
      setGeoResults([]);
      return;
    }
    setGeoLoading(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=ru&format=json`,
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.results) {
        setGeoResults(
          data.results.map((r: Record<string, unknown>) => ({
            name: r.name as string,
            country: (r.country_code as string) || "",
            latitude: r.latitude as number,
            longitude: r.longitude as number,
          })),
        );
      } else {
        setGeoResults([]);
      }
    } catch {
      setGeoResults([]);
    } finally {
      setGeoLoading(false);
    }
  }, []);

  const handleCityQueryChange = useCallback(
    (value: string) => {
      setCityQuery(value);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => searchCities(value), 300);
    },
    [searchCities],
  );

  const selectCity = useCallback((city: GeoCity) => {
    setSelectedCity(city);
    setCitySearchOpen(false);
    setCityQuery("");
    setGeoResults([]);
  }, []);

  const fetchWeather = useCallback(async (city: GeoCity) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,uv_index&daily=temperature_2m_max,temperature_2m_min,weather_code&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=7`,
      );
      if (!res.ok) throw new Error("Weather fetch failed");

      const data = await res.json();
      const current = data.current;
      const daily = data.daily;

      const hourlyNow = data.hourly?.time || [];
      const hourlyTemp = data.hourly?.temperature_2m || [];
      const hourlyCode = data.hourly?.weather_code || [];
      const nowIdx = hourlyNow.findIndex(
        (t: string) => new Date(t) >= new Date(),
      );
      const startIdx = Math.max(0, nowIdx === -1 ? 0 : nowIdx);

      const hourly = Array.from({ length: 8 }, (_, i) => {
        const idx = startIdx + i;
        const time = hourlyNow[idx]
          ? new Date(hourlyNow[idx]).toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : "";
        return {
          time,
          tempC: Math.round(hourlyTemp[idx] ?? 0),
          weatherCode: hourlyCode[idx] ?? 0,
        };
      }).filter((h) => h.time);

      const dailyForecast = Array.from({ length: 7 }, (_, i) => {
        const date = daily.time?.[i];
        const day = date
          ? new Date(date + "T00:00:00Z").toLocaleDateString("ru-RU", {
              weekday: "short",
            })
          : "";
        const dateLabel = date
          ? new Date(date + "T00:00:00Z").toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
            })
          : "";
        return {
          day,
          date: dateLabel,
          high: Math.round(daily.temperature_2m_max?.[i] ?? 0),
          low: Math.round(daily.temperature_2m_min?.[i] ?? 0),
          weatherCode: daily.weather_code?.[i] ?? 0,
        };
      });

      const conditionLabel = getWeatherLabel(current.weather_code);

      setWeather({
        city: city.name,
        country: city.country,
        weatherCode: current.weather_code,
        tempC: Math.round(current.temperature_2m),
        feelsLikeC: Math.round(current.apparent_temperature),
        condition: conditionLabel,
        humidity: current.relative_humidity_2m,
        windKph: Math.round(current.wind_speed_10m),
        pressure: Math.round(current.surface_pressure),
        tempHigh: Math.round(daily.temperature_2m_max?.[0] ?? 0),
        tempLow: Math.round(daily.temperature_2m_min?.[0] ?? 0),
        hourly,
        daily: dailyForecast,
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(selectedCity);
    const interval = setInterval(() => fetchWeather(selectedCity), 600000);
    return () => clearInterval(interval);
  }, [selectedCity, fetchWeather]);

  return (
    <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background to-muted/20 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Погода</h3>
      </div>

      {/* Hero section */}
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="text-xs font-medium">
              {weather?.city || selectedCity.name}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground/70">
            {weather?.condition || (loading ? "Загрузка..." : "")}
          </p>
        </div>
        <WeatherSvgIcon code={weather?.weatherCode ?? 0} size={40} />
      </div>

      <div className="flex items-end gap-3 mb-4">
        <span className="text-5xl font-extralight tracking-tighter leading-none text-foreground">
          {loading ? "—" : `${weather?.tempC}°`}
        </span>
        {weather && (
          <div className="pb-1.5 space-y-0.5">
            <p className="text-xs text-muted-foreground">
              ощущ. {weather.feelsLikeC}°
            </p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
              <span>↑ {weather.tempHigh}°</span>
              <span>↓ {weather.tempLow}°</span>
            </div>
          </div>
        )}
      </div>

      {/* Hourly */}
      {weather && (
        <div className="mb-4">
          <div
            className="flex gap-1 overflow-x-auto pb-1 scrollbar-none"
            onWheel={(e) => {
              if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
          >
            {weather.hourly.map((h, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 shrink-0 px-2 py-1.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors min-w-[48px]"
              >
                <span className="text-[10px] text-muted-foreground font-medium">
                  {h.time}
                </span>
                <WeatherSvgIcon code={h.weatherCode} size={16} />
                <span className="text-xs font-semibold">{h.tempC}°</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-day */}
      {weather && (
        <div className="mb-4 rounded-xl bg-muted/20 border border-border/30 overflow-y-auto max-h-[200px] scrollbar-none">
          {weather.daily.map((d, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-3 py-2 ${
                i !== weather.daily.length - 1
                  ? "border-b border-border/20"
                  : ""
              }`}
            >
              <span className="text-xs font-medium w-16">
                {i === 0 ? "Сегодня" : d.day}
                <span className="text-[10px] text-muted-foreground ml-1">
                  {i === 0 ? "" : d.date}
                </span>
              </span>
              <WeatherSvgIcon code={d.weatherCode} size={16} />
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold w-6 text-right">{d.high}°</span>
                <div className="w-12 h-1 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                    style={{
                      width: `${Math.min(100, Math.max(20, ((d.high - d.low) / 30) * 100))}%`,
                    }}
                  />
                </div>
                <span className="text-muted-foreground w-6 text-right">
                  {d.low}°
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details */}
      {weather && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            {
              icon: Wind,
              label: "Ветер",
              value: `${weather.windKph}`,
              unit: "км/ч",
            },
            {
              icon: Droplets,
              label: "Влажность",
              value: `${weather.humidity}`,
              unit: "%",
            },
            {
              icon: Thermometer,
              label: "Давление",
              value: `${Math.round(weather.pressure * 0.75)}`,
              unit: "мм",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-xl bg-muted/20 border border-border/30 p-2.5 text-center space-y-1"
            >
              <item.icon className="h-3.5 w-3.5 mx-auto text-primary/70" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {item.label}
              </p>
              <p className="text-xs font-semibold">
                {item.value}
                <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                  {item.unit}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* City Search */}
      <div>
        <Popover open={citySearchOpen} onOpenChange={setCitySearchOpen}>
          <PopoverTrigger className="w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-2 rounded-lg bg-muted/20 hover:bg-muted/30">
            <MapPin className="h-3 w-3" />
            {selectedCity.name} — сменить город
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="top"
            sideOffset={8}
            className="w-64 p-0"
          >
            <div className="p-2 border-b border-border/40">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={cityQuery}
                  onChange={(e) => handleCityQueryChange(e.target.value)}
                  placeholder="Найти город..."
                  className="w-full rounded-md border border-border/60 bg-background pl-8 pr-2 py-1.5 text-xs outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                  autoFocus
                />
                {cityQuery && (
                  <button
                    onClick={() => {
                      setCityQuery("");
                      setGeoResults([]);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {geoLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                </div>
              )}
              {!geoLoading &&
                geoResults.length > 0 &&
                geoResults.map((city, i) => (
                  <button
                    key={`${city.name}-${city.latitude}-${i}`}
                    onClick={() => selectCity(city)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors",
                      selectedCity.name === city.name &&
                        selectedCity.latitude === city.latitude
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted/50 text-foreground",
                    )}
                  >
                    <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{city.name}</span>
                    {city.country && (
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {city.country}
                      </span>
                    )}
                  </button>
                ))}
              {!geoLoading &&
                geoResults.length === 0 &&
                cityQuery.length >= 2 && (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    Город не найден
                  </div>
                )}
              {!geoLoading &&
                geoResults.length === 0 &&
                cityQuery.length < 2 && (
                  <div className="p-2 space-y-0.5">
                    <p className="text-[10px] text-muted-foreground px-2 py-1">
                      Популярные города
                    </p>
                    {DEFAULT_CITIES.map((city) => (
                      <button
                        key={`${city.name}-${city.latitude}`}
                        onClick={() => selectCity(city)}
                        className={cn(
                          "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors",
                          selectedCity.name === city.name &&
                            selectedCity.latitude === city.latitude
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted/50 text-foreground",
                        )}
                      >
                        <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{city.name}</span>
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
