/**
 * Destination Image Map — Curated, verified images for each destination
 * Using LoremFlickr which is highly reliable and does not have connection reset issues or hotlink protection.
 */

// ── Verified LoremFlickr photo URLs ─────────────────────────────────────────────
const DESTINATION_IMAGES = {
  kashmir: 'https://loremflickr.com/800/600/kashmir,landscape/all',
  goa: 'https://loremflickr.com/800/600/goa,beach/all',
  rajasthan: 'https://loremflickr.com/800/600/rajasthan,palace/all',
  himachal: 'https://loremflickr.com/800/600/himachal,mountains/all',
  kerala: 'https://loremflickr.com/800/600/kerala,houseboat/all',
  japan: 'https://loremflickr.com/800/600/japan,kyoto,temple/all',
  italy: 'https://loremflickr.com/800/600/italy,rome,colosseum/all',
  bali: 'https://loremflickr.com/800/600/bali,temple/all',
  'new-york': 'https://loremflickr.com/800/600/newyork,manhattan/all',
  paris: 'https://loremflickr.com/800/600/paris,eiffeltower/all',
  thailand: 'https://loremflickr.com/800/600/thailand,temple/all',
  dubai: 'https://loremflickr.com/800/600/dubai,skyline/all',
  turkey: 'https://loremflickr.com/800/600/turkey,istanbul/all',
  greece: 'https://loremflickr.com/800/600/greece,santorini/all',
  london: 'https://loremflickr.com/800/600/london,bigben/all',
};

// ── City-level images (for stop cards) ───────────────────────────────────────
const CITY_IMAGES = {
  srinagar: DESTINATION_IMAGES.kashmir,
  gulmarg: DESTINATION_IMAGES.kashmir,
  pahalgam: DESTINATION_IMAGES.kashmir,
  sonamarg: DESTINATION_IMAGES.kashmir,
  'north goa': DESTINATION_IMAGES.goa,
  'south goa': DESTINATION_IMAGES.goa,
  jaipur: DESTINATION_IMAGES.rajasthan,
  jodhpur: DESTINATION_IMAGES.rajasthan,
  udaipur: DESTINATION_IMAGES.rajasthan,
  jaisalmer: DESTINATION_IMAGES.rajasthan,
  pushkar: DESTINATION_IMAGES.rajasthan,
  shimla: DESTINATION_IMAGES.himachal,
  manali: DESTINATION_IMAGES.himachal,
  kasol: DESTINATION_IMAGES.himachal,
  kufri: DESTINATION_IMAGES.himachal,
  kochi: DESTINATION_IMAGES.kerala,
  munnar: DESTINATION_IMAGES.kerala,
  alleppey: DESTINATION_IMAGES.kerala,
  kovalam: DESTINATION_IMAGES.kerala,
  agra: 'https://loremflickr.com/800/600/tajmahal,india/all', // Taj Mahal

  tokyo: DESTINATION_IMAGES.japan,
  kyoto: DESTINATION_IMAGES.japan,
  osaka: DESTINATION_IMAGES.japan,
  hakone: DESTINATION_IMAGES.japan,
  takayama: DESTINATION_IMAGES.japan,
  kanazawa: DESTINATION_IMAGES.japan,
  hiroshima: DESTINATION_IMAGES.japan,

  rome: DESTINATION_IMAGES.italy,
  florence: DESTINATION_IMAGES.italy,
  venice: DESTINATION_IMAGES.italy,
  paris: DESTINATION_IMAGES.paris,
  versailles: DESTINATION_IMAGES.paris,
  london: DESTINATION_IMAGES.london,
  oxford: DESTINATION_IMAGES.london,
  edinburgh: DESTINATION_IMAGES.london,
  bath: DESTINATION_IMAGES.london,
  santorini: DESTINATION_IMAGES.greece,
  athens: DESTINATION_IMAGES.greece,
  mykonos: DESTINATION_IMAGES.greece,
  crete: DESTINATION_IMAGES.greece,

  bali: DESTINATION_IMAGES.bali,
  ubud: DESTINATION_IMAGES.bali,
  seminyak: DESTINATION_IMAGES.bali,
  uluwatu: DESTINATION_IMAGES.bali,
  'nusa penida': DESTINATION_IMAGES.bali,
  bangkok: DESTINATION_IMAGES.thailand,
  phuket: DESTINATION_IMAGES.thailand,
  'chiang mai': DESTINATION_IMAGES.thailand,
  'koh samui': DESTINATION_IMAGES.thailand,

  dubai: DESTINATION_IMAGES.dubai,
  'abu dhabi': DESTINATION_IMAGES.dubai,
  istanbul: DESTINATION_IMAGES.turkey,
  cappadocia: DESTINATION_IMAGES.turkey,

  'new york': DESTINATION_IMAGES['new-york'],
  manhattan: DESTINATION_IMAGES['new-york'],
  brooklyn: DESTINATION_IMAGES['new-york'],
};

/**
 * Get the hero/cover image for a destination by its route ID (e.g. 'kashmir', 'goa', 'japan')
 */
export function getDestinationImage(destId) {
  return DESTINATION_IMAGES[destId] || `https://loremflickr.com/800/600/${destId},landscape/all`;
}

/**
 * Get an image for a specific city name (e.g. 'Srinagar', 'North Goa', 'Tokyo')
 */
export function getCityImageUrl(cityName, country = '') {
  if (!cityName) return `https://loremflickr.com/800/600/travel/all`;

  const key = cityName.toLowerCase().trim();

  // Direct match
  if (CITY_IMAGES[key]) return CITY_IMAGES[key];

  // Try destination-level match
  if (DESTINATION_IMAGES[key]) return DESTINATION_IMAGES[key];

  // Fallback
  const seed = encodeURIComponent(key);
  return `https://loremflickr.com/800/600/${seed},city/all`;
}

/**
 * Pre-warm cache for stops
 */
export function prewarmImageCache(stops) {
  // No-op
}

export function clearImageCache() {
  // No-op
}
