const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** @returns {Record<string, string>} */
export function validateContactForm(form) {
  const fields = {};
  const name = form.name?.trim() ?? '';
  const email = form.email?.trim() ?? '';
  const message = form.message?.trim() ?? '';
  const topic = form.topic?.trim() ?? '';

  if (!name) {
    fields.name = 'Please enter your name.';
  } else if (name.length > 200) {
    fields.name = 'Name must be 200 characters or fewer.';
  }

  if (!email) {
    fields.email = 'Please enter your email address.';
  } else if (!EMAIL_RE.test(email)) {
    fields.email = 'Please enter a valid email address (e.g. yourname@example.com).';
  } else if (email.length > 320) {
    fields.email = 'Email address is too long.';
  }

  if (topic.length > 120) {
    fields.topic = 'Topic must be 120 characters or fewer.';
  }

  if (!message) {
    fields.message = 'Please enter your message.';
  } else if (message.length > 5000) {
    fields.message = 'Message must be 5,000 characters or fewer.';
  }

  return fields;
}

export function contactFormSummaryError(fields) {
  const messages = Object.values(fields);
  if (messages.length === 0) return '';
  if (messages.length === 1) return messages[0];
  return 'Please correct the highlighted fields below.';
}
