/** Mirrors backend/src/config.ts. Currency is derived from country, same as on the server. */
export const COUNTRY_CURRENCY: Record<string, string> = {
  India: 'INR',
  'United States': 'USD',
  'United Kingdom': 'GBP',
  Germany: 'EUR',
  France: 'EUR',
  Singapore: 'SGD',
  Australia: 'AUD',
  Canada: 'CAD',
};
export const COUNTRY_NAMES = Object.keys(COUNTRY_CURRENCY);
