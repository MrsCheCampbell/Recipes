'use strict';
// Our Kitchen: Helpers, storage, search, calendar, quantities and units, images, sheets, navigation.
// The scripts share one scope and load in order (see index.html).

// ---------- Small helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/[’'`-]/g, ' ');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const ls = {
  get(k, d) { try { const v = localStorage.getItem('abe:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('abe:' + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem('abe:' + k); } catch {} },
};
let S = ls.get('settings', {});
// Weather city: a phone in Spain starts on Madrid, anywhere else on Paris (both can be changed in More).
const homeCity = () => { try { return /^(Europe\/Madrid|Atlantic\/Canary|Africa\/Ceuta)$/.test(Intl.DateTimeFormat().resolvedOptions().timeZone) ? 'madrid' : 'paris'; } catch { return 'paris'; } };
S = Object.assign({ name: '', size: 'large', theme: 'dark', city: homeCity() }, S);
// Dark is the default now: phones that were left on Automatic switch once (they can pick Automatic again).
if (!S.darkDefault) { if (S.theme === 'auto') S.theme = 'dark'; S.darkDefault = true; }
// "Abe" was the default name in early versions; nobody chose it.
if (S.name === 'Abe') S.name = '';
const saveSettings = () => ls.set('settings', S);
S.lang = 'en';  // The app is English only.
const T = () => STR.en;
const locale = () => 'en-US';
function fmtNum(n) {
  if (!isFinite(n)) return '';
  if (n >= 10) return String(Math.round(n));
  const whole = Math.floor(n), f = n - whole;
  const fr = [[0, ''], [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾'], [1, '']];
  for (const [v, g] of fr) if (Math.abs(f - v) < 0.03) {
    const w = v === 1 ? whole + 1 : whole;
    return g ? (w ? w + g : g) : String(w);
  }
  return (Math.round(n * 10) / 10).toLocaleString(locale());
}
const fmtDate = (ts, opts = { day: 'numeric', month: 'long', year: 'numeric' }) => ts ? new Date(ts).toLocaleDateString(locale(), opts) : '';
const fmtDur = m => { m = Math.round(m || 0); if (!m) return '—'; const h = Math.floor(m / 60), r = m % 60; return h ? `${h} h${r ? ' ' + String(r).padStart(2, '0') : ''}` : `${r} min`; };
const sortKey = s => String(s || '').replace(/^[^\p{L}\p{N}]+/u, '');
const initial = s => (sortKey(s)[0] || '?').toUpperCase();

function applyLook() {
  const r = document.documentElement;
  r.lang = S.lang;
  r.dataset.size = S.size;
  if (S.theme === 'auto') r.removeAttribute('data-theme'); else r.dataset.theme = S.theme;
  document.title = T().appName;
}

// ---------- Storage (IndexedDB, with memory fallback) ----------
const DB = {
  db: null, mem: null,
  open() {
    return new Promise(res => {
      try {
        const rq = indexedDB.open('abe-recettes', 1);
        rq.onupgradeneeded = () => { const d = rq.result; d.createObjectStore('recipes', { keyPath: 'id' }); d.createObjectStore('kv'); };
        rq.onsuccess = () => { this.db = rq.result; res(true); };
        rq.onerror = () => { this.mem = new Map(); res(false); };
        rq.onblocked = () => { this.mem = new Map(); res(false); };
      } catch { this.mem = new Map(); res(false); }
    });
  },
  _run(store, mode, fn) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, mode); const rq = fn(tx.objectStore(store));
      tx.oncomplete = () => res(rq && 'result' in rq ? rq.result : undefined);
      tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error);
    });
  },
  async all() { return this.db ? this._run('recipes', 'readonly', s => s.getAll()) : [...this.mem.values()]; },
  async put(r) { return this.db ? this._run('recipes', 'readwrite', s => s.put(r)) : this.mem.set(r.id, r); },
  async del(id) { return this.db ? this._run('recipes', 'readwrite', s => s.delete(id)) : this.mem.delete(id); },
  async clear() { return this.db ? this._run('recipes', 'readwrite', s => s.clear()) : this.mem.clear(); },
  async kvGet(k) { return this.db ? this._run('kv', 'readonly', s => s.get(k)) : this.mem.get('kv:' + k); },
  async kvSet(k, v) { return this.db ? this._run('kv', 'readwrite', s => s.put(v, k)) : this.mem.set('kv:' + k, v); },
};

// ---------- App state ----------
let recipes = [];
const byId = id => recipes.find(r => r.id === id) || (FAM.on ? FAM.all.find(r => r.id === id) : undefined);
const customOcc = () => S.customOcc || [];
const occLabel = (k, lang = S.lang) => (OCCASIONS.includes(k) || SEASONS.includes(k) || HOLIDAYS.includes(k) ? STR.en.hol[k] : '') || customOcc().find(c => c.key === k)?.label || '';
const generalOcc = () => [...OCCASIONS, ...HOLIDAYS, ...customOcc().map(c => c.key)];
// Occasions someone added that "Birthdays" already covers ("Harold's birthday"…) are folded into it, once.
if (customOcc().some(c => /birthday|bday|anniversaire|cumplea/i.test(norm(c.label)))) {
  const alias = { ...(S.occAlias || {}) };
  S.customOcc = customOcc().filter(c => { if (!/birthday|bday|anniversaire|cumplea/i.test(norm(c.label))) return true; alias[c.key] = 'birthday'; return false; });
  S.occAlias = alias; ls.set('settings', S);
}
// Old occasion keys that now mean another one ("Mom's birthday" and the above → Birthdays).
const mapOcc = list => [...new Set((list || []).map(h => h === 'momsbday' ? 'birthday' : (S.occAlias || {})[h] || h))];
// Older recipes had a separate "kosher for Pesach" box; it is now just the Pesach occasion.
function migrate(r) {
  let changed = false;
  if ('pesach' in r) {
    if (r.pesach && !(r.holidays || []).includes('pesach')) r.holidays = [...(r.holidays || []), 'pesach'];
    delete r.pesach; changed = true;
  }
  if (r.holidays && mapOcc(r.holidays).join() !== r.holidays.join()) { r.holidays = mapOcc(r.holidays); changed = true; }
  return changed;
}
const L = { q: '', kash: '', cat: '', hol: '', mood: '', fav: false, quick: false, who: '', sort: 'az', scroll: 0 };
let shop = ls.get('shop', []);
const saveShop = () => { ls.set('shop', shop); updateNavCount(); };

// ---------- Search ----------
const SYN = [
  ['hanoucca', 'hanukkah', 'chanukah', 'hanouka', 'hanukka', 'channukah'],
  ['pessah', 'pesach', 'passover', 'paque', 'pessa h', 'pesah'],
  ['chabbat', 'shabbat', 'sabbat', 'shabbos', 'shabat'],
  ['hallah', 'challah', 'halla', 'hala', 'hallot', 'challot'],
  ['matsa', 'matzo', 'matza', 'matzah', 'matsot'],
  ['roch hachana', 'rosh hashanah', 'rosh hashana'], ['kippour', 'kippur'], ['souccot', 'sukkot', 'succot'],
  ['pourim', 'purim'], ['chavouot', 'shavuot'], ['amis', 'friends', 'invites', 'guests'], ['anniversaire', 'birthday'], ['thanksgiving', 'dinde', 'turkey'], ['ete', 'summer'], ['hiver', 'winter'], ['automne', 'autumn', 'fall'], ['printemps', 'spring'], ['potager', 'jardin', 'garden'], ['canicule', 'chaud', 'chaleur', 'hot'], ['froid', 'cold'], ['pluie', 'rain', 'rainy'], ['bassari', 'meat', 'viande', 'fleishig'], ['halavi', 'dairy', 'lait', 'milchig'], ['parve', 'pareve', 'parev'],
  ['poulet', 'chicken'], ['boeuf', 'beef'], ['agneau', 'lamb'], ['poisson', 'fish'], ['oeuf', 'oeufs', 'egg', 'eggs'], ['pomme de terre', 'pommes de terre', 'potato', 'potatoes', 'patate'],
  ['gateau', 'cake'], ['soupe', 'soup', 'potage'], ['miel', 'honey'], ['carotte', 'carrot'], ['oignon', 'onion'], ['ail', 'garlic'], ['cannelle', 'cinnamon'],
].map(g => g.map(norm));
function expand(tok) {
  const out = new Set([tok]);
  for (const g of SYN) if (g.some(w => w === tok || (tok.length >= 4 && w.startsWith(tok)))) g.forEach(w => out.add(w));
  return [...out];
}
function lev1(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return false;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let cur = [i], best = i;
    for (let j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); best = Math.min(best, cur[j]); }
    if (best > max) return false;
    prev.splice(0, prev.length, ...cur);
  }
  return prev[b.length] <= max;
}
function indexRecipe(r) {
  const both = (dict, k) => k ? STR.en[dict][k] : '';
  const f = {
    title: norm(r.title),
    meta: norm([r.tags?.join(' '), both('cat', r.category), (r.holidays || []).map(h => occLabel(h)).join(' '), r.source].join(' ')),
    ing: norm(r.ingredients),
    rest: norm([r.steps, r.notes, r.note, r.link].join(' ')),
  };
  f.words = [...new Set((f.title + ' ' + f.meta + ' ' + f.ing).split(/[^a-z0-9]+/).filter(w => w.length > 3))];
  Object.defineProperty(r, '_ix', { value: f, configurable: true, enumerable: false, writable: true });
}
function score(r, toks) {
  const f = r._ix; let total = 0;
  for (const tok of toks) {
    let best = 0;
    for (const v of expand(tok)) {
      if (f.title.includes(v)) best = Math.max(best, f.title.startsWith(v) ? 14 : 10);
      else if (f.meta.includes(v)) best = Math.max(best, 6);
      else if (f.ing.includes(v)) best = Math.max(best, 4);
      else if (f.rest.includes(v)) best = Math.max(best, 1);
    }
    if (!best && tok.length >= 4) { const max = tok.length >= 7 ? 2 : 1; if (f.words.some(w => lev1(tok, w.slice(0, tok.length + max), max))) best = 2; }
    if (!best) return 0;
    total += best;
  }
  return total;
}
const totalTime = r => (+r.prep || 0) + (+r.cook || 0);
const letterOf = r => { const c = norm(sortKey(r.title)).trim()[0] || '#'; return /[a-z]/.test(c) ? c.toUpperCase() : '#'; };
const collator = () => new Intl.Collator(locale(), { sensitivity: 'base', numeric: true });

// A word in the search that is someone's name ("maman") means "recipes added by them".
function nameTokens(toks) {
  if (!FAM.on) return { who: [], rest: toks };
  const names = Object.entries(FAM.members).map(([id, m]) => [id, norm(m.name).split(/\s+/)]);
  const who = [], rest = [];
  for (const tk of toks) { const hit = names.filter(([, ws]) => ws.includes(tk)).map(([id]) => id); if (hit.length) who.push(hit); else rest.push(tk); }
  return { who, rest };
}
function filtered() {
  const parts = nameTokens(norm(L.q).split(/\s+/).filter(Boolean)), toks = parts.rest;
  let list = recipes.filter(r =>
    (!L.who || r.owner === L.who) && parts.who.every(ids => ids.includes(r.owner)) &&
    (!L.fav || r.favorite) && (!L.kash || r.kashrut === L.kash) && (!L.cat || r.category === L.cat) &&
    (!L.hol || (r.holidays || []).includes(L.hol)) && (!L.quick || (totalTime(r) > 0 && totalTime(r) <= 30)));
  if (L.mood && !toks.length) {
    const scores = new Map(moodList(L.mood).map(x => [x.r, x.score]));
    return list.filter(r => scores.has(r)).sort((a, b) => scores.get(b) - scores.get(a));
  }
  if (toks.length) {
    list = list.map(r => [r, score(r, toks)]).filter(x => x[1] > 0);
    if (L.sort === 'az') list.sort((a, b) => b[1] - a[1] || collator().compare(sortKey(a[0].title), sortKey(b[0].title)));
    list = list.map(x => x[0]);
  }
  const C = collator();
  if (!toks.length || L.sort !== 'az') {
    const s = {
      az: (a, b) => C.compare(sortKey(a.title), sortKey(b.title)),
      recent: (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
      cooked: (a, b) => (b.cookCount || 0) - (a.cookCount || 0) || C.compare(a.title, b.title),
      rating: (a, b) => (b.rating || 0) - (a.rating || 0) || C.compare(a.title, b.title),
      time: (a, b) => (totalTime(a) || 1e9) - (totalTime(b) || 1e9),
    }[L.sort];
    list.sort(s);
  }
  return list;
}

// ---------- Cities (for the weather) ----------
const CITIES = {
  paris: ['Paris', 48.8566, 2.3522, 'Europe/Paris'], lyon: ['Lyon', 45.764, 4.8357, 'Europe/Paris'], marseille: ['Marseille', 43.2965, 5.3698, 'Europe/Paris'],
  nice: ['Nice', 43.7102, 7.262, 'Europe/Paris'], toulouse: ['Toulouse', 43.6047, 1.4442, 'Europe/Paris'], strasbourg: ['Strasbourg', 48.5734, 7.7521, 'Europe/Paris'],
  bordeaux: ['Bordeaux', 44.8378, -0.5792, 'Europe/Paris'], lille: ['Lille', 50.6292, 3.0573, 'Europe/Paris'], nantes: ['Nantes', 47.2184, -1.5536, 'Europe/Paris'],
  montpellier: ['Montpellier', 43.6108, 3.8767, 'Europe/Paris'], sarcelles: ['Sarcelles', 48.9973, 2.3797, 'Europe/Paris'],
  jerusalem: ['Jérusalem', 31.7683, 35.2137, 'Asia/Jerusalem'], telaviv: ['Tel Aviv', 32.0853, 34.7818, 'Asia/Jerusalem'],
  madrid: ['Madrid', 40.4168, -3.7038, 'Europe/Madrid'], barcelona: ['Barcelona', 41.3874, 2.1686, 'Europe/Madrid'], valencia: ['Valencia', 39.4699, -0.3763, 'Europe/Madrid'],
  sevilla: ['Sevilla', 37.3891, -5.9845, 'Europe/Madrid'], malaga: ['Málaga', 36.7213, -4.4214, 'Europe/Madrid'], bilbao: ['Bilbao', 43.263, -2.935, 'Europe/Madrid'],
  london: ['London', 51.5072, -0.1276, 'Europe/London'], newyork: ['New York', 40.7128, -74.006, 'America/New_York'],
};

// ---------- Ingredient quantities ----------
const FRAC = { '½': .5, '¼': .25, '¾': .75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': .125 };
const QTY_RE = /^(\s*)(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?(?:\s*[½¼¾⅓⅔⅛])?|[½¼¾⅓⅔⅛])(\s*(?:-|–|à|to)\s*(\d+(?:[.,]\d+)?))?/;
function parseNum(s) {
  s = s.trim(); let m;
  if ((m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/))) return +m[1] + m[2] / m[3];
  if ((m = s.match(/^(\d+)\/(\d+)$/))) return m[1] / m[2];
  if ((m = s.match(/^(\d+(?:[.,]\d+)?)?\s*([½¼¾⅓⅔⅛])?$/)) && (m[1] || m[2])) return (m[1] ? parseFloat(m[1].replace(',', '.')) : 0) + (m[2] ? FRAC[m[2]] : 0);
  return NaN;
}
function splitQty(line, factor) {
  const m = line.match(QTY_RE);
  if (!m) return { q: '', rest: line };
  const a = parseNum(m[2]); if (isNaN(a)) return { q: '', rest: line };
  let q = factor === 1 ? m[2].trim() : fmtNum(a * factor);
  let n2 = null;
  if (m[3]) { const b = parseNum(m[4]); n2 = b * factor; q += '–' + (factor === 1 ? m[4] : fmtNum(n2)); }
  return { q, rest: line.slice(m[0].length), n: a * factor, n2 };
}

// ---------- Unit conversion (as written / metric / US cups & oz) ----------
const DENS = [ // grams per US cup, matched on the ingredient name
  [/matz|matsa/, 120], [/amande|almond/, 95], [/sucre glace|icing|powdered|confectioner/, 120], [/farine|flour/, 125],
  [/sucre roux|cassonade|vergeoise|brown sugar/, 220], [/sucre|sugar/, 200], [/beurre|butter/, 227], [/riz|rice/, 185],
  [/avoine|oat/, 90], [/cacao|cocoa/, 85], [/miel|honey/, 340], [/semoule|semolina|couscous/, 170], [/chapelure|breadcrumb/, 110],
  [/fromage|cheese|parmesan/, 100], [/pepite|chocolate chip|chocolat/, 170], [/noisette|hazelnut|noix|nut/, 120], [/raisin/, 150],
];
const LIQ = /\b(eau|water|lait|milk|creme|cream|huile|oil|bouillon|broth|stock|jus|juice|vin|wine|vinaigre|vinegar|sirop|syrup|biere|beer)\b/;
const UNIT_RE = /^(\s*)(cups?|tasses?|fl\.?\s?oz|ounces?|oz|pounds?|lbs?|sticks?|pints?|quarts?|qt|kg|kilos?|grammes?|grams?|gr|g|ml|cl|dl|litres?|liters?|l)\b\.?/i;
const TEMP_F = /(\d{3})\s*(?:°\s*|degrees?\s*|degr[eé]s\s*)?F\b/g;
const TEMP_C = /(\d{2,3})\s*(?:°\s*|degr[eé]s\s*|degrees?\s*)C\b/g;
function unitKind(u) {
  u = u.toLowerCase().replace(/[.\s]/g, '');
  if (/^(cups?|tasses?)$/.test(u)) return 'cup';
  if (u === 'floz') return 'floz';
  if (/^(ounces?|oz)$/.test(u)) return 'oz';
  if (/^(pounds?|lbs?)$/.test(u)) return 'lb';
  if (/^sticks?$/.test(u)) return 'stick';
  if (/^pints?$/.test(u)) return 'pint';
  if (/^(quarts?|qt)$/.test(u)) return 'quart';
  if (/^(kg|kilos?)$/.test(u)) return 'kg';
  if (/^(g|gr|grammes?|grams?)$/.test(u)) return 'g';
  if (['ml', 'cl', 'dl'].includes(u)) return u;
  return 'l';
}
const density = name => (DENS.find(([re]) => re.test(name)) || [])[1];
const fmt1 = v => (Math.round(v * 10) / 10).toLocaleString(locale());
const round5 = x => x < 20 ? Math.round(x) : x < 100 ? Math.round(x / 5) * 5 : Math.round(x / 10) * 10;
const asG = x => x >= 1000 ? { v: fmt1(x / 1000), u: 'kg' } : { v: String(round5(x)), u: 'g' };
const asMl = x => x >= 1000 ? { v: fmt1(x / 1000), u: 'l' } : { v: String(round5(x)), u: 'ml' };
const niceFrac = v => { const q = Math.round(v * 4) / 4, t = Math.round(v * 3) / 3; return Math.abs(q - v) <= Math.abs(t - v) ? q : t; };
const UL = { en: { cup: ['cup', 'cups'], tbsp: 'tbsp', tsp: 'tsp' } };
function usVolume(cups) {
  const ul = UL.en;
  if (cups >= 0.25) { const v = niceFrac(cups); return { v: fmtNum(v), u: ul.cup[v > 1 ? 1 : 0] }; }
  const tbsp = cups * 16;
  if (tbsp >= 1) return { v: fmtNum(niceFrac(tbsp)), u: ul.tbsp };
  return { v: fmtNum(Math.max(0.25, niceFrac(tbsp * 3))), u: ul.tsp };
}
function toMetric(n, kind, name) {
  const liquid = LIQ.test(name), d = density(name);
  switch (kind) {
    case 'cup': return liquid || !d ? asMl(n * 240) : asG(n * d);
    case 'floz': return asMl(n * 29.57);
    case 'oz': return asG(n * 28.35);
    case 'lb': return asG(n * 453.6);
    case 'stick': return asG(n * 113);
    case 'pint': return asMl(n * 473);
    case 'quart': return asMl(n * 946);
  }
  return null;
}
function toUS(n, kind, name) {
  const d = density(name);
  if (kind === 'g' || kind === 'kg') {
    const g = kind === 'kg' ? n * 1000 : n;
    if (d && !LIQ.test(name)) return usVolume(g / d);
    const oz = g / 28.35;
    return oz >= 16 ? { v: fmtNum(niceFrac(oz / 16)), u: 'lb' } : { v: fmtNum(Math.max(0.25, niceFrac(oz))), u: 'oz' };
  }
  const ml = { ml: 1, cl: 10, dl: 100, l: 1000 }[kind];
  if (ml) return usVolume(n * ml / 240);
  return null;
}
function ingLine(line, factor) {
  const r = splitQty(line, factor);
  const mode = S.units || 'orig';
  if (!r.q || mode === 'orig') return r;
  const m = r.rest.match(UNIT_RE); if (!m) return r;
  const kind = unitKind(m[2]), name = norm(r.rest.slice(m[0].length));
  const f = mode === 'metric' ? toMetric : toUS;
  const a = f(r.n, kind, name); if (!a) return r;
  const b = r.n2 != null ? f(r.n2, kind, name) : null;
  return { q: b && b.u === a.u ? `${a.v}–${b.v} ${a.u}` : `${a.v} ${a.u}`, rest: r.rest.slice(m[0].length), conv: true, orig: (r.q + m[0]).trim() };
}
function convertTemps(text) {
  const mode = S.units || 'orig';
  if (mode === 'metric') return text.replace(TEMP_F, (x, f) => `${Math.round((f - 32) * 5 / 9 / 10) * 10} °C`);
  if (mode === 'us') return text.replace(TEMP_C, (x, c) => `${Math.round((c * 9 / 5 + 32) / 25) * 25} °F`);
  return text;
}
const hasUnits = r => lines(r.ingredients).some(l => { const x = splitQty(l, 1); return x.q && UNIT_RE.test(x.rest); }) || new RegExp(TEMP_F.source).test(r.steps || '') || new RegExp(TEMP_C.source).test(r.steps || '');
const lines = s => String(s || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
const isHeading = l => /:$/.test(l) || /^#+\s/.test(l);
const cleanHeading = l => l.replace(/^#+\s*/, '').replace(/\s*:$/, '');
const cleanStep = l => l.replace(/^(\d+[.)-]\s*|[-•*]\s+|(étape|step)\s*\d+\s*[:.-]?\s*)/i, '');

// Turns "20 min", "1 h 30", "2 heures" into tappable timers.
const TIME_RE = /(\d+(?:[.,]\d+)?)(?:\s*(?:-|–|à|to)\s*(\d+(?:[.,]\d+)?))?\s*(heures?|hours?|hrs?|h|minutes?|mins?|min|mn)\b(?:\s*(\d{1,2})(?!\s*(?:°|min|g\b)))?/gi;
function withTimers(text) {
  const out = []; let last = 0;
  text.replace(TIME_RE, (m, a, b, unit, extra, idx) => {
    const n = parseFloat((b || a).replace(',', '.'));
    let mins = /^h/i.test(unit) ? n * 60 : n;
    if (/^h/i.test(unit) && extra) mins += +extra;
    if (mins > 0 && mins <= 24 * 60) {
      out.push(esc(text.slice(last, idx)));
      out.push(`<button class="timer-chip" data-act="timer" data-min="${mins}" data-label="${esc(text.slice(0, 60))}">${ico('clock')}${esc(m)}</button>`);
      last = idx + m.length;
    }
    return m;
  });
  out.push(esc(text.slice(last)));
  return out.join('');
}

// ---------- Images ----------
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
async function compress(fileOrBlob, max, q = 0.82) {
  const url = URL.createObjectURL(fileOrBlob);
  try {
    const img = await loadImg(url);
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', q);
  } finally { URL.revokeObjectURL(url); }
}
async function thumbFrom(dataUrl) {
  try { const b = await (await fetch(dataUrl)).blob(); return await compress(b, 240, 0.75); } catch { return dataUrl; }
}
const thumbHTML = r => r.thumb || r.photo
  ? `<img class="thumb" src="${esc(r.thumb || r.photo)}" alt="" loading="lazy" decoding="async">`
  : artHTML(r, 'thumb');

// ---------- UI primitives ----------
let toastTimer;
function toast(msg, action) {
  $('.toast')?.remove(); clearTimeout(toastTimer);
  const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status');
  el.innerHTML = esc(msg) + (action ? ` &nbsp;<button class="btn small" style="min-height:32px">${esc(action.label)}</button>` : '');
  if (action) el.querySelector('button').onclick = () => { action.fn(); el.remove(); };
  document.body.append(el);
  toastTimer = setTimeout(() => el.remove(), action ? 6000 : 2600);
}
function sheet(html, onReady) {
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  scrim.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  const close = () => { scrim.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  scrim.addEventListener('click', e => { if (e.target === scrim) close(); });
  document.addEventListener('keydown', onKey);
  document.body.append(scrim);
  onReady?.(scrim.firstChild, close);
  return close;
}
function confirmBox(msg, yes, danger = true) {
  return new Promise(res => {
    sheet(`<h2>${esc(msg)}</h2><div class="row2"><button class="btn" data-n>${esc(T().cancel)}</button><button class="btn ${danger ? 'danger' : 'primary'}" data-y>${esc(yes)}</button></div>`, (el, c) => {
      el.querySelector('[data-n]').onclick = () => { c(); res(false); };
      el.querySelector('[data-y]').onclick = () => { c(); res(true); };
    });
  });
}

// ---------- Navigation ----------
function navHTML(active) {
  const t = T().nav;
  const items = [['', 'book', t.list, 'list'], ['fil', 'feed', t.feed, 'fil'], ['carnets', 'notebook', t.carnets, 'carnets'], ['frigo', 'fridge', t.fridge, 'frigo'], ['shop', 'cart', t.shop, 'shop'], ['more', 'more', t.more, 'more']];
  if (active === 'fav') active = 'carnets';
  const NAV_ART = { book: 'nav-book', feed: 'nav-feed', notebook: 'nav-notebook', fridge: 'nav-fridge', cart: 'nav-basket', more: 'nav-whisk' };
  $('#navin').innerHTML = items.map(([h, i, label, k]) => `<a href="#/${h}" class="${active === k ? 'on' : ''}" ${active === k ? 'aria-current="page"' : ''}><img class="navart" src="${artSrc(NAV_ART[i])}" alt="" aria-hidden="true"><span>${esc(label)}</span>${k === 'shop' ? '<i class="count" id="shopCount" hidden></i>' : k === 'fil' ? '<i class="count dot" id="feedCount" hidden></i>' : ''}</a>`).join('');
  updateNavCount();
}
function updateNavCount() {
  const el = $('#shopCount'); if (el) { const n = shop.filter(x => !x.done).length; el.hidden = !n; el.textContent = n; }
  const f = $('#feedCount'), u = feedUnread();
  if (f) { f.hidden = !u; f.textContent = u > 9 ? '9+' : u; f.setAttribute('aria-label', T().newPosts(u)); }
  try { if (u) navigator.setAppBadge?.(u); else navigator.clearAppBadge?.(); } catch {}
}
// New in the family feed since I last opened it (others' recipes and photos, and recommendations for me).
function feedUnread() {
  if (!FAM.on || S.feedOff) return 0;
  const seen = ls.get('feedSeen', 0), muted = new Set(S.muted || []);
  const other = id => id && id !== FAM.uid && !muted.has(id);
  return FAM.all.filter(r => !r.sample && other(r.owner) && (r.createdAt || 0) > seen).length
    + [...FAM.cooks.values()].filter(c => other(c.uid) && (c.at || 0) > seen).length
    + FAM.recos.filter(x => !x.done && (x.at || 0) > seen).length;
}

let current = '';
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [a = '', b = ''] = h.split('/').map(decodeURIComponent);
  if (current === 'list' || current === 'fav') L.scroll = window.scrollY;
  flushEvent(); flushGuest(); flushWine();
  closeCook();
  $$('.scrim, .viewer').forEach(s => s.remove());
  $('#view').dataset.id = '';
  const v = $('#view'); v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter');
  $('#nav').hidden = a === 'edit';
  commentUnsub?.(); commentUnsub = null;
  if (a === 'famille') return renderFamily();
  if (a === 'join' && b) return renderJoin(b);
  if (a === 'r' && byId(b)) return renderRecipe(byId(b));
  if (a === 'cook' && byId(b)) { renderRecipe(byId(b)); return openCook(byId(b)); }
  if (a === 'edit') { const er = b === 'new' ? null : byId(b); if (er && !isMine(er)) return renderRecipe(er); return renderEdit(er); }
  if (a === 'shop') return renderShop();
  if (a === 'inbox') return renderInbox(false);
  if (a === 'frigo') return renderFridge();
  if (a === 'recu' && b) {
    receiveCode(b, true).then(ok => {
      const ios = isIOS && !installed();
      if (ios) iosLandingCode = b;
      history.replaceState(null, '', location.pathname + '#/inbox');
      renderInbox(ios);
      if (ok === true && !ios) toast(T().gotOne); else if (!ok) toast(T().pasteBad);
    });
    return;
  }
  if (a === 'more') return renderMore();
  if (a === 'fil') return renderFeed();
  if (a === 'carnets') return renderCarnets();
  if (a === 'carnet' && b) return renderEvent(b);
  if (a === 'invites' && b) return renderGuest(b);
  if (a === 'vin' && b) return renderWine(b);
  return renderList(a === 'fav');
}
window.addEventListener('hashchange', route);
const go = h => { location.hash = h; };
