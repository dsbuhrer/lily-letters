import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');

const assets = [
  // Product gallery (Etsy CDN)
  ...[
    [1, 'https://i.etsystatic.com/58295093/r/il/b60a90/8014611280/il_794xN.8014611280_m31w.jpg'],
    [1, 'https://i.etsystatic.com/58295093/r/il/4d470e/8014611250/il_794xN.8014611250_swr4.jpg'],
    [1, 'https://i.etsystatic.com/58295093/r/il/7b0dc7/8062522389/il_794xN.8062522389_5b42.jpg'],
    [2, 'https://i.etsystatic.com/58295093/r/il/35a21d/8066502411/il_794xN.8066502411_osoc.jpg'],
    [2, 'https://i.etsystatic.com/58295093/r/il/abf5e8/8066502409/il_794xN.8066502409_1y16.jpg'],
    [2, 'https://i.etsystatic.com/58295093/r/il/932dfa/8066502417/il_794xN.8066502417_w9uz.jpg'],
    [2, 'https://i.etsystatic.com/58295093/r/il/6d123e/8018583874/il_794xN.8018583874_t1du.jpg'],
    [3, 'https://i.etsystatic.com/58295093/r/il/dd1ad9/8074009253/il_794xN.8074009253_7pq6.jpg'],
    [3, 'https://i.etsystatic.com/58295093/r/il/f5e29a/8074009203/il_794xN.8074009203_bscq.jpg'],
    [3, 'https://i.etsystatic.com/58295093/r/il/72ac80/8026096560/il_794xN.8026096560_q8jj.jpg'],
    [4, 'https://i.etsystatic.com/58295093/r/il/608f0f/8082291807/il_794xN.8082291807_taza.jpg'],
    [4, 'https://i.etsystatic.com/58295093/r/il/a9b345/8034378088/il_794xN.8034378088_n3ou.jpg'],
    [4, 'https://i.etsystatic.com/58295093/r/il/b4f702/8082291801/il_794xN.8082291801_qedc.jpg'],
    [5, 'https://i.etsystatic.com/58295093/r/il/07f068/7400927159/il_794xN.7400927159_ej4j.jpg'],
    [5, 'https://i.etsystatic.com/58295093/r/il/f23bbd/7400927161/il_794xN.7400927161_s1uk.jpg'],
    [5, 'https://i.etsystatic.com/58295093/r/il/82c0cb/7352995054/il_794xN.7352995054_b6he.jpg'],
    [5, 'https://i.etsystatic.com/58295093/r/il/31ea47/7400927143/il_794xN.7400927143_lcoz.jpg'],
    [6, 'https://i.etsystatic.com/58295093/r/il/8ce397/7755880216/il_794xN.7755880216_6jd3.jpg'],
    [6, 'https://i.etsystatic.com/58295093/r/il/49e75a/7803827233/il_794xN.7803827233_1dty.jpg'],
    [6, 'https://i.etsystatic.com/58295093/r/il/73bab0/7803827247/il_794xN.7803827247_f3jl.jpg'],
    [6, 'https://i.etsystatic.com/58295093/r/il/fd44e6/7803827231/il_794xN.7803827231_ft9o.jpg'],
    [7, 'https://i.etsystatic.com/58295093/r/il/27f396/7806778531/il_794xN.7806778531_t79r.jpg'],
    [7, 'https://i.etsystatic.com/58295093/r/il/59920f/7758831394/il_794xN.7758831394_gk9a.jpg'],
    [7, 'https://i.etsystatic.com/58295093/r/il/058485/7806778509/il_794xN.7806778509_g6ob.jpg'],
    [7, 'https://i.etsystatic.com/58295093/r/il/789b49/7806778521/il_794xN.7806778521_8hlp.jpg'],
    [8, 'https://i.etsystatic.com/58295093/r/il/8f4991/7201196252/il_794xN.7201196252_gjlu.jpg'],
    [8, 'https://i.etsystatic.com/58295093/r/il/c41cb2/7201196270/il_794xN.7201196270_d03o.jpg'],
    [8, 'https://i.etsystatic.com/58295093/r/il/b34e5d/7201196364/il_794xN.7201196364_aeyj.jpg'],
    [8, 'https://i.etsystatic.com/58295093/r/il/b9dd2e/7201196324/il_794xN.7201196324_arnz.jpg'],
  ].map(([productId, url], _, arr) => {
    const indexInProduct = arr.filter(([id]) => id === productId).findIndex(([, u]) => u === url);
    const file = `${String(indexInProduct + 1).padStart(2, '0')}.jpg`;
    return { url, dest: `images/products/${productId}/${file}` };
  }),

  // Home page
  { url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1600&q=85', dest: 'images/home/hero.jpg' },
  { url: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=1600&q=80', dest: 'images/home/brand-story.jpg' },
  { url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=100&h=100&fit=crop', dest: 'images/home/testimonial-1.jpg' },
  { url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=100&h=100&fit=crop', dest: 'images/home/testimonial-2.jpg' },
  { url: 'https://images.unsplash.com/photo-1511285605577-4d62fb50d2f7?w=100&h=100&fit=crop', dest: 'images/home/testimonial-3.jpg' },

  // About page
  { url: 'https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=700&q=80', dest: 'images/about/story-flatlay.jpg' },

  // Blog seed default hero
  { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80', dest: 'images/blog/hero-default.jpg' },
];

async function download(url, destPath) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'LilyLetters-Asset-Migration/1.0' },
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buf);
  return buf.length;
}

let ok = 0;
let fail = 0;

for (const { url, dest } of assets) {
  const destPath = path.join(publicDir, dest);
  try {
    const bytes = await download(url, destPath);
    console.log(`✓ ${dest} (${(bytes / 1024).toFixed(1)} KB)`);
    ok += 1;
  } catch (err) {
    console.error(`✗ ${dest}: ${err.message}`);
    fail += 1;
  }
}

console.log(`\nDone: ${ok} downloaded, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
