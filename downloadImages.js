const fs = require('fs');
const https = require('https');
const path = require('path');

const images = {
  kashmir: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Dal_Lake_Srinagar_Kashmir.jpg',
  goa: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Palolem_Beach_Goa.jpg',
  rajasthan: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Hawa_Mahal_Jaipur.jpg',
  himachal: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Solang_Valley_Manali.jpg',
  kerala: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Houseboats_in_Kerala.jpg',
  japan: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Fushimi_Inari_Taisha_Shrine_Kyoto_Japan.jpg',
  italy: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg',
  bali: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Pura_Ulun_Danu_Bratan_Temple_Bali.jpg',
  'new-york': 'https://upload.wikimedia.org/wikipedia/commons/7/7a/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg',
  paris: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg',
  thailand: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Grand_Palace_Bangkok.jpg',
  dubai: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Dubai_Skylines_at_night_%28Pexels_3764646%29.jpg',
  turkey: 'https://upload.wikimedia.org/wikipedia/commons/1/14/Hagia_Sophia_Mars_2013.jpg',
  greece: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Santorini_Oia.jpg',
  london: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Palace_of_Westminster_from_the_dome_on_Methodist_Central_Hall.jpg',
  tajmahal: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Taj_Mahal_in_March_2004.jpg'
};

function download(url, dest) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    };
    https.get(url, options, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(true)));
      } else if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 308) {
        https.get(res.headers.location, options, (res2) => {
           res2.pipe(file);
           file.on('finish', () => file.close(() => resolve(true)));
        });
      } else {
        file.close();
        fs.unlink(dest, () => resolve(false));
      }
    }).on('error', () => {
      fs.unlink(dest, () => resolve(false));
    });
  });
}

async function run() {
  const dir = path.join(__dirname, 'frontend', 'public', 'images', 'destinations');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  for (const [key, url] of Object.entries(images)) {
    console.log('Downloading', key);
    await download(url, path.join(dir, key + '.jpg'));
    // Small delay to avoid 429
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('Done!');
}

run();
