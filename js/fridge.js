'use strict';
// Our Kitchen: Frigo: what can I make with what I have?
// The scripts share one scope and load in order (see index.html).

// ---------- Fridge: what can I make? ----------
let pantry = ls.get('pantry', []);
const savePantry = () => ls.set('pantry', pantry);
const QUICK_EN = ['eggs', 'butter', 'onions', 'garlic', 'tomatoes', 'potatoes', 'pasta', 'rice', 'chicken', 'cream', 'cheese', 'lemon', 'carrots', 'flour', 'milk', 'courgettes'];
// Basics everyone has: a line made only of these (plus measures) doesn't count as missing.
const STAPLE_W = new Set('sel poivre eau huile olive tournesol neutre fleur noir moulu salt pepper water oil black ground'.split(' '));
const FILL_W = new Set('de du des la le les et a au aux d l c cs cc soupe cafe cuillere cuilleres pincee pincees gout filet peu un une quelques of and tbsp tsp pinch to taste cl ml g kg extra vierge virgin'.split(' '));
const isStaple = n => { const w = n.split(/[^a-z]+/).filter(x => x && !FILL_W.has(x)); return w.length > 0 && w.every(x => STAPLE_W.has(x)); };
const singular = w => w.replace(/(eaux|aux)$/, 'al').replace(/([^s])s$/, '$1').replace(/x$/, '');
function pantryTerms() {
  // each pantry item -> normalised forms, singular forms and known translations
  return pantry.map(p => { const n = norm(p).trim(); const set = new Set([n, singular(n), ...expand(n), ...expand(singular(n))]); return [...set].filter(x => x.length > 1); });
}
// "2 sachets de levure boulangère (16 g)" -> "levure boulangère"
const MEASURE = /^(?:(?:kg|g|gr|grammes?|cl|dl|ml|l|litres?|cups?|tasses?|tbsp|tsp|oz|lb|c\.?\s?à\s?(?:soupe|café)|cuill[eè]res?\s?à\s?(?:soupe|café)|sachets?|gousses?|branches?|brins?|pincées?|tranches?|boîtes?|verres?|bottes?|feuilles?|morceaux?|bouquets?|têtes?|filets?|noix|zestes?)\.?\s+)/i;
const ingName = raw => { let x = raw.trim(); for (let i = 0; i < 2; i++) x = x.replace(MEASURE, '').replace(/^(de |d’|d'|du |des |of )/i, ''); return x.split(/[,(]/)[0].trim(); };
function bookMatches() {
  const terms = pantryTerms(); if (!terms.length) return [];
  const out = [];
  for (const r of recipes) {
    const items = lines(r.ingredients).filter(l => !isHeading(l)).map(l => ({ raw: splitQty(l, 1).rest.trim(), n: norm(l) }));
    const need = items.filter(x => !isStaple(norm(x.raw)));
    if (!need.length) continue;
    const has = x => terms.some(forms => forms.some(f => new RegExp('\\b' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(x.n)));
    const have = need.filter(has), miss = need.filter(x => !has(x));
    if (!have.length) continue;
    const cover = have.length / need.length;
    const score = cover * 100 + have.length * 5 + (r.rating || 0) * 3 + (r.favorite ? 5 : 0) + Math.min(r.cookCount || 0, 5);
    if (cover < 0.3 && have.length < 2) continue;
    out.push({ r, have: have.length, total: need.length, miss: miss.map(x => ingName(x.raw)).filter(Boolean), cover, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 12);
}
let claudeBusy = false, claudeTimer = null;
function renderFridge() {
  current = 'frigo'; navHTML('frigo');
  const t = T(), quick = QUICK_EN.filter(q => !pantry.some(p => norm(p) === norm(q)));
  const last = ls.get('claudeLast', null);
  $('#view').innerHTML = `<div class="wrap stack">
    <header class="top" style="padding-top:8px"><div class="mast"><span>${esc(t.nav.fridge)}</span><span>${esc(String(pantry.length).padStart(2, '0'))}</span></div><h1 class="greet" style="font-style:italic">${esc(t.fridgeTitle)}</h1></header>
    <form class="shop-add" id="pantryAdd"><input class="input" id="pantryIn" placeholder="${esc(t.fridgeAddPh)}" enterkeyhint="done" autocomplete="off"><button class="btn primary" aria-label="${esc(t.add)}">${ico('plus')}</button></form>
    <div class="wrapchips pantry">${pantry.map((p, i) => `<button class="chip on" data-act="pantryrm" data-i="${i}">${esc(p)}${ico('x')}</button>`).join('')}${pantry.length ? `<button class="chip add" data-act="pantryclear">${esc(t.fridgeClear)}</button>` : ''}</div>
    ${quick.length ? `<div><span class="eyebrow">${esc(t.fridgeQuick)}</span><div class="chips" style="flex-wrap:wrap">${quick.map(q => `<button class="chip" data-act="pantryquick" data-q="${esc(q)}">${ico('plus')}${esc(q)}</button>`).join('')}</div></div>` : ''}
    <section class="section" style="margin-top:6px"><div class="section-h"><h2>${esc(t.inYourBook)}</h2></div><div id="bookMatches"></div></section>
    <section class="claude-box" id="claudeBox"></section>
  </div>`;
  $('#pantryAdd').onsubmit = e => { e.preventDefault(); const v = $('#pantryIn').value; addPantry(v); };
  drawBookMatches(); drawClaude(last);
}
function addPantry(v) {
  const items = String(v).split(/[,;\n]| et | and /).map(x => x.trim()).filter(Boolean);
  for (const it of items) if (!pantry.some(p => norm(p) === norm(it))) pantry.push(it);
  savePantry(); renderFridge(); $('#pantryIn')?.focus();
}
function drawBookMatches() {
  const t = T(), box = $('#bookMatches'); if (!box) return;
  if (!pantry.length) { box.innerHTML = `<p class="muted" style="margin:0">${esc(t.fridgeEmpty)}</p>`; return; }
  const m = bookMatches();
  box.innerHTML = m.length ? `<div class="cards">${m.map(x => `<a class="card" href="#/r/${encodeURIComponent(x.r.id)}">${thumbHTML(x.r)}
      <div class="min"><div class="meta"><span class="no">${esc(t.haveOf(x.have, x.total))}</span>${starsMini(x.r.rating)}</div><h3>${esc(x.r.title)}</h3>
      <div class="meta">${x.miss.length ? `<span>${esc(t.missing)} : ${esc(x.miss.slice(0, 4).join(', '))}${x.miss.length > 4 ? '…' : ''}</span>` : `<span style="color:var(--parve)">${esc(t.nothingMissing)}</span>`}</div></div>
      <div class="side"><span class="match" style="--p:${Math.round(x.cover * 100)}">${Math.round(x.cover * 100)}<small>%</small></span></div></a>`).join('')}</div>`
    : `<p class="muted" style="margin:0">${esc(t.noBookMatch)}</p>`;
}
function drawClaude(res) {
  const t = T(), box = $('#claudeBox'); if (!box) return;
  const key = claudeKey();
  const ask = `<button class="btn primary block" data-act="askclaude" ${!pantry.length || claudeBusy ? 'disabled' : ''}>${ico('spark')}${esc(res ? t.askAgain : t.askClaude)}</button>`;
  if (!key) { box.innerHTML = `<div class="panel"><h2>${ico('spark')} Claude</h2><p style="margin:0">${esc(t.claudeNoKey)}</p><a class="btn" href="#/more" data-goto="claude">${esc(t.claudeSetup)}</a></div>`; return; }
  if (claudeBusy) { box.innerHTML = `<div class="panel thinking"><span class="spinner" aria-hidden="true"></span><p style="margin:0">${esc(t.claudeThinking)}</p><span class="eyebrow" id="claudeSec"></span></div>`; return; }
  if (!res) { box.innerHTML = ask; return; }
  if (res.error) { box.innerHTML = `<p class="banner" style="margin:0">${esc(res.error)}</p>${ask}`; return; }
  const book = (res.fromBook || []).map(x => ({ ...x, r: byId(x.id) })).filter(x => x.r);
  box.innerHTML = `<div class="panel claude-ans">
      <div class="catrow"><span class="no">${ico('spark')} Claude</span><span>${esc(t.claudeOld(fmtDate(res.at, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })))}</span></div>
      <h2>${esc(t.claudeSummary)}</h2><p class="claude-summary">${esc(res.summary || '')}</p>
      ${book.length ? `<h3 class="eyebrow">${esc(t.claudeFromBook)}</h3><div class="cards">${book.map(x => `<a class="card" href="#/r/${encodeURIComponent(x.r.id)}">${thumbHTML(x.r)}<div class="min"><h3>${esc(x.r.title)}</h3><div class="meta" style="text-transform:none;letter-spacing:0;font-family:var(--font-body);font-size:.88rem">${esc(x.why || '')}</div></div><div class="side"></div></a>`).join('')}</div>` : ''}
      ${(res.newIdeas || []).length ? `<h3 class="eyebrow">${esc(t.claudeNew)}</h3>${res.newIdeas.map((x, i) => `<article class="idea">
        <span class="eyebrow">${esc(x.site || hostOf(x.url))}${x.time ? ' · ' + esc(x.time) : ''}</span><h3>${esc(x.title)}</h3><p style="margin:0">${esc(x.why || '')}</p>
        ${(x.uses || []).length ? `<div class="meta"><span>${esc(t.claudeUses)} : ${esc(x.uses.join(', '))}</span></div>` : ''}
        ${(x.missing || []).length ? `<div class="meta"><span>${esc(t.missing)} : ${esc(x.missing.join(', '))}</span></div>` : ''}
        <div class="row2"><a class="btn" href="${esc(x.url)}" target="_blank" rel="noopener">${ico('link')}${esc(t.openSite)}</a><button class="btn primary" data-act="saveidea" data-i="${i}">${ico('download')}${esc(t.saveIdea)}</button></div></article>`).join('')}` : ''}
    </div>${ask}`;
}
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

// Claude, called from the phone with the user's own key (kept in this browser only).
let AnthropicSDK = null;
async function claudeClient() {
  if (!AnthropicSDK) AnthropicSDK = (await import(new URL('vendor/anthropic/anthropic-sdk.mjs', document.baseURI).href)).default;
  return new AnthropicSDK({ apiKey: claudeKey(), dangerouslyAllowBrowser: true });
}
function claudePrompt() {
  const local = bookMatches().slice(0, 8);
  const shortlist = [...new Set([...local.map(x => x.r), ...[...recipes].sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.cookCount || 0) - (a.cookCount || 0))])].slice(0, 60);
  const book = shortlist.map(r => ({ id: r.id, title: r.title, category: r.category || undefined, rating: r.rating || 0, favorite: !!r.favorite, cooked: r.cookCount || 0,
    ingredients: lines(r.ingredients).filter(l => !isHeading(l)).slice(0, 14).map(l => splitQty(l, 1).rest.trim()) }));
  const season = seasonNow(), w = wx && Date.now() - wx.at < 3 * 3600e3 ? `${wx.temp}°C in ${wx.city}` : 'unknown';
  const lang = 'English';
  const system = `You help a home cook decide what to make with what they have. Write everything for the cook in ${lang}, warmly and briefly, like a friend who cooks well.
Use the web_search tool to find 3 to 5 real recipe pages that use the ingredients on hand. Only suggest a page you actually found in your search results, and give its exact URL. Choose individual recipe pages, not home pages or lists.
Also pick up to 4 of the cook's own saved recipes that fit, using their ids exactly as given. Favour the cook's highly rated and often-cooked recipes when the ingredients fit.
When you are done, reply with only one JSON object between <json> and </json>, with this shape:
{"summary": "2 to 4 sentences: what to cook tonight and why", "fromBook": [{"id": "saved recipe id", "why": "one short sentence"}], "newIdeas": [{"title": "recipe name", "url": "https://...", "site": "site name", "why": "one short sentence", "uses": ["ingredients on hand it uses"], "missing": ["what they would need to buy"], "time": "approximate total time, e.g. 40 min"}]}`;
  const user = `Ingredients on hand: ${pantry.join(', ')}.
Season: ${season}. Current weather: ${w}. Date: ${new Date().toDateString()}.
The cook's saved recipes (JSON): ${JSON.stringify(book)}
The app's own ingredient matching found these as closest: ${local.map(x => `${x.r.title} (${x.have}/${x.total})`).join('; ') || 'none'}.`;
  return { system, user };
}
async function askClaude() {
  const t = T();
  if (!navigator.onLine) { drawClaude({ error: t.claudeOffline }); return; }
  claudeBusy = true; drawClaude(null);
  const started = Date.now(); clearInterval(claudeTimer);
  claudeTimer = setInterval(() => { const el = $('#claudeSec'); if (el) el.textContent = t.claudeSec(Math.round((Date.now() - started) / 1000)); }, 1000);
  let res;
  try {
    const client = await claudeClient();
    const { system, user } = claudePrompt();
    const messages = [{ role: 'user', content: user }];
    let msg;
    for (let turn = 0; turn < 4; turn++) {
      msg = await client.beta.messages.create({
        model: 'claude-opus-5-5', max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
        output_config: { effort: 'medium' },
        system, messages,
        tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 6 }],
      });
      if (msg.stop_reason !== 'pause_turn') break;
      messages.push({ role: 'assistant', content: msg.content });  // let the server continue its search loop
    }
    if (msg.stop_reason === 'refusal') throw Object.assign(new Error('refusal'), { refusal: true });
    // URLs Claude actually saw in search results: only those links are shown.
    const seen = new Set();
    for (const b of msg.content) if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) b.content.forEach(x => x.url && seen.add(x.url.replace(/\/$/, '')));
    const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const json = (text.match(/<json>([\s\S]*?)<\/json>/) || [])[1] || (text.match(/\{[\s\S]*\}/) || [])[0];
    const data = JSON.parse(json);
    res = {
      at: Date.now(), summary: String(data.summary || ''),
      fromBook: (data.fromBook || []).filter(x => byId(x.id)).slice(0, 4),
      newIdeas: (data.newIdeas || []).filter(x => /^https?:\/\//.test(x.url || '') && (!seen.size || seen.has(String(x.url).replace(/\/$/, '')))).slice(0, 5),
    };
    ls.set('claudeLast', res);
  } catch (e) {
    const status = e && e.status;
    res = { error: e && e.refusal ? t.claudeRefused : status === 401 || status === 403 ? t.claudeErrKey : t.claudeErr };
  }
  claudeBusy = false; clearInterval(claudeTimer);
  if (current === 'frigo') drawClaude(res);
}
