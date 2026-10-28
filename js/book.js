'use strict';
// Our Kitchen: The recipe book: list, suggestions, recipe page, cook mode, timers, the form, smart tags, importing.
// The scripts share one scope and load in order (see index.html).

// ---------- List view ----------
function greeting() {
  const now = new Date(), h = now.getHours(), dow = now.getDay();
  const st = shabbatTimes(now);
  if ((dow === 5 && h >= 12) || (dow === 6 && (!st || now < st.endAt))) return T().shabbatShalom;
  return T().hello[h < 5 ? 0 : h < 12 ? 1 : h < 18 ? 2 : 3].replace('-', '\u2011');
}
const occChip = (h, sel = []) => { const on = (sel || []).includes(h); return `<button type="button" class="chip ${on ? 'on' : ''}" data-h="${h}" aria-pressed="${on}">${esc(occLabel(h))}</button>`; };
function addOccasion(onAdded) {
  const t = T();
  sheet(`<h2>${esc(t.occAdd)}</h2>
    <div class="form" style="padding:0">
      <div class="field"><label for="occName">${esc(t.occName)}</label><input class="input" id="occName" placeholder="${esc(t.occNamePh)}"></div>
      <div class="field"><label for="occDateIn">${esc(t.occDate)}</label><input class="input" id="occDateIn" type="date"></div>
      <div class="row2"><button class="btn" data-x="no">${esc(t.cancel)}</button><button class="btn primary" data-x="ok">${esc(t.save)}</button></div></div>`, (el, close) => {
    setTimeout(() => $('#occName')?.focus(), 50);
    el.querySelector('[data-x="no"]').onclick = close;
    el.querySelector('[data-x="ok"]').onclick = () => {
      const label = $('#occName').value.trim(); if (!label) { $('#occName').focus(); return; }
      const key = 'c_' + uid();
      S.customOcc = [...customOcc(), { key, label, date: ($('#occDateIn').value || '').slice(5) }]; saveSettings();
      close(); onAdded?.(key);
    };
  });
}
// Next date for occasions that have one (Thanksgiving, New Year's Eve, birthdays the user dated).
function datedOccasions(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const next = (mmdd) => { const [m, d] = mmdd.split('-').map(Number); let x = new Date(today.getFullYear(), m - 1, d); if (x < today) x = new Date(today.getFullYear() + 1, m - 1, d); return x; };
  const thanks = y => { const d = new Date(y, 10, 1); d.setDate(1 + ((4 - d.getDay() + 7) % 7) + 21); return d; };
  let tg = thanks(today.getFullYear()); if (tg < today) tg = thanks(today.getFullYear() + 1);
  const list = [{ key: 'thanksgiving', date: tg }, { key: 'newyear', date: next('12-31') }];
  for (const c of customOcc()) if (c.date) list.push({ key: c.key, date: next(c.date) });
  return list.map(o => ({ ...o, days: Math.round((o.date - today) / 864e5) })).sort((a, b) => a.days - b.days);
}
function calHTML() {
  // A quiet line under the greeting: date, Hebrew date, and Shabbat/holiday only when near.
  const t = T(), now = new Date(), dow = now.getDay();
  const bits = [`<span>${esc(fmtDate(now, { weekday: 'long', day: 'numeric', month: 'long' }))}</span>`, `<span class="soft">${esc(hebDateLabel(now))}</span>`];
  if (dow >= 4 && dow <= 6) {
    const st = shabbatTimes(now);
    if (st && !(dow === 6 && now > st.endAt)) bits.push(`<span title="${esc(st.city)} · ${esc(t.approx)}">${esc(t.hol.shabbat)} · ${esc(t.candlesShort(st.candles))}</span>`);
  }
  const hol = nextHoliday(now);
  if (hol && hol.offset <= 14) {
    const name = t.hol[hol.key], n = recipes.filter(r => (r.holidays || []).includes(hol.key)).length;
    const label = t.holSoon(name, hol.offset - 1);
    bits.push(n ? `<button data-act="holfilter" data-h="${hol.key}">${esc(label)}</button>` : `<span>${esc(label)}</span>`);
  }
  for (const o of datedOccasions(now).filter(o => o.days <= 14).slice(0, 2)) {
    const n = recipes.filter(r => (r.holidays || []).includes(o.key)).length, label = t.occSoon(occLabel(o.key), o.days);
    bits.push(n ? `<button data-act="holfilter" data-h="${o.key}">${esc(label)}</button>` : `<span>${esc(label)}</span>`);
  }
  return `<div class="cal">${bits.join('<i>·</i>')}</div>`;
}
function bannerHTML() {
  const t = T();
  if (inbox.length) return `<section class="banner airmail"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span>${ico('mail')} ${esc(t.inboxBanner(inbox.length, inbox[0].from))}</span>
    <a class="btn small primary" href="#/inbox">${esc(t.open)}</a></div></section>`;
  if (isIOS && !installed() && !ls.get('iosNudgeDone', false)) {
    return `<section class="banner"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span>${ico('iosShare').replace('<svg', '<svg style="width:20px;height:20px;vertical-align:-4px;color:var(--accent)"')} ${esc(t.iosNudge)}</span>
      <button class="btn small" data-act="iosok">${esc(t.ok)}</button></div></section>`;
  }
  const lb = ls.get('lastBackup', 0);
  if (recipes.filter(r => !r.sample).length >= 10 && Date.now() - lb > 30 * 864e5 && ls.get('nudgeSnooze', 0) < Date.now()) {
    return `<section class="banner"><div class="row" style="justify-content:space-between"><span>${esc(t.backupNudge)}</span>
      <span class="row"><button class="btn small" data-act="snooze">${esc(t.later)}</button><button class="btn small primary" data-act="backup">${esc(t.backupNow)}</button></span></div></section>`;
  }
  return '';
}
const seasonNow = (d = new Date()) => ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'][d.getMonth()];
// Current weather for the chosen city (Open-Meteo, free, no account). Cached for an hour; silent when offline.
let wx = ls.get('wx', null);
function cityCoords() {
  if (S.city === 'gps' && S.gps) return [T().myPos, S.gps[0], S.gps[1]];
  const c = CITIES[S.city] || CITIES.paris; return [c[0], c[1], c[2]];
}
async function refreshWeather() {
  const [name, lat, lng] = cityCoords();
  if (wx && wx.city === name && Date.now() - wx.at < 3600e3) return;
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    wx = { city: name, at: Date.now(), temp: Math.round(d.current.temperature_2m), code: d.current.weather_code };
    ls.set('wx', wx);
    if (current === 'list' && $('#railbox')) $('#railbox').innerHTML = railHTML();
  } catch {}
}
// What fits today, read from each recipe itself (title, ingredients, type, cooking time), not only from tags.
// Each rule: [pattern on the normalised text, points, label shown on the polaroid].
const MOODS = {
  hotday: { tags: ['hotday', 'summer'], cats: { salads: 3, drinks: 2, starters: 1 }, words: [
    ['gaspacho|gazpacho', 4, 'gaspacho'], ['salade|salad', 3, 'salade'], ['sorbet|glace\\b|ice cream|granite', 4, 'glacé'], ['servir (bien )?frais|servir froid|served cold|chilled', 2, 'frais'],
    ['taboule|tabbouleh', 3, 'taboulé'], ['concombre|cucumber', 2, 'concombre'], ['pasteque|watermelon|melon', 3, 'melon'], ['tomate|tomato', 1, 'tomate'],
    ['carpaccio|tartare|ceviche', 3, 'cru'], ['menthe|mint', 1, 'menthe'], ['citron|lemon|lime', 1, 'citron'], ['limonade|lemonade|smoothie|citronnade', 3, 'boisson fraîche'],
    ['barbecue|bbq|plancha|grill', 2, 'grillé'], ['yaourt|yogurt|tzatziki', 1, 'yaourt']], long: -2 },
  coldday: { tags: ['coldday', 'winter'], cats: { soups: 3, meat: 1, poultry: 1 }, words: [
    ['(?<!a )soupe|soup\\b|potage|veloute|bouillon|broth', 3, 'soupe'], ['ragout|stew|mijot|braise|daube|bourguignon|pot au feu|blanquette', 4, 'mijoté'],
    ['gratin', 3, 'gratin'], ['tajine|tagine|couscous', 2, 'tajine'], ['cassoulet|choucroute|raclette|fondue|tartiflette', 4, 'réconfort'],
    ['dafina|skhina|cholent|tcholent|hamin', 4, 'dafina'], ['lentille|lentil|pois chiche|chickpea|haricot|bean', 2, 'légumineuses'],
    ['chocolat chaud|hot chocolate|vin chaud|mulled', 4, 'boisson chaude'], ['roti\\b|rotie|roast', 2, 'rôti'], ['curry|chili', 2, 'épicé'], ['puree|mash', 2, 'purée']], long: 2 },
  rainyday: { tags: ['rainyday'], cats: { soups: 2, pastries: 1, desserts: 1 }, words: [
    ['(?<!a )soupe|soup\\b|veloute', 2, 'soupe'], ['gratin', 2, 'gratin'], ['crepe|pancake|gaufre|waffle', 3, 'crêpes'], ['cookie|biscuit|madeleine|brownie', 3, 'goûter'],
    ['gateau|cake|tarte|pie', 2, 'gâteau'], ['pates|pasta|risotto|lasagne', 2, 'pâtes'], ['chocolat|chocolate', 2, 'chocolat'], ['tea\\b|infusion', 1, 'thé']], long: 1 },
  spring: { tags: ['spring'], words: [['asperge|asparagus', 4, 'asperges'], ['petits? pois|\\bpeas\\b', 3, 'petits pois'], ['feve|broad bean|fava', 3, 'fèves'], ['radis|radish', 3, 'radis'],
    ['artichaut|artichoke', 3, 'artichaut'], ['epinard|spinach', 2, 'épinards'], ['fraise|strawberr', 3, 'fraises'], ['rhubarbe|rhubarb', 4, 'rhubarbe'], ['agneau|lamb', 2, 'agneau'], ['oseille|sorrel|ail des ours', 3, 'herbes'], ['petits? oignons|spring onion', 2, 'oignons nouveaux']] },
  summer: { tags: ['summer', 'garden'], cats: { salads: 1 }, words: [['tomate|tomato', 3, 'tomates'], ['courgette|zucchini', 3, 'courgettes'], ['aubergine|eggplant', 3, 'aubergines'], ['poivron|bell pepper', 3, 'poivrons'],
    ['basilic|basil', 2, 'basilic'], ['peche|peach|nectarine', 3, 'pêches'], ['abricot|apricot', 3, 'abricots'], ['cerise|cherr', 3, 'cerises'], ['melon|pasteque|watermelon', 3, 'melon'],
    ['framboise|raspberr|myrtille|blueberr', 3, 'fruits rouges'], ['haricots? verts?|green bean', 2, 'haricots verts'], ['epis? de mais|corn\\b', 2, 'maïs'], ['concombre|cucumber', 2, 'concombre']] },
  autumn: { tags: ['autumn'], words: [['potiron|citrouille|courge(?!tte)|butternut|potimarron|pumpkin|squash', 4, 'courge'], ['champignon|cepe|girolle|mushroom', 3, 'champignons'],
    ['pomme(?!s? de terre)|apple', 3, 'pommes'], ['poire|pear', 3, 'poires'], ['coing|quince', 4, 'coings'], ['raisin(?! sec)|grape', 2, 'raisin'], ['chataigne|marron|chestnut', 4, 'châtaignes'],
    ['noix(?! de muscade| de coco)|walnut|noisette|hazelnut', 2, 'noix'], ['figue|fig\\b', 3, 'figues'], ['betterave|beet', 2, 'betterave'], ['miel|honey', 1, 'miel'], ['cannelle|cinnamon', 1, 'cannelle']] },
  winter: { tags: ['winter'], cats: { soups: 1 }, words: [['chou\\b|choux|cabbage|kale|brussels', 3, 'chou'], ['poireau|leek', 3, 'poireaux'], ['endive', 3, 'endives'], ['navet|turnip|panais|parsnip|topinambour', 3, 'racines'],
    ['celeri|celeriac', 2, 'céleri'], ['orange|clementine|mandarine|pamplemousse|grapefruit', 3, 'agrumes'], ['kiwi', 2, 'kiwi'], ['carotte|carrot', 1, 'carottes'],
    ['pot au feu|choucroute|raclette|fondue', 4, 'plat d’hiver'], ['(?<!a )soupe|soup\\b|potage|veloute', 2, 'soupe']] },
};
const WHY_EN = { gaspacho: 'gazpacho', salade: 'salad', 'glacé': 'iced', frais: 'chilled', 'taboulé': 'tabbouleh', concombre: 'cucumber', melon: 'melon', tomate: 'tomato', cru: 'raw', menthe: 'mint',
  citron: 'lemon', 'boisson fraîche': 'cold drink', 'grillé': 'grilled', yaourt: 'yogurt', soupe: 'soup', 'mijoté': 'slow-cooked', gratin: 'gratin', tajine: 'tagine', 'réconfort': 'comfort',
  dafina: 'dafina', 'légumineuses': 'beans', 'boisson chaude': 'hot drink', 'rôti': 'roast', 'épicé': 'spicy', 'purée': 'mash', 'crêpes': 'pancakes', 'goûter': 'teatime', 'gâteau': 'cake',
  'pâtes': 'pasta', chocolat: 'chocolate', 'thé': 'tea', asperges: 'asparagus', 'petits pois': 'peas', 'fèves': 'broad beans', radis: 'radish', artichaut: 'artichoke', 'épinards': 'spinach',
  fraises: 'strawberries', rhubarbe: 'rhubarb', agneau: 'lamb', herbes: 'herbs', 'oignons nouveaux': 'spring onions', tomates: 'tomatoes', courgettes: 'courgettes', aubergines: 'aubergines',
  poivrons: 'peppers', basilic: 'basil', 'pêches': 'peaches', abricots: 'apricots', cerises: 'cherries', 'fruits rouges': 'berries', 'haricots verts': 'green beans', 'maïs': 'corn',
  courge: 'squash', champignons: 'mushrooms', pommes: 'apples', poires: 'pears', coings: 'quince', raisin: 'grapes', 'châtaignes': 'chestnuts', noix: 'walnuts', figues: 'figs',
  betterave: 'beetroot', miel: 'honey', cannelle: 'cinnamon', chou: 'cabbage', poireaux: 'leeks', endives: 'endives', racines: 'root veg', 'céleri': 'celeriac', agrumes: 'citrus',
  kiwi: 'kiwi', carottes: 'carrots', 'plat d’hiver': 'winter dish' };
const moodRe = new Map();
function moodScore(r, key) {
  const m = MOODS[key]; if (!m || !r._ix) return { score: 0 };
  let score = 0, why = '';
  if ((r.holidays || []).some(h => m.tags.includes(h))) score += 5;
  if (m.cats?.[r.category]) score += m.cats[r.category];
  const title = r._ix.title, body = title + ' ' + r._ix.ing;
  for (const [pat, pts, label] of m.words) {
    let re = moodRe.get(pat); if (!re) { re = new RegExp('\\b(' + pat + ')'); moodRe.set(pat, re); }
    const lbl = S.lang === 'en' ? (WHY_EN[label] || label) : label;
    if (re.test(title)) { score += pts * 2; why ||= lbl; } else if (re.test(body)) { score += pts; why ||= lbl; }
  }
  if (m.long && totalTime(r) >= 60) score += m.long;
  return { score: Math.max(0, score), why };
}
function moodList(key) {
  return recipes.map(r => ({ r, ...moodScore(r, key) })).filter(x => x.score >= 3)
    .sort((a, b) => b.score - a.score || (b.r.rating || 0) - (a.r.rating || 0));
}
function moodRail() {
  // Weather first (hot / cold / rain), otherwise the season.
  const t = T(), fresh = wx && Date.now() - wx.at < 3 * 3600e3;
  const season = seasonNow();
  const opts = [];
  if (fresh && wx.temp >= 28) opts.push(['hotday', t.wxHot(wx.temp, wx.city)]);
  if (fresh && wx.temp <= 5) opts.push(['coldday', t.wxCold(wx.temp, wx.city)]);
  if (fresh && ((wx.code >= 51 && wx.code <= 67) || (wx.code >= 80 && wx.code <= 82))) opts.push(['rainyday', t.wxRain(wx.city)]);
  opts.push([season, t.seasonRail[season]]);
  for (const [key, title] of opts) { const items = moodList(key); if (items.length) return { key, title, items }; }
  return null;
}
const moodTitle = key => { const t = T(); return t.seasonRail[key] || occLabel(key); };
const tilesHTML = items => `<div class="rail">${items.slice(0, 10).map(x => { const r = x.r || x; return `<a class="tile" href="#/r/${encodeURIComponent(r.id)}">${r.thumb || r.photo
  ? `<img class="img" src="${esc(r.thumb || r.photo)}" alt="" loading="lazy" decoding="async">`
  : artHTML(r, 'img')}${x.why ? `<span class="why">${esc(x.why)}</span>` : ''}<b>${esc(r.title)}</b></a>`; }).join('')}</div>`;
function railHTML() {
  const t = T();
  if (current !== 'list' || L.q || L.cat || L.hol || L.mood || L.kash || L.quick || L.fav || L.who || !recipes.length) return '';
  let items = recipes.filter(r => r.favorite), title = t.favRail;
  if (items.length < 2) { items = [...recipes].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); title = t.recentRail; }
  const mood = moodRail() || { key: '', title: t.tonightRail, items: dailyPicks() };
  return `<div class="rail-h"><h2>${esc(mood.title)}</h2>${mood.key ? `<button class="linkish" data-act="moodfilter" data-m="${mood.key}">${esc(t.seeAll)}${ico('arrow')}</button>` : ''}</div>${tilesHTML(mood.items)}` +
    (recipes.length < 4 ? '' : `<div class="rail-h"><h2>${esc(title)}</h2>${title === t.favRail ? `<a href="#/fav" class="linkish">${esc(t.seeAll)}${ico('arrow')}</a>` : ''}</div>${tilesHTML(items)}`);
}
// When nothing matches today's weather or season: a few recipes, changing each day (best rated first).
function dailyPicks() {
  const day = Math.floor(Date.now() / 864e5), h = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, day);
  return [...recipes].filter(r => !r.sample || recipes.length < 6).sort((a, b) => (b.rating || 0) - (a.rating || 0) || h(a.id) - h(b.id)).slice(0, 8);
}
function chipsHTML() {
  const t = T(), pill = (f, label, extra = '') => `<button class="fpill" data-act="unfilter" data-f="${f}" ${extra}>${label}${ico('x')}</button>`;
  const on = [
    L.fav && current !== 'fav' && pill('fav', ico('bookmark') + esc(t.favorites)),
    L.who && pill('who', avatarHTML(L.who, 'xs') + esc(L.who === FAM.uid ? t.mine : member(L.who).name)),
    L.cat && pill('cat', esc(t.cat[L.cat])),
    L.hol && pill('hol', esc(occLabel(L.hol))),
    L.kash && pill('kash', esc(t.kash[L.kash])),
    L.quick && pill('quick', '≤ 30 min'),
    L.mood && pill('mood', esc(moodTitle(L.mood))),
  ].filter(Boolean);
  const n = on.length; queueMicrotask(() => { const fb = $('#filtersBtn'); if (fb) fb.classList.toggle('on', !!n); });
  return on.join('');
}
function composerHTML() {
  const t = T();
  return `<div class="composer">${avatarHTML(FAM.uid)}<button class="composer-in" data-act="photopost">${esc(t.composerPh)}</button>
    <button class="icon-btn" data-act="photopost" aria-label="${esc(t.photoPost)}">${ico('camera')}</button><button class="icon-btn" data-act="cookpick" aria-label="${esc(t.madeItQ)}">${ico('fire')}</button></div>`;
}
function feedIntroHTML() {
  const t = T();
  return `<div class="feedintro">
    <article class="post sample" data-label="${esc(t.example)}"><header><span class="av" style="--c:#C2452D" aria-hidden="true">${illus('mitt')}</span><div class="min"><b>${esc(t.exampleWho)}</b><span class="muted">${esc(t.cookedVerb)} · ${esc(t.agoYesterday)}</span></div></header>
      <div class="post-photo"><div class="ph art" style="--c:${CAT_C.desserts}"><span class="ini" aria-hidden="true">G</span></div></div><p class="hand">${esc(t.exampleNote)}</p>
      <div class="post-acts"><span class="pa on">${ico('heart')}<span>3</span></span><span class="pa">${ico('chat')}<span>2</span></span></div></article>
    <section class="panel"><h2>${ico('users')} ${esc(t.feedIntroT)}</h2><p>${esc(t.feedIntro)}</p><p class="muted">${esc(t.feedIntroHow)}</p>
      <a class="btn primary" href="#/famille">${ico('users')}${esc(t.feedIntroBtn)}</a></section></div>`;
}
let feedPrevSeen = 0;
function renderFeed() {
  if (current !== 'feed') feedPrevSeen = ls.get('feedSeen', 0);
  current = 'feed'; navHTML('fil');
  if (FAM.on && document.visibilityState !== 'hidden') { ls.set('feedSeen', Date.now()); updateNavCount(); }
  const t = T();
  $('#view').innerHTML = `
    <div class="wrap">
      <header class="top">
        <div class="mast"><span>${esc(FAM.name || t.appName)}</span><span class="mast-r">${Object.keys(FAM.members).slice(0, 5).map(id => avatarHTML(id, 'xs')).join('')}<a href="#/inbox" class="mailbtn" aria-label="${esc(t.inbox)}">${ico('mail')}${inbox.length ? `<i>${inbox.length}</i>` : ''}</a></span></div>
        <h1 class="greet">${esc(t.tabFeed)}</h1>
      </header>
      ${FAM.on ? composerHTML() + feedHTML() : feedIntroHTML()}
    </div>
    <button class="fab" data-act="fab">${ico('plus')}${esc(t.add)}</button>`;
}
function renderList(favOnly) {
  const was = current;
  current = favOnly ? 'fav' : 'list';
  if (favOnly) L.fav = true; else if (was === 'fav') L.fav = false;
  if (was !== 'recipe') L.scroll = 0;
  navHTML(current);
  const t = T();
  const hasSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  $('#view').innerHTML = `
    <div class="wrap">
      <header class="hbar"><span class="hname">${esc(favOnly ? t.carnets : t.appName)}</span>
        <a href="#/inbox" class="mailbtn" aria-label="${esc(t.inbox)}">${ico('mail')}${inbox.length ? `<i>${inbox.length}</i>` : ''}</a></header>
      ${favOnly ? carnetTabs('fav') : `<p class="hello">${esc(greeting())}, ${esc(S.name || 'Abe')}</p>${calHTML()}${bannerHTML()}`}
    </div>
    <div class="searchbar"><div class="wrap">
      <div class="search" role="search">${ico('search', 'lead')}
        <input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="${esc(t.searchPh)}" value="${esc(L.q)}" aria-label="${esc(t.searchPh)}">
        <button class="icon-btn" data-act="clearq" aria-label="${esc(t.clear)}" ${L.q ? '' : 'hidden'}>${ico('x')}</button>
        ${hasSpeech ? `<button class="icon-btn" data-act="voice" aria-label="${esc(t.voice)}">${ico('mic')}</button>` : ''}
      </div>
      <div class="tools"><span class="muted" id="count"></span><span class="tools-r">
        <button class="toolbtn" data-act="filters" id="filtersBtn">${ico('filter')}${esc(t.filters)}</button>
        <select id="sort" aria-label="${esc(t.sortBy)}">${Object.entries(t.sort).map(([k, v]) => `<option value="${k}" ${L.sort === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></span></div>
      <div class="activef" id="chips">${chipsHTML()}</div>
    </div></div>
    <div class="wrap">
      <div id="railbox"></div>
      <div id="results"></div>
    </div>
    <button class="fab" data-act="fab">${ico('plus')}${esc(t.add)}</button>
    <div class="az" id="az" hidden></div>`;
  renderResults();
  requestAnimationFrame(() => window.scrollTo(0, L.scroll || 0));
}
// Catalogue numbers, like a card box: N° 001 is the first recipe ever added.
let catNos = new Map();
function numberRecipes() {
  catNos = new Map([...recipes].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).map((r, i) => [r.id, String(i + 1).padStart(3, '0')]));
}
const catNo = r => catNos.get(r.id) || '—';
const starsMini = n => n ? `<span class="stars-mini" aria-label="${n}/5">${ico('star').repeat(n)}</span>` : '';
function cardHTML(r) {
  const t = T();
  const meta = [r.category && t.cat[r.category], totalTime(r) && fmtDur(totalTime(r)), r.servings && t.servings(+r.servings)].filter(Boolean);
  const pic = r.thumb || r.photo;
  return `<a class="card ${pic ? 'has-pic' : ''}" href="#/r/${encodeURIComponent(r.id)}">
    <div class="min"><h3>${esc(r.title)}</h3>
      <div class="meta">${meta.map(m => `<span>${esc(m)}</span>`).join('')}${r.kashrut ? `<span class="kbadge k-${r.kashrut}">${esc(t.kash[r.kashrut])}</span>` : ''}${starsMini(r.rating)}</div>
      ${FAM.on && r.owner ? `<div class="by">${avatarHTML(r.owner, 'xs')}<span>${esc(r.owner === FAM.uid ? t.you : member(r.owner).name)}</span></div>` : ''}</div>
    ${pic ? `<img class="cpic" src="${esc(pic)}" alt="" loading="lazy" decoding="async">` : ''}
    ${r.favorite ? `<span class="cfav" aria-label="${esc(t.favorites)}">${ico('bookmark')}</span>` : ''}</a>`;
}
function renderResults() {
  const t = T(), list = filtered(), box = $('#results'); if (!box) return;
  numberRecipes();
  $('#railbox').innerHTML = railHTML();
  const pool = current === 'fav' ? recipes.filter(r => r.favorite).length : recipes.length;
  $('#count').textContent = list.length === pool ? t.nRecipes(pool) : t.nOf(list.length, pool);
  $('[data-act="clearq"]').hidden = !L.q;
  const az = $('#az'); az.hidden = true;
  if (!recipes.length) {
    box.innerHTML = `<div class="empty">
      <h2>${esc(t.emptyTitle)}</h2><p>${esc(t.emptyText)}</p>
      <button class="btn primary" data-act="new">${ico('plus')}${esc(t.firstRecipe)}</button>
      <button class="btn" data-act="samples">${esc(t.loadSamples)}</button></div>`;
    return;
  }
  if (!list.length) {
    box.innerHTML = `<div class="empty"><h2>${esc(t.noResults)}</h2><p>${esc(t.noResultsHint)}</p><button class="btn" data-act="reset">${esc(t.resetFilters)}</button></div>`;
    return;
  }
  if (L.sort === 'az' && !L.q) {
    const groups = new Map();
    for (const r of list) { const k = letterOf(r); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); }
    box.innerHTML = [...groups].map(([k, rs]) => `<div class="letter" id="L-${k}">${k}</div><div class="cards">${rs.map(cardHTML).join('')}</div>`).join('');
    if (list.length > 12) {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
      az.innerHTML = letters.map(l => `<span data-l="${l}" class="${groups.has(l) ? 'has' : ''}">${l}</span>`).join('');
      az.hidden = false; azVisibility();
    }
  } else {
    box.innerHTML = `<div class="cards">${list.map(cardHTML).join('')}</div>`;
  }
}
// A–Z rail: drag a finger down the letters to jump.
function azJump(e) {
  const pt = e.touches ? e.touches[0] : e;
  const el = document.elementFromPoint(pt.clientX, pt.clientY);
  const l = el?.dataset?.l; if (!l) return;
  const avail = $$('#az span.has').map(s => s.dataset.l);
  const target = avail.find(x => x >= l) || avail[avail.length - 1];
  const sec = target && document.getElementById('L-' + target);
  if (sec) { sec.scrollIntoView({ block: 'start' }); let p = $('.az-pop'); if (!p) { p = document.createElement('div'); p.className = 'az-pop'; document.body.append(p); } p.textContent = target; }
}
document.addEventListener('touchstart', e => { if (e.target.closest('#az')) { e.preventDefault(); azJump(e); } }, { passive: false });
document.addEventListener('touchmove', e => { if (e.target.closest('#az')) { e.preventDefault(); azJump(e); } }, { passive: false });
document.addEventListener('touchend', () => $('.az-pop')?.remove());
const azVisibility = () => { const az = $('#az'), res = $('#results'); if (az && res && !az.hidden) az.classList.toggle('show', window.scrollY > res.offsetTop - 260); };
window.addEventListener('scroll', azVisibility, { passive: true });
document.addEventListener('click', e => { if (e.target.closest('#az')) { azJump(e); setTimeout(() => $('.az-pop')?.remove(), 500); } });

function openFilters() {
  const t = T(), st = { cat: L.cat, kash: L.kash, hol: L.hol, quick: L.quick, fav: L.fav, who: L.who };
  const owners = FAM.on ? [...new Set(recipes.filter(r => !r.sample && r.owner).map(r => r.owner))].sort((a, b) => (b === FAM.uid) - (a === FAM.uid)) : [];
  const group = (title, key, items) => `<div class="fgroup"><h3 class="eyebrow">${esc(title)}</h3><div class="wrapchips">${items.map(([v, label]) => `<button type="button" class="chip ${st[key] === v ? 'on' : ''}" data-f="${key}" data-v="${esc(v)}" aria-pressed="${st[key] === v}">${esc(label)}</button>`).join('')}</div></div>`;
  const count = () => { const saved = { cat: L.cat, kash: L.kash, hol: L.hol, quick: L.quick, fav: L.fav, who: L.who }; Object.assign(L, st); const n = filtered().length; Object.assign(L, saved); return n; };
  const body = () => `<h2>${esc(t.filters)}</h2>
    <div class="fgroup"><div class="wrapchips"><button type="button" class="chip ${st.fav ? 'on' : ''}" data-f="fav" aria-pressed="${st.fav}">${ico('bookmark', 'heart')}${esc(t.favorites)}</button><button type="button" class="chip ${st.quick ? 'on' : ''}" data-f="quick" aria-pressed="${st.quick}">${ico('clock')}${esc(t.quick)}</button></div></div>
    ${owners.length > 1 ? group(t.whoAdded, 'who', [['', t.anyF], ...owners.map(id => [id, id === FAM.uid ? t.mine : member(id).name])]) : ''}
    ${group(t.occSeasons, 'hol', SEASONS.map(h => [h, occLabel(h)]))}
    ${group(t.occMoments, 'hol', generalOcc().map(h => [h, occLabel(h)]))}
    ${group(t.occJewish, 'hol', HOLIDAYS.map(h => [h, occLabel(h)]))}
    ${group(t.category, 'cat', [['', t.anyF], ...CATS.filter(c => c === st.cat || recipes.some(r => r.category === c)).map(c => [c, t.cat[c]])])}
    ${group(t.kashrutF, 'kash', [['', t.anyF], ...KASHRUT.map(k => [k, t.kashLong[k]])])}
    <div class="row2 fbar"><button class="btn" data-x="reset">${esc(t.resetFilters)}</button><button class="btn primary" data-x="ok">${esc(t.filtersShow(count()))}</button></div>`;
  sheet(body(), (el, close) => {
    el.classList.add('filters');
    el.addEventListener('click', e => {
      const c = e.target.closest('[data-f]');
      if (c) { const k = c.dataset.f; if (k === 'quick' || k === 'fav') st[k] = !st[k]; else st[k] = st[k] === c.dataset.v && c.dataset.v ? '' : c.dataset.v; const y = el.scrollTop; el.innerHTML = '<div class="grab"></div>' + body(); el.scrollTop = y; return; }
      const x = e.target.closest('[data-x]')?.dataset.x;
      if (x === 'ok') { Object.assign(L, st); close(); refreshList(); }
      if (x === 'reset') { Object.assign(L, { cat: '', hol: '', quick: false, kash: '', fav: current === 'fav', who: '' }); close(); refreshList(); }
    });
  });
}
// Native drop-downs look like a web form: each <select> gets a button in the app's style that opens a list.
// The <select> stays (hidden) as the value everything else reads.
function fancySelects(root = document) {
  for (const sel of root.querySelectorAll('select:not([data-fancy])')) {
    sel.dataset.fancy = '1'; sel.classList.add('fsel-native'); sel.tabIndex = -1;
    const lbl = sel.id ? document.querySelector(`label[for="${sel.id}"]`) : null;
    const btn = document.createElement('button'); btn.type = 'button';
    btn.className = 'fsel' + (sel.id === 'sort' ? ' pill' : '');
    const name = (lbl?.textContent || sel.getAttribute('aria-label') || '').trim();
    const draw = () => { btn.innerHTML = `<span>${esc(sel.selectedOptions[0]?.textContent || '—')}</span>${ico('chev')}`; btn.setAttribute('aria-label', [name, sel.selectedOptions[0]?.textContent].filter(Boolean).join(' : ')); };
    draw(); sel.after(btn);
    if (lbl) { lbl.removeAttribute('for'); lbl.addEventListener('click', () => btn.click()); }
    sel.addEventListener('change', draw);
    btn.addEventListener('click', () => pickOption(sel, name, draw));
  }
}
function pickOption(sel, name, draw) {
  const opt = o => `<button type="button" class="fopt" data-v="${esc(o.value)}" aria-pressed="${o.selected}">${esc(o.textContent)}${o.selected ? ico('check') : ''}</button>`;
  const html = [...sel.children].map(n => n.tagName === 'OPTGROUP' ? `<h3 class="eyebrow">${esc(n.label)}</h3>${[...n.children].map(opt).join('')}` : opt(n)).join('');
  sheet(`${name ? `<h2>${esc(name)}</h2>` : ''}<div class="fopts">${html}</div>`, (el, close) => {
    el.querySelector('.fopt[aria-pressed="true"]')?.scrollIntoView({ block: 'center' });
    el.addEventListener('click', e => {
      const b = e.target.closest('.fopt'); if (!b) return;
      close(); if (sel.value === b.dataset.v) return;
      sel.value = b.dataset.v; draw();
      sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
}
new MutationObserver(() => { if (document.querySelector('select:not([data-fancy])')) fancySelects(); }).observe(document.body, { childList: true, subtree: true });
function refreshList() { $('#chips').innerHTML = chipsHTML(); renderResults(); }

// Voice search (Chrome on Android)
function voiceSearch() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
  const rec = new SR(); rec.lang = S.lang === 'fr' ? 'fr-FR' : 'en-US'; rec.interimResults = false;
  const btn = $('[data-act="voice"]'); btn.style.color = 'var(--danger)';
  rec.onresult = e => { L.q = e.results[0][0].transcript; $('#q').value = L.q; renderResults(); };
  rec.onend = () => { btn.style.color = ''; };
  try { rec.start(); } catch { btn.style.color = ''; }
}

// ---------- Recipe view ----------
let scale = {};
function renderRecipe(r) {
  current = 'recipe'; navHTML('list'); numberRecipes();
  const t = T();
  const base = +r.servings || 0;
  const cur = scale[r.id] ?? (base || 1);
  const factor = base ? cur / base : cur;
  let ing = '';
  for (const l of lines(r.ingredients)) {
    if (isHeading(l)) { ing += `<li class="sub">${esc(cleanHeading(l))}</li>`; continue; }
    const { q, rest, conv, orig } = ingLine(l, factor);
    ing += `<li><label><input type="checkbox"><span>${q ? `<b${conv ? ` class="conv" data-orig="${esc(orig)}"` : ''}>${esc(q)}</b>` : ''}${esc(rest)}</span></label></li>`;
  }
  let steps = '';
  for (const l of lines(r.steps)) {
    if (isHeading(l) && l.length < 60) { steps += `<li class="sub">${esc(cleanHeading(l))}</li>`; continue; }
    steps += `<li class="step"><div>${withTimers(convertTemps(cleanStep(l)))}</div></li>`;
  }

  const badges = [
    r.kashrut && `<span class="badge kbadge k-${r.kashrut}">${esc(t.kashLong[r.kashrut])}</span>`,
    r.category && `<span class="badge">${esc(t.cat[r.category])}</span>`,
    ...(r.holidays || []).filter(h => occLabel(h)).map(h => `<span class="badge">${esc(occLabel(h))}</span>`),
    ...(r.tags || []).map(g => `<span class="badge">#${esc(g)}</span>`),
  ].filter(Boolean).join('');
  $('#view').innerHTML = `
    <div class="rbar wrap"><button class="icon-btn" data-act="back" aria-label="${esc(t.close)}">${ico('back')}</button>
      <span class="r"><button class="icon-btn" data-act="fav" aria-label="${esc(t.favorites)}" aria-pressed="${!!r.favorite}">${ico(r.favorite ? 'bookmark' : 'bookmarkO')}</button>
      <button class="icon-btn" data-act="menu" aria-label="Menu">${ico('dots')}</button></span></div>
    <article class="wrap paper">
      ${r.photo ? `<img class="rphoto" src="${esc(r.photo)}" alt="${esc(r.title)}" data-act="viewphoto">` : ''}
      <div class="catrow">${r.category ? `<span>${esc(t.cat[r.category])}</span>` : ''}<span>${esc(t.added)} ${esc(fmtDate(r.createdAt, { day: 'numeric', month: 'short', year: 'numeric' }))}</span></div>
      <div class="rtitle">
        <h1>${esc(r.title)}</h1>
        ${FAM.on && r.owner && r.owner !== FAM.uid ? `<div class="byline">${avatarHTML(r.owner, 'sm')}<span>${esc(t.addedBy(member(r.owner).name))} · ${esc(ago(r.createdAt || Date.now()))}</span></div>` : ''}
        ${r.source ? `<div class="muted">${esc(t.source)} <b>${esc(r.source)}</b></div>` : ''}
        <div class="badges">${badges}</div>
        <div class="stars" role="group" aria-label="Note">${[1, 2, 3, 4, 5].map(i => `<button data-act="rate" data-v="${i}" class="${(r.rating || 0) >= i ? 'on' : ''}" aria-label="${i}/5">${ico('star')}</button>`).join('')}</div>
        ${FAM.on && FAM.raw.has(r.id) ? socialHTML(r) : ''}
      </div>
      ${(r.prep || r.cook) ? `<div class="facts"><div class="fact"><b>${fmtDur(r.prep)}</b><span>${esc(t.prep)}</span></div><div class="fact"><b>${fmtDur(r.cook)}</b><span>${esc(t.cook)}</span></div><div class="fact"><b>${fmtDur(totalTime(r))}</b><span>${esc(t.total)}</span></div></div>` : ''}
      <div class="actions">
        ${lines(r.steps).length ? `<button class="btn primary" data-act="cook">${ico('fire')}${esc(t.cookMode)}</button>` : ''}
        ${r.link ? `<a class="btn" href="${esc(r.link)}" target="_blank" rel="noopener">${ico('link')}${esc(t.openLink)}</a>` : ''}
        ${FAM.on && FAM.raw.has(r.id) ? `<button class="btn" data-act="recommend">${ico('reco')}${esc(t.recommend)}</button>` : `<button class="btn" data-act="send">${ico('mail')}${esc(t.send)}</button>`}
      </div>
      ${!ing && !steps ? pagesHTML(r) : ''}
      ${ing ? `<section class="section"><div class="section-h"><h2>${esc(t.ingredients)}</h2>
        <div class="scaler" aria-label="Portions"><button data-act="scale" data-d="-1" aria-label="moins">−</button><span>${esc(base ? t.servings(cur) : t.times(cur))}</span><button data-act="scale" data-d="1" aria-label="plus">+</button></div></div>
        ${hasUnits(r) ? `<div class="units" role="group" aria-label="${esc(t.unitsLabel)}">${['orig', 'metric', 'us'].map(u => `<button data-act="units" data-u="${u}" aria-pressed="${(S.units || 'orig') === u}">${esc(t.units[u])}</button>`).join('')}</div>
          ${(S.units || 'orig') !== 'orig' ? `<p class="muted units-note">${esc(t.unitsNote)}</p>` : ''}` : ''}
        <ul class="ing">${ing}</ul>
        <button class="btn block" style="margin-top:10px" data-act="toshop">${ico('cart')}${esc(t.addToShop)}</button></section>` : ''}
      ${steps ? `<section class="section"><div class="section-h"><h2>${esc(t.steps)}</h2></div><ol class="steps">${steps}</ol></section>` : ''}
      ${r.notes ? `<section class="section"><div class="section-h"><h2>${esc(t.recipeNotes)}</h2></div><p class="srcnotes">${esc(r.notes)}</p></section>` : ''}
      ${r.note ? `<section class="section"><div class="section-h"><h2>${esc(t.notesOf(FAM.on && r.owner ? member(r.owner).name : S.name || ''))}</h2></div><div class="notes">${esc(r.note)}</div></section>` : ''}
      ${ing || steps ? pagesHTML(r) : ''}
      <div class="cooked"><span>${esc(t.cookedN(r.cookCount || 0, r.lastCooked && fmtDate(r.lastCooked)))}</span><button class="btn small primary" data-act="cooked">${ico('camera')}${esc(t.madeIt)}</button>
        ${eventsWith(r.id).length ? `<div class="served-line"><span>${esc(t.servedAt)}</span>${eventsWith(r.id).slice(0, 6).map(e => `<a href="#/carnet/${encodeURIComponent(e.id)}">${esc(evLabel(e))}${evLabel(e).includes(String(new Date(evTime(e)).getFullYear())) ? '' : ' · ' + new Date(evTime(e)).getFullYear()}</a>`).join('')}</div>` : ''}
        ${winesFor(r.id).length ? `<div class="served-line"><span>${esc(t.pairings)}</span>${winesFor(r.id).slice(0, 6).map(w => `<a href="#/vin/${encodeURIComponent(w.id)}">${esc(wineLabel(w))}</a>`).join('')}</div>` : ''}</div>
      ${madeSectionHTML(r)}
      ${FAM.on && FAM.raw.has(r.id) ? `<section class="section" id="commentsSec"><div class="section-h"><h2>${esc(t.comments)}</h2></div>
        <div id="comments">${commentsListHTML()}</div>
        <div class="comment-form"><textarea class="input" id="commentIn" rows="2" placeholder="${esc(t.commentPh)}"></textarea>
          <div class="row2" style="align-items:center"><label class="tried-toggle"><input type="checkbox" id="commentTried"><span>${esc(t.triedIt)}</span></label><button class="btn primary" data-act="postcomment">${ico('chat')}${esc(t.send)}</button></div></div></section>` : ''}
      <p class="muted" style="font-size:.85rem;text-align:center">${esc(t.addedOn(fmtDate(r.createdAt)))}</p>
    </article>`;
  $('#view').dataset.id = r.id;
  window.scrollTo(0, 0);
  if (FAM.on && FAM.raw.has(r.id)) { watchComments(r.id); loadPages(r); if (window._scrollTo === 'comments') { window._scrollTo = ''; setTimeout(() => $('#commentsSec')?.scrollIntoView({ block: 'start' }), 60); } }
}
function socialHTML(r) {
  const t = T(), hearts = Object.keys(r.hearts || {}), liked = !!(r.hearts || {})[FAM.uid];
  return `<div class="social">
    <button class="pa ${liked ? 'on' : ''}" data-act="like" data-id="${r.id}" aria-pressed="${liked}">${ico(liked ? 'heart' : 'heartO')}<span>${hearts.length || ''}</span></button>
    <span class="likers">${hearts.slice(0, 5).map(id => avatarHTML(id, 'xs')).join('')}</span>
    ${r.famCount ? `<span class="famstars">${esc(t.famStars(fmtNum(Math.round(r.famRating * 10) / 10), r.famCount))}</span>` : ''}
  </div>`;
}
function recipeText(r) {
  const t = T();
  return [r.title, r.source ? `${t.source} ${r.source}` : '', '', `— ${t.ingredients} —`, ...lines(r.ingredients).map(l => isHeading(l) ? `\n${cleanHeading(l)} :` : `• ${l}`), '', `— ${t.steps} —`,
    ...lines(r.steps).map((l, i) => `${i + 1}. ${cleanStep(l)}`), r.notes ? `\n${t.recipeNotes} : ${r.notes}` : '', r.note ? `\n${t.notesOf(FAM.on && r.owner ? member(r.owner).name : S.name || '')} : ${r.note}` : '', r.link ? `\n${r.link}` : '', `\n— ${T().appName}`].filter(x => x !== undefined).join('\n').replace(/\n{3,}/g, '\n\n');
}
async function shareText(title, text) {
  if (navigator.share) { try { await navigator.share({ title, text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(text); toast(T().copied); } catch { toast(T().copied); }
}
function recipeMenu(r) {
  const t = T();
  sheet(`<h2>${esc(r.title)}</h2><div class="menu">
    ${isMine(r) ? `<button data-m="edit">${ico('edit')}${esc(t.edit)}</button>` : `<button data-m="dup">${ico('copy')}${esc(t.copyToMine)}</button>`}
    <button data-m="event">${ico('book')}${esc(t.addToEvent)}</button>
    <button data-m="wine">${ico('glass')}${esc(t.pairWine)}</button>
    <button data-m="send">${ico('mail')}${esc(t.send)}</button>
    <button data-m="share">${ico('share')}${esc(t.share)}</button>
    <button data-m="copy">${ico('copy')}${esc(t.copyText)}</button>
    <button data-m="print">${ico('print')}${esc(t.print)}</button>
    <button data-m="dup">${ico('book')}${esc(t.duplicate)}</button>
    ${isMine(r) ? `<button data-m="del" class="danger">${ico('trash')}${esc(t.del)}</button>` : ''}</div>`, (el, close) => {
    el.addEventListener('click', async e => {
      const m = e.target.closest('[data-m]')?.dataset.m; if (!m) return; close();
      if (m === 'edit') go('#/edit/' + r.id);
      if (m === 'share') shareText(r.title, recipeText(r));
      if (m === 'event') addToEventSheet(r);
      if (m === 'wine') { const got = await pickWines({ title: t.pairWine, exclude: winesFor(r.id).map(w => w.id) }); if (!got) return;
        for (const id of got.ids) { const w = PS.wines.get(id); if (w) { w.pairs = [...new Set([...(w.pairs || []), r.id])]; psPut('wines', w); } }
        if (got.create) { const w = newWine(); w.pairs = [r.id]; psPut('wines', w); go('#/vin/' + w.id); } else { const y = window.scrollY; renderRecipe(r); window.scrollTo(0, y); } }
      if (m === 'send') sendRecipe(r);
      if (m === 'copy') { try { await navigator.clipboard.writeText(recipeText(r)); } catch {} toast(t.copied); }
      if (m === 'print') setTimeout(() => window.print(), 300);
      if (m === 'dup') { const c = { ...r, id: uid(), owner: undefined, audience: ['all'], note: '', title: isMine(r) ? r.title + ' (2)' : r.title, createdAt: Date.now(), updatedAt: Date.now(), cookCount: 0, lastCooked: 0, sample: false }; await saveRecipe(c); go('#/r/' + c.id); }
      if (m === 'del') {
        if (!(await confirmBox(t.deleteQ(r.title), t.deleteYes))) return;
        if (FAM.on) await cloudDelete(r); else { await DB.del(r.id); recipes = recipes.filter(x => x.id !== r.id); } go('#/');
        toast(t.deleted, { label: t.undo, fn: async () => { await saveRecipe(r); go('#/r/' + r.id); } });
      }
    });
  });
}

// ---------- Cook mode ----------
let cookState = null, wakeLock = null;
async function keepAwake() { try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {} }
document.addEventListener('visibilitychange', () => { if (cookState && document.visibilityState === 'visible') keepAwake(); });
function openCook(r) {
  const st = lines(r.steps).filter(l => !(isHeading(l) && l.length < 60)).map(cleanStep);
  if (!st.length) return;
  cookState = { r, st, i: 0 };
  const el = document.createElement('div'); el.className = 'cook'; el.id = 'cook';
  document.body.append(el); document.body.style.overflow = 'hidden';
  keepAwake(); drawCook();
  let x0 = null;
  el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 70) cookMove(dx < 0 ? 1 : -1); x0 = null; });
}
function drawCook() {
  const { r, st, i } = cookState, t = T(), el = $('#cook');
  el.innerHTML = `<div class="ch"><button class="icon-btn" data-act="cookclose" aria-label="${esc(t.close)}">${ico('x')}</button><h2>${esc(r.title)}</h2>
      <button class="btn small" data-act="cooking">${esc(t.showIng)}</button></div>
    <div class="body"><div class="progress"><i style="width:${((i + 1) / st.length) * 100}%"></i></div>
      <div class="num">${esc(t.step(i + 1, st.length))}</div><div class="text">${withTimers(convertTemps(st[i]))}</div></div>
    <div class="foot"><button class="btn" data-act="cookprev" ${i === 0 ? 'disabled' : ''}>${esc(t.prev)}</button>
      <button class="btn primary" data-act="cooknext">${esc(i === st.length - 1 ? t.finish : t.next)}</button></div>`;
}
function cookMove(d) {
  const c = cookState; if (!c) return;
  if (d > 0 && c.i === c.st.length - 1) { history.back(); return; }
  c.i = Math.max(0, Math.min(c.st.length - 1, c.i + d)); drawCook();
}
function closeCook() {
  if (!cookState) return;
  $('#cook')?.remove(); document.body.style.overflow = ''; cookState = null;
  try { wakeLock?.release(); } catch {} wakeLock = null;
}

// ---------- Timers ----------
let timers = ls.get('timers', []), audioCtx = null, ringLoop = null;
function addTimer(min, label) {
  timers.push({ id: uid(), end: Date.now() + min * 60000, label, min });
  ls.set('timers', timers); drawTimers();
  try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch {}
  try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch {}
}
function beep() {
  try {
    const ctx = audioCtx || (audioCtx = new (window.AudioContext || window.webkitAudioContext)());
    [0, .25, .5].forEach(dt => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(.25, ctx.currentTime + dt); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + dt + .2); o.start(ctx.currentTime + dt); o.stop(ctx.currentTime + dt + .22); });
  } catch {}
  try { navigator.vibrate?.([300, 150, 300, 150, 300]); } catch {}
}
function drawTimers() {
  const box = $('#timers'), now = Date.now(), t = T();
  let ringing = false;
  box.innerHTML = timers.map(x => {
    const left = Math.max(0, Math.round((x.end - now) / 1000)); const done = left === 0; ringing ||= done;
    const hh = Math.floor(left / 3600), mm = Math.floor(left / 60) % 60, ss = String(left % 60).padStart(2, '0');
    const clock = hh ? `${hh}:${String(mm).padStart(2, '0')}:${ss}` : `${mm}:${ss}`;
    return `<div class="tmr ${done ? 'ring' : ''}"><b>${ico('clock')}${done ? '' : clock}</b><span>${esc(done ? t.timerDone : x.label)}</span><button data-act="tstop" data-id="${x.id}">${esc(t.stop)}</button></div>`;
  }).join('');
  document.body.style.paddingTop = timers.length ? box.offsetHeight + 8 + 'px' : '';
  document.documentElement.style.setProperty('--tmr-h', timers.length ? box.offsetHeight + 8 + 'px' : '0px');
  if (ringing && !ringLoop) {
    beep(); ringLoop = setInterval(beep, 2500);
    try { if (document.visibilityState !== 'visible' && Notification.permission === 'granted') new Notification(t.timerDone, { body: timers.find(x => x.end <= now)?.label || '', icon: 'icons/icon-192.png' }); } catch {}
  }
  if (!ringing && ringLoop) { clearInterval(ringLoop); ringLoop = null; }
}
setInterval(() => { if (timers.length) drawTimers(); }, 1000);
function askTimer(min, label) {
  const t = T();
  sheet(`<h2>${esc(t.timerFor)} · ${fmtDur(min)}</h2><p class="muted" style="margin:0">${esc(label)}</p>
    <div class="scaler" style="justify-self:center"><button data-d="-1">−</button><span id="tm">${fmtDur(min)}</span><button data-d="1">+</button></div>
    <div class="row2"><button class="btn" data-x="no">${esc(t.cancel)}</button><button class="btn primary" data-x="go">${ico('clock')}${esc(t.startTimer)}</button></div>`, (el, close) => {
    el.addEventListener('click', e => {
      const d = e.target.closest('[data-d]')?.dataset.d;
      if (d) { min = Math.max(1, min + (+d) * (min >= 20 ? 5 : 1)); $('#tm', el).textContent = fmtDur(min); }
      const x = e.target.closest('[data-x]')?.dataset.x;
      if (x === 'no') close();
      if (x === 'go') { addTimer(min, label); close(); }
    });
  });
}

// ---------- Edit view ----------
let formPhoto = null;
function renderEdit(r) {
  formTag = { auto: false, ai: false };
  current = 'edit';
  const t = T(), isNew = !r;
  r = r || { title: '', holidays: [], tags: [], audience: ['all'] };
  formPhoto = r.photo || null;
  formPages = [...(r.pages || [])];
  const draft = ls.get('draft');
  const draftKey = isNew ? 'new' : r.id;
  const showDraft = draft && draft.key === draftKey && draft.ts > (r.updatedAt || 0);
  const kOpt = ['', ...KASHRUT].map(k => `<label class="${k ? 'k-' + k : ''}"><input type="radio" name="kashrut" value="${k}" ${(r.kashrut || '') === k ? 'checked' : ''}>${esc(k ? t.kash[k] : t.kash.none)}</label>`).join('');
  $('#view').innerHTML = `
    <div class="page-h wrap"><button class="icon-btn" data-act="back" aria-label="${esc(t.cancel)}">${ico('x')}</button><h1>${esc(isNew ? t.newRecipe : t.editRecipe)}</h1></div>
    <form class="form wrap" id="form" novalidate>
      ${showDraft ? `<div class="draft-note"><span>${esc(t.draftFound)}</span><span style="display:flex;gap:8px"><button type="button" class="btn small" data-act="draftno">${esc(t.discard)}</button><button type="button" class="btn small primary" data-act="draftyes">${esc(t.restore)}</button></span></div>` : ''}
      <div class="addbox">
        <label for="fSmart">${esc(t.smartLabel)}</label>
        <textarea id="fSmart" rows="3" autocapitalize="off" spellcheck="false"></textarea>
        <div class="addbtns"><button type="button" class="btn primary" data-act="smartfill">${ico('download')}${esc(t.smartFill)}</button>
          <button type="button" class="btn" data-act="book">${ico('camera')}${esc(t.photosBtn)}</button></div>
        <p class="addstatus" id="addStatus" role="status" hidden></p>
        <div id="ocrStatus" class="ocr" hidden><span id="ocrText"></span><div class="bar"><i id="ocrBar"></i></div></div>
        <div class="pages" id="formPages"></div>
      </div>
      <div class="field"><span class="lbl">${esc(t.photo)}</span><div class="photo-drop" id="photoBox"></div>
        <input class="input" id="fPhotoUrl" type="url" inputmode="url" placeholder="${esc(t.photoUrl)}" value="${formPhoto && /^https?:/.test(formPhoto) ? esc(formPhoto) : ''}"></div>
      <div class="field"><label for="fTitle">${esc(t.title)} *</label><input class="input" id="fTitle" required placeholder="${esc(t.titlePh)}" value="${esc(r.title)}" style="font-size:1.15rem;font-weight:700"></div>
      <div class="autotag"><button type="button" class="btn" data-act="autotag">${ico('spark')}${esc(t.autoTagBtn)}</button></div>
      <div class="field"><label for="fCat">${esc(t.category)}</label><select id="fCat"><option value="">—</option>${CATS.map(c => `<option value="${c}" ${r.category === c ? 'selected' : ''}>${esc(t.cat[c])}</option>`).join('')}</select></div>
      <div class="field"><span class="lbl">${esc(t.occasions)}</span>
        <span class="eyebrow">${esc(t.occSeasons)}</span>
        <div class="wrapchips occ-chips" id="fSeason">${SEASONS.map(h => occChip(h, r.holidays)).join('')}</div>
        <span class="eyebrow" style="margin-top:6px">${esc(t.occMoments)}</span>
        <div class="wrapchips occ-chips" id="fOcc">${generalOcc().map(h => occChip(h, r.holidays)).join('')}<button type="button" class="chip add" data-act="addocc">${ico('plus')}${esc(t.addOcc)}</button></div>
        <span class="eyebrow" style="margin-top:6px">${esc(t.occJewish)}</span>
        <div class="wrapchips occ-chips" id="fHol">${HOLIDAYS.map(h => occChip(h, r.holidays)).join('')}</div></div>
      <details class="more-box" ${r.kashrut ? 'open' : ''}><summary>${esc(t.kashrut)}</summary><div class="in">
      <div class="seg">${kOpt}</div>
      </div></details>
      <div class="row3">
        <div class="field"><label for="fServ">${esc(t.servingsF)}</label><input class="input" id="fServ" type="number" inputmode="numeric" min="0" value="${esc(r.servings || '')}"></div>
        <div class="field"><label for="fPrep">${esc(t.prepF)}</label><input class="input" id="fPrep" type="number" inputmode="numeric" min="0" value="${esc(r.prep || '')}"></div>
        <div class="field"><label for="fCook">${esc(t.cookF)}</label><input class="input" id="fCook" type="number" inputmode="numeric" min="0" value="${esc(r.cook || '')}"></div>
      </div>
      <div class="field"><label for="fIng">${esc(t.ingF)}</label><textarea id="fIng" rows="8">${esc(r.ingredients || '')}</textarea></div>
      <div class="field"><label for="fSteps">${esc(t.stepsF)}</label><textarea id="fSteps" rows="10">${esc(r.steps || '')}</textarea></div>
      <div class="field"><label for="fNote">${esc(t.noteF)}</label><textarea id="fNote" style="min-height:5em">${esc(r.note || '')}</textarea></div>
      <div class="field"><label for="fNotes">${esc(t.notesF)}</label><textarea id="fNotes" style="min-height:4em">${esc(r.notes || '')}</textarea></div>
      <div class="field"><label for="fSource">${esc(t.sourceF)}</label><input class="input" id="fSource" placeholder="${esc(t.sourcePh)}" value="${esc(r.source || '')}"></div>
      <div class="field"><label for="fLink">${esc(t.link)}</label><input class="input" id="fLink" type="url" inputmode="url" value="${esc(r.link || '')}"></div>
      <div class="field"><label for="fTags">${esc(t.tags)}</label><input class="input" id="fTags" placeholder="${esc(t.tagsPh)}" value="${esc((r.tags || []).join(', '))}"></div>
    </form>
    <div class="savebar"><div class="in"><button class="btn" data-act="back">${esc(t.cancel)}</button><button class="btn primary" data-act="save">${ico('check')}${esc(t.save)}</button></div></div>`;
  $('#view').dataset.id = isNew ? '' : r.id;
  drawPhotoBox(); drawFormPages();
  const form = $('#form');
  form.addEventListener('input', () => ls.set('draft', { key: draftKey, ts: Date.now(), data: readForm() }));
  form.addEventListener('submit', e => e.preventDefault());
  $('#fPhotoUrl').addEventListener('change', e => { const v = e.target.value.trim(); if (/^https?:\/\//.test(v)) { formPhoto = v; drawPhotoBox(); } });
  window.scrollTo(0, 0);
  if (pendingShare) { const p = pendingShare; pendingShare = null; applyShare(p); }
}
function drawPhotoBox() {
  const t = T(), box = $('#photoBox'); if (!box) return;
  box.innerHTML = formPhoto
    ? `<div style="display:grid;gap:10px;width:100%"><img src="${esc(formPhoto)}" alt=""><div class="acts"><button type="button" class="btn small" data-act="pickphoto">${ico('camera')}${esc(t.changePhoto)}</button><button type="button" class="btn small danger" data-act="rmphoto">${esc(t.removePhoto)}</button></div></div>`
    : `<button type="button" class="btn" data-act="pickphoto">${ico('camera')}${esc(t.addPhoto)}</button>`;
}
function readForm() {
  const v = id => $('#' + id)?.value?.trim() ?? '';
  return {
    title: v('fTitle'), link: v('fLink'), category: v('fCat'), kashrut: $('input[name="kashrut"]:checked')?.value || '',
    holidays: $$('.occ-chips .chip.on[data-h]').map(b => b.dataset.h),
    servings: +v('fServ') || '', prep: +v('fPrep') || '', cook: +v('fCook') || '',
    ingredients: $('#fIng')?.value || '', steps: $('#fSteps')?.value || '', notes: $('#fNotes')?.value || '', note: $('#fNote')?.value || '', source: v('fSource'),
    tags: v('fTags').split(',').map(s => s.trim()).filter(Boolean), photo: formPhoto, pages: formPages,
  };
}
function fillForm(d, onlyEmpty = false) {
  const set = (id, val) => { const el = $('#' + id); if (!el || val == null || val === '') return; if (onlyEmpty && el.value.trim()) return; el.value = val; if (el.tagName === 'SELECT') el.dispatchEvent(new Event('change')); };
  set('fTitle', d.title); set('fLink', d.link); set('fCat', d.category); set('fServ', d.servings); set('fPrep', d.prep); set('fCook', d.cook);
  set('fIng', d.ingredients); set('fSteps', d.steps); set('fNotes', d.notes); set('fSource', d.source);
  if (d.tags?.length) set('fTags', d.tags.join(', '));
  if (d.kashrut !== undefined && !onlyEmpty) { const k = $(`input[name="kashrut"][value="${d.kashrut}"]`); if (k) k.checked = true; }
  if (!onlyEmpty && d.kashrut) $('.more-box').open = true;
  if (d.holidays && !onlyEmpty) $$('.occ-chips .chip[data-h]').forEach(b => { const on = d.holidays.includes(b.dataset.h); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  if (d.photo && (!onlyEmpty || !formPhoto)) { formPhoto = d.photo; drawPhotoBox(); if (/^https?:/.test(d.photo)) $('#fPhotoUrl').value = d.photo; }
}
async function saveRecipe(r) {
  migrate(r);
  indexRecipe(r);
  if (FAM.on) { await cloudSave(r); return; }
  await DB.put(r);
  const i = recipes.findIndex(x => x.id === r.id);
  if (i >= 0) recipes[i] = r; else recipes.push(r);
  try { navigator.storage?.persist?.(); } catch {}
}
async function submitForm() {
  const t = T(), d = readForm();
  if (!d.title) { toast(t.needTitle); $('#fTitle').focus(); return; }
  const id = $('#view').dataset.id;
  const old = id ? byId(id) : null;
  const r = Object.assign({}, old || { id: uid(), createdAt: Date.now(), cookCount: 0, rating: 0, favorite: false }, d, { updatedAt: Date.now() });
  if (r.photo !== old?.photo) r.thumb = r.photo ? (r.photo.startsWith('data:') ? await thumbFrom(r.photo) : r.photo) : null;
  if (old?.sample) r.sample = false;
  const ingLines = lines(r.ingredients); if (ingLines.length <= 3) r.ingredients = ingLines.flatMap(splitList).join('\n');
  if (formTag.auto) r.autoTagged = true;
  if (formTag.ai) r.aiTagged = true;
  autoTag(r);
  await saveRecipe(r);
  ls.del('draft');
  toast(t.saved);
  location.replace('#/r/' + r.id);
  claudeTagRecipe(r).then(done => { if (done && current === 'recipe' && $('#view').dataset.id === r.id) { const y = window.scrollY; renderRecipe(byId(r.id) || r); window.scrollTo(0, y); } });
}

// ---------- Smart tags: each recipe is filed under its seasons, weather and occasions ----------
// On the phone: the same word lists as the suggestions. With a Claude key: Claude reads the recipe too.
const OCC_WORDS = { bbq: 'barbecue|bbq|plancha|grill|brochette|kebab|burger', brunch: 'brunch|pancake|granola|oeufs? brouill|scrambled|pain perdu|french toast|muffin|shakshuka|chakchouka', friends: 'apero|aperitif|tapas|mezze|houmous|hummus|plateau|amuse' };
const PROTEIN = [[/\b(poulet|dinde|canard|chicken|turkey|duck)/, 'poultry'], [/\b(boeuf|agneau|veau|porc|beef|lamb|veal|pork)/, 'meat'], [/\b(poisson|saumon|dorade|thon|cabillaud|crevette|fish|salmon|tuna|cod|shrimp)/, 'fish']];
// From the title first; otherwise from the main protein in the ingredients.
const guessCat = r => (GUESS.find(([re]) => re.test(norm(r.title))) || PROTEIN.find(([re]) => re.test(norm(r.ingredients))) || [])[1] || '';
function guessTags(r) {
  indexRecipe(r);
  const tags = new Set(r.holidays || []);
  for (const key of ['hotday', 'coldday', 'rainyday', 'spring', 'summer', 'autumn', 'winter']) if (moodScore(r, key).score >= 5) tags.add(key);
  const body = r._ix.title + ' ' + r._ix.ing + ' ' + norm(r.steps);
  for (const [k, pat] of Object.entries(OCC_WORDS)) if (new RegExp('\\b(' + pat + ')').test(body)) tags.add(k);
  const category = r.category || guessCat(r);
  if (totalTime(r) && totalTime(r) <= 30 && ['mains', 'meat', 'poultry', 'fish', 'vegetarian'].includes(category)) tags.add('weeknight');
  return { holidays: [...tags], category };
}
function autoTag(r) {
  if (r.autoTagged) return;
  Object.assign(r, guessTags(r), { autoTagged: true });
}
const TAG_KEYS = [...OCCASIONS, ...SEASONS, ...HOLIDAYS];
async function claudeTags(r) {
  const client = await claudeClient();
  const msg = await client.beta.messages.create({
    model: 'claude-opus-5-5', max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: { type: 'object', additionalProperties: false, required: ['category', 'tags', 'keywords'], properties: {
      category: { type: 'string', enum: [...CATS, ''] }, tags: { type: 'array', items: { type: 'string', enum: TAG_KEYS } }, keywords: { type: 'array', items: { type: 'string' } } } } } },
    messages: [{ role: 'user', content: `File this recipe for a family cookbook (French-Jewish-American family in Bordeaux).
Pick the category, and the tags that clearly fit: seasons by its main produce (spring, summer, autumn, winter, garden for vegetable-garden dishes); weather (hotday: a scorching day, coldday: a cold winter day, rainyday); occasions (friends: having friends over, family: family dinner, birthday, thanksgiving, newyear, brunch, bbq: barbecue or picnic, weeknight: quick weeknight dinner); Jewish holidays only if the dish is traditional for that holiday (shabbat, roshhashana, yomkippur for the meal before or after the fast, sukkot, hanukkah, tubishvat, purim, pesach only if kosher for Passover, shavuot). Usually 2 to 5 tags. Leave out anything doubtful.
keywords: up to 5 short search words in the recipe's own language (main ingredient, dish type, cuisine), not repeating the title.

<recipe>
${[r.title, r.category && 'Category: ' + r.category, 'Ingredients:\n' + (r.ingredients || ''), 'Steps:\n' + (r.steps || ''), r.notes].filter(Boolean).join('\n').slice(0, 12000)}
</recipe>` }],
  });
  if (msg.stop_reason === 'refusal') return null;
  return JSON.parse(msg.content.filter(b => b.type === 'text').map(b => b.text).join(''));
}
// Adds Claude's tags (never removes the ones already there). Quietly does nothing without a key.
async function claudeTagRecipe(r) {
  if (!hasClaude() || !navigator.onLine || r.aiTagged || (FAM.on && r.owner && r.owner !== FAM.uid)) return false;
  let d; try { d = await claudeTags(r); } catch (e) { console.warn(e); return false; }
  if (!d) return false;
  const cur = byId(r.id) || r;
  cur.holidays = [...new Set([...(cur.holidays || []), ...d.tags.filter(k => TAG_KEYS.includes(k))])];
  if (!cur.category && CATS.includes(d.category)) cur.category = d.category;
  if (!(cur.tags || []).length && d.keywords?.length) cur.tags = d.keywords.map(x => x.trim()).filter(x => x && x.length < 25).slice(0, 5);
  cur.aiTagged = true;
  await saveRecipe(cur);
  return true;
}
// The "Ranger automatiquement" button in the form (also run after an import): fills in what fits, all still editable.
let formTag = { auto: false, ai: false };
async function formAutoTag(quiet) {
  const t = T(), btn = $('[data-act="autotag"]'); if (!btn || btn.disabled) return;
  const r = readForm();
  if (!r.title && !r.ingredients.trim()) { if (!quiet) toast(t.autoTagEmpty); return; }
  const before = new Set(r.holidays), catBefore = r.category;
  const apply = (keys, cat, kw) => {
    if (cat && !$('#fCat').value) { $('#fCat').value = cat; $('#fCat').dispatchEvent(new Event('change')); }
    for (const k of keys) { const c = $(`.occ-chips .chip[data-h="${k}"]`); if (c && !c.classList.contains('on')) { c.classList.add('on', 'just'); c.setAttribute('aria-pressed', true); } }
    if (kw?.length && !$('#fTags').value.trim()) $('#fTags').value = kw.slice(0, 5).join(', ');
  };
  const g = guessTags(r); apply(g.holidays, g.category); formTag.auto = true;
  if (hasClaude() && navigator.onLine) {
    btn.disabled = true; btn.innerHTML = `<span class="spinner sm" aria-hidden="true"></span>${esc(t.autoTagBusy)}`;
    try { const c = await claudeTags({ ...r, holidays: readForm().holidays }); if (c && $('#form')) { apply(c.tags, c.category, c.keywords); formTag.ai = true; } } catch (e) { console.warn(e); }
    btn.disabled = false; btn.innerHTML = ico('spark') + esc(t.autoTagBtn);
  }
  if (!$('#form')) return;
  const after = readForm(), n = after.holidays.filter(h => !before.has(h)).length + (after.category !== catBefore ? 1 : 0);
  $('#form').dispatchEvent(new Event('input'));
  if (!quiet || n) toast(n ? t.autoTagDone(n) : t.autoTagNone);
}
// Once per phone: file the recipes that were added before smart tags existed.
async function tagSweep() {
  const mine = recipes.filter(r => !r.autoTagged && !r.sample && (!FAM.on || r.owner === FAM.uid));
  for (const r of mine) { autoTag(r); await saveRecipe(r); }
}
async function claudeTagAll() {
  const t = T(), todo = recipes.filter(r => !r.aiTagged && !r.sample && (!FAM.on || r.owner === FAM.uid));
  if (!todo.length) { toast(t.tagAllDone(0)); return; }
  let n = 0;
  for (const r of todo) { toast(t.tagAllProgress(n + 1, todo.length)); if (await claudeTagRecipe(r)) n++; }
  toast(t.tagAllDone(n));
}

// Pasted text → fields
// "200 g de farine, 3 œufs, 100 g de sucre" → one ingredient per line. "1,5 kg" (no space) and "2 oignons, émincés" (two parts) stay whole.
const splitList = l => { const parts = l.split(/[,;]\s+/).map(x => x.trim()).filter(Boolean); return parts.length >= 3 ? parts : [l]; };
function parseRecipeText(text) {
  const ls_ = String(text).split(/\r?\n/).map(l => l.trim());
  const H_ING = /^(ingr[eé]dients?|ingredients?|il vous faut|liste des ingr[eé]dients)\s*:?$/i;
  const H_STEP = /^(pr[eé]paration|instructions?|[eé]tapes?|m[eé]thode|method|directions|recette|steps|preparation)\s*:?$/i;
  const H_NOTE = /^(notes?|astuces?|conseils?|tips?)\s*:?$/i;
  let mode = 'head', title = '', ing = [], steps = [], notes = [], head = [];
  // "Ingrédients : 200 g de farine, 3 œufs" — a heading with its content on the same line
  const inline = (l, re) => { const m = l.match(new RegExp(re.source.replace('\\s*:?$', '\\s*:\\s*(.+)$'), 'i')); return m && m[m.length - 1]; };
  for (let l of ls_) {
    if (!l) continue;
    l = l.replace(/^[-•*▢☐◦·]\s*/, '');
    if (H_ING.test(l)) { mode = 'ing'; continue; }
    if (H_STEP.test(l)) { mode = 'steps'; continue; }
    if (H_NOTE.test(l)) { mode = 'notes'; continue; }
    let rest;
    if ((rest = inline(l, H_ING))) { mode = 'ing'; l = rest; }
    else if ((rest = inline(l, H_STEP))) { mode = 'steps'; l = rest; }
    else if ((rest = inline(l, H_NOTE))) { mode = 'notes'; l = rest; }
    ({ head, ing, steps, notes })[mode === 'head' ? 'head' : mode].push(l);
  }
  // Ingredients written as a list on one line: "200 g de farine, 3 œufs, 100 g de sucre" (but not "1,5 kg")
  ing = ing.flatMap(splitList);
  // Steps written as one paragraph: one step per sentence
  if (steps.length === 1 && steps[0].length > 160) steps = steps[0].split(/(?<=[.!])\s+(?=[A-ZÀ-Ý0-9])/);
  if (!ing.length && !steps.length) {
    // No headings: short lines that look like quantities are ingredients, long lines are steps.
    const rest = head.slice(1); title = head[0] || '';
    for (const l of rest) (l.length < 70 && !/[.!]$/.test(l) ? ing : steps).push(l);
  } else { title = head[0] || ''; notes = notes.concat(head.slice(1).filter(l => l.length > 40 && !/personnes|servings|serves|pr[eé]paration|cuisson|prep|cook/i.test(l))); }
  const d = { title: title.replace(/^recette\s*:?\s*/i, ''), ingredients: ing.map(l => l.replace(/^[-•*▢☐]\s*/, '')).join('\n'), steps: steps.map(cleanStep).join('\n'), notes: notes.join('\n') };
  const all = norm(text);
  const pers = all.match(/(?:pour|for|serves?|portions?\s*:?)\s*(\d+)\s*(?:personnes?|pers|people|servings|portions)?/);
  if (pers) d.servings = +pers[1];
  const prep = all.match(/(?:preparation|prep(?:\s*time)?)\s*:?\s*(\d+)\s*(min|h)/); if (prep) d.prep = prep[2] === 'h' ? prep[1] * 60 : +prep[1];
  const ck = all.match(/(?:cuisson|cook(?:ing)?(?:\s*time)?)\s*:?\s*(\d+)\s*(min|h)/); if (ck) d.cook = ck[2] === 'h' ? ck[1] * 60 : +ck[1];
  const url = String(text).match(/https?:\/\/\S+/); if (url) d.link = url[0];
  return d;
}

// ---------- Adding a recipe: one box for a link or a whole recipe, and Photos ----------
function addStatus(msg, kind = '') {
  const el = $('#addStatus'); if (!el) { if (msg) toast(msg); return; }
  el.hidden = !msg; el.className = 'addstatus ' + kind; el.textContent = msg || '';
}
// What went wrong with Claude, in plain words.
function claudeErrorText(e) {
  const t = T(), s = e?.status, m = String(e?.error?.error?.message || e?.message || '');
  if (e?.refusal) return t.claudeRefused;
  if (s === 401 || s === 403) return t.claudeErrKey;
  if (/credit|billing|balance/i.test(m)) return t.claudeErrCredit;
  if (s === 429 || s === 529 || s >= 500) return t.claudeErrBusy;
  if (!navigator.onLine || !s) return t.claudeOffline;
  return t.claudeErr + ` (${s})`;
}
async function smartFill(btn) {
  const t = T(), box = $('#fSmart'), v = box.value.trim();
  if (!v) { box.focus(); return; }
  const url = (v.match(/https?:\/\/[^\s<>"]+/) || [])[0];
  const label = btn?.innerHTML; if (btn) { btn.disabled = true; btn.textContent = t.importing; }
  try {
    if (url && v.length - url.length < 40) { $('#fLink').value = url; await importLink(url, btn); }
    else { if (url) $('#fLink').value = url; await importText(v, btn); }
  } finally { if (btn) { btn.disabled = false; btn.innerHTML = label; } }
}
async function importText(v, btn) {
  const t = T();
  let failed = '';
  if (hasClaude() && navigator.onLine) {
    if (btn) btn.textContent = t.claudeReading;
    try { const c = await claudeRecipe({ text: v }); if (c) { fillForm(c); addStatus(t.claudeReadOk, 'ok'); formAutoTag(true); return; } }
    catch (e) { console.warn(e); failed = claudeErrorText(e); }
  }
  fillForm(parseRecipeText(v)); formAutoTag(true);
  addStatus(failed ? failed + ' ' + t.filledWithoutClaude : t.filledWithoutClaude + (hasClaude() ? '' : ' ' + t.claudeTip), 'warn');
}

// Link → fields (reads schema.org Recipe data that most recipe sites publish)
const PROXIES = [u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u), u => 'https://corsproxy.io/?url=' + encodeURIComponent(u), u => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u)];
// The site's own page fetcher (netlify/functions/fetch-page.mjs) first, then the page itself, then public proxies.
const OWN_FETCH = location.protocol === 'https:' ? u => '/api/fetch?url=' + encodeURIComponent(u) : null;
async function fetchVia(url, asBlob) {
  if (OWN_FETCH) try { const r = await fetch(OWN_FETCH(url), { signal: AbortSignal.timeout(12000) }); if (r.ok && !(r.headers.get('content-type') || '').includes('application/json')) return asBlob ? r.blob() : r.text(); } catch {}
  try { const r = await fetch(url, { signal: AbortSignal.timeout(8000) }); if (r.ok) return asBlob ? r.blob() : r.text(); } catch {}
  for (const p of PROXIES) {
    try { const r = await fetch(p(url), { signal: AbortSignal.timeout(12000) }); if (r.ok) return asBlob ? r.blob() : r.text(); } catch {}
  }
  return null;
}
const isoMin = s => { if (!s || typeof s !== 'string') return ''; const m = s.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i); if (!m) return ''; return ((+m[1] || 0) * 1440 + (+m[2] || 0) * 60 + (+m[3] || 0)) || ''; };
const txt = s => { const d = document.createElement('div'); d.innerHTML = String(s || ''); return d.textContent.replace(/\s+/g, ' ').trim(); };
function findRecipeLD(doc) {
  const out = [];
  const walk = o => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk); const ty = [].concat(o['@type'] || []); if (ty.some(x => /Recipe$/i.test(x))) out.push(o); if (o['@graph']) walk(o['@graph']); if (o.mainEntity) walk(o.mainEntity); };
  for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) { try { walk(JSON.parse(s.textContent)); } catch {} }
  return out[0];
}
function stepsFromLD(ins) {
  const out = [];
  const walk = x => {
    if (!x) return;
    if (typeof x === 'string') return txt(x).split(/\n+/).forEach(l => l.trim() && out.push(l.trim()));
    if (Array.isArray(x)) return x.forEach(walk);
    if (/HowToSection/i.test(x['@type'])) { if (x.name) out.push(txt(x.name) + ' :'); return walk(x.itemListElement); }
    if (x.text) out.push(txt(x.text)); else if (x.name) out.push(txt(x.name));
  };
  walk(ins); return out;
}
let lastPageText = '';
// Readable text of a page, for Claude when the page has no recipe data built in.
function pageText(doc) {
  doc.querySelectorAll('script:not([type="application/ld+json"]),style,noscript,svg,iframe,form,nav,footer,header,aside,button').forEach(e => e.remove());
  doc.querySelectorAll('p,li,h1,h2,h3,h4,h5,br,div,tr,section,article').forEach(e => e.append('\n'));
  return (doc.body?.textContent || '').replace(/[ \t\u00a0]+/g, ' ').replace(/\n\s*\n\s*\n+/g, '\n\n').trim().slice(0, 80000);
}
async function importFromLink(url) {
  lastPageText = '';
  const html = await fetchVia(url);
  if (!html) return null;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  lastPageText = pageText(new DOMParser().parseFromString(html, 'text/html'));
  const ld = findRecipeLD(doc);
  const meta = n => doc.querySelector(`meta[property="${n}"],meta[name="${n}"]`)?.content;
  if (!ld) { const title = meta('og:title') || doc.title; return title ? { title: txt(title), photo: meta('og:image') || null, link: url, partial: true } : null; }
  let img = ld.image; if (Array.isArray(img)) img = img[0]; if (img && typeof img === 'object') img = img.url || img.contentUrl;
  const yieldN = String([].concat(ld.recipeYield || [])[0] || '').match(/\d+/);
  const kw = typeof ld.keywords === 'string' ? ld.keywords.split(',') : [].concat(ld.keywords || []);
  return {
    title: txt(ld.name), link: url, photo: img || meta('og:image') || null,
    ingredients: [].concat(ld.recipeIngredient || ld.ingredients || []).map(txt).join('\n'),
    steps: stepsFromLD(ld.recipeInstructions).join('\n'),
    servings: yieldN ? +yieldN[0] : '', prep: isoMin(ld.prepTime), cook: isoMin(ld.cookTime) || (isoMin(ld.totalTime) && !isoMin(ld.prepTime) ? isoMin(ld.totalTime) : ''),
    notes: ld.description ? txt(ld.description) : '', tags: kw.map(s => txt(s)).filter(s => s && s.length < 25).slice(0, 5),
  };
}
// ---------- Claude reads a recipe (screenshots, a page, or pasted text) ----------
// Needs the Claude key from Plus → Claude. Returns form data, or null if no recipe was found.
const RECIPE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['found', 'title', 'servings', 'prepMinutes', 'cookMinutes', 'ingredients', 'steps', 'notes', 'category', 'source', 'tags'],
  properties: {
    found: { type: 'boolean' }, title: { type: 'string' }, servings: { type: 'integer' }, prepMinutes: { type: 'integer' }, cookMinutes: { type: 'integer' },
    ingredients: { type: 'array', items: { type: 'string' } }, steps: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' }, category: { type: 'string', enum: [...CATS, ''] }, source: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } },
  },
};
const claudeKey = () => ls.get('claudeKey', '') || (FAM.on ? ls.get('famClaudeKey', '') : '');
const hasClaude = () => !!claudeKey();
async function claudeRecipe({ images = [], text = '', url = '' }) {
  const client = await claudeClient();
  const what = images.length ? (images.length > 1 ? `${images.length} screenshots or photos, in order, of one recipe` : 'a screenshot or photo of a recipe') : text ? 'the text of a recipe page' : 'a recipe web page';
  const prompt = `Here is ${what}. Copy the recipe into the fields, exactly as written and in its own language: do not translate, invent, or "improve" anything.
- ingredients: one per item, with its quantity. If the recipe groups them (for the dough, for the filling), add the group name as its own item ending with ":".
- steps: one step per item, without the step number. Same grouping rule.
- servings, prepMinutes, cookMinutes: numbers if the recipe gives them, otherwise 0.
- notes: tips, variations or the short introduction, if any. source: the author, book or site, if shown.
- category: the best fit from the list, or "" if unsure. tags: up to 5 short keywords in the recipe's language.
Leave out ads, comments, ratings, navigation, and anything that isn't the recipe. Join text that runs across several screenshots.
If there is no recipe here, set found to false and leave the rest empty.`;
  const content = images.map(d => ({ type: 'image', source: { type: 'base64', media_type: d.slice(5, d.indexOf(';')), data: d.slice(d.indexOf(',') + 1) } }));
  content.push({ type: 'text', text: prompt + (text ? `\n\n<page${url ? ` url="${url}"` : ''}>\n${text}\n</page>` : url ? `\n\nThe recipe page: ${url}` : '') });
  const messages = [{ role: 'user', content }];
  const useFetch = !images.length && !text && url;
  let msg;
  for (let turn = 0; turn < 4; turn++) {
    msg = await client.beta.messages.create({
      model: 'claude-opus-5-5', max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: RECIPE_SCHEMA } },
      messages,
      ...(useFetch ? { tools: [{ type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 3 }] } : {}),
    });
    if (msg.stop_reason !== 'pause_turn') break;
    messages.push({ role: 'assistant', content: msg.content });  // let the server finish fetching
  }
  if (msg.stop_reason === 'refusal') throw Object.assign(new Error('refusal'), { refusal: true });
  const d = JSON.parse(msg.content.filter(b => b.type === 'text').map(b => b.text).join(''));
  if (!d.found || !(d.title || d.ingredients.length || d.steps.length)) return null;
  return {
    title: d.title.trim(), ingredients: d.ingredients.map(x => x.trim()).filter(Boolean).join('\n'), steps: d.steps.map(x => x.trim()).filter(Boolean).join('\n'),
    servings: d.servings > 0 ? d.servings : '', prep: d.prepMinutes > 0 ? d.prepMinutes : '', cook: d.cookMinutes > 0 ? d.cookMinutes : '',
    notes: d.notes.trim(), category: CATS.includes(d.category) ? d.category : '', source: d.source.trim(), tags: d.tags.map(x => x.trim()).filter(x => x && x.length < 25).slice(0, 5),
  };
}
async function localizePhoto(url) {
  // Save a copy of a web image inside the app so it still shows offline.
  try { const b = await fetchVia(url, true); if (b && b.type.startsWith('image/')) return await compress(b, 1400); } catch {}
  return url;
}

// ---------- Cookbook pages: photo + text reading (Tesseract, bundled with the app) ----------
let formPages = [];
function drawFormPages() {
  const box = $('#formPages'); if (!box) return;
  const t = T();
  box.innerHTML = formPages.map((p, i) => `<div class="page-th"><button type="button" data-act="viewpage" data-i="${i}" style="all:unset;display:block;width:100%;height:100%"><img src="${esc(p)}" alt="${esc(t.pageAlt(i + 1))}"></button>
    <button type="button" class="rm" data-act="rmpage" data-i="${i}" aria-label="${esc(t.removePage)}">${ico('x')}</button></div>`).join('');
}
function pagesHTML(r) {
  const n = (r.pages || []).length; if (!n) return '';
  const t = T();
  return `<section class="section"><div class="section-h"><h2>${esc(t.pagesN(n))}</h2></div><div class="pages">${r.pages.map((p, i) =>
    `<button class="page-th" data-act="viewpage" data-i="${i}" aria-label="${esc(t.pageAlt(i + 1))}"><img src="${esc(p)}" alt="" loading="lazy"></button>`).join('')}</div></section>`;
}
function viewImage(src) {
  const el = document.createElement('div'); el.className = 'viewer'; el.setAttribute('role', 'dialog');
  el.innerHTML = `<button class="icon-btn on-photo close" aria-label="${esc(T().close)}">${ico('x')}</button><div class="vs"><img src="${esc(src)}" alt=""></div>`;
  el.addEventListener('click', e => { if (e.target.closest('.close')) el.remove(); else if (e.target.tagName === 'IMG') el.classList.toggle('zoom'); });
  document.body.append(el);
}
const vendorURL = p => new URL('vendor/tesseract/' + p, location.href).href;
let tessLoading = null;
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve();
  return tessLoading ||= new Promise((res, rej) => {
    const sc = document.createElement('script'); sc.src = vendorURL('tesseract.min.js');
    sc.onload = res; sc.onerror = () => { tessLoading = null; rej(new Error('load')); };
    document.head.append(sc);
  });
}
// Book text wraps mid-sentence; join those lines back so each step reads as one paragraph.
function unwrapOcr(text) {
  const out = [];
  const PRON = /^(les|le|la|lui|leur|leurs|en|y|vous|nous|moi|toi|ci|là)\b/;
  const ls_ = text.replace(/\r/g, '')
    .replace(/(\p{L})-\n(\p{Ll}+)/gu, (m, a, b) => PRON.test(b) ? `${a}-${b}` : a + b)
    .split('\n').map(l => l.replace(/\s+/g, ' ').trim())
    .map(l => (l.match(/[\p{L}\d]/gu) || []).length < 2 ? '' : l);  // drop specks read as text
  for (const l of ls_) {
    const prev = out[out.length - 1];
    // Only rejoin long lines: wrapped paragraph text runs the full column width, ingredient lines are short.
    if (l && prev && prev.length >= 40 && !/[.!?:;]$/.test(prev) && /^\p{Ll}/u.test(l)) out[out.length - 1] = prev + ' ' + l;
    else out.push(l);
  }
  return out.filter((l, i, a) => l || (a[i - 1] && a[i + 1])).join('\n').replace(/\n{3,}/g, '\n\n');
}
async function readBookPages(files) {
  const t = T();
  const st = $('#ocrStatus'), txt = $('#ocrText'), bar = $('#ocrBar');
  const set = (msg, p) => { if (!st) return; st.hidden = false; txt.textContent = msg; bar.style.width = Math.round((p || 0) * 100) + '%'; };
  const pages = [];
  for (const f of files) { try { pages.push(await compress(f, 2000, 0.85)); } catch {} }
  if (!pages.length) return;
  formPages.push(...pages); drawFormPages();
  const btn = $('[data-act="book"]'); if (btn) btn.disabled = true;
  addStatus('');
  let claudeFailed = '';
  if (hasClaude() && navigator.onLine) {
    set(t.claudeReading, 0.35);
    try {
      const imgs = []; for (const p of pages) imgs.push(await recompressDataUrl(p, 1800, 0.85));
      const c = await claudeRecipe({ images: imgs });
      if (btn) btn.disabled = false;
      if (c) { st.hidden = true; fillForm(c, true); $('#form')?.dispatchEvent(new Event('input')); addStatus(t.claudeReadOk, 'ok'); formAutoTag(true); return; }
      st.hidden = true; addStatus(t.noRecipeInPhotos, 'warn'); $('#form')?.dispatchEvent(new Event('input')); return;
    } catch (e) { console.warn(e); claudeFailed = claudeErrorText(e); }  // fall back to reading on the phone
  }
  set(t.ocrLoading, 0.02);
  let text = '', cur = 1, worker;
  try {
    await loadTesseract();
    worker = await Tesseract.createWorker(S.lang === 'fr' ? ['fra', 'eng'] : ['eng', 'fra'], 1, {
      workerPath: vendorURL('worker.min.js'), corePath: vendorURL(''), langPath: vendorURL('lang'),
      logger: m => { if (m.status === 'recognizing text') set(t.ocrReading(cur, pages.length, Math.round(m.progress * 100)), m.progress); },
    });
    for (; cur <= pages.length; cur++) { const { data } = await worker.recognize(pages[cur - 1]); text += data.text + '\n\n'; }
  } catch (e) {
    set(t.ocrFail, 0); if (btn) btn.disabled = false; $('#form')?.dispatchEvent(new Event('input')); return;
  } finally { try { await worker?.terminate(); } catch {} }
  if (btn) btn.disabled = false;
  text = unwrapOcr(text).trim();
  if (text.replace(/\W/g, '').length < 10) { set(t.ocrEmpty, 0); $('#form')?.dispatchEvent(new Event('input')); return; }
  st.hidden = true;
  fillForm(parseRecipeText(text), true);
  $('#form')?.dispatchEvent(new Event('input'));
  addStatus(claudeFailed ? claudeFailed + ' ' + t.filledWithoutClaude : hasClaude() ? t.ocrOk : t.filledWithoutClaude + ' ' + t.claudeTip, claudeFailed || !hasClaude() ? 'warn' : 'ok');
  formAutoTag(true);
}
