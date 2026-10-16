'use strict';
// La Cuisine d'Abe: Icons and artwork.
// The scripts share one scope and load in order (see index.html).

// ---------- Icons (drawn for this app: round strokes, small friendly details) ----------
const F = 'fill="currentColor" stroke="none"';
const I = {
  search: `<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.4 15.4 4.6 4.6"/><path d="M7.7 9.1a3.2 3.2 0 0 1 2.2-2" opacity=".5"/>`,
  mic: `<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/>`,
  x: `<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  glass: `<path d="M7.5 3.5h9c0 5-1.6 8.2-4.5 8.2S7.5 8.5 7.5 3.5Z"/><path d="M8 7.5h8"/><path d="M12 11.7v7.8M8.5 20.5h7"/>`,
  chev: `<path d="m7 9.5 5 5 5-5"/>`,
  // open cookbook with a ribbon bookmark
  book: `<path d="M3 5.6c3-1.3 6-1.3 9 .8 3-2.1 6-2.1 9-.8V19c-3-1.2-6-1.2-9 .8-3-2-6-2-9-.8Z"/><path d="M12 6.4v13.4"/><path d="M15.6 4.9v6.2l1.5-1.1 1.5 1.1V4.7" ${F} opacity=".9"/>`,
  heart: `<path d="M12 20s-7.5-4.4-7.5-10.1A4.2 4.2 0 0 1 12 7.5a4.2 4.2 0 0 1 7.5 2.4C19.5 15.6 12 20 12 20Z" ${F}/><path d="M7.9 9.4a1.9 1.9 0 0 1 1.5-1.2" stroke="var(--surface)" opacity=".75"/>`,
  heartO: `<path d="M12 20s-7.5-4.4-7.5-10.1A4.2 4.2 0 0 1 12 7.5a4.2 4.2 0 0 1 7.5 2.4C19.5 15.6 12 20 12 20Z"/>`,
  // market basket with a little leaf
  cart: `<path d="M3.5 10.5h17l-1.5 7.7a2 2 0 0 1-2 1.8H7a2 2 0 0 1-2-1.8Z"/><path d="M7 10.5a5 5 0 0 1 10 0"/><path d="M9.5 13.6v3.4M12 13.6v3.4M14.5 13.6v3.4"/><path d="M15.4 6.6c1-2 2.8-2.9 4.8-2.6-.3 2.1-2 3.3-4.8 2.6Z" ${F} opacity=".35"/>`,
  // whisk
  more: `<path d="M12 14.6c-3.3 0-4.8-3.7-4.8-6.4S9.3 3.2 12 3.2s4.8 2.3 4.8 5-1.5 6.4-4.8 6.4Z"/><path d="M12 14.6c-1.3 0-1.9-3.7-1.9-6.4S10.9 3.2 12 3.2s1.9 2.3 1.9 5-.6 6.4-1.9 6.4Z"/><rect x="10.6" y="14.6" width="2.8" height="6.4" rx="1.4"/>`,
  back: `<path d="M14.5 5.5 8 12l6.5 6.5"/>`,
  arrow: `<path d="M5 12h13M13 7l5 5-5 5"/>`,
  dots: `<circle cx="12" cy="5.5" r="1.7" ${F}/><circle cx="12" cy="12" r="1.7" ${F}/><circle cx="12" cy="18.5" r="1.7" ${F}/>`,
  star: `<path d="m12 3.6 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8Z" ${F}/>`,
  edit: `<path d="M4.5 19.5 5.4 15 15.6 4.8a2 2 0 0 1 2.8 0l.8.8a2 2 0 0 1 0 2.8L9 18.6Z"/><path d="m13.8 6.6 3.6 3.6M4.5 19.5h4.5"/>`,
  // paper plane
  share: `<path d="M20.5 3.5 3.5 10.6l6.6 2.4 2.4 6.6Z"/><path d="m10.1 13 10.4-9.5"/>`,
  trash: `<path d="M4.5 6.5h15M9.5 6.5v-2h5v2"/><path d="m6.5 6.5.9 12.6a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9l.9-12.6"/><path d="M10 10.5v6M14 10.5v6"/>`,
  copy: `<rect x="8.5" y="8.5" width="11" height="12" rx="2.2"/><path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2"/>`,
  print: `<path d="M7 8.5v-5h10v5"/><rect x="3.5" y="8.5" width="17" height="8" rx="2.2"/><path d="M7 13.5h10v7H7Z"/><circle cx="17.2" cy="11.3" r=".6" ${F}/>`,
  link: `<path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`,
  // vintage camera
  camera: `<rect x="3" y="7" width="18" height="12.5" rx="2.6"/><path d="m8 7 1.4-2.5h5.2L16 7"/><circle cx="12" cy="13.2" r="3.6"/><circle cx="12" cy="13.2" r="1.2" ${F} opacity=".35"/><circle cx="17.7" cy="9.8" r=".7" ${F}/>`,
  // chef's toque, for cooking mode
  fire: `<path d="M7.5 14C4.6 13.6 4.2 9.7 6.8 8.7 7.1 6 9.7 4.6 12 5.7 14.3 4.6 16.9 6 17.2 8.7c2.6 1 2.2 4.9-.7 5.3"/><rect x="7.5" y="14" width="9" height="5.8" rx="1.3"/><path d="M10 16.9h4"/>`,
  // egg timer
  clock: `<path d="M6.5 3.5h11M6.5 20.5h11"/><path d="M8 3.5c0 4 4 5 4 8.5 0-3.5 4-4.5 4-8.5M8 20.5c0-4 4-5 4-8.5 0 3.5 4 4.5 4 8.5"/><path d="M9.6 20.5c.6-1.7 1.7-2.5 2.4-2.9.7.4 1.8 1.2 2.4 2.9Z" ${F}/>`,
  dice: `<rect x="4" y="4" width="16" height="16" rx="4.2"/><circle cx="8.7" cy="8.7" r="1.35" ${F}/><circle cx="12" cy="12" r="1.35" ${F}/><circle cx="15.3" cy="15.3" r="1.35" ${F}/>`,
  // kitchen sieve, for filters
  filter: `<path d="M3.5 9.5h13a6.5 6.5 0 0 1-13 0Z"/><path d="M16.5 9.5 21 6.2"/><circle cx="7.3" cy="12" r=".75" ${F}/><circle cx="10" cy="13.4" r=".75" ${F}/><circle cx="12.7" cy="12" r=".75" ${F}/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5"/>`,
  download: `<path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5"/><path d="M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2"/>`,
  upload: `<path d="M12 14.5v-11M7.5 8 12 3.5 16.5 8"/><path d="M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2"/>`,
  pin: `<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>`,
  install: `<rect x="6.5" y="2.5" width="11" height="19" rx="2.6"/><path d="M12 7v7M9.5 11.5 12 14l2.5-2.5M10.5 18.5h3"/>`,
  iosShare: `<path d="M12 14.5v-11M8.5 7 12 3.5 15.5 7"/><path d="M8.5 10H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1.5"/>`,
  // cookbook page with a camera lens
  bookCam: `<path d="M3 6c3-1.3 6-1.3 9 .8 3-2.1 6-2.1 9-.8v12.5c-3-1.2-6-1.2-9 .8-3-2-6-2-9-.8Z"/><path d="M12 6.8v13.3"/><circle cx="16.6" cy="12.6" r="2.5"/><path d="M5.5 10h3.5M5.5 13h3.5" opacity=".6"/>`,
  // fridge with a little heart magnet
  fridge: `<rect x="5.5" y="2.5" width="13" height="19" rx="2.6"/><path d="M5.5 9.5h13M8.5 5.4v2M8.5 12.4v3"/><path d="M14.6 14.6s-1.6-.9-1.6-2a.8.8 0 0 1 1.6-.4.8.8 0 0 1 1.6.4c0 1.1-1.6 2-1.6 2Z" ${F}/><path d="M7.5 21.5v1M16.5 21.5v1"/>`,
  // sparkle, for Claude's ideas
  spark: `<path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z"/><path d="M19 15.5c.25 1.6 1 2.35 2.5 2.5-1.5.25-2.25 1-2.5 2.5-.25-1.5-1-2.25-2.5-2.5 1.5-.15 2.25-.9 2.5-2.5Z" ${F}/>`,
  // ribbon bookmark, for personal favorites
  bookmark: `<path d="M6.5 3.5h11v17l-5.5-4-5.5 4Z" ${F}/>`,
  bookmarkO: `<path d="M6.5 3.5h11v17l-5.5-4-5.5 4Z"/>`,
  // speech bubble, for comments
  chat: `<path d="M4 6.5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6.5a3 3 0 0 1-3 3h-6.5L6 20v-4H7a3 3 0 0 1-3-3Z"/><path d="M8.5 9.8h.01M12 9.8h.01M15.5 9.8h.01" stroke-width="2.4"/>`,
  lock: `<rect x="5" y="10.5" width="14" height="10" rx="2.4"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><circle cx="12" cy="15.5" r="1.3" ${F}/>`,
  users: `<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.6-3.3 2.7-5 5.5-5s4.9 1.7 5.5 5"/><circle cx="16.8" cy="9.2" r="2.6"/><path d="M15.6 14.6c2.6-.3 4.4 1.3 4.9 4.4"/>`,
  // heart flying out, for "recommend"
  reco: `<path d="M10 18.5s-6-3.5-6-8.1A3.4 3.4 0 0 1 10 8.4a3.4 3.4 0 0 1 6 2"/><path d="m14 15 6-6M15.5 9H20v4.5"/>`,
  // envelope sealed with a heart
  mail: `<rect x="3" y="5.5" width="18" height="13" rx="2.4"/><path d="m3.6 7.2 8.4 6 8.4-6"/><path d="M12 17.3s-2-1.1-2-2.5a1 1 0 0 1 2-.5 1 1 0 0 1 2 .5c0 1.4-2 2.5-2 2.5Z" ${F}/>`,
  // cute pot with a face, for the empty state
  pot: `<path d="M4.5 10.5h15V16a4 4 0 0 1-4 4h-7a4 4 0 0 1-4-4Z"/><path d="M2.5 11.6h2M19.5 11.6h2M6 10.5c0-2 2.7-3 6-3s6 1 6 3M11 6.3h2"/><circle cx="9.3" cy="14.6" r=".8" ${F}/><circle cx="14.7" cy="14.6" r=".8" ${F}/><path d="M10.9 16.6a1.6 1.6 0 0 0 2.2 0"/>`,
};
const ico = (n, cls = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="i ${cls}">${I[n] || ''}</svg>`;

// ---------- Category illustrations (placeholders for recipes without a photo) ----------
// Illustrations live in art/ as one file per name (see art/README.md).
// To use purchased artwork, drop a file with the same name into art/, or point a name at another file here,
// e.g. whisk: 'whisk.png'.
const ART_FILES = {};
const artSrc = name => 'art/' + (ART_FILES[name] || name + '.svg');
const artImg = (name, cls = '') => `<img class="ill ${cls}" src="${artSrc(name)}" alt="" aria-hidden="true" loading="lazy" decoding="async">`;
const ART_NAMES = new Set(['soups', 'salads', 'mains', 'meat', 'poultry', 'fish', 'vegetarian', 'sides', 'breads', 'desserts', 'pastries', 'sauces', 'drinks', 'cocktails', 'starters', 'other',
  'whisk', 'teapot', 'kettle', 'mitt', 'apron', 'pan', 'pot', 'rollingpin', 'grater', 'spoon']);
const illus = key => artImg(ART_NAMES.has(key) ? key : 'mains');
const CAT_C = { soups: '#C9773A', breads: '#C49A4A', desserts: '#C26B7A', pastries: '#C9963A', salads: '#6E9A55', fish: '#4F86A8', poultry: '#C7823F', meat: '#A85543', vegetarian: '#D9822B', sides: '#B39256', starters: '#7C8F4E', mains: '#8C7A6B', sauces: '#B5412C', drinks: '#5E8C8A', cocktails: '#B04A6A', other: '#8C7A6B' };
// No category? Guess one from the name so the drawing still fits.
const GUESS = [[/cocktail|martini|mojito|spritz|margarita|negroni|daiquiri|sangria|punch|old fashioned|gin tonic|mimosa/, 'cocktails'], [/soupe|veloute|potage|bouillon|soup|gaspacho/, 'soups'], [/salade|salad|taboule/, 'salads'], [/tarte|croissant|madeleine|brioche|cookie|biscuit/, 'pastries'],
  [/gateau|cake|mousse|creme|flan|glace|sorbet|dessert|chocolat/, 'desserts'], [/pain|halla|challah|baguette|bread|focaccia/, 'breads'], [/poulet|dinde|canard|chicken|turkey|duck/, 'poultry'],
  [/boeuf|agneau|veau|steak|beef|lamb|roti|boulette/, 'meat'], [/poisson|saumon|dorade|thon|cabillaud|fish|salmon|tuna/, 'fish'], [/sauce|confiture|pesto|vinaigrette|jam/, 'sauces'],
  [/the\b|cafe|jus|limonade|cocktail|smoothie|tea\b|juice/, 'drinks'], [/puree|gratin|frites|riz|pates|potato|rice|pasta/, 'sides'], [/legume|carotte|courgette|aubergine|ratatouille|vegetable/, 'vegetarian']];
const catOf = r => r.category || (GUESS.find(([re]) => re.test(norm(r.title))) || [])[1] || 'mains';
// No photo: the recipe's initial, like a letter on a card-catalogue tab, on its category's tint.
const artHTML = (r, cls) => { const c = catOf(r); return `<div class="${cls} art" style="--c:${CAT_C[c] || '#8C7A6B'}"><span class="ini" aria-hidden="true">${esc(initial(r.title))}</span></div>`; };
