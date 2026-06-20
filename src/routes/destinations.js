const express = require('express');
const router = express.Router();

const { Redis } = require('@upstash/redis');

let redis;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  redis = {
    get: async () => null,
    set: async () => null
  };
}

// GET /api/destination-photo?city=Bali
router.get('/photo', async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: 'City is required' });

    const cacheKey = `destination-photo:${city.toLowerCase()}`;
    
    let cachedUrl = null;
    try {
      cachedUrl = await redis.get(cacheKey);
    } catch (err) {
      console.warn('Redis get failed (DestinationPhoto), bypassing cache:', err.message);
    }
    
    if (cachedUrl) {
      return res.status(200).json({ url: cachedUrl });
    }

    // Call Pexels API
    const pexelsResponse = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(city + ' landmark city')}&per_page=1&orientation=square`, {
      headers: {
        Authorization: process.env.PEXELS_API_KEY
      }
    });

    let photoUrl = 'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1080&fit=crop'; // Reliable fallback (mountains)
    
    if (pexelsResponse.ok) {
      const data = await pexelsResponse.json();
      if (data.photos && data.photos.length > 0) {
        // Use large2x or large for best resolution for 1080x1080
        photoUrl = data.photos[0].src.large2x || data.photos[0].src.large;
      } else {
        // If 0 results for specific landmark query, try generic travel query
        const fallbackRes = await fetch(`https://api.pexels.com/v1/search?query=travel ${encodeURIComponent(city)}&per_page=1&orientation=square`, {
          headers: { Authorization: process.env.PEXELS_API_KEY }
        });
        if (fallbackRes.ok) {
           const fallbackData = await fallbackRes.json();
           if (fallbackData.photos && fallbackData.photos.length > 0) {
              photoUrl = fallbackData.photos[0].src.large2x || fallbackData.photos[0].src.large;
           }
        }
      }
    } else {
      console.error('Pexels API error:', await pexelsResponse.text());
    }

    // Convert to base64 data URL to completely bypass CORS in html2canvas
    let finalDataUrl = '';
    try {
      const imgRes = await fetch(photoUrl);
      if (imgRes.ok) {
        const arrayBuf = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        finalDataUrl = `data:${imgRes.headers.get('content-type') || 'image/jpeg'};base64,${buffer.toString('base64')}`;
      }
    } catch (e) {
      console.error('Failed to convert image to base64:', e);
    }

    if (!finalDataUrl) {
      console.warn('Failed to convert to base64, returning raw URL');
      return res.status(200).json({ url: photoUrl });
    }
    
    // Store in cache with 24-hour TTL (86400 seconds)
    try {
      await redis.set(cacheKey, finalDataUrl, { ex: 86400 });
    } catch (err) {
      console.warn('Redis set failed (DestinationPhoto):', err.message);
    }

    res.status(200).json({ url: finalDataUrl });
  } catch (error) {
    console.error('Error fetching destination photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

module.exports = router;
