// Reads the content/ folder (the single source of truth for lessons).
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', 'content');
const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));

export async function loadContent() {
  const tracks = await readJson(path.join(root, 'tracks.json'));
  const sources = await readJson(path.join(root, 'sources.json'));
  const dir = path.join(root, 'lessons');
  const lessons = await Promise.all(
    (await readdir(dir)).filter((f) => f.endsWith('.json')).sort().map((f) => readJson(path.join(dir, f)))
  );
  return { tracks, sources, lessons };
}
