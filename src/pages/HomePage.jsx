import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Download, Palette, Printer, Star, ChevronDown } from 'lucide-react';
import { getFeaturedProducts } from '../data/products';
import ProductCard from '../components/ProductCard';

const steps = [
  {
    icon: <ShoppingBagIcon />,
    number: '01',
    title: 'Choose Your Template',
    desc: 'Browse our curated collection of wedding stationery templates. Each design is crafted with elegance and attention to detail.',
  },
  {
    icon: <Download size={28} strokeWidth={1.2} />,
    number: '02',
    title: 'Instant Download',
    desc: 'After purchase, receive a PDF with all your Canva template links instantly — by download and via email. No waiting, no shipping.',
  },
  {
    icon: <Palette size={28} strokeWidth={1.2} />,
    number: '03',
    title: 'Personalize in Canva',
    desc: 'Open the template in Canva (free account works!), customize colors, fonts, and add your details with ease.',
  },
  {
    icon: <Printer size={28} strokeWidth={1.2} />,
    number: '04',
    title: 'Print & Celebrate',
    desc: 'Download your finished design and print at home, at a local print shop, or upload to an online printer.',
  },
];

function ShoppingBagIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.2" stroke="currentColor">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );
}

const testimonials = [
  {
    name: 'Sarah & James',
    location: 'Brooklyn, NY',
    text: 'These templates are absolutely gorgeous! I customized our garden suite in under an hour. Everyone at our wedding kept asking where we got our invitations.',
    rating: 5,
    image: '/images/home/testimonial-1.jpg',
  },
  {
    name: 'Emily & Marcus',
    location: 'Austin, TX',
    text: 'The Celestial Suite was perfect for our night wedding. The download was instant and the Canva templates were so easy to edit. Worth every penny!',
    rating: 5,
    image: '/images/home/testimonial-2.jpg',
  },
  {
    name: 'Olivia & Chen',
    location: 'Seattle, WA',
    text: 'I was nervous about DIY stationery but The Lily Letters Co made it completely stress-free. The templates are beautiful and so professional looking.',
    rating: 5,
    image: '/images/home/testimonial-3.jpg',
  },
];

export default function HomePage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const featured = getFeaturedProducts();

  return (
    <main>
      {/* Hero */}
      <section
        ref={heroRef}
        className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden pt-20"
      >
        {/* Background */}
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 z-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url(/images/banner.jpg)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wine/70 via-wine/50 to-cream/95" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(76, 34, 51, 0.75) 0%, rgba(76, 34, 51, 0.35) 45%, transparent 70%)',
            }}
          />
        </motion.div>

        {/* Content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 text-center px-6 max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <img
              src="/logos/logo-icon.svg"
              alt=""
              className="w-20 h-20 mx-auto mb-6 brightness-0 invert opacity-90"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="section-subtitle !text-cream mb-4 hero-text-shadow"
          >
            Wedding Printable Templates
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-display text-5xl md:text-7xl font-light text-cream leading-tight mb-6 hero-text-shadow"
          >
            Your Love Story,
            <br />
            <em className="font-light italic">Beautifully Told</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="font-body text-cream text-lg max-w-xl mx-auto mb-10 leading-relaxed hero-text-shadow"
          >
            Elegant, editable wedding stationery templates. Customize in Canva, 
            download instantly, and print anywhere.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-cream text-wine px-8 py-4 font-body text-sm font-medium tracking-widest uppercase hover:bg-wine hover:text-cream transition-all duration-300"
            >
              Shop Templates
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 border border-cream text-cream px-8 py-4 font-body text-sm font-medium tracking-widest uppercase bg-wine/30 backdrop-blur-sm hover:bg-cream/15 transition-all duration-300"
            >
              Our Story
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream/90"
        >
          <ChevronDown size={28} strokeWidth={1} />
        </motion.div>
      </section>

      {/* Stats bar */}
      <section className="bg-wine py-6">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '2,500+', label: 'Happy Couples' },
            { value: '12', label: 'Template Collections' },
            { value: '4.9 ★', label: 'Average Rating' },
            { value: 'Instant', label: 'Download' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <p className="font-display text-3xl font-light text-cream">{stat.value}</p>
              <p className="font-body text-xs tracking-widest uppercase text-cream/50 mt-0.5">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="section-subtitle mb-3">Simple & Seamless</p>
            <h2 className="section-heading">How It Works</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center group"
              >
                <div className="relative inline-flex">
                  <div className="w-16 h-16 border border-taupe group-hover:border-wine transition-colors flex items-center justify-center text-gold group-hover:text-wine transition-colors mb-5">
                    {step.icon}
                  </div>
                  <span className="absolute -top-3 -right-3 font-body text-xs text-taupe font-medium">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-display text-xl font-light text-wine mb-2">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-ink-muted leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 md:py-28 bg-[#f8f5ef]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4"
          >
            <div>
              <p className="section-subtitle mb-3">Our Collections</p>
              <h2 className="section-heading">Featured Templates</h2>
            </div>
            <Link to="/products" className="btn-ghost">
              View All Templates
              <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Brand story banner */}
      <section className="relative py-28 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(/images/home/brand-story.jpg)',
          }}
        />
        <div className="absolute inset-0 bg-[#4c2233]/70" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="section-subtitle text-cream/70 mb-4">Our Story</p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-cream mb-6 leading-snug">
              Art Made With Heart,
              <br /><em>Designed for Your Moments</em>
            </h2>
            <p className="font-body text-cream/75 text-base leading-relaxed mb-8 max-w-xl mx-auto">
              The Lily Letters Co is a small creative studio run by Gau — a graphic designer 
              and illustrator with a passion for watercolor, vintage line art, and the beauty 
              found in life's most cherished celebrations. Every template is a little piece of 
              her heart, made to be part of yours.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 border border-cream/60 text-cream px-8 py-3 font-body text-sm tracking-widest uppercase hover:bg-cream hover:text-wine transition-all duration-300"
            >
              Meet Gau
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="section-subtitle mb-3">Love Letters to Us</p>
            <h2 className="section-heading">What Couples Say</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="card-surface-interactive p-8"
              >
                <div className="flex mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} fill="#978152" strokeWidth={0} />
                  ))}
                </div>
                <p className="font-body text-sm text-ink-muted leading-relaxed mb-6 italic">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-body text-sm font-medium text-ink">
                      {t.name}
                    </p>
                    <p className="font-body text-xs text-ink-faint">
                      {t.location}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#f8f5ef] py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <img
              src="/logos/logo-icon.svg"
              alt=""
              className="w-16 h-16 mx-auto mb-6 opacity-50"
            />
            <h2 className="section-heading mb-4">
              Ready to Begin?
            </h2>
            <p className="font-body text-sm text-ink-muted mb-8 leading-relaxed">
              Browse our full collection of wedding templates — from invitation suites 
              to day-of stationery. Every design is beautiful, editable, and instantly yours.
            </p>
            <Link to="/products" className="btn-primary">
              Explore All Templates
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
