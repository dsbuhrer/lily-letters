import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Mail, Instagram, Clock, CheckCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { validateContactForm, contactFormSummaryError } from '../utils/contactFormValidation';

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
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const topic = searchParams.get('topic');
    const order = searchParams.get('order');
    if (topic || order) {
      setForm((prev) => ({
        ...prev,
        topic: topic ? decodeURIComponent(topic.replace(/\+/g, ' ')) : prev.topic,
        message: order
          ? `Order number: ${order}\n\n(Please describe your issue below)\n`
          : prev.message,
      }));
    }
  }, [searchParams]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (submitError) setSubmitError('');
  };

  const fieldClass = (field) =>
    fieldErrors[field] ? 'input-field input-field-error' : 'input-field';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientFields = validateContactForm(form);
    if (Object.keys(clientFields).length > 0) {
      setFieldErrors(clientFields);
      setSubmitError(contactFormSummaryError(clientFields));
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setFieldErrors({});
    try {
      await api.submitContact({
        name: form.name.trim(),
        email: form.email.trim(),
        topic: form.topic || undefined,
        message: form.message.trim(),
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err.fields) setFieldErrors(err.fields);
      setSubmitError(err.message || 'Could not send your message. Please try again or email us directly.');
    } finally {
      setSubmitting(false);
    }
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
          <motion.p {...fadeUp} transition={{ delay: 0.2 }} className="page-lead mx-auto">
            Have a question about your order, need help with a template, or just want to say hello? 
            We typically respond within 1–2 business days.
          </motion.p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-5 gap-12">
          {/* Contact Info */}
          <motion.div {...fadeUp} className="md:col-span-2 space-y-6">
            <div className="panel shadow-soft p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-wine/10 flex items-center justify-center flex-shrink-0">
                  <Mail size={18} strokeWidth={1.3} className="text-wine" />
                </div>
                <div>
                  <h3 className="font-body text-sm font-medium text-ink mb-1">Email Us</h3>
                  <a
                    href="mailto:thelilyletters.co@gmail.com"
                    className="font-body text-sm text-gold hover:text-wine transition-colors"
                  >
                    thelilyletters.co@gmail.com
                  </a>
                  <p className="font-body text-xs text-ink-faint mt-1">
                    For all order & template questions
                  </p>
                </div>
              </div>
            </div>

            <div className="panel shadow-soft p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-wine/10 flex items-center justify-center flex-shrink-0">
                  <Instagram size={18} strokeWidth={1.3} className="text-wine" />
                </div>
                <div>
                  <h3 className="font-body text-sm font-medium text-ink mb-1">Instagram</h3>
                  <a
                    href="https://www.instagram.com/thelilyletters.co"
                    target="_blank"
                    rel="noreferrer"
                    className="font-body text-sm text-gold hover:text-wine transition-colors"
                  >
                    @thelilyletters.co
                  </a>
                  <p className="font-body text-xs text-ink-faint mt-1">
                    DMs welcome, response may be slower
                  </p>
                </div>
              </div>
            </div>

            <div className="panel shadow-soft p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-wine/10 flex items-center justify-center flex-shrink-0">
                  <Clock size={18} strokeWidth={1.3} className="text-wine" />
                </div>
                <div>
                  <h3 className="font-body text-sm font-medium text-ink mb-1">Response Time</h3>
                  <p className="font-body text-sm text-ink-muted">1–2 Business Days</p>
                  <p className="font-body text-xs text-ink-faint mt-1">
                    Mon–Fri, 9am–5pm EST
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-cream border border-gold/30 p-5">
              <p className="font-body text-xs text-gold uppercase tracking-wider font-medium mb-2">
                Quick Tip
              </p>
              <p className="font-body text-sm text-ink-muted leading-relaxed">
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
                className="panel shadow-soft p-10 text-center"
              >
                <div className="w-16 h-16 bg-sage/15 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={28} strokeWidth={1.5} className="text-sage" />
                </div>
                <h2 className="font-display text-2xl font-light text-wine mb-3">
                  Message Sent!
                </h2>
                <p className="font-body text-sm text-ink-muted mb-6 leading-relaxed">
                  Thank you for reaching out, {form.name}! We've received your message and will 
                  get back to you at <strong>{form.email}</strong> within 1–2 business days.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: '', email: '', topic: '', message: '' });
                    setFieldErrors({});
                    setSubmitError('');
                  }}
                  className="btn-ghost"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <div className="panel shadow-soft p-8">
                <h2 className="font-display text-2xl font-light text-wine mb-6">
                  Send Us a Message
                </h2>
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="form-label"
                      >
                        Your Name *
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Jane Smith"
                        value={form.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className={fieldClass('name')}
                        aria-invalid={Boolean(fieldErrors.name)}
                        aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
                      />
                      {fieldErrors.name && (
                        <p id="contact-name-error" className="font-body text-xs text-red-800 mt-1.5" role="alert">
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="form-label"
                      >
                        Email Address *
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        autoComplete="email"
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className={fieldClass('email')}
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? 'contact-email-error' : undefined}
                      />
                      {fieldErrors.email && (
                        <p id="contact-email-error" className="font-body text-xs text-red-800 mt-1.5" role="alert">
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-topic"
                      className="form-label"
                    >
                      Topic
                    </label>
                    <select
                      id="contact-topic"
                      value={form.topic}
                      onChange={(e) => updateField('topic', e.target.value)}
                      className={fieldClass('topic')}
                      aria-invalid={Boolean(fieldErrors.topic)}
                      aria-describedby={fieldErrors.topic ? 'contact-topic-error' : undefined}
                    >
                      <option value="">Select a topic...</option>
                      {topics.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {fieldErrors.topic && (
                      <p id="contact-topic-error" className="font-body text-xs text-red-800 mt-1.5" role="alert">
                        {fieldErrors.topic}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="form-label"
                    >
                      Your Message *
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      placeholder="Tell us how we can help you..."
                      value={form.message}
                      onChange={(e) => updateField('message', e.target.value)}
                      className={`${fieldClass('message')} resize-none`}
                      aria-invalid={Boolean(fieldErrors.message)}
                      aria-describedby={fieldErrors.message ? 'contact-message-error' : undefined}
                    />
                    {fieldErrors.message && (
                      <p id="contact-message-error" className="font-body text-xs text-red-800 mt-1.5" role="alert">
                        {fieldErrors.message}
                      </p>
                    )}
                  </div>

                  {submitError && (
                    <p className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
                      {submitError}
                    </p>
                  )}

                  <button type="submit" className="btn-primary w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Mail size={14} strokeWidth={1.5} />
                        Send Message
                      </>
                    )}
                  </button>

                  <p className="font-body text-xs text-ink-faint text-center">
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
