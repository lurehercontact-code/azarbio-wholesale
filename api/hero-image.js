import fs from 'node:fs';
import path from 'node:path';

let cached = null;

function getHero() {
  if (cached) return cached;
  const source = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const images = [...source.matchAll(/<img\s+[^>]*src="([^"]+)"[^>]*>/gi)].map((m) => m[1]);
  const dataUrl = images[4] || images[0] || '';
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if (!match) throw new Error('hero_image_not_found');
  cached = { type: match[1], buffer: Buffer.from(match[2], 'base64') };
  return cached;
}

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.statusCode = 405;
    return res.end();
  }

  try {
    const hero = getHero();
    res.setHeader('Content-Type', hero.type);
    res.setHeader('Content-Length', String(hero.buffer.length));
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.statusCode = 200;
    if (req.method === 'HEAD') return res.end();
    return res.end(hero.buffer);
  } catch (error) {
    console.error('AzarBio hero image error', error?.message || error);
    res.statusCode = 404;
    return res.end();
  }
}
