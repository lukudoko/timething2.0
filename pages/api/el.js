import cache from 'memory-cache';

const CACHE_KEY = 'energyPricesSE3';
const CACHE_EXPIRY = 15 * 60 * 1000;
const REGION = 'SE3';

const getLevel = (priceSek) => {
  if (priceSek < 0)    return 'negative';
  if (priceSek < 0.15) return 'low';
  if (priceSek > 0.80) return 'high';
  return 'normal';
};

const formatDisplay = (priceSek) => {
  const abs = Math.abs(priceSek).toFixed(2);
  return (priceSek < 0 && abs !== '0.00') ? `−${abs} kr` : `${abs} kr`;
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=60');

  const cached = cache.get(CACHE_KEY);
  if (cached) return res.status(200).json(cached);

  try {
    const response = await fetch('https://mgrey.se/espot?format=json');
    if (!response.ok) throw new Error(`Upstream error: ${response.statusText}`);

    const data = await response.json();
    const entry = data[REGION]?.[0];
    if (!entry) throw new Error(`No data for ${REGION}`);

    const priceSek = entry.price_sek/100;
    const result = {
      current: {
        hour: entry.hour,
        priceSek,
        level: getLevel(priceSek),
        display: formatDisplay(priceSek),
      },
      region: REGION,
      lastUpdated: new Date().toISOString(),
    };

    cache.put(CACHE_KEY, result, CACHE_EXPIRY);
    return res.status(200).json(result);

  } catch (error) {
    console.error('Energy API error:', error);
    const stale = cache.get(CACHE_KEY);
    if (stale) return res.status(200).json({ ...stale, isStale: true });
    return res.status(500).json({ error: 'Failed to fetch energy prices' });
  }
}