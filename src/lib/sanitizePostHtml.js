import sanitizeHtml from 'sanitize-html';

export const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'figure']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    a: ['href', 'name', 'target', 'rel'],
  },
};

export function sanitizePostContent(html) {
  return sanitizeHtml(html || '', sanitizeOptions);
}
