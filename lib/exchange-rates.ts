const CACHE_TTL = 60_000;
let cachedRate: number | null = null;
let cachedAt = 0;

export async function getUSDTtoRUB(): Promise<number> {
  const now = Date.now();
  if (cachedRate !== null && now - cachedAt < CACHE_TTL) return cachedRate;

  try {
    const res = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=USDTRUB",
      { signal: AbortSignal.timeout(5000) },
    );
    const data = await res.json();
    const rate = parseFloat(data.price);
    if (rate > 0) {
      cachedRate = rate;
      cachedAt = now;
      return rate;
    }
  } catch {}

  return cachedRate ?? 90;
}

export function convertToRUB(
  amount: number,
  currency: string,
  usdtRate: number,
): number {
  if (currency === "RUB") return amount;
  return amount * usdtRate;
}
