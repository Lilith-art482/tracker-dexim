const CACHE_TTL = 300_000;
let cachedRate: number | null = null;
let cachedAt = 0;

export async function getUSDTtoRUB(): Promise<number> {
  const now = Date.now();
  if (cachedRate !== null && now - cachedAt < CACHE_TTL) return cachedRate;

  try {
    const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js", {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    const rate = data.Valute?.USD?.Value;
    if (rate > 0) {
      cachedRate = rate;
      cachedAt = now;
      return rate;
    }
  } catch {}

  return cachedRate ?? 85;
}

const STABLECOINS = new Set(["USDT", "USDC", "USD"]);

export function convertToRUB(
  amount: number,
  currency: string,
  usdtRate: number,
): number {
  if (currency === "RUB") return amount;
  if (STABLECOINS.has(currency)) return amount * usdtRate;
  return amount;
}

export function getConversionNote(currency: string): string | null {
  if (currency === "RUB") return null;
  if (STABLECOINS.has(currency)) return null;
  return ` (${currency}, не конвертирован)`;
}
