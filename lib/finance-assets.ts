export const CRYPTO_ICONS: Record<string, string> = {
  BTC: "/icon-btc.webp",
  ETH: "/icon-eth.webp",
  SOL: "/icon-sol.webp",
  BNB: "/icon-bnb.webp",
  GRAM: "/Gram Circular Badge.svg",
  TON: "/Gram Circular Badge.svg",
  TRX: "/trx.png",
  USDT: "/usdt.png",
  USDC: "/usdc.jpg",
  PUSD: "/PUSD.avif",
};

export const FIAT_ICONS: Record<string, string> = {
  RUB: "/рубль.png",
  USD: "/usd.png",
};

export function getAssetIcon(code: string): string | undefined {
  return CRYPTO_ICONS[code] || FIAT_ICONS[code];
}
