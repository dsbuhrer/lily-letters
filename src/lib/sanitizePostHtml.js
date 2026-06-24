import DOMPurify from 'dompurify';
import { preserveBlogLineBreaks } from './blogContent';

export const sanitizeOptions = {
  ADD_TAGS: ['figure'],
  ADD_ATTR: ['target', 'rel', 'loading'],
};

export function sanitizePostContent(html) {
  const normalized = preserveBlogLineBreaks(html || '');
  const sanitized = DOMPurify.sanitize(normalized, sanitizeOptions);
  return preserveBlogLineBreaks(sanitized);
}
