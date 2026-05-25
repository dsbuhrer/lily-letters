import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Instagram, Clock, CheckCircle } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55 },
};

const topics = [
  'Order & Download Issues',
  'Template Customization Help',
  'Canva Access Questions',
  'Refunds & Returns',
  'Collaboration / Wholesale',
  'Other',
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-cream pt-20">
      {/* Hero */}
      <section className="pt-16 pb-12 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <motion.p {...fadeUp} className="section-subtitle">Get in Touch</motion.p>
          <motion.h1
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl font-light text-wine mt-3 mb-4"
          >
            We'd Love to Hear
            <br />
            <em className="text-gold">From You</em>
          </motion.h1>
          <motion.p {...fadeUp} transition={{ delay: 0.2 }} className="font-body text-sm text-[#2d2020]/55 leading-relaxed">
            Have a question about your order, need help with a template, or just want to say hello? 
            We typically respond within 1–2 business days.
          </motion.p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-5 gap-12">
          {/* Contact Info */}
          <motion.div {...fadeUp} className="md:col-span-2 space-y-6">
            <div className="bg-white border border-taupe/20 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-wine/10 flex items-center justify-center flex-shrink-0">
                  <Mail size={18} strokeWidth={1.3} className="text-wine" />
                </div>
                <div>
                  <h3 className="font-body text-sm font-medium text-[#2d2020] mb-1">Email Us</h3>
                  <a
                    href="mailto:hello@thelilyletttersco.com"
                    className="font-body text-sm text-gold hover:text-wine transition-colors"
                  >
                    hello@thelilylettters.com
                  </a>
                  <p className="font-body text-xs text-[#2d2020]/40 mt-1">
                    For all order & template questions
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-taupe/20 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-wine/10 flex items-center justify-center flex-shrink-0">
                  <Instagram size={18} strokeWidth={1.3} className="text-wine" />
                </div>
                <div>
                  <h3 className="font-body text-sm font-medium text-[#2d2020] mb-1">Instagram</h3>
                  <a
                    href="https://www.instagram.com/thelilyletters.co"
                    target="_blank"
                    rel="noreferrer"
                    className="font-body text-sm text-gold hover:text-wine transition-colors"
                  >
                    @thelilyletters.co
                  </a>
                  <p className="font-body text-xs text-[#2d2020]/40 mt-1">
                    DMs welcome, response may be slower
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-taupe/20 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-wine/10 flex items-center justify-center flex-shrink-0">
                  <Clock size={18} strokeWidth={1.3} className="text-wine" />
                </div>
                <div>
                  <h3 className="font-body text-sm font-medium text-[#2d2020] mb-1">Response Time</h3>
                  <p className="font-body text-sm text-[#2d2020]/70">1–2 Business Days</p>
                  <p className="font-body text-xs text-[#2d2020]/40 mt-1">
                    Mon–Fri, 9am–5pm EST
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-cream border border-gold/30 p-5">
              <p className="font-body text-xs text-gold uppercase tracking-wider font-medium mb-2">
                Quick Tip
              </p>
              <p className="font-body text-sm text-[#2d2020]/65 leading-relaxed">
                Check our <a href="/faq" className="text-wine underline">FAQ page</a> first—most 
                common questions about downloads, Canva access, and printing are answered there instantly.
              </p>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="md:col-span-3">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-taupe/20 p-10 text-center"
              >
                <div className="w-16 h-16 bg-sage/15 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={28} strokeWidth={1.5} className="text-sage" />
                </div>
                <h2 className="font-display text-2xl font-light text-wine mb-3">
                  Message Sent!
                </h2>
                <p className="font-body text-sm text-[#2d2020]/60 mb-6 leading-relaxed">
                  Thank you for reaching out, {form.name}! We've received your message and will 
                  get back to you at <strong>{form.email}</strong> within 1–2 business days.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', topic: '', message: '' }); }}
                  className="btn-ghost"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <div className="bg-white border border-taupe/20 p-8">
                <h2 className="font-display text-2xl font-light text-wine mb-6">
                  Send Us a Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-body text-xs uppercase tracking-wider text-[#2d2020]/60 mb-1.5">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Jane Smith"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block font-body text-xs uppercase tracking-wider text-[#2d2020]/60 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-[#2d2020]/60 mb-1.5">
                      Topic
                    </label>
                    <select
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select a topic...</option>
                      {topics.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-[#2d2020]/60 mb-1.5">
                      Your Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Tell us how we can help you..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="input-field resize-none"
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full">
                    <Mail size={14} strokeWidth={1.5} />
                    Send Message
                  </button>

                  <p className="font-body text-xs text-[#2d2020]/40 text-center">
                    We respect your privacy. Your information is never shared with third parties.
                  </p>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
