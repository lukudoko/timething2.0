import cache from 'memory-cache';

const CACHE_KEY = 'energyPricesSE3';
const CACHE_EXPIRY = 60 * 60 * 1000; 

const REGION = 'SE3';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const cached = cache.get(CACHE_KEY);
  if (cached) {
    return res.status(200).json(cached);
  }

  try {
    const response = await fetch('https://mgrey.se/espot?format=json');
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);

    const data = await response.json();
    const regionData = data[REGION];

    if (!regionData?.length) {
      throw new Error(`No data for ${REGION}`);
    }

    const currentHour = new Date().getHours();
    const currentEntry = regionData.find(e => e.hour === currentHour) || regionData[0];

    const priceOre = currentEntry.price_sek;
    const priceSek = priceOre / 100;

    const isNegative = priceSek < 0;

    let level = 'normal';
    if (isNegative) level = 'negative';      

    else if (priceSek < 0.15) level = 'low';    

    else if (priceSek > 0.80) level = 'high';   

    const display = isNegative
      ? `−${Math.abs(priceSek).toFixed(2)} kr`
      : `${priceSek.toFixed(2)} kr`;

    const result = {
      current: {
        hour: currentHour,
        priceSek,
        isNegative,
        level,
        display
      },
      region: REGION,
      lastUpdated: new Date().toISOString()
    };

    cache.put(CACHE_KEY, result, CACHE_EXPIRY);
    return res.status(200).json(result);

  } catch (error) {
    console.error('Energy API error:', error);

    const stale = cache.get(CACHE_KEY);
    if (stale) {
      return res.status(200).json({ ...stale, isStale: true });
    }

    return res.status(500).json({ error: 'Failed to fetch energy prices' });
  }
}