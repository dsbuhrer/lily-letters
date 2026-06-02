import DOMPurify from 'dompurify';

export const sanitizeOptions = {
  ADD_TAGS: ['figure'],
  ADD_ATTR: ['target', 'rel', 'loading'],
};

export function sanitizePostContent(html) {
  return DOMPurify.sanitize(html || '', sanitizeOptions);
}
