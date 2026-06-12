/**
 * Destination Image Map — Curated, verified images for each destination
 * Using LoremFlickr which is highly reliable and does not have connection reset issues or hotlink protection.
 */

// ── Verified LoremFlickr photo URLs ─────────────────────────────────────────────
const DESTINATION_IMAGES = {
  kashmir: 'https://picsum.photos/seed/kashmir/800/600',
  goa: 'https://picsum.photos/seed/goa/800/600',
  rajasthan: 'https://picsum.photos/seed/rajasthan/800/600',
  himachal: 'https://picsum.photos/seed/himachal/800/600',
  kerala: 'https://picsum.photos/seed/kerala/800/600',
  japan: 'https://picsum.photos/seed/japan/800/600',
  italy: 'https://picsum.photos/seed/italy/800/600',
  bali: 'https://picsum.photos/seed/bali/800/600',
  'new-york': 'https://picsum.photos/seed/newyork/800/600',
  paris: 'https://picsum.photos/seed/paris/800/600',
  thailand: 'https://picsum.photos/seed/thailand/800/600',
  dubai: 'https://picsum.photos/seed/dubai/800/600',
  turkey: 'https://picsum.photos/seed/turkey/800/600',
  greece: 'https://picsum.photos/seed/greece/800/600',
  london: 'https://picsum.photos/seed/london/800/600',
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
  agra: 'https://picsum.photos/seed/agra/800/600', // Taj Mahal

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
  return DESTINATION_IMAGES[destId] || `https://picsum.photos/seed/${destId}/800/600`;
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
  return `https://picsum.photos/seed/${seed}/800/600`;
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
