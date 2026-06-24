/**
 * Empty paragraphs and soft breaks collapse when HTML is parsed and re-serialized
 * (prepareBlogContentHtml, DOMPurify, browser innerHTML). Normalize so spacing
 * from the editor survives on the published post.
 */
export function preserveBlogLineBreaks(html) {
  if (!html) return '';
  return html
    .replace(/<p>(?:\s|&nbsp;)*<\/p>/gi, '<p><br></p>')
    .replace(
      /<br([^>]*)\sclass="[^"]*ProseMirror[^"]*"([^>]*)>/gi,
      '<br$1$2>',
    );
}

/**
 * Adds stable ids to h2/h3 so the table of contents can link to sections.
 */
export function prepareBlogContentHtml(html) {
  if (!html) return '';
  const normalized = preserveBlogLineBreaks(html);
  const div = document.createElement('div');
  div.innerHTML = normalized;
  let index = 0;
  div.querySelectorAll('h2, h3').forEach((el) => {
    if (!el.id) {
      el.id = `section-${index}`;
      index += 1;
    }
  });
  return preserveBlogLineBreaks(div.innerHTML);
}
