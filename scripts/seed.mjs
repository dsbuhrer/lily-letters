import bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';
import { slugify, readingTime } from '../src/lib/utils/slug.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '../.env') });

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const BLOG_CATEGORIES = [
  { slug: 'wedding-invitations', name: 'Wedding Invitations', sort_order: 1 },
  { slug: 'wedding-signage', name: 'Wedding Signage', sort_order: 2 },
  { slug: 'bridal-shower', name: 'Bridal Shower', sort_order: 3 },
  { slug: 'bachelorette-party', name: 'Bachelorette Party', sort_order: 4 },
  { slug: 'wedding-trends', name: 'Wedding Trends', sort_order: 5 },
  { slug: 'wedding-planning-tips', name: 'Wedding Planning Tips', sort_order: 6 },
  { slug: 'custom-prints', name: 'Custom Prints', sort_order: 7 },
  { slug: 'wedding-inspiration', name: 'Wedding Inspiration', sort_order: 8 },
  { slug: 'color-palettes', name: 'Color Palettes', sort_order: 9 },
  { slug: 'minimalist-wedding', name: 'Minimalist Wedding', sort_order: 10 },
  { slug: 'modern-wedding', name: 'Modern Wedding', sort_order: 11 },
  { slug: 'elegant-wedding-ideas', name: 'Elegant Wedding Ideas', sort_order: 12 },
  { slug: 'diy-wedding-details', name: 'DIY Wedding Details', sort_order: 13 },
];

const SAMPLE_FAQ = [
  {
    question: 'Can I edit these templates without a designer?',
    answer:
      'Yes. All Lily Letters templates open in Canva with a free account. You can change text, colors, and fonts in minutes without design experience.',
  },
  {
    question: 'How fast do I receive my download after purchase?',
    answer:
      'Instantly. You get a download link on the order confirmation page and the same link by email, with Canva template access included.',
  },
  {
    question: 'What paper should I use for wedding stationery?',
    answer:
      'We recommend white cardstock at 200gsm or higher. Matte finishes feel elegant; glossy makes colors pop. Always print a test sheet first.',
  },
  {
    question: 'Do your templates work for small and large guest counts?',
    answer:
      'Yes. Table signs, seating charts, and place cards scale to your guest list. Duplicate Canva pages as needed for additional tables or names.',
  },
  {
    question: 'Where should I print my wedding stationery?',
    answer:
      'Looking to print? I recommend Prints of Love for all your professional printing needs. Click my special link below to get started:\n\nhttps://printsoflove.com/ref/LILYLETTERS\n\nUse code LILYLETTERS10 at Prints of Love for 10% off your order of $49 or more!',
  },
];

function sectionToHtml(s) {
  if (s.type === 'h2') return `<h2>${s.text}</h2>`;
  if (s.type === 'h3') return `<h3>${s.text}</h3>`;
  if (s.type === 'img') {
    const alt = (s.alt || '').replace(/"/g, '&quot;');
    const caption = s.caption
      ? `<figcaption>${s.caption}</figcaption>`
      : '';
    return `<figure><img src="${s.src}" alt="${alt}" loading="lazy" />${caption}</figure>`;
  }
  return `<p>${s.text}</p>`;
}

function postTemplate({ title, slug, categorySlug, excerpt, directAnswer, sections, productIds, tags }) {
  const content = sections.map(sectionToHtml).join('\n');
  const fullContent = content + '<p>Explore our editable Canva wedding templates to bring this look to life for your celebration.</p>';
  return {
    slug,
    title,
    excerpt,
    direct_answer: directAnswer,
    content: fullContent,
    status: 'published',
    meta_title: `${title} | The Lily Letters Co.`,
    meta_description: excerpt,
    tag_slugs: tags,
    category_slug: categorySlug,
    faq: SAMPLE_FAQ,
    related_product_ids: productIds,
    seo_keywords: tags,
    featured: false,
    author_name: 'The Lily Letters Co.',
    author_bio: 'Curating elegant, editable wedding stationery for modern couples.',
    reading_time_minutes: readingTime(fullContent),
    published_at: new Date().toISOString(),
    hero_image: '/images/blog/hero-default.jpg',
    hero_alt: title,
  };
}

const SEED_POSTS = [
  postTemplate({
    title: 'Best Wedding Welcome Sign Ideas for 2026',
    slug: 'best-wedding-welcome-sign-ideas-2026',
    categorySlug: 'wedding-signage',
    excerpt:
      'Discover welcome sign ideas that feel personal, polished, and on-trend for 2026 weddings — from acrylic displays to floral arches and minimalist typography.',
    directAnswer:
      'The best wedding welcome signs in 2026 combine clear guest messaging, your names or monogram, and a style that matches your venue — acrylic, floral frame, or elegant printed board.',
    tags: ['welcome sign', 'wedding signage', '2026 wedding trends'],
    productIds: [2, 4],
    sections: [
      { type: 'p', text: 'Your welcome sign is the first branded touchpoint guests see. It sets the tone for a formal ballroom, garden celebration, or intimate dinner.' },
      { type: 'h2', text: 'Top welcome sign styles for 2026' },
      { type: 'h3', text: 'Acrylic and modern minimal' },
      { type: 'p', text: 'Clear or frosted acrylic with serif typography remains popular for modern and black-tie weddings.' },
      {
        type: 'img',
        src: '/images/products/2/01.jpg',
        alt: 'Modern acrylic welcome sign with elegant serif typography',
        caption: 'Acrylic welcome signs keep lines crisp and feel elevated at indoor venues.',
      },
      { type: 'h3', text: 'Floral and garden frames' },
      { type: 'p', text: 'Hand-drawn greenery and soft sage palettes pair beautifully with outdoor and vineyard venues.' },
      {
        type: 'img',
        src: '/images/products/4/01.jpg',
        alt: 'Sage green floral welcome sign with garden frame illustration',
        caption: 'Floral frames soften the entrance and photograph beautifully in natural light.',
      },
      { type: 'h2', text: 'What to include on your sign' },
      { type: 'p', text: 'Include your names, wedding date, and a warm line such as “Welcome to our wedding.” Add directional cues if needed for ceremony vs. reception.' },
      {
        type: 'img',
        src: '/images/home/brand-story.jpg',
        alt: 'Welcome sign displayed at a garden wedding entrance',
        caption: 'Place your sign where guests naturally pause — near the entrance or ceremony aisle.',
      },
    ],
  }),
  postTemplate({
    title: 'How to Choose Your Wedding Color Palette',
    slug: 'how-to-choose-wedding-color-palette',
    categorySlug: 'color-palettes',
    excerpt:
      'A step-by-step guide to building a cohesive wedding color palette that works across invitations, signage, florals, and table settings.',
    directAnswer:
      'Start with one anchor color, add two supporting neutrals, and one accent — then test the palette on invitations, signage, and linen swatches in natural light.',
    tags: ['color palette', 'wedding planning', 'stationery'],
    productIds: [8, 3],
    sections: [
      { type: 'p', text: 'Color ties every detail together. The right palette makes stationery, signage, and decor feel intentional rather than scattered.' },
      { type: 'h2', text: 'Four steps to a cohesive palette' },
      { type: 'p', text: 'Pull inspiration from your venue, season, and wardrobe. Limit yourself to four colors total for visual calm.' },
    ],
  }),
  postTemplate({
    title: 'Minimalist Wedding Invitations Trends',
    slug: 'minimalist-wedding-invitations-trends',
    categorySlug: 'minimalist-wedding',
    excerpt:
      'Minimalist wedding invitations favor clean typography, generous white space, and restrained color — here is what couples are choosing in 2026.',
    directAnswer:
      'Minimalist wedding invitations use one or two fonts, neutral or monochrome palettes, and simple layouts with plenty of breathing room.',
    tags: ['minimalist wedding', 'invitations', 'typography'],
    productIds: [8, 1],
    sections: [
      { type: 'p', text: 'Less ornamentation does not mean less impact. Minimal suites feel expensive when typography and paper quality are right.' },
      { type: 'h2', text: 'Key minimalist design moves' },
      { type: 'p', text: 'Choose a serif headline and a simple sans body font. Keep borders and illustrations sparse.' },
    ],
  }),
  postTemplate({
    title: 'Wedding Signage Checklist',
    slug: 'wedding-signage-checklist',
    categorySlug: 'wedding-signage',
    excerpt:
      'A complete wedding signage checklist so you do not miss ceremony, cocktail, or reception signs guests actually need.',
    directAnswer:
      'Essential wedding signs include welcome, ceremony program, bar menu, seating chart, table numbers, and restroom — plus any directional signs for split venues.',
    tags: ['wedding signage', 'checklist', 'reception'],
    productIds: [2, 3, 7],
    sections: [
      { type: 'h2', text: 'Before the ceremony' },
      { type: 'p', text: 'Welcome sign, seating chart if early reveal, and directional arrows for parking or garden paths.' },
      { type: 'h2', text: 'During reception' },
      { type: 'p', text: 'Bar menu, sweetheart table sign, guest book table sign, and thank-you station if applicable.' },
    ],
  }),
  postTemplate({
    title: 'Custom Bridal Shower Signs Ideas',
    slug: 'custom-bridal-shower-signs-ideas',
    categorySlug: 'bridal-shower',
    excerpt:
      'Creative bridal shower sign ideas — welcome boards, dessert labels, photo backdrops, and games — that photograph beautifully and feel personal.',
    directAnswer:
      'Popular bridal shower signs include a welcome board with the bride’s name, themed dessert bar labels, and a photo backdrop with a short quote or monogram.',
    tags: ['bridal shower', 'custom signs', 'party decor'],
    productIds: [4, 2],
    sections: [
      { type: 'p', text: 'Bridal shower signage should match the party theme — tea party, garden brunch, or glam night out.' },
      { type: 'h2', text: 'Sign ideas guests love' },
      { type: 'p', text: 'Add a advice-for-the-bride card station sign and a favors table label for a polished hostess touch.' },
    ],
  }),
  postTemplate({
    title: 'How to Make Your Wedding Look Luxurious on a Budget',
    slug: 'luxurious-wedding-on-a-budget',
    categorySlug: 'wedding-planning-tips',
    excerpt:
      'Luxury is about cohesion, not cost. Learn how typography, signage, and printable templates elevate your wedding without overspending.',
    directAnswer:
      'Make a wedding look luxurious on a budget by choosing one elegant font pairing, consistent colors, quality paper, and cohesive signage and stationery.',
    tags: ['luxury wedding', 'budget tips', 'DIY wedding'],
    productIds: [8, 5, 2],
    sections: [
      { type: 'p', text: 'Guests perceive luxury when details repeat thoughtfully — same burgundy on invites, menus, and welcome signs.' },
      { type: 'h2', text: 'High-impact, low-cost upgrades' },
      { type: 'p', text: 'Invest in typography and paper. Use editable templates for a designer look at a fraction of custom print studio fees.' },
    ],
  }),
  postTemplate({
    title: 'Modern Wedding Aesthetic Guide',
    slug: 'modern-wedding-aesthetic-guide',
    categorySlug: 'modern-wedding',
    excerpt:
      'Define a modern wedding aesthetic with clean lines, intentional negative space, and stationery that feels editorial.',
    directAnswer:
      'A modern wedding aesthetic uses sans-serif or refined serif type, neutral bases with one bold accent, geometric layouts, and minimal floral illustration.',
    tags: ['modern wedding', 'aesthetic', 'stationery'],
    productIds: [8, 7],
    sections: [
      { type: 'p', text: 'Modern does not mean cold. Warm neutrals and tactile paper keep the look inviting.' },
      { type: 'h2', text: 'Stationery for modern celebrations' },
      { type: 'p', text: 'Pair invitation suites with matching bar menus and table numbers for a gallery-worthy tablescape.' },
    ],
  }),
  postTemplate({
    title: 'Wedding Fonts That Look Elegant',
    slug: 'wedding-fonts-that-look-elegant',
    categorySlug: 'wedding-invitations',
    excerpt:
      'The best elegant wedding fonts for invitations and signs — serif classics, modern serifs, and script accents that stay readable.',
    directAnswer:
      'Elegant wedding fonts include Cormorant Garamond, Playfair Display, and restrained script accents like Great Vibes — use no more than two font families per suite.',
    tags: ['wedding fonts', 'typography', 'invitations'],
    productIds: [8, 1],
    sections: [
      { type: 'h2', text: 'Serif fonts for timeless elegance' },
      { type: 'p', text: 'High-contrast serifs feel formal and work for black-tie and estate weddings.' },
      { type: 'h2', text: 'Pairing rules' },
      { type: 'p', text: 'Use one font for names and headlines, another for body text. Avoid mixing more than one script.' },
    ],
  }),
  postTemplate({
    title: 'Wedding Seating Chart Ideas',
    slug: 'wedding-seating-chart-ideas',
    categorySlug: 'wedding-signage',
    excerpt:
      'Seating chart ideas for every wedding size — alphabetical lists, assigned tables by number, and display styles guests can read quickly.',
    directAnswer:
      'The clearest seating charts list guests alphabetically by last name with table numbers, displayed at eye level near the reception entrance on a sturdy easel.',
    tags: ['seating chart', 'reception', 'wedding signage'],
    productIds: [3, 2],
    sections: [
      { type: 'p', text: 'A readable seating chart prevents bottlenecks at the reception door. Design for legibility first, decoration second.' },
      { type: 'h2', text: 'Display formats' },
      { type: 'p', text: 'Large printed boards, mirror decals, and digital-friendly PDF backups for your coordinator all work well.' },
    ],
  }),
  postTemplate({
    title: 'Everything You Need for Wedding Day Stationery',
    slug: 'wedding-day-stationery-checklist',
    categorySlug: 'wedding-planning-tips',
    excerpt:
      'The ultimate wedding day stationery checklist: invitations, programs, menus, place cards, signs, and thank-you cards in one guide.',
    directAnswer:
      'Wedding day stationery typically includes save-the-dates, invitations, programs, menus, place cards, table numbers, signage, and thank-you cards — prioritized by your timeline and budget.',
    tags: ['stationery checklist', 'wedding planning', 'printables'],
    productIds: [8, 5, 6, 1],
    sections: [
      { type: 'h2', text: 'Months before the wedding' },
      { type: 'p', text: 'Send save-the-dates and invitations. Order postage and assemble addressing plan.' },
      { type: 'h2', text: 'One month out' },
      { type: 'p', text: 'Finalize menus, place cards, seating chart, and all reception signage. Print test copies.' },
    ],
  }),
];

export async function runSeed() {
  const supabase = getSupabase();
  if (!supabase) {
    console.error('Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@thelilyletters.co').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'change-me-on-first-login';

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { name: 'Lily Admin' },
  });

  if (authError && !authError.message?.includes('already')) {
    console.warn('Auth user:', authError.message);
  } else if (authUser?.user?.id) {
    await supabase.from('staff_roles').upsert(
      { user_id: authUser.user.id, role: 'admin' },
      { onConflict: 'user_id' },
    );
    console.log('Admin auth user + staff_roles:', adminEmail);
  } else {
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find((u) => u.email === adminEmail);
    if (found) {
      await supabase.from('staff_roles').upsert(
        { user_id: found.id, role: 'admin' },
        { onConflict: 'user_id' },
      );
      console.log('Linked staff_roles for existing auth user:', adminEmail);
    }
  }

  const hash = await bcrypt.hash(adminPassword, 10);
  await supabase.from('admin_users').upsert(
    { email: adminEmail, password_hash: hash, name: 'Lily Admin' },
    { onConflict: 'email' },
  );

  for (const cat of BLOG_CATEGORIES) {
    await supabase.from('categories').upsert(
      {
        ...cat,
        description: `Articles about ${cat.name.toLowerCase()} for sophisticated weddings.`,
        meta_title: `${cat.name} | Lily Letters Blog`,
        meta_description: `Wedding inspiration and guides about ${cat.name.toLowerCase()}.`,
      },
      { onConflict: 'slug' },
    );
  }

  const { data: categories } = await supabase.from('categories').select('id, slug');
  const catMap = Object.fromEntries((categories || []).map((c) => [c.slug, c.id]));

  const { products } = await import('../src/data/products.js');
  for (const p of products) {
    await supabase.from('products').upsert(
      {
        id: p.id,
        slug: slugify(p.name),
        etsy_id: p.etsyId,
        etsy_url: p.etsyUrl,
        name: p.name,
        subtitle: p.subtitle,
        category: p.category,
        price: p.price,
        original_price: p.originalPrice,
        badge: p.badge,
        rating: p.rating,
        reviews: p.reviews,
        description: p.description,
        includes: p.includes,
        canva_link: p.canvaLink,
        images: p.images,
        tags: p.tags,
        colors: p.colors,
        editable_in: p.editableIn,
        instant: p.instant,
        collection: p.collection,
        sale_ends_soon: p.saleEndsSoon || false,
        featured: p.id <= 4,
        active: true,
      },
      { onConflict: 'id' },
    );
  }

  for (const post of SEED_POSTS) {
    const { category_slug, ...rest } = post;
    const row = {
      ...rest,
      category_id: catMap[category_slug] || null,
    };
    await supabase.from('posts').upsert(row, { onConflict: 'slug' });
  }

  console.log('Seed complete: admin, categories, products, posts');
}

if (process.argv[1]?.includes('seed')) {
  runSeed().catch(console.error);
}
