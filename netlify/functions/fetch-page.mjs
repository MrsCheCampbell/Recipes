// Fetches a recipe page (or its photo) for the app, from Netlify's servers.
// Browsers can't read most recipe sites directly (CORS), and the free public proxies are often blocked.
// Only GET, only http(s), only public addresses, only pages and images, size-capped.

const MAX_BYTES = 6 * 1024 * 1024;
const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|\[?::1\]?|\[?f[cd][0-9a-f]{2}:.*|\[?fe80:.*)$/i;
const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/*,*/*;q=0.8',
  'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
};

const fail = (status, error) => new Response(JSON.stringify({ error }), { status, headers: { 'content-type': 'application/json' } });

export default async (req) => {
  if (req.method !== 'GET') return fail(405, 'GET only');
  // Only the app itself (same site) may use this.
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(req.url).host) return fail(403, 'forbidden');

  let target;
  try { target = new URL(new URL(req.url).searchParams.get('url') || ''); } catch { return fail(400, 'bad url'); }
  if (!/^https?:$/.test(target.protocol) || PRIVATE_HOST.test(target.hostname) || target.username || target.password) return fail(400, 'bad url');

  // Follow redirects by hand so every hop is checked before it is requested.
  let res;
  const deadline = AbortSignal.timeout(9000);
  for (let hop = 0; ; hop++) {
    try {
      res = await fetch(target, { headers: HEADERS, redirect: 'manual', signal: deadline });
    } catch {
      return fail(504, 'unreachable');
    }
    const next = res.status >= 300 && res.status < 400 && res.headers.get('location');
    if (!next) break;
    if (hop >= 5) return fail(508, 'too many redirects');
    try { target = new URL(next, target); } catch { return fail(502, 'bad redirect'); }
    if (!/^https?:$/.test(target.protocol) || PRIVATE_HOST.test(target.hostname)) return fail(400, 'bad url');
  }
  if (!res.ok) return fail(502, 'status ' + res.status);

  const type = (res.headers.get('content-type') || '').toLowerCase();
  if (!/text\/html|application\/xhtml|application\/(ld\+)?json|text\/plain|image\//.test(type)) return fail(415, 'unsupported type');
  if (+res.headers.get('content-length') > MAX_BYTES) return fail(413, 'too large');

  const reader = res.body.getReader(), chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BYTES) { reader.cancel(); return fail(413, 'too large'); }
    chunks.push(value);
  }
  return new Response(new Blob(chunks), {
    status: 200,
    headers: { 'content-type': type || 'text/html', 'cache-control': 'public, max-age=3600', 'x-final-url': target.href },
  });
};

export const config = { path: '/api/fetch' };
