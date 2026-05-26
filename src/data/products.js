export const categories = [
  { id: 'all', label: 'All Templates', group: null },

  // Wedding Collections
  { id: 'wedding-invitation', label: 'Wedding Invitation', group: 'WEDDING COLLECTIONS' },
  { id: 'wedding-table-signs', label: 'Wedding Table Signs', group: 'WEDDING COLLECTIONS' },
  { id: 'wedding-extras', label: 'Wedding Extras', group: 'WEDDING COLLECTIONS' },
  { id: 'save-the-date', label: 'Save the Date', group: 'WEDDING COLLECTIONS' },
  { id: 'bridal-shower-invite', label: 'Bridal Shower Invite', group: 'WEDDING COLLECTIONS' },
  { id: 'bridal-shower-extras', label: 'Bridal Shower Extras', group: 'WEDDING COLLECTIONS' },
  { id: 'baby-shower-invite', label: 'Baby Shower Invite', group: 'WEDDING COLLECTIONS' },
  { id: 'baby-shower-extras', label: 'Baby Shower Extras', group: 'WEDDING COLLECTIONS' },

  // Christmas Collection
  { id: 'christmas-invitation', label: 'Christmas Invitation', group: 'CHRISTMAS COLLECTION' },
  { id: 'christmas-extras', label: 'Christmas Extras', group: 'CHRISTMAS COLLECTION' },

  // Seasonal Collections
  { id: 'bachelorette-invite', label: 'Bachelorette Invite', group: 'SEASONAL COLLECTIONS' },
];

export const products = [
  // ─── Product 1: Wedding Thank You Card (Grand Palais Collection) ───────────
  {
    id: 1,
    etsyId: '4504345272',
    etsyUrl: 'https://www.etsy.com/listing/4504345272/',
    name: 'Wedding Thank You Card Template',
    subtitle: 'Grand Palais Collection — Minimalist Burgundy',
    category: 'wedding-extras',
    price: 7.00,
    originalPrice: null,
    badge: null,
    rating: 5.0,
    reviews: 5,
    description:
      'This burgundy wedding thank you card template is made for a formal and timeless celebration. The deep red color and classic layout create a look that feels traditional, refined, and quietly luxurious. Inspired by old money style weddings, this card is perfect for black-tie events, church ceremonies, ballroom receptions, and elegant estate venues.',
    includes: [
      'Thank You Card (front and back) — 3.5×5 in',
      'Instructions & FAQ PDF',
    ],
    canvaLink: 'https://canva.com/template',
    images: [
      'https://i.etsystatic.com/58295093/r/il/b60a90/8014611280/il_794xN.8014611280_m31w.jpg',
      'https://i.etsystatic.com/58295093/r/il/4d470e/8014611250/il_794xN.8014611250_swr4.jpg',
      'https://i.etsystatic.com/58295093/r/il/7b0dc7/8062522389/il_794xN.8062522389_5b42.jpg',
    ],
    tags: ['thank-you', 'burgundy', 'old-money', 'elegant', 'minimalist'],
    colors: ['Burgundy', 'Cream', 'Black'],
    editableIn: 'Canva',
    instant: true,
    collection: 'Grand Palais',
  },

  // ─── Product 2: Guest Book Wedding Sign (Grand Palais Collection) ──────────
  {
    id: 2,
    etsyId: '4504978940',
    etsyUrl: 'https://www.etsy.com/listing/4504978940/',
    name: 'Guest Book Wedding Sign',
    subtitle: 'Grand Palais Collection — Luxury Old Money',
    category: 'wedding-table-signs',
    price: 7.00,
    originalPrice: null,
    badge: null,
    rating: 5.0,
    reviews: 5,
    description:
      'This burgundy wedding table sign template is made for a formal and timeless celebration. Inspired by old money style weddings, this guestbook sign is perfect for rehearsal dinners, black-tie events, church ceremonies, ballroom receptions, and elegant estate venues.',
    includes: [
      'Guestbook Table Sign — 8×10 in',
      'Guestbook Table Sign — 5×7 in',
      'Guestbook Table Sign — 4×6 in',
      'Instructions & FAQ PDF',
    ],
    canvaLink: 'https://canva.com/template',
    images: [
      'https://i.etsystatic.com/58295093/r/il/35a21d/8066502411/il_794xN.8066502411_osoc.jpg',
      'https://i.etsystatic.com/58295093/r/il/abf5e8/8066502409/il_794xN.8066502409_1y16.jpg',
      'https://i.etsystatic.com/58295093/r/il/932dfa/8066502417/il_794xN.8066502417_w9uz.jpg',
      'https://i.etsystatic.com/58295093/r/il/6d123e/8018583874/il_794xN.8018583874_t1du.jpg',
    ],
    tags: ['guest-book', 'sign', 'burgundy', 'old-money', 'wedding-decor'],
    colors: ['Burgundy', 'Cream', 'Black'],
    editableIn: 'Canva',
    instant: true,
    collection: 'Grand Palais',
  },

  // ─── Product 3: Sage Green Seating Chart (Secret Garden Collection) ─────────
  {
    id: 3,
    etsyId: '4506132420',
    etsyUrl: 'https://www.etsy.com/listing/4506132420/',
    name: 'Sage Green Seating Chart Template',
    subtitle: 'Secret Garden Collection — Alphabetical',
    category: 'wedding-table-signs',
    price: 8.00,
    originalPrice: null,
    badge: 'New',
    rating: 5.0,
    reviews: 5,
    description:
      'This elegant, classy, and timeless sage green floral alphabetical seating plan was created for those who love the delicate vintage garden aesthetics. All line art is hand-drawn to bring a touch of art to your special day. Available in portrait and landscape orientations, in multiple sizes.',
    includes: [
      'Alphabetical Seating Chart (portrait) — 6 sizes: 24×36, 20×30, 18×24, 16×20 in, A1, A2',
      'Alphabetical Seating Chart (landscape) — 6 sizes',
      'Instructions & FAQ PDF',
    ],
    canvaLink: 'https://canva.com/template',
    images: [
      'https://i.etsystatic.com/58295093/r/il/dd1ad9/8074009253/il_794xN.8074009253_7pq6.jpg',
      'https://i.etsystatic.com/58295093/r/il/f5e29a/8074009203/il_794xN.8074009203_bscq.jpg',
      'https://i.etsystatic.com/58295093/r/il/72ac80/8026096560/il_794xN.8026096560_q8jj.jpg',
    ],
    tags: ['seating-chart', 'sage-green', 'hand-drawn', 'vintage', 'garden'],
    colors: ['Sage Green', 'Cream', 'Warm Gold'],
    editableIn: 'Canva',
    instant: true,
    collection: 'Secret Garden',
  },

  // ─── Product 4: Rehearsal Dinner Welcome Sign (Secret Garden Collection) ────
  {
    id: 4,
    etsyId: '4507430806',
    etsyUrl: 'https://www.etsy.com/listing/4507430806/',
    name: 'The Night Before — Rehearsal Dinner Sign',
    subtitle: 'Secret Garden Collection — Sage Green Vintage',
    category: 'wedding-extras',
    price: 8.00,
    originalPrice: null,
    badge: null,
    rating: 5.0,
    reviews: 5,
    description:
      'This elegant, classy, and timeless sage green floral Welcome Sign was created for those who love the delicate vintage garden aesthetics. All line art is hand-drawn to bring a touch of art to your rehearsal dinner or the night before celebration. Available in multiple sizes.',
    includes: [
      'Rehearsal Welcome Sign (portrait) — 6 sizes: 24×36, 20×30, 18×24, 16×20 in, A1, A2',
      'Instructions & FAQ PDF',
    ],
    canvaLink: 'https://canva.com/template',
    images: [
      'https://i.etsystatic.com/58295093/r/il/608f0f/8082291807/il_794xN.8082291807_taza.jpg',
      'https://i.etsystatic.com/58295093/r/il/a9b345/8034378088/il_794xN.8034378088_n3ou.jpg',
      'https://i.etsystatic.com/58295093/r/il/b4f702/8082291801/il_794xN.8082291801_qedc.jpg',
    ],
    tags: ['rehearsal-dinner', 'welcome-sign', 'sage-green', 'hand-drawn', 'night-before'],
    colors: ['Sage Green', 'Cream', 'Warm Gold'],
    editableIn: 'Canva',
    instant: true,
    collection: 'Secret Garden',
  },

  // ─── Product 5: Wedding Menu Template (Vintage Drawn Collection) ────────────
  {
    id: 5,
    etsyId: '4397956722',
    etsyUrl: 'https://www.etsy.com/listing/4397956722/',
    name: 'Whimsical Wedding Menu Template',
    subtitle: 'Vintage Drawn Collection — Hand Drawn Greenery',
    category: 'wedding-table-signs',
    price: 6.00,
    originalPrice: null,
    badge: null,
    rating: 5.0,
    reviews: 5,
    description:
      'This hand-drawn wedding menu was designed with a whimsical, garden-inspired aesthetic in mind, pairing natural green accents with timeless vintage details. Perfect for couples who want their stationery to feel personal, hand-drawn, and full of character. Includes a Thank You card on the back.',
    includes: [
      'Menu Template (front) — 4×9 in',
      'Thank You Card Template (back) — 4×9 in',
      'Instructions & FAQ PDF',
    ],
    canvaLink: 'https://canva.com/template',
    images: [
      'https://i.etsystatic.com/58295093/r/il/07f068/7400927159/il_794xN.7400927159_ej4j.jpg',
      'https://i.etsystatic.com/58295093/r/il/f23bbd/7400927161/il_794xN.7400927161_s1uk.jpg',
      'https://i.etsystatic.com/58295093/r/il/82c0cb/7352995054/il_794xN.7352995054_b6he.jpg',
      'https://i.etsystatic.com/58295093/r/il/31ea47/7400927143/il_794xN.7400927143_lcoz.jpg',
    ],
    tags: ['menu', 'hand-drawn', 'vintage', 'greenery', 'whimsical'],
    colors: ['Sage Green', 'Cream', 'Warm Brown'],
    editableIn: 'Canva',
    instant: true,
    collection: 'Vintage Drawn',
  },

  // ─── Product 6: Wedding Place Card Template (Vintage Drawn Collection) ───────
  {
    id: 6,
    etsyId: '4464459351',
    etsyUrl: 'https://www.etsy.com/listing/4464459351/',
    name: 'Whimsical Wedding Place Card Template',
    subtitle: 'Vintage Drawn Collection — With Meal Choice Icon',
    category: 'wedding-extras',
    price: 5.00,
    originalPrice: null,
    badge: null,
    rating: 5.0,
    reviews: 5,
    description:
      'This hand-drawn wedding place card was designed with a whimsical, garden-inspired aesthetic in mind, pairing natural green accents with timeless vintage details. Includes meal choice icon. Perfect for couples who want their stationery to feel personal, hand-drawn, and full of character.',
    includes: [
      'Place Card (one side) — 3.5×2 in',
      'Place Card (foldable) — 3.5×4 in',
      '10 cards per page — one side version',
      '4 cards per page — foldable version (A4 & US Letter)',
      'Instructions & FAQ PDF',
    ],
    canvaLink: 'https://canva.com/template',
    images: [
      'https://i.etsystatic.com/58295093/r/il/8ce397/7755880216/il_794xN.7755880216_6jd3.jpg',
      'https://i.etsystatic.com/58295093/r/il/49e75a/7803827233/il_794xN.7803827233_1dty.jpg',
      'https://i.etsystatic.com/58295093/r/il/73bab0/7803827247/il_794xN.7803827247_f3jl.jpg',
      'https://i.etsystatic.com/58295093/r/il/fd44e6/7803827231/il_794xN.7803827231_ft9o.jpg',
    ],
    tags: ['place-card', 'name-tag', 'hand-drawn', 'vintage', 'meal-choice'],
    colors: ['Sage Green', 'Cream', 'Warm Brown'],
    editableIn: 'Canva',
    instant: true,
    collection: 'Vintage Drawn',
  },

  // ─── Product 7: Bar Menu Sign Template (Vintage Drawn Collection) ────────────
  {
    id: 7,
    etsyId: '4464901105',
    etsyUrl: 'https://www.etsy.com/listing/4464901105/',
    name: 'Bar Menu Sign Template',
    subtitle: 'Vintage Drawn Collection — Signature Cocktails',
    category: 'wedding-table-signs',
    price: 4.55,
    originalPrice: 7.00,
    badge: 'Sale',
    rating: 5.0,
    reviews: 5,
    description:
      'This hand-drawn wedding bar menu table sign was designed with a whimsical, garden-inspired aesthetic in mind, pairing natural green accents with timeless vintage details. List your signature cocktails, wines, and spirits in style. Perfect for couples who want their stationery to feel personal, hand-drawn, and full of character.',
    includes: [
      'Bar Menu Table Sign — 8×10 in',
      'Bar Menu Table Sign — 5×7 in',
      'Bar Menu Table Sign — 4×6 in',
      'Instructions & FAQ PDF',
    ],
    canvaLink: 'https://canva.com/template',
    images: [
      'https://i.etsystatic.com/58295093/r/il/27f396/7806778531/il_794xN.7806778531_t79r.jpg',
      'https://i.etsystatic.com/58295093/r/il/59920f/7758831394/il_794xN.7758831394_gk9a.jpg',
      'https://i.etsystatic.com/58295093/r/il/058485/7806778509/il_794xN.7806778509_g6ob.jpg',
      'https://i.etsystatic.com/58295093/r/il/789b49/7806778521/il_794xN.7806778521_8hlp.jpg',
    ],
    tags: ['bar-menu', 'cocktails', 'sign', 'hand-drawn', 'vintage'],
    colors: ['Sage Green', 'Cream', 'Warm Brown'],
    editableIn: 'Canva',
    instant: true,
    collection: 'Vintage Drawn',
    saleEndsSoon: true,
  },

  // ─── Product 8: Wedding Invitation Suite (Vintage Drawn Collection) ──────────
  {
    id: 8,
    etsyId: '4370063789',
    etsyUrl: 'https://www.etsy.com/listing/4370063789/',
    name: 'Whimsical Wedding Invitation Suite',
    subtitle: 'Vintage Drawn Collection — Hand Drawn Green Set',
    category: 'wedding-invitation',
    price: 11.24,
    originalPrice: 14.99,
    badge: 'Best Seller',
    rating: 5.0,
    reviews: 5,
    description:
      'This hand-drawn wedding invitation set was designed with a whimsical, garden-inspired aesthetic in mind, pairing natural green accents with timeless vintage details. Perfect for couples who want their stationery to feel personal, hand-drawn, and full of character. Includes the full suite: invitation, detail card, RSVP, and envelope liner.',
    includes: [
      'Invitation Template (front and back) — 5×7 in',
      'Detail Card Template — 4×6 in',
      'RSVP Card Template — 5×3.5 in',
      'Printable A7 Liner — Euro Square / Euro / Regular Flap',
      'Instructions & FAQ PDF',
    ],
    canvaLink: 'https://canva.com/template',
    images: [
      'https://i.etsystatic.com/58295093/r/il/8f4991/7201196252/il_794xN.7201196252_gjlu.jpg',
      'https://i.etsystatic.com/58295093/r/il/c41cb2/7201196270/il_794xN.7201196270_d03o.jpg',
      'https://i.etsystatic.com/58295093/r/il/b34e5d/7201196364/il_794xN.7201196364_aeyj.jpg',
      'https://i.etsystatic.com/58295093/r/il/b9dd2e/7201196324/il_794xN.7201196324_arnz.jpg',
    ],
    tags: ['invitation-suite', 'hand-drawn', 'vintage', 'greenery', 'whimsical', 'bundle'],
    colors: ['Sage Green', 'Cream', 'Warm Gold'],
    editableIn: 'Canva',
    instant: true,
    collection: 'Vintage Drawn',
    saleEndsSoon: true,
  },
];

export const getFeaturedProducts = () => products.slice(0, 4);
export const getProductById = (id) => products.find((p) => p.id === Number(id));
export const getProductsByCategory = (category) =>
  category === 'all' ? products : products.filter((p) => p.category === category);
