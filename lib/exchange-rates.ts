const CACHE_TTL = 300_000;
let cachedRates: Record<string, number> | null = null;
let cachedAt = 0;

type RateMap = Record<string, number>;

const CRYPTO_COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  TON: "the-open-network",
  BNB: "binancecoin",
  TRX: "tron",
};

async function fetchCBIRates(): Promise<Record<string, number>> {
  const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js", {
    signal: AbortSignal.timeout(5000),
  });
  const data = await res.json();
  const map: Record<string, number> = {};
  for (const [code, info] of Object.entries(
    data.Valute as Record<string, { Value: number }>,
  )) {
    map[code] = info.Value;
  }
  return map;
}

async function fetchCoinGeckoPrices(): Promise<Record<string, number>> {
  const ids = Object.values(CRYPTO_COINGECKO_IDS).join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
    { signal: AbortSignal.timeout(5000) },
  );
  const data = (await res.json()) as Record<string, { usd: number }>;
  const map: Record<string, number> = {};
  for (const [symbol, id] of Object.entries(CRYPTO_COINGECKO_IDS)) {
    const price = data[id]?.usd;
    if (price && price > 0) map[symbol] = price;
  }
  return map;
}

function buildRUBRateMap(
  cbiRates: Record<string, number>,
  cryptoUsdPrices: Record<string, number>,
  usdToRub: number,
): RateMap {
  const map: RateMap = { RUB: 1 };

  for (const [code, rubRate] of Object.entries(cbiRates)) {
    map[code] = rubRate;
  }

  map["USD"] = usdToRub;
  map["USDT"] = usdToRub;
  map["USDC"] = usdToRub;

  for (const [symbol, usdPrice] of Object.entries(cryptoUsdPrices)) {
    map[symbol] = usdPrice * usdToRub;
  }

  return map;
}

export async function getAllRates(): Promise<RateMap> {
  const now = Date.now();
  if (cachedRates !== null && now - cachedAt < CACHE_TTL) return cachedRates;

  try {
    const cbiRates = await fetchCBIRates();
    const usdToRub = cbiRates["USD"] || 85;
    const cryptoUsdPrices = await fetchCoinGeckoPrices();
    cachedRates = buildRUBRateMap(cbiRates, cryptoUsdPrices, usdToRub);
    cachedAt = now;
  } catch {
    if (cachedRates) return cachedRates;
    cachedRates = buildRUBRateMap({}, {}, 85);
  }

  return cachedRates;
}

export function convert(
  amount: number,
  from: string,
  to: string,
  rates: RateMap,
): number {
  if (from === to) return amount;
  const rateFrom = rates[from];
  const rateTo = rates[to];
  if (!rateFrom || !rateTo) return amount;
  return (amount * rateFrom) / rateTo;
}

export function getDisplayCurrency(): string {
  if (typeof window === "undefined") return "RUB";
  return localStorage.getItem("finance_currency") || "RUB";
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: "₽",
  USD: "$",
  EUR: "€",
  CNY: "¥",
  UAH: "₴",
  KZT: "₸",
  BYN: "Br",
  AMD: "֏",
  AED: "د.إ",
  TRY: "₺",
  PLN: "zł",
  BTC: "₿",
  ETH: "⟠",
  SOL: "SOL",
  TON: "TON",
  BNB: "BNB",
  TRX: "TRX",
  USDT: "₮",
  USDC: "₮",
};

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || code;
}

export function getCachedRates(): RateMap | null {
  return cachedRates;
}

/**
 * For a crypto account, computes the effective balance from the fixed cryptoAmount.
 * For non-crypto accounts, returns the stored balance.
 */
export function getEffectiveBalance(
  amount: number,
  cryptoAmount: number | undefined | null,
  cryptoCoin: string | undefined,
  fromCurrency: string,
  rates: RateMap,
): number {
  if (cryptoCoin && cryptoAmount != null) {
    return convert(cryptoAmount, cryptoCoin, fromCurrency, rates);
  }
  return amount;
}

/**
 * Computes how much cryptoCoin corresponds to a given fiat balance.
 * Used when creating a crypto account: cryptoAmount = balance / rate(cryptoCoin → currency)
 */
export function computeCryptoAmount(
  balance: number,
  cryptoCoin: string,
  currency: string,
  rates: RateMap,
): number {
  const rateToCurrency = convert(1, cryptoCoin, currency, rates);
  if (rateToCurrency === 0) return 0;
  return balance / rateToCurrency;
}

// ── backward-compatible helpers ──────────────────────────────────────────────

export async function getUSDTtoRUB(): Promise<number> {
  const rates = await getAllRates();
  return rates["USD"] || 85;
}

export function convertToRUB(
  amount: number,
  currency: string,
  _usdtRate?: number,
): number {
  if (!cachedRates) return amount;
  const display = getDisplayCurrency();
  return convert(amount, currency, display, cachedRates);
}

export function getConversionNote(currency: string): string | null {
  if (currency === "RUB") return null;
  if (["USDT", "USDC"].includes(currency)) return null;
  if (cachedRates && cachedRates[currency]) return null;
  return ` (${currency}, нет курса)`;
}
