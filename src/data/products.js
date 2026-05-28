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
      '/images/products/1/01.jpg',
      '/images/products/1/02.jpg',
      '/images/products/1/03.jpg',
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
      '/images/products/2/01.jpg',
      '/images/products/2/02.jpg',
      '/images/products/2/03.jpg',
      '/images/products/2/04.jpg',
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
      '/images/products/3/01.jpg',
      '/images/products/3/02.jpg',
      '/images/products/3/03.jpg',
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
      '/images/products/4/01.jpg',
      '/images/products/4/02.jpg',
      '/images/products/4/03.jpg',
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
      '/images/products/5/01.jpg',
      '/images/products/5/02.jpg',
      '/images/products/5/03.jpg',
      '/images/products/5/04.jpg',
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
      '/images/products/6/01.jpg',
      '/images/products/6/02.jpg',
      '/images/products/6/03.jpg',
      '/images/products/6/04.jpg',
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
      '/images/products/7/01.jpg',
      '/images/products/7/02.jpg',
      '/images/products/7/03.jpg',
      '/images/products/7/04.jpg',
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
      '/images/products/8/01.jpg',
      '/images/products/8/02.jpg',
      '/images/products/8/03.jpg',
      '/images/products/8/04.jpg',
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
