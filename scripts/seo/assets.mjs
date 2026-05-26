import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cached = null;

export function getAssetTags() {
  if (cached) return cached;
  const indexPath = path.join(__dirname, '../../dist/index.html');
  if (!fs.existsSync(indexPath)) {
    cached = { scripts: '', styles: '' };
    return cached;
  }
  const html = fs.readFileSync(indexPath, 'utf8');
  const styles = (html.match(/<link[^>]+rel="stylesheet"[^>]*>/g) || []).join('\n');
  const scripts = (html.match(/<script[^>]+type="module"[^>]*><\/script>/g) || []).join('\n');
  cached = { styles, scripts };
  return cached;
}
