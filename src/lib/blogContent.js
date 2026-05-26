/**
 * Adds stable ids to h2/h3 so the table of contents can link to sections.
 */
export function prepareBlogContentHtml(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  let index = 0;
  div.querySelectorAll('h2, h3').forEach((el) => {
    if (!el.id) {
      el.id = `section-${index}`;
      index += 1;
    }
  });
  return div.innerHTML;
}
