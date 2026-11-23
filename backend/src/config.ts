/** Country -> currency. Currency is derived from country so the two can never disagree. */
export const COUNTRIES: Record<string, string> = {
  India: 'INR',
  'United States': 'USD',
  'United Kingdom': 'GBP',
  Germany: 'EUR',
  France: 'EUR',
  Singapore: 'SGD',
  Australia: 'AUD',
  Canada: 'CAD',
};

export const COUNTRY_NAMES = Object.keys(COUNTRIES) as [string, ...string[]];

/** Static exchange rates (1 unit of currency in USD). Static on purpose: deterministic and offline. */
export const FX_TO_USD: Record<string, number> = {
  USD: 1,
  INR: 0.012,
  GBP: 1.27,
  EUR: 1.08,
  SGD: 0.74,
  AUD: 0.66,
  CAD: 0.73,
};

export const MAX_PAGE_SIZE = 100;
