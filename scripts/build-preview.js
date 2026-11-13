// Builds a single self-contained HTML (CSS + JS + content inlined) to preview the app without a server.
// Usage: npm run build:preview  ->  dist/preview.html
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { loadContent } from '../db/content.js';

const root = path.resolve(import.meta.dirname, '..');
const pub = (p) => readFile(path.join(root, 'public', p), 'utf8');

const [html, css, js, data] = await Promise.all([pub('index.html'), pub('css/app.css'), pub('js/app.js'), loadContent()]);
const json = JSON.stringify(data).replace(/</g, '\\u003c');

const out = html
  .replace(/<link rel="manifest"[^>]*>\n?/, '')
  .replace(/<link rel="icon"[^>]*>\n?/, '')
  .replace('<link rel="stylesheet" href="/css/app.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script src="/js/app.js"></script>', () => `<script>window.__SOHBA_DATA__=${json};</script>\n<script>\n${js}\n</script>`);

await mkdir(path.join(root, 'dist'), { recursive: true });
await writeFile(path.join(root, 'dist', 'preview.html'), out);
console.log('dist/preview.html written');
