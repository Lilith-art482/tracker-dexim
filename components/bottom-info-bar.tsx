"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Cloud,
  Wind,
  Droplets,
  Thermometer,
  X,
  Clock,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

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
  visibility: number;
  pressure: number;
  uvIndex: number;
  tempHigh: number;
  tempLow: number;
  hourly: { time: string; tempC: number; weatherCode: number }[];
  daily: { day: string; date: string; high: number; low: number; weatherCode: number }[];
}

interface CryptoRate {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  sparkline: number[];
}

interface FiatRate {
  code: string;
  symbol: string;
  rate: number;
  change24h: number;
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
  { name: "Санкт-Петербург", country: "RU", latitude: 59.9343, longitude: 30.3351 },
  { name: "Новосибирск", country: "RU", latitude: 55.0084, longitude: 82.9357 },
  { name: "Казань", country: "RU", latitude: 55.7887, longitude: 49.1221 },
  { name: "Сочи", country: "RU", latitude: 43.6028, longitude: 39.7342 },
  { name: "Екатеринбург", country: "RU", latitude: 56.8389, longitude: 60.6057 },
];

const CRYPTOS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", icon: "/icon-btc.webp" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", icon: "/icon-eth.webp" },
  { id: "solana", symbol: "SOL", name: "Solana", icon: "/icon-sol.webp" },
  { id: "binancecoin", symbol: "BNB", name: "BNB", icon: "/icon-bnb.webp" },
  { id: "the-open-network", symbol: "GRAM", name: "Gram", icon: "/Gram Circular Badge.svg" },
];

const FIATS = [
  { code: "RUB", symbol: "₽", name: "Рубль" },
  { code: "USD", symbol: "$", name: "Доллар" },
  { code: "EUR", symbol: "€", name: "Евро" },
  { code: "CNY", symbol: "¥", name: "Юань" },
  { code: "BYN", symbol: "Br", name: "Бел. рубль" },
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
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#a5b4fc" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ) : (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="5" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5"/>
        <line x1="12" y1="1" x2="12" y2="3" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="21" x2="12" y2="23" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="1" y1="12" x2="3" y2="12" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="21" y1="12" x2="23" y2="12" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }
  if (code === 1) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="10" cy="10" r="4" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5"/>
        <line x1="10" y1="2" x2="10" y2="4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="10" y1="16" x2="10" y2="18" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="3.5" y1="10" x2="5.5" y2="10" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M17 18a4 4 0 0 0-4-4 4 4 0 0 0-3.5 2A3 3 0 0 0 10 19h7a3 3 0 0 0 0-6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (code === 2) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="8" cy="8" r="3.5" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.2"/>
        <path d="M19 17a4 4 0 0 0-4-4 4 4 0 0 0-3 1.5A3.5 3.5 0 0 0 8 15a3.5 3.5 0 0 0 0 7h11a3 3 0 0 0 0-5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (code === 3) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M18 10a5 5 0 0 0-5-5 5 5 0 0 0-4.5 2.8A4 4 0 0 0 5 11.5 3.5 3.5 0 0 0 5 18h12a3.5 3.5 0 0 0 0-7" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (code >= 45 && code <= 48) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M5 17h14M7 13h10M9 9h6" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        <path d="M18 10a5 5 0 0 0-5-5 5 5 0 0 0-4.5 2.8A4 4 0 0 0 5 11.5 3.5 3.5 0 0 0 5 18h12a3.5 3.5 0 0 0 0-7" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (code >= 51 && code <= 67) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M18 10a5 5 0 0 0-5-5 5 5 0 0 0-4.5 2.8A4 4 0 0 0 5 11.5 3.5 3.5 0 0 0 5 18h12a3.5 3.5 0 0 0 0-7" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="8" y1="19" x2="7" y2="22" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="19" x2="11" y2="22" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="16" y1="19" x2="15" y2="22" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }
  if (code >= 71 && code <= 77) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M18 10a5 5 0 0 0-5-5 5 5 0 0 0-4.5 2.8A4 4 0 0 0 5 11.5 3.5 3.5 0 0 0 5 18h12a3.5 3.5 0 0 0 0-7" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="8" cy="20" r="1" fill="#bfdbfe"/>
        <circle cx="12" cy="21" r="1" fill="#bfdbfe"/>
        <circle cx="16" cy="19.5" r="1" fill="#bfdbfe"/>
        <circle cx="10" cy="22" r="0.8" fill="#bfdbfe"/>
        <circle cx="14" cy="22.5" r="0.8" fill="#bfdbfe"/>
      </svg>
    );
  }
  if (code >= 80 && code <= 82) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M18 10a5 5 0 0 0-5-5 5 5 0 0 0-4.5 2.8A4 4 0 0 0 5 11.5 3.5 3.5 0 0 0 5 18h12a3.5 3.5 0 0 0 0-7" fill="#64748b" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="7" y1="19" x2="5" y2="23" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="19" x2="10" y2="23" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
        <line x1="17" y1="19" x2="15" y2="23" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  if (code >= 95) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M18 10a5 5 0 0 0-5-5 5 5 0 0 0-4.5 2.8A4 4 0 0 0 5 11.5 3.5 3.5 0 0 0 5 18h12a3.5 3.5 0 0 0 0-7" fill="#475569" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="13 17 11 21 14 21 12 25" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
      <path d="M8 12a4 4 0 0 1 8 0" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/* ─────────── Helpers ─────────── */

function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

function formatTime(tz: string): string {
  return new Date().toLocaleTimeString("ru-RU", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDate(tz: string): string {
  return new Date().toLocaleDateString("ru-RU", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatCurrency(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

function formatFiatRate(n: number, code: string): string {
  if (code === "RUB") return n.toFixed(2);
  return n.toFixed(2);
}

/* ─────────── Sparkline SVG ─────────── */

function MiniSparkline({
  data,
  positive,
}: {
  data: number[];
  positive: boolean;
}) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 20;
  const w = 60;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#22c55e" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─────────── Crypto Icon ─────────── */

function CryptoIcon({
  icon,
  symbol,
  size = 32,
}: {
  icon: string;
  symbol: string;
  size?: number;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-lg bg-muted/50 overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt={symbol}
        width={size}
        height={size}
        className="object-contain"
      />
    </div>
  );
}

/* ─────────── Weather Widget ─────────── */

function WeatherWidget() {
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
        visibility: 10,
        pressure: Math.round(current.surface_pressure),
        uvIndex: current.uv_index ?? 0,
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
    <div className="relative">
      {/* Premium gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-primary/5" />
      <div className="absolute inset-0 backdrop-blur-xl" />

      <div className="relative">
        {/* Hero section */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="text-xs font-medium tracking-wide uppercase">
                  {weather?.city || selectedCity.name}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/70">
                {weather?.condition || (loading ? "Загрузка..." : "")}
              </p>
            </div>
            <WeatherSvgIcon code={weather?.weatherCode ?? 0} size={48} />
          </div>

          <div className="mt-3 flex items-end gap-3">
            <span className="text-6xl font-extralight tracking-tighter leading-none text-foreground">
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
        </div>

        {/* Hourly */}
        {weather && (
          <div className="px-5 pb-4">
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
                  className="flex flex-col items-center gap-1.5 shrink-0 px-2.5 py-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors min-w-[52px]"
                >
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {h.time}
                  </span>
                  <WeatherSvgIcon code={h.weatherCode} size={18} />
                  <span className="text-xs font-semibold">{h.tempC}°</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7-day */}
        {weather && (
          <div className="mx-5 mb-4 rounded-xl bg-muted/20 border border-border/30 overflow-y-auto max-h-[240px] scrollbar-none" style={{ WebkitOverflowScrolling: "touch" }}>
            {weather.daily.map((d, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3.5 py-2.5 ${
                  i !== weather.daily.length - 1 ? "border-b border-border/20" : ""
                }`}
              >
                <span className="text-xs font-medium w-20">
                  {i === 0 ? "Сегодня" : d.day}
                  <span className="text-[10px] text-muted-foreground ml-1">{i === 0 ? "" : d.date}</span>
                </span>
                <WeatherSvgIcon code={d.weatherCode} size={18} />
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold w-8 text-right">{d.high}°</span>
                  <div className="w-16 h-1 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                      style={{
                        width: `${Math.min(100, Math.max(20, ((d.high - d.low) / 30) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground w-8 text-right">{d.low}°</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details */}
        {weather && (
          <div className="mx-5 mb-4 grid grid-cols-3 gap-2">
            {[
              { icon: Wind, label: "Ветер", value: `${weather.windKph}`, unit: "км/ч" },
              { icon: Droplets, label: "Влажность", value: `${weather.humidity}`, unit: "%" },
              { icon: Thermometer, label: "Давление", value: `${Math.round(weather.pressure * 0.75)}`, unit: "мм" },
            ].map((item, i) => (
              <div key={i} className="rounded-xl bg-muted/20 border border-border/30 p-3 text-center space-y-1.5">
                <item.icon className="h-4 w-4 mx-auto text-primary/70" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{item.label}</p>
                <p className="text-sm font-semibold">
                  {item.value}
                  <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{item.unit}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* City Search */}
        <div className="px-5 pb-4">
          <Popover open={citySearchOpen} onOpenChange={setCitySearchOpen}>
            <PopoverTrigger className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              <MapPin className="h-3 w-3 inline mr-1" />
              {selectedCity.name} — сменить город
            </PopoverTrigger>
            <PopoverContent align="start" side="top" sideOffset={8} className="w-64 p-0">
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
                    <button onClick={() => { setCityQuery(""); setGeoResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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
                {!geoLoading && geoResults.length > 0 && geoResults.map((city, i) => (
                  <button
                    key={`${city.name}-${city.latitude}-${i}`}
                    onClick={() => selectCity(city)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors",
                      selectedCity.name === city.name && selectedCity.latitude === city.latitude ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-foreground",
                    )}
                  >
                    <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{city.name}</span>
                    {city.country && <span className="text-[10px] text-muted-foreground ml-auto">{city.country}</span>}
                  </button>
                ))}
                {!geoLoading && geoResults.length === 0 && cityQuery.length >= 2 && (
                  <div className="py-4 text-center text-xs text-muted-foreground">Город не найден</div>
                )}
                {!geoLoading && geoResults.length === 0 && cityQuery.length < 2 && (
                  <div className="p-2 space-y-0.5">
                    <p className="text-[10px] text-muted-foreground px-2 py-1">Популярные города</p>
                    {DEFAULT_CITIES.map((city) => (
                      <button
                        key={`${city.name}-${city.latitude}`}
                        onClick={() => selectCity(city)}
                        className={cn(
                          "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors",
                          selectedCity.name === city.name && selectedCity.latitude === city.latitude ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-foreground",
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
    </div>
  );
}

/* ─────────── Time Widget ─────────── */

const TIMEZONES = [
  { value: "Pacific/Auckland", label: "UTC+12/+13" },
  { value: "Asia/Kamchatka", label: "UTC+12" },
  { value: "Asia/Magadan", label: "UTC+11" },
  { value: "Asia/Vladivostok", label: "UTC+10" },
  { value: "Asia/Yakutsk", label: "UTC+9" },
  { value: "Asia/Tokyo", label: "UTC+9" },
  { value: "Asia/Seoul", label: "UTC+9" },
  { value: "Asia/Shanghai", label: "UTC+8" },
  { value: "Asia/Irkutsk", label: "UTC+8" },
  { value: "Asia/Singapore", label: "UTC+8" },
  { value: "Asia/Kolkata", label: "UTC+5:30" },
  { value: "Asia/Yekaterinburg", label: "UTC+5" },
  { value: "Asia/Tashkent", label: "UTC+5" },
  { value: "Asia/Almaty", label: "UTC+6" },
  { value: "Asia/Omsk", label: "UTC+6" },
  { value: "Asia/Krasnoyarsk", label: "UTC+7" },
  { value: "Asia/Dubai", label: "UTC+4" },
  { value: "Europe/Samara", label: "UTC+4" },
  { value: "Asia/Baku", label: "UTC+4" },
  { value: "Asia/Tbilisi", label: "UTC+4" },
  { value: "Europe/Moscow", label: "UTC+3" },
  { value: "Europe/Kiev", label: "UTC+2/+3" },
  { value: "Europe/Istanbul", label: "UTC+3" },
  { value: "Europe/Athens", label: "UTC+2/+3" },
  { value: "Europe/Berlin", label: "UTC+1/+2" },
  { value: "Europe/Paris", label: "UTC+1/+2" },
  { value: "Europe/Minsk", label: "UTC+3" },
  { value: "Europe/London", label: "UTC+0/+1" },
  { value: "Atlantic/Reykjavik", label: "UTC+0" },
  { value: "America/Sao_Paulo", label: "UTC-3" },
  { value: "America/New_York", label: "UTC-5/-4" },
  { value: "America/Chicago", label: "UTC-6/-5" },
  { value: "America/Denver", label: "UTC-7/-6" },
  { value: "America/Los_Angeles", label: "UTC-8/-7" },
  { value: "Pacific/Honolulu", label: "UTC-10" },
];

function TimeWidget() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [tzOpen, setTzOpen] = useState(false);
  const [tz, setTz] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("user_timezone") || getUserTimezone();
    }
    return getUserTimezone();
  });

  useEffect(() => {
    const tick = () => {
      setTime(formatTime(tz));
      setDate(formatDate(tz));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tz]);

  const handleTzChange = (newTz: string) => {
    setTz(newTz);
    localStorage.setItem("user_timezone", newTz);
    setTzOpen(false);
  };

  const tzLabel = TIMEZONES.find((t) => t.value === tz)?.label || tz.split("/").pop()?.replace("_", " ") || tz;

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="text-xs font-semibold tabular-nums">{time}</span>
        <span className="text-[10px] text-muted-foreground truncate">
          {date}
        </span>
      </div>

      <Popover open={tzOpen} onOpenChange={setTzOpen}>
        <PopoverTrigger className="text-[10px] text-muted-foreground hover:text-foreground transition-colors shrink-0">
          {tzLabel}
        </PopoverTrigger>
        <PopoverContent
          align="center"
          side="top"
          sideOffset={8}
          className="w-44 p-0"
        >
          <div className="p-2 border-b border-border/40">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2">
              Часовой пояс
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {TIMEZONES.map((item) => (
              <button
                key={item.value}
                onClick={() => handleTzChange(item.value)}
                className={cn(
                  "flex items-center w-full px-2.5 py-1.5 rounded-md text-xs transition-colors",
                  tz === item.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted/50 text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ─────────── Markets Widget (Crypto + Fiat) ─────────── */

function MarketsWidget() {
  const [cryptoRates, setCryptoRates] = useState<CryptoRate[]>([]);
  const [fiatRates, setFiatRates] = useState<FiatRate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCryptoRates = useCallback(async () => {
    try {
      const ids = CRYPTOS.map((c) => c.id).join(",");
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`,
      );
      if (!res.ok) throw new Error("CoinGecko fetch failed");
      const data = await res.json();

      return data.map(
        (coin: Record<string, unknown>) => {
          const sparklineData = (coin.sparkline_in_7d as { price: number[] })
            ?.price;
          return {
            id: coin.id as string,
            symbol: CRYPTOS.find((c) => c.id === coin.id)?.symbol || "",
            name: coin.name as string,
            price: coin.current_price as number,
            change24h: coin.price_change_percentage_24h as number,
            sparkline: sparklineData?.slice(-24) || [],
          };
        },
      );
    } catch {
      return [];
    }
  }, []);

  const fetchFiatRates = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=rub,eur,cny,byn&include_24hr_change=true`,
      );
      if (!res.ok) {
        return FIATS.map((f) => ({
          code: f.code,
          symbol: f.symbol,
          rate: f.code === "USD" ? 1 : f.code === "RUB" ? 85 : f.code === "EUR" ? 0.92 : f.code === "CNY" ? 7.2 : 3.2,
          change24h: 0,
        }));
      }
      const data = await res.json();
      const usdRub = data?.tether?.rub ?? 85;
      const usdEur = data?.tether?.eur ? 1 / data.tether.eur : 0.92;
      const usdCny = data?.tether?.cny ? 1 / data.tether.cny : 7.2;
      const usdByn = data?.tether?.byn ? 1 / data.tether.byn : 3.2;
      return [
        { code: "RUB", symbol: "₽", rate: usdRub, change24h: data?.tether?.rub_24h_change ?? 0 },
        { code: "USD", symbol: "$", rate: 1, change24h: 0 },
        { code: "EUR", symbol: "€", rate: usdEur, change24h: data?.tether?.eur_24h_change ?? 0 },
        { code: "CNY", symbol: "¥", rate: usdCny, change24h: data?.tether?.cny_24h_change ?? 0 },
        { code: "BYN", symbol: "Br", rate: usdByn, change24h: data?.tether?.byn_24h_change ?? 0 },
      ];
    } catch {
      return FIATS.map((f) => ({
        code: f.code,
        symbol: f.symbol,
        rate: f.code === "USD" ? 1 : f.code === "RUB" ? 85 : f.code === "EUR" ? 0.92 : f.code === "CNY" ? 7.2 : 3.2,
        change24h: 0,
      }));
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [crypto, fiat] = await Promise.all([
      fetchCryptoRates(),
      fetchFiatRates(),
    ]);
    setCryptoRates(crypto);
    setFiatRates(fiat);
    setLoading(false);
  }, [fetchCryptoRates, fetchFiatRates]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold">Рынки</h4>
        <Button variant="ghost" size="sm" onClick={() => fetchAll()} className="h-6 px-1.5">
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {/* Fiat first */}
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
        Валюты (к USD)
      </p>
      <div className="divide-y divide-border/30 mb-3">
        {fiatRates.map((r) => {
          const positive = r.change24h >= 0;
          return (
            <div key={r.code} className="flex items-center gap-3 py-2 hover:bg-muted/30 rounded-lg px-2 transition-colors">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/50 text-sm font-bold shrink-0">
                {r.symbol}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{FIATS.find((f) => f.code === r.code)?.name || r.code}</p>
                <p className="text-[10px] text-muted-foreground">{r.code}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold tabular-nums">{formatFiatRate(r.rate, r.code)} {r.symbol}</p>
                {r.change24h !== 0 && (
                  <p className={cn("text-[10px] font-medium tabular-nums", positive ? "text-emerald-500" : "text-red-500")}>
                    {positive ? "+" : ""}{r.change24h.toFixed(2)}%
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Then crypto */}
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
        Криптовалюты
      </p>
      <div className="divide-y divide-border/30">
        {cryptoRates.map((r) => {
          const positive = r.change24h >= 0;
          const crypto = CRYPTOS.find((c) => c.id === r.id);
          return (
            <div key={r.id} className="flex items-center gap-3 py-2 hover:bg-muted/30 rounded-lg px-2 transition-colors">
              {crypto && <CryptoIcon icon={crypto.icon} symbol={r.symbol} size={28} />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{r.name}</p>
                <p className="text-[10px] text-muted-foreground">{r.symbol}</p>
              </div>
              <MiniSparkline data={r.sparkline} positive={positive} />
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold tabular-nums">${formatCurrency(r.price)}</p>
                <p className={cn("text-[10px] font-medium tabular-nums", positive ? "text-emerald-500" : "text-red-500")}>
                  {positive ? "+" : ""}{r.change24h.toFixed(2)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────── Main Bottom Bar (Floating Button) ─────────── */

export function BottomInfoBar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="flex items-center gap-2 h-11 px-4 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-200">
          <Cloud className="h-4 w-4" />
          <span className="text-xs font-semibold">Инфо</span>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="top"
          sideOffset={8}
          className="w-[380px] p-0 max-h-[80vh] overflow-y-auto scrollbar-none"
        >
          {/* Weather */}
          <WeatherWidget />

          {/* Divider */}
          <div className="h-px bg-border/40 mx-4" />

          {/* Time */}
          <div className="px-4 py-3">
            <TimeWidget />
          </div>

          {/* Divider */}
          <div className="h-px bg-border/40 mx-4" />

          {/* Markets */}
          <MarketsWidget />
        </PopoverContent>
      </Popover>
    </div>
  );
}
