/**
 * Destination Image Map — Curated, verified images for each destination
 * Using LoremFlickr which is highly reliable and does not have connection reset issues or hotlink protection.
 */

// ── Verified LoremFlickr photo URLs ─────────────────────────────────────────────
const DESTINATION_IMAGES = {
  kashmir: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80',
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
  rajasthan: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
  himachal: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
  kerala: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
  japan: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  italy: 'https://images.unsplash.com/photo-1515542622106-78b28af78158?auto=format&fit=crop&w=800&q=80',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
  'new-york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  paris: 'https://images.unsplash.com/photo-1502602898657-3e907614f092?auto=format&fit=crop&w=800&q=80',
  thailand: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80',
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
  turkey: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
  greece: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
  london: 'https://images.unsplash.com/photo-1513635269975-5969336cd100?auto=format&fit=crop&w=800&q=80',
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
