"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  Droplets,
  Eye,
  Thermometer,
  ChevronDown,
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  RefreshCw,
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
  tempC: number;
  feelsLikeC: number;
  condition: string;
  icon: string;
  humidity: number;
  windKph: number;
  visibility: number;
  pressure: number;
  uvIndex: number;
  tempHigh: number;
  tempLow: number;
  hourly: { time: string; tempC: number; icon: string }[];
  daily: { day: string; high: number; low: number; icon: string }[];
}

interface CryptoRate {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  sparkline: number[];
}

/* ─────────── Constants ─────────── */

const CITIES = [
  { name: "Москва", query: "Moscow" },
  { name: "Санкт-Петербург", query: "Saint Petersburg" },
  { name: "Новосибирск", query: "Novosibirsk" },
  { name: "Казань", query: "Kazan" },
  { name: "Сочи", query: "Sochi" },
  { name: "Екатеринбург", query: "Yekaterinburg" },
  { name: "Лондон", query: "London" },
  { name: "Нью-Йорк", query: "New York" },
  { name: "Токио", query: "Tokyo" },
  { name: "Дубай", query: "Dubai" },
];

const CRYPTOS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "toncoin", symbol: "TON", name: "Toncoin" },
];

const WMO_ICONS: Record<number, { icon: string; label: string }> = {
  0: { icon: "☀️", label: "Ясно" },
  1: { icon: "🌤️", label: "Малооблачно" },
  2: { icon: "⛅", label: "Облачно" },
  3: { icon: "☁️", label: "Пасмурно" },
  45: { icon: "🌫️", label: "Туман" },
  48: { icon: "🌫️", label: "Инейный туман" },
  51: { icon: "🌦️", label: "Морось" },
  53: { icon: "🌦️", label: "Морось" },
  55: { icon: "🌧️", label: "Сильная морось" },
  61: { icon: "🌧️", label: "Дождь" },
  63: { icon: "🌧️", label: "Дождь" },
  65: { icon: "🌧️", label: "Сильный дождь" },
  71: { icon: "❄️", label: "Снег" },
  73: { icon: "❄️", label: "Снег" },
  75: { icon: "❄️", label: "Сильный снег" },
  80: { icon: "🌦️", label: "Ливень" },
  81: { icon: "🌧️", label: "Ливень" },
  82: { icon: "⛈️", label: "Сильный ливень" },
  95: { icon: "⛈️", label: "Гроза" },
  96: { icon: "⛈️", label: "Гроза с градом" },
  99: { icon: "⛈️", label: "Гроза с градом" },
};

const CRYPTO_ICONS: Record<string, string> = {
  BTC: "₿",
  ETH: "Ξ",
  SOL: "◎",
  DOGE: "Ð",
  TON: "💎",
};

/* ─────────── Helpers ─────────── */

function getWeatherIcon(code: number) {
  return WMO_ICONS[code] || { icon: "🌡️", label: "Неизвестно" };
}

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

/* ─────────── Weather Widget ─────────── */

function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  const fetchWeather = useCallback(async (city: (typeof CITIES)[0]) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(city.query)}&longitude=&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,uv_index&daily=temperature_2m_max,temperature_2m_min,weather_code&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=7`,
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
          icon: getWeatherIcon(hourlyCode[idx] ?? 0).icon,
        };
      }).filter((h) => h.time);

      const dailyForecast = Array.from({ length: 7 }, (_, i) => {
        const date = daily.time?.[i];
        const day = date
          ? new Date(date + "T00:00:00Z").toLocaleDateString("ru-RU", {
              weekday: "short",
            })
          : "";
        return {
          day,
          high: Math.round(daily.temperature_2m_max?.[i] ?? 0),
          low: Math.round(daily.temperature_2m_min?.[i] ?? 0),
          icon: getWeatherIcon(daily.weather_code?.[i] ?? 0).icon,
        };
      });

      const wmoInfo = getWeatherIcon(current.weather_code);

      setWeather({
        city: city.name,
        country: "",
        tempC: Math.round(current.temperature_2m),
        feelsLikeC: Math.round(current.apparent_temperature),
        condition: wmoInfo.label,
        icon: wmoInfo.icon,
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
    <div className="flex items-center gap-2 min-w-0">
      <Popover open={detailOpen} onOpenChange={setDetailOpen}>
        <PopoverTrigger
              className="flex items-center gap-2 rounded-lg hover:bg-muted/50 px-2 py-1.5 transition-colors min-w-0"
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
              ) : (
                <span className="text-base leading-none">{weather?.icon}</span>
              )}
              <span className="text-xs font-medium truncate">
                {loading ? "—" : `${weather?.tempC}°`}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </PopoverTrigger>
        <PopoverContent
          align="start"
          side="top"
          sideOffset={8}
          className="w-[340px] p-0 overflow-hidden"
        >
          {weather && (
            <div className="bg-gradient-to-b from-sky-500/10 via-background to-background">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-semibold">
                      {weather.city}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {weather.condition}
                  </p>
                </div>
                <span className="text-3xl">{weather.icon}</span>
              </div>

              {/* Temp */}
              <div className="px-4 pb-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {weather.tempC}°
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ощущ. {weather.feelsLikeC}°
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>↑ {weather.tempHigh}°</span>
                  <span>↓ {weather.tempLow}°</span>
                </div>
              </div>

              {/* Hourly */}
              <div className="px-4 pb-3">
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                  {weather.hourly.map((h, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-1 shrink-0"
                    >
                      <span className="text-[10px] text-muted-foreground">
                        {h.time}
                      </span>
                      <span className="text-sm">{h.icon}</span>
                      <span className="text-xs font-medium">{h.tempC}°</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-day */}
              <div className="border-t border-border/40 px-4 py-3">
                {weather.daily.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-xs w-20 truncate">{d.day}</span>
                    <span className="text-sm">{d.icon}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">{d.high}°</span>
                      <span className="text-muted-foreground">{d.low}°</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Details */}
              <div className="border-t border-border/40 grid grid-cols-3 gap-px bg-border/20">
                {[
                  {
                    icon: Wind,
                    label: "Ветер",
                    value: `${weather.windKph} км/ч`,
                  },
                  {
                    icon: Droplets,
                    label: "Влажность",
                    value: `${weather.humidity}%`,
                  },
                  {
                    icon: Thermometer,
                    label: "Давление",
                    value: `${weather.pressure} гПа`,
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-background p-3 text-center">
                    <item.icon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-[10px] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-xs font-semibold mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* City Picker */}
      <Popover open={cityPickerOpen} onOpenChange={setCityPickerOpen}>
        <PopoverTrigger
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors truncate max-w-[80px]"
            >
              {selectedCity.name}
            </PopoverTrigger>
        <PopoverContent align="start" side="top" sideOffset={8} className="w-48 p-1">
          {CITIES.map((city) => (
            <button
              key={city.query}
              onClick={() => {
                setSelectedCity(city);
                setCityPickerOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors",
                selectedCity.query === city.query
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted/50 text-foreground",
              )}
            >
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{city.name}</span>
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ─────────── Time Widget ─────────── */

function TimeWidget() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const tz = useMemo(() => getUserTimezone(), []);

  useEffect(() => {
    const tick = () => {
      setTime(formatTime(tz));
      setDate(formatDate(tz));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tz]);

  const tzShort = tz.split("/").pop()?.replace("_", " ") || tz;

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="text-xs font-semibold tabular-nums">{time}</span>
        <span className="text-[10px] text-muted-foreground truncate">
          {date} · {tzShort}
        </span>
      </div>
    </div>
  );
}

/* ─────────── Crypto Widget ─────────── */

function CryptoWidget() {
  const [rates, setRates] = useState<CryptoRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchRates = useCallback(async () => {
    try {
      const ids = CRYPTOS.map((c) => c.id).join(",");
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`,
      );
      if (!res.ok) throw new Error("CoinGecko fetch failed");
      const data = await res.json();

      const mapped: CryptoRate[] = data.map(
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
      setRates(mapped);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  return (
    <Popover open={expanded} onOpenChange={setExpanded}>
        <PopoverTrigger
            className="flex items-center gap-2 rounded-lg hover:bg-muted/50 px-2 py-1.5 transition-colors"
          >
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <div className="flex items-center gap-2">
              {loading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-3 w-10 rounded bg-muted animate-pulse"
                    />
                  ))}
                </>
              ) : (
                rates.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">
                      {r.symbol}
                    </span>
                    <span className="text-[11px] font-medium tabular-nums">
                      ${formatCurrency(r.price)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-[320px] p-0"
      >
        <div className="p-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold">Криптовалюты</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchRates()}
              className="h-6 px-1.5"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="divide-y divide-border/30">
          {rates.map((r) => {
            const positive = r.change24h >= 0;
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-sm font-bold">
                  {CRYPTO_ICONS[r.symbol] || r.symbol[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground">{r.symbol}</p>
                </div>
                <MiniSparkline data={r.sparkline} positive={positive} />
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold tabular-nums">
                    ${formatCurrency(r.price)}
                  </p>
                  <p
                    className={cn(
                      "text-[10px] font-medium tabular-nums",
                      positive ? "text-emerald-500" : "text-red-500",
                    )}
                  >
                    {positive ? "+" : ""}
                    {r.change24h.toFixed(2)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ─────────── Main Bottom Bar ─────────── */

export function BottomInfoBar() {
  return (
    <div className="sticky bottom-0 z-40 w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-10 items-center justify-between px-3 sm:px-4 gap-4">
        {/* Left: Weather */}
        <div className="flex items-center min-w-0 shrink-0">
          <WeatherWidget />
        </div>

        {/* Center: Time */}
        <div className="hidden sm:flex items-center justify-center flex-1 min-w-0">
          <TimeWidget />
        </div>

        {/* Right: Crypto */}
        <div className="flex items-center justify-end min-w-0 shrink-0">
          <CryptoWidget />
        </div>
      </div>
    </div>
  );
}
