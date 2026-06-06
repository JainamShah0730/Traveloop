/**
 * Packing Templates — Auto-generate packing lists based on trip destination.
 *
 * Each template has:
 *  - tags: destination keywords to match against trip city names
 *  - categories: grouped items with must-have / suggested flags
 *
 * THE SINGLE RULE: NO hardcoded items anywhere in the component.
 * ALL items come from PACKING_TEMPLATES[matchedKey].categories.
 */

const PACKING_TEMPLATES = {
  cold_mountain: {
    tags: ['kashmir','manali','leh','shimla','spiti','kedarnath','mussoorie','srinagar','gulmarg','pahalgam','sonamarg','ladakh','kufri','kasol','nainital','darjeeling'],
    categories: [
      {
        id: 'clothing', name: 'Clothing', icon: 'shirt',
        items: [
          { id: 'thermal_top', name: 'Thermal top', must: true },
          { id: 'thermal_bottom', name: 'Thermal bottoms', must: true },
          { id: 'heavy_jacket', name: 'Heavy winter jacket', must: true },
          { id: 'woollen_socks', name: 'Woollen socks (x4 pairs)', must: true },
          { id: 'gloves', name: 'Gloves', must: true },
          { id: 'beanie', name: 'Beanie / warm cap', must: true },
          { id: 'snow_boots', name: 'Snow boots / trekking shoes', must: true },
          { id: 'fleece', name: 'Fleece mid-layer', must: false },
          { id: 'scarf', name: 'Scarf / neck warmer', must: false },
          { id: 'waterproof_pants', name: 'Waterproof trousers', must: false },
        ]
      },
      {
        id: 'documents', name: 'Documents', icon: 'id',
        items: [
          { id: 'govt_id', name: 'Government ID / Passport', must: true },
          { id: 'permit', name: 'Inner Line Permit (Leh/Ladakh)', must: true },
          { id: 'hotel_print', name: 'Hotel booking printout', must: true },
          { id: 'insurance', name: 'Travel insurance', must: false },
          { id: 'emergency_contacts', name: 'Emergency contacts printout', must: false },
        ]
      },
      {
        id: 'health', name: 'Health & Meds', icon: 'first-aid-kit',
        items: [
          { id: 'diamox', name: 'Diamox (altitude sickness tablets)', must: true },
          { id: 'lip_balm', name: 'SPF lip balm', must: true },
          { id: 'sunscreen', name: 'Sunscreen SPF 50+', must: true },
          { id: 'pain_killer', name: 'Painkillers', must: true },
          { id: 'cold_meds', name: 'Cold & flu medicine', must: true },
          { id: 'electrolytes', name: 'ORS / electrolyte sachets', must: false },
          { id: 'hand_warmer', name: 'Hand warmers (disposable)', must: false },
          { id: 'bandages', name: 'Bandages & antiseptic', must: false },
        ]
      },
      {
        id: 'gear', name: 'Gear', icon: 'backpack',
        items: [
          { id: 'daypack', name: 'Daypack / small backpack', must: true },
          { id: 'water_bottle', name: 'Insulated water bottle', must: true },
          { id: 'powerbank', name: 'Power bank (20000mAh+)', must: true },
          { id: 'torch', name: 'Torch / headlamp', must: false },
          { id: 'trekking_pole', name: 'Trekking poles', must: false },
          { id: 'sleeping_bag', name: 'Sleeping bag liner', must: false },
        ]
      },
      {
        id: 'electronics', name: 'Electronics', icon: 'device-mobile',
        items: [
          { id: 'charger', name: 'Phone charger + cable', must: true },
          { id: 'adapter', name: 'Universal power adapter', must: false },
          { id: 'offline_maps', name: 'Offline maps downloaded', must: true },
          { id: 'camera', name: 'Camera + memory card', must: false },
          { id: 'earphones', name: 'Earphones', must: false },
        ]
      },
      {
        id: 'toiletries', name: 'Toiletries', icon: 'droplet',
        items: [
          { id: 'moisturizer', name: 'Heavy moisturizer', must: true },
          { id: 'toothbrush', name: 'Toothbrush & toothpaste', must: true },
          { id: 'deodorant', name: 'Deodorant', must: true },
          { id: 'wet_wipes', name: 'Wet wipes', must: false },
        ]
      }
    ]
  },

  beach_tropical: {
    tags: ['kerala','goa','andaman','pondicherry','lakshadweep','vizag','mangalore','kochi','munnar','alleppey','kovalam','north goa','south goa'],
    categories: [
      {
        id: 'clothing', name: 'Clothing', icon: 'shirt',
        items: [
          { id: 'light_tshirts', name: 'Light t-shirts (x4)', must: true },
          { id: 'shorts', name: 'Shorts / light trousers', must: true },
          { id: 'swimwear', name: 'Swimwear', must: true },
          { id: 'flip_flops', name: 'Flip flops', must: true },
          { id: 'light_jacket', name: 'Light jacket (evenings)', must: false },
          { id: 'sun_hat', name: 'Sun hat / cap', must: false },
          { id: 'coverup', name: 'Beach cover-up', must: false },
        ]
      },
      {
        id: 'documents', name: 'Documents', icon: 'id',
        items: [
          { id: 'govt_id', name: 'Government ID', must: true },
          { id: 'hotel_booking', name: 'Hotel booking', must: true },
          { id: 'insurance', name: 'Travel insurance', must: false },
        ]
      },
      {
        id: 'health', name: 'Health & Meds', icon: 'first-aid-kit',
        items: [
          { id: 'sunscreen', name: 'Sunscreen SPF 50+', must: true },
          { id: 'insect_repellent', name: 'Insect repellent', must: true },
          { id: 'ors', name: 'ORS sachets', must: false },
          { id: 'seasick', name: 'Sea-sickness tablets', must: false },
          { id: 'antifungal', name: 'Antifungal powder (humidity)', must: false },
          { id: 'bandages', name: 'Bandages & antiseptic', must: false },
        ]
      },
      {
        id: 'gear', name: 'Gear', icon: 'backpack',
        items: [
          { id: 'waterproof_bag', name: 'Waterproof dry bag', must: true },
          { id: 'water_bottle', name: 'Water bottle', must: true },
          { id: 'snorkel', name: 'Snorkel mask', must: false },
          { id: 'powerbank', name: 'Power bank', must: false },
          { id: 'underwater_pouch', name: 'Underwater phone pouch', must: false },
        ]
      },
      {
        id: 'toiletries', name: 'Toiletries', icon: 'droplet',
        items: [
          { id: 'toothbrush', name: 'Toothbrush & toothpaste', must: true },
          { id: 'shampoo', name: 'Shampoo & conditioner', must: true },
          { id: 'after_sun', name: 'After-sun lotion', must: false },
        ]
      }
    ]
  },

  city_international: {
    tags: ['dubai','rome','paris','london','newyork','tokyo','singapore','bangkok','bali','new york','barcelona','amsterdam','berlin','zurich','sydney','melbourne','istanbul'],
    categories: [
      {
        id: 'documents', name: 'Documents', icon: 'id',
        items: [
          { id: 'passport', name: 'Passport (valid 6+ months)', must: true },
          { id: 'visa', name: 'Visa / e-visa printout', must: true },
          { id: 'forex', name: 'Foreign currency / travel card', must: true },
          { id: 'insurance', name: 'Travel insurance', must: true },
          { id: 'hotel_booking', name: 'Hotel booking printout', must: true },
          { id: 'return_ticket', name: 'Return flight ticket', must: true },
          { id: 'vaccine_cert', name: 'Vaccination certificate (if required)', must: false },
        ]
      },
      {
        id: 'clothing', name: 'Clothing', icon: 'shirt',
        items: [
          { id: 'smart_casual', name: 'Smart casual outfits (x3)', must: true },
          { id: 'comfortable_shoes', name: 'Comfortable walking shoes', must: true },
          { id: 'formal', name: 'One formal outfit', must: false },
          { id: 'light_jacket', name: 'Light jacket', must: false },
          { id: 'underwear', name: 'Underwear (x5)', must: true },
          { id: 'socks', name: 'Socks (x5 pairs)', must: true },
        ]
      },
      {
        id: 'electronics', name: 'Electronics', icon: 'device-mobile',
        items: [
          { id: 'travel_adapter', name: 'Universal travel adapter', must: true },
          { id: 'charger', name: 'Phone charger', must: true },
          { id: 'powerbank', name: 'Power bank', must: true },
          { id: 'earphones', name: 'Earphones / noise-cancelling', must: false },
          { id: 'camera', name: 'Camera', must: false },
        ]
      },
      {
        id: 'health', name: 'Health & Meds', icon: 'first-aid-kit',
        items: [
          { id: 'basic_meds', name: 'Basic medicines', must: true },
          { id: 'hand_sanitizer', name: 'Hand sanitizer', must: false },
          { id: 'sunscreen', name: 'Sunscreen', must: false },
          { id: 'prescription', name: 'Prescription medicines + letter', must: false },
        ]
      },
      {
        id: 'toiletries', name: 'Toiletries', icon: 'droplet',
        items: [
          { id: 'toothbrush', name: 'Toothbrush & toothpaste', must: true },
          { id: 'razor', name: 'Razor / shaving kit', must: false },
          { id: 'deodorant', name: 'Deodorant', must: true },
          { id: 'travel_sizes', name: 'Travel-size toiletries (100ml for flights)', must: true },
        ]
      },
      {
        id: 'gear', name: 'Gear', icon: 'backpack',
        items: [
          { id: 'daypack', name: 'Daypack for sightseeing', must: false },
          { id: 'luggage_lock', name: 'TSA-approved luggage lock', must: true },
          { id: 'neck_pillow', name: 'Neck pillow (for long flights)', must: false },
          { id: 'eye_mask', name: 'Eye mask & earplugs', must: false },
        ]
      }
    ]
  },

  domestic_city: {
    tags: ['mumbai','delhi','bangalore','hyderabad','chennai','kolkata','pune','jaipur','ahmedabad','surat','jodhpur','udaipur','jaisalmer','pushkar','agra','varanasi','rajasthan'],
    categories: [
      {
        id: 'documents', name: 'Documents', icon: 'id',
        items: [
          { id: 'govt_id', name: 'Government ID', must: true },
          { id: 'hotel_booking', name: 'Hotel booking', must: true },
          { id: 'train_tickets', name: 'Train / bus tickets', must: true },
        ]
      },
      {
        id: 'clothing', name: 'Clothing', icon: 'shirt',
        items: [
          { id: 'outfits', name: 'Casual outfits (x3)', must: true },
          { id: 'comfortable_shoes', name: 'Comfortable shoes', must: true },
          { id: 'formal', name: 'One formal outfit', must: false },
          { id: 'underwear', name: 'Underwear (x4)', must: true },
        ]
      },
      {
        id: 'electronics', name: 'Electronics', icon: 'device-mobile',
        items: [
          { id: 'charger', name: 'Phone charger', must: true },
          { id: 'powerbank', name: 'Power bank', must: false },
          { id: 'earphones', name: 'Earphones', must: false },
        ]
      },
      {
        id: 'health', name: 'Health & Meds', icon: 'first-aid-kit',
        items: [
          { id: 'basic_meds', name: 'Basic medicines', must: true },
          { id: 'hand_sanitizer', name: 'Hand sanitizer', must: false },
        ]
      },
      {
        id: 'toiletries', name: 'Toiletries', icon: 'droplet',
        items: [
          { id: 'toothbrush', name: 'Toothbrush & toothpaste', must: true },
          { id: 'deodorant', name: 'Deodorant', must: true },
          { id: 'moisturizer', name: 'Moisturizer', must: false },
        ]
      }
    ]
  }
};

/**
 * Find the best matching packing template for a trip.
 * Checks all stop city names + the trip name against template tags.
 *
 * @param {Object} trip - Trip object with name, stops[]
 * @returns {Object} Matching template (defaults to city_international)
 */
export function getTemplateForTrip(trip) {
  const allCities = (trip?.stops || []).map(s => (s.city_name || '').toLowerCase());
  const tripName = (trip?.name || '').toLowerCase();
  const searchStr = [tripName, ...allCities].join(' ');

  for (const [, tmpl] of Object.entries(PACKING_TEMPLATES)) {
    if (tmpl.tags.some(tag => searchStr.includes(tag))) {
      return tmpl;
    }
  }

  return PACKING_TEMPLATES.city_international;
}

export default PACKING_TEMPLATES;
