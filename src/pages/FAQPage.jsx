import { useState } from 'react';
import FaqAnswer from '../components/FaqAnswer';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Minus, Search } from 'lucide-react';

const faqData = [
  {
    category: 'Downloads & Delivery',
    icon: '📦',
    items: [
      {
        q: 'How do I receive my templates after purchasing?',
        a: 'Immediately after your purchase is confirmed, you will receive two things: (1) a download button on the order confirmation page for instant access, and (2) an email to your provided address containing the same PDF with all your Canva template links. No waiting required!',
      },
      {
        q: "My download link isn't working. What do I do?",
        a: "First, check your spam/junk folder for the confirmation email. If you still can't find it, contact us at thelilyletters.co@gmail.com with your order number and we'll resend your download link within 24 hours.",
      },
      {
        q: 'How long do I have access to my download?',
        a: 'Your download link is active for 1 year from the date of purchase. We recommend saving the PDF to your device or cloud storage (Google Drive, Dropbox) as soon as you download it, so you always have access.',
      },
      {
        q: 'Can I download the templates more than once?',
        a: 'Yes! You can download your PDF as many times as you need within the 1-year access window. Create a free account after purchase to manage all your downloads in one place.',
      },
    ],
  },
  {
    category: 'Canva Templates',
    icon: '🎨',
    items: [
      {
        q: 'Do I need a Canva account to use the templates?',
        a: 'Yes, a free Canva account is required. You can sign up at canva.com completely free. A free account gives you full access to edit all our templates. You do NOT need Canva Pro.',
      },
      {
        q: 'How do I open and edit a template in Canva?',
        a: 'Open your downloaded PDF and click on the Canva link for the template you want to edit. This will open Canva in your browser. Click "Use template" to create your own editable copy. From there, you can change text, colors, fonts, and images to personalize it for your wedding.',
      },
      {
        q: 'Can I change the text?',
        a: 'All text in our templates are fully editable. You can easily add your information, change fonts, size, colors, and layout.',
      },
      {
        q: 'Can I change the colors of the images?',
        a: 'Line-art illustrations: yes — colors, size, and position are all editable.\n\nWatercolor and painted artwork: no — these are fixed images and cannot be modified (for example, the envelope liner images).',
      },
      {
        q: 'Can I share my Canva template with my partner or planner?',
        a: 'No. The template is for personal use only and cannot be shared with planners, partners, or any third party. Each user needs their own license.',
      },
    ],
  },
  {
    category: 'Printing',
    icon: '🖨️',
    items: [
      {
        q: 'What paper should I use for printing?',
        a: 'We recommend using white cardstock of at least 200gsm for the best results. A matte finish gives an elegant look, while a glossy finish makes colors pop.',
      },
      {
        q: 'What are the standard template sizes?',
        a: 'Template sizes vary depending on the product, so we recommend checking the images and description of each listing for the exact dimensions. Most invitations are designed in 5×7" format, and all templates include bleed and cut marks when exported as PDF from Canva.',
      },
      {
        q: 'Can I print at a professional print shop?',
        a: 'Yes! Export your finished Canva design as a PDF (Print). Before a large order, request a test print to check colors, sizing, and paper quality.\n\nLooking to print? I recommend Prints of Love for all your professional printing needs. Click my special link below to get started:\n\nhttps://printsoflove.com/ref/LILYLETTERS\n\nUse code LILYLETTERS10 at Prints of Love for 10% off your order of $49 or more!',
      },
      {
        q: 'Can I print at home?',
        a: 'Yes! Our templates are designed to print beautifully on a standard home inkjet or laser printer. Before printing, make sure your printer supports the paper weight you plan to use — not all home printers handle heavy cardstock. For best results, use a high-quality print setting and always do a test print first.',
      },
    ],
  },
  {
    category: 'Orders & Refunds',
    icon: '🛒',
    items: [
      {
        q: "Do I need to create an account to purchase?",
        a: "No account is required to complete a purchase! Just enter your email and payment details at checkout. After your purchase, you'll have the option to create a free account to save and manage your downloads.",
      },
      {
        q: 'Do you offer refunds?',
        a: 'Because our products are digital downloads, we generally cannot offer refunds once a purchase is made and the download link has been accessed. However, if you experience a technical issue or received the wrong item, please contact us and we\'ll make it right.',
      },
      {
        q: 'Can I use the templates for commercial purposes?',
        a: 'Our templates are licensed for personal use only (i.e., for your own wedding). You may not resell, redistribute, or offer printed copies for sale. For commercial licensing inquiries, please contact us.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover). Payment is processed securely—your card details are never stored on our servers.',
      },
    ],
  },
];

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-taupe/35 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left py-4 flex items-start justify-between gap-4 group focus-visible:outline-offset-[-2px]"
        aria-expanded={open}
      >
        <span className="font-body text-sm font-medium text-ink group-hover:text-wine transition-colors pr-4">
          {question}
        </span>
        <span className="flex-shrink-0 mt-0.5">
          {open ? (
            <Minus size={14} strokeWidth={2} className="text-gold" />
          ) : (
            <Plus size={14} strokeWidth={2} className="text-gold" />
          )}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pb-5 pr-8">
              <FaqAnswer answer={answer} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = faqData
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(
      (cat) =>
        (activeCategory === 'all' || cat.category === activeCategory) &&
        cat.items.length > 0
    );

  return (
    <main className="min-h-screen bg-cream pt-20">
      {/* Hero */}
      <section className="pt-16 pb-12 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="section-subtitle"
          >
            FAQ
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl font-light text-wine mt-3 mb-4"
          >
            Frequently Asked
            <br />
            <em className="text-gold">Questions</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="page-lead mx-auto"
          >
            Everything you need to know about our templates, Canva, printing, and orders.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative mt-8"
          >
            <Search size={16} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe" />
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </motion.div>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-6">
          {/* Category filter */}
          {!search && (
            <div className="flex flex-wrap gap-2 mb-10">
              <button
                onClick={() => setActiveCategory('all')}
                className={`font-body text-xs px-4 py-2 border transition-all duration-200 ${
                  activeCategory === 'all'
                    ? 'bg-wine text-cream border-wine shadow-soft'
                    : 'bg-white text-ink-muted border-taupe/80 hover:border-wine hover:text-wine'
                }`}
              >
                All Topics
              </button>
              {faqData.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setActiveCategory(cat.category)}
                  className={`font-body text-xs px-4 py-2 border transition-all duration-200 ${
                    activeCategory === cat.category
                      ? 'bg-wine text-cream border-wine shadow-soft'
                      : 'bg-white text-ink-muted border-taupe/80 hover:border-wine hover:text-wine'
                  }`}
                >
                  {cat.icon} {cat.category}
                </button>
              ))}
            </div>
          )}

          {/* FAQ Items */}
          <div className="space-y-10">
            {filtered.length > 0 ? (
              filtered.map((cat) => (
                <motion.div
                  key={cat.category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xl">{cat.icon}</span>
                    <h2 className="font-display text-xl font-light text-wine">{cat.category}</h2>
                  </div>
                  <div className="panel px-6 shadow-soft">
                    {cat.items.map((item) => (
                      <FAQItem key={item.q} question={item.q} answer={item.a} />
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-16">
                <p className="font-display text-2xl text-wine/40 mb-2">No results found</p>
                <p className="font-body text-sm text-ink-faint">
                  Try a different search term or{' '}
                  <Link to="/contact" className="text-wine underline">
                    contact us directly
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>

          {/* Still have questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 panel-elevated p-8 text-center bg-wine/[0.04] border-wine/25"
          >
            <p className="font-display text-xl font-light text-wine mb-3">
              Still have questions?
            </p>
            <p className="font-body text-sm text-ink-muted mb-5">
              We're here to help! Send us a message and we'll get back to you within 1–2 business days.
            </p>
            <Link to="/contact" className="btn-primary">
              Contact Us
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
