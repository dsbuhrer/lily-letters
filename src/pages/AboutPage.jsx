import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Leaf, Download, Sparkles, ArrowRight, Star } from 'lucide-react';

const values = [
  {
    icon: Heart,
    title: 'Crafted with Passion',
    body: 'Each design is a reflection of Gau\'s love for illustration and her genuine desire to make your celebration feel truly special.',
  },
  {
    icon: Sparkles,
    title: 'Inspired by Beauty',
    body: 'From timeless elegance to fairy-tale florals and vintage architecture — every collection draws from the aesthetics that make moments unforgettable.',
  },
  {
    icon: Download,
    title: 'Made for DIY Creators',
    body: 'Templates live on Canva so you can access, personalize, and print from anywhere — no design skills required.',
  },
  {
    icon: Leaf,
    title: 'Always Evolving',
    body: 'New collections are added regularly, inspired by trending styles and the seasons. There\'s always something fresh waiting for you.',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-wine/5 pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.p {...fadeUp} className="section-subtitle">
            About the Shop
          </motion.p>
          <motion.h1
            {...fadeUp}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="font-display text-5xl md:text-6xl font-light text-wine mt-3 mb-6 leading-tight"
          >
            Celebrate Life's
            <br />
            <em className="text-gold">Cherished Moments</em>
          </motion.h1>
          <motion.p
            {...fadeUp}
            transition={{ delay: 0.2 }}
            className="font-body text-base text-[#2d2020]/60 leading-relaxed max-w-xl mx-auto"
          >
            The Lily Letters Co is a creative studio dedicated to making your most 
            meaningful celebrations look as beautiful as they feel — through 
            thoughtfully illustrated, fully editable digital templates.
          </motion.p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-14 items-center">
          <motion.div {...fadeUp} className="relative">
            <div className="aspect-[3/4] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=700&q=80"
                alt="Wedding stationery flat lay"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
            <p className="section-subtitle mb-4">Hi there!</p>
            <h2 className="font-display text-3xl font-light text-wine mb-6 leading-snug">
              I'm Gau, the Designer Behind the Letters
            </h2>
            <div className="space-y-4 font-body text-sm text-[#2d2020]/65 leading-relaxed">
              <p>
                I'm a graphic designer and illustrator with a deep love for watercolor painting 
                and vintage line art. My work draws inspiration from timeless elegance, nature, 
                fairy tales, vintage architecture, and the aesthetics that make each era beautiful 
                in its own way.
              </p>
              <p>
                The Lily Letters Co is where I share that creativity with you. Here you'll find 
                editable digital design files for weddings, baby showers, birthdays, and all the 
                moments worth celebrating — hosted on Canva, so you can personalize everything 
                with ease, no design background needed.
              </p>
              <p>
                If you're in your DIY era, you're in the right place. I truly love knowing 
                that my work gets to be a small part of your most unforgettable moments.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="section-subtitle mb-3">What Drives This Shop</p>
            <h2 className="section-heading">A Little About the Work</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 bg-cream flex items-center justify-center mx-auto mb-4">
                  <v.icon size={22} strokeWidth={1.2} className="text-wine" />
                </div>
                <h3 className="font-display text-lg font-light text-wine mb-2">{v.title}</h3>
                <p className="font-body text-sm text-[#2d2020]/55 leading-relaxed">{v.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Maker */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="section-subtitle mb-3">Meet the Maker</p>
            <h2 className="section-heading">The Heart Behind the Brand</h2>
          </motion.div>
          <motion.div {...fadeUp} className="flex flex-col md:flex-row gap-10 items-center">
            <div className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0 overflow-hidden rounded-full">
              <img
                src="/gau.jpg"
                alt="Gau, founder of The Lily Letters Co"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-display text-3xl font-light text-wine mb-1">Gau</h3>
              <p className="font-body text-sm text-gold uppercase tracking-wider mb-5">
                Founder, Designer & Illustrator
              </p>
              <div className="space-y-3 font-body text-sm text-[#2d2020]/60 leading-relaxed mb-8">
                <p>
                  I've always believed that the details are what make a celebration truly 
                  memorable — and beautiful stationery is one of the first things your guests 
                  see and touch. That belief is what led me to start The Lily Letters Co.
                </p>
                <p>
                  Drawing from my background in graphic design and illustration, I create each 
                  collection with intention: watercolor textures that feel hand-painted, 
                  vintage line art that tells a story, and elegant compositions inspired by 
                  nature, architecture, and the aesthetics I find endlessly beautiful.
                </p>
                <p>
                  If you ever have a question or need a hand with anything, don't hesitate to 
                  reach out — I'm always happy to help. It's truly an honor to have my work 
                  be part of your unforgettable moments.
                </p>
              </div>
              {/* Signature */}
              <div className="border-t border-taupe/30 pt-6">
                <p className="font-script text-3xl text-wine leading-none mb-1">Gau</p>
                <p className="font-body text-xs text-[#2d2020]/40 tracking-wider uppercase">
                  The Lily Letters Co.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-wine text-cream">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { number: '10K+', label: 'Happy Couples' },
            { number: '120+', label: 'Templates Designed' },
            { number: '4.9★', label: 'Average Rating' },
            { number: '50+', label: 'Countries' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <p className="font-display text-4xl font-light text-cream/90 mb-1">{stat.number}</p>
              <p className="font-body text-xs uppercase tracking-widest text-cream/50">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <motion.div {...fadeUp} className="max-w-lg mx-auto px-6">
          <p className="section-subtitle mb-3">Explore the Shop</p>
          <h2 className="section-heading mb-4">Discover Designs You'll Love</h2>
          <p className="font-body text-sm text-[#2d2020]/55 mb-8 leading-relaxed">
            New collections are added regularly — favorite the shop so you never miss what's next.
          </p>
          <Link to="/products" className="btn-primary">
            Browse All Templates
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
