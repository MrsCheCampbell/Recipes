'use strict';
// La Cuisine d'Abe: Sending recipes between phones, sharing into the app, shopping list, settings, examples.
// The scripts share one scope and load in order (see index.html).

// ---------- Sending recipes between phones ----------
// A recipe travels inside a link (compressed into the address), sent by WhatsApp, SMS or e-mail.
// Opening the link puts it in the receiver's inbox, where they keep it or delete it.
let inbox = ls.get('inbox', []);
const saveInbox = () => { ls.set('inbox', inbox); updateNavCount(); };
const b64url = bytes => { let s = ''; bytes.forEach(b => s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64url = str => Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
async function squeeze(bytes, how) {
  const stream = new Blob([bytes]).stream().pipeThrough(how === 'in' ? new CompressionStream('deflate-raw') : new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function packRecipe(r) {
  const keep = ['title', 'category', 'kashrut', 'servings', 'prep', 'cook', 'ingredients', 'steps', 'notes', 'source', 'link', 'tags'];
  const rec = {}; for (const k of keep) if (r[k]) rec[k] = r[k];
  rec.holidays = (r.holidays || []).filter(h => !h.startsWith('c_'));
  const pic = r.thumb || r.photo;
  if (pic && pic.startsWith('data:')) { try { const mini = await compress(await (await fetch(pic)).blob(), 160, 0.6); if (mini.length < 9000) rec.mini = mini; } catch {} }
  const bytes = new TextEncoder().encode(JSON.stringify({ v: 1, from: S.name || '', at: Date.now(), r: rec }));
  if ('CompressionStream' in window) { try { return '1' + b64url(await squeeze(bytes, 'in')); } catch {} }
  return '0' + b64url(bytes);
}
async function unpackRecipe(code) {
  const bytes = unb64url(code.slice(1));
  const json = new TextDecoder().decode(code[0] === '1' ? await squeeze(bytes, 'out') : bytes);
  const d = JSON.parse(json);
  if (!d || !d.r || !d.r.title) throw new Error('bad');
  return d;
}
const codeHash = c => { let h = 5381; for (let i = 0; i < c.length; i++) h = ((h * 33) ^ c.charCodeAt(i)) >>> 0; return h.toString(36); };
async function receiveCode(code, quiet) {
  const t = T();
  let d; try { d = await unpackRecipe(code); } catch { if (!quiet) toast(t.pasteBad); return false; }
  const id = 'in_' + codeHash(code);
  if (inbox.some(x => x.id === id)) { if (!quiet) toast(t.alreadyIn); return 'dup'; }
  inbox.unshift({ id, from: d.from || t.someone, sentAt: d.at, receivedAt: Date.now(), r: d.r, code });
  saveInbox();
  return true;
}
const codeFromText = txt => (String(txt).match(/#\/recu\/([A-Za-z0-9_-]{8,})/) || [])[1];
async function sendRecipe(r) {
  const t = T();
  const url = location.origin + location.pathname + '#/recu/' + await packRecipe(r);
  const text = t.sendText(S.name || 'Abe', r.title);
  if (navigator.share) { try { await navigator.share({ title: r.title, text, url }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(text + '\n' + url); toast(t.copied); } catch { toast(t.copied); }
}
function letterHTML(x) {
  const t = T(), r = x.r;
  const fake = { ...r, id: x.id };
  const pic = r.mini ? `<img class="thumb" src="${esc(r.mini)}" alt="">` : artHTML(fake, 'thumb');
  return `<article class="letter-card" data-id="${x.id}">
    <div class="stamp-row"><span class="postmark">${esc(t.parAvion)}</span><span>${esc(t.receivedOn(fmtDate(x.receivedAt, { day: '2-digit', month: '2-digit', year: 'numeric' })))}</span></div>
    <div class="letter-main">${pic}<div class="min"><span class="eyebrow">${esc(t.fromWho(x.from))}</span><h3>${esc(r.title)}</h3>
      <div class="meta">${[r.category && t.cat[r.category], (+r.prep || 0) + (+r.cook || 0) ? fmtDur((+r.prep || 0) + (+r.cook || 0)) : '', r.servings ? t.servings(+r.servings) : ''].filter(Boolean).map(m => `<span>${esc(m)}</span>`).join('')}</div></div></div>
    <details class="peek"><summary>${esc(t.preview)}</summary>
      ${lines(r.ingredients).length ? `<ul>${lines(r.ingredients).map(l => `<li>${esc(isHeading(l) ? cleanHeading(l) : l)}</li>`).join('')}</ul>` : ''}
      ${lines(r.steps).length ? `<ol>${lines(r.steps).filter(l => !isHeading(l)).map(l => `<li>${esc(cleanStep(l))}</li>`).join('')}</ol>` : ''}
      ${r.notes ? `<p class="hand">${esc(r.notes)}</p>` : ''}</details>
    <div class="letter-acts"><button class="btn" data-act="toss" data-id="${x.id}" aria-label="${esc(t.toss)}" title="${esc(t.toss)}">${ico('trash')}</button><button class="btn primary" data-act="keep" data-id="${x.id}">${ico('check')}${esc(t.keep)}</button></div>
  </article>`;
}
function renderInbox(iosLanding) {
  current = 'inbox'; navHTML('');
  const t = T();
  $('#view').innerHTML = `<div class="page-h wrap"><button class="icon-btn" data-act="home" aria-label="${esc(t.close)}">${ico('back')}</button><h1>${esc(t.inbox)}</h1></div>
    <div class="wrap stack">
      ${iosLanding ? `<section class="panel airmail"><h2>${esc(t.iosCopyTitle)}</h2><p style="margin:0">${esc(t.iosCopyText)}</p>
        <button class="btn primary" data-act="copyforapp">${ico('copy')}${esc(t.copyForApp)}</button></section>` : ''}
      ${inbox.length ? inbox.map(letterHTML).join('') : `<div class="empty">${ico('mail', 'ill-big')}<p>${esc(t.inboxEmpty)}</p></div>`}
      <section class="panel"><h2>${esc(t.pasteLink)}</h2><p class="hint" style="margin:0">${esc(t.pasteHelp)}</p>
        <button class="btn" data-act="pastecode">${ico('copy')}${esc(t.pasteLink)}</button>
        <div class="field" id="pasteBox" hidden><textarea class="input" id="pasteIn" rows="3" placeholder="${esc(t.pastePh)}"></textarea>
          <button class="btn primary" data-act="pastego">${esc(t.pasteGo)}</button></div></section>
    </div>`;
  window.scrollTo(0, 0);
}
let iosLandingCode = '';
async function keepLetter(id) {
  const t = T(), x = inbox.find(y => y.id === id); if (!x) return;
  const r = { ...x.r, id: uid(), createdAt: Date.now(), updatedAt: Date.now(), cookCount: 0, rating: 0, favorite: false, holidays: x.r.holidays || [], tags: x.r.tags || [] };
  r.source = r.source || x.from;
  if (r.mini) { r.photo = r.mini; r.thumb = r.mini; } delete r.mini;
  await saveRecipe(r);
  inbox = inbox.filter(y => y.id !== id); saveInbox();
  toast(t.kept); go('#/r/' + r.id);
}

// ---------- Share target (Android "Share" → this app) ----------
let pendingShare = null;
function readShareParams() {
  const p = new URLSearchParams(location.search);
  if (!p.has('url') && !p.has('text') && !p.has('title')) return;
  const text = p.get('text') || '', url = p.get('url') || (text.match(/https?:\/\/\S+/) || [])[0] || '';
  pendingShare = { url, text, title: p.get('title') || '' };
  history.replaceState(null, '', location.pathname + '#/edit/new');
}
async function applyShare(p) {
  const v = [p.text, p.url].filter(Boolean).join('\n');
  if (v) { $('#fSmart').value = v; smartFill($('[data-act="smartfill"]')); }
  if (p.title && !$('#fTitle').value) $('#fTitle').value = p.title;
}
async function importLink(url, btn) {
  const t = T();
  let d = await importFromLink(url), failed = '';
  if ((!d || d.partial) && hasClaude()) {
    if (btn) btn.textContent = t.claudeReading;
    try { const c = await claudeRecipe(lastPageText.length > 300 ? { text: lastPageText, url } : { url }); if (c) d = { ...c, link: url, photo: d?.photo || null }; }
    catch (e) { console.warn(e); failed = claudeErrorText(e); }
  }
  if (!d || d.partial) { if (d) fillForm(d, true); addStatus((failed ? failed + ' ' : '') + t.importFail + (hasClaude() ? '' : ' ' + t.claudeTip), 'warn'); return; }
  if (d.photo) d.photo = await localizePhoto(d.photo);
  fillForm(d, false);
  ls.set('draft', { key: $('#view').dataset.id || 'new', ts: Date.now(), data: readForm() });
  addStatus(t.importOk, 'ok');
  formAutoTag(true);
}

// ---------- Shopping list ----------
function renderShop() {
  current = 'shop'; navHTML('shop');
  const t = T();
  const groups = new Map();
  for (const it of shop) { const k = it.recipe || t.other; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); }
  $('#view').innerHTML = `<div class="wrap stack">
    <header class="top" style="padding-top:8px"><h1 class="greet">${esc(t.shopTitle)}</h1></header>
    <form class="shop-add" id="shopAdd"><input class="input" id="shopIn" style="border:1.5px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--surface)" placeholder="${esc(t.shopAddPh)}" enterkeyhint="done"><button class="btn primary" aria-label="${esc(t.add)}">${ico('plus')}</button></form>
    ${shop.length ? [...groups].map(([g, items]) => `<div class="shop-group"><h3>${esc(g)}</h3>${items.map(it => `<div class="shop-item ${it.done ? 'done' : ''}"><label><input type="checkbox" data-act="shoptoggle" data-id="${it.id}" ${it.done ? 'checked' : ''}><span>${esc(it.text)}</span></label><button class="icon-btn" data-act="shopdel" data-id="${it.id}" aria-label="${esc(t.del)}">${ico('x')}</button></div>`).join('')}</div>`).join('')
      : `<div class="empty"><p>${esc(t.shopEmpty)}</p></div>`}
    ${shop.length ? `<div class="stack" style="padding-top:4px"><button class="btn primary" data-act="shopshare">${ico('share')}${esc(t.shareList)}</button>
      <div class="row2"><button class="btn" data-act="shopclear">${esc(t.clearDone)}</button><button class="btn danger" data-act="shopall">${esc(t.clearAll)}</button></div></div>` : ''}
  </div>`;
  $('#shopAdd').onsubmit = e => { e.preventDefault(); const v = $('#shopIn').value.trim(); if (!v) return; shop.push({ id: uid(), text: v, done: false }); saveShop(); renderShop(); $('#shopIn').focus(); };
}

// ---------- More / settings ----------
let installEvt = null;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
const CUP_G = { flour: [125, 'Farine', 'Flour'], sugar: [200, 'Sucre', 'Sugar'], brown: [220, 'Sucre roux', 'Brown sugar'], icing: [120, 'Sucre glace', 'Powdered sugar'], butter: [227, 'Beurre', 'Butter'], oil: [218, 'Huile', 'Oil'], rice: [185, 'Riz', 'Rice'], oats: [90, 'Flocons d’avoine', 'Oats'], cocoa: [85, 'Cacao', 'Cocoa'], honey: [340, 'Miel', 'Honey'], almonds: [95, 'Amandes en poudre', 'Ground almonds'], matza: [120, 'Farine de matsa', 'Matzo meal'], water: [240, 'Eau / lait (ml)', 'Water / milk (ml)'] };
const UNITS = { cup: 'cup / tasse', tbsp: 'tbsp / c. à soupe', tsp: 'tsp / c. à café', floz: 'fl oz', oz: 'oz', lb: 'lb', stick: 'stick (butter)', f: '°F' };
function convert(amount, unit, ingr) {
  const g = CUP_G[ingr][0], isLiquid = ingr === 'water';
  const unitG = isLiquid ? ' ml' : ' g';
  switch (unit) {
    case 'cup': return fmtNum(amount * g) + unitG;
    case 'tbsp': return fmtNum(amount * g / 16) + unitG;
    case 'tsp': return fmtNum(amount * g / 48) + unitG;
    case 'floz': return fmtNum(amount * 29.57) + ' ml';
    case 'oz': return fmtNum(amount * 28.35) + ' g';
    case 'lb': return fmtNum(amount * 453.6) + ' g';
    case 'stick': return fmtNum(amount * 113) + ' g';
    case 'f': { const c = (amount - 32) * 5 / 9; return `${Math.round(c)} °C · Th. ${fmtNum(Math.round(c / 30 * 2) / 2)}`; }
  }
}
function renderMore() {
  setTimeout(() => { if (sessionStorage.getItem?.('abe:goto') === 'claude') { sessionStorage.removeItem('abe:goto'); $('#claudePanel')?.scrollIntoView({ block: 'start' }); } }, 50);
  current = 'more'; navHTML('more');
  const t = T();
  const nFav = recipes.filter(r => r.favorite).length, nCooked = recipes.reduce((a, r) => a + (r.cookCount || 0), 0);
  const hasSamples = recipes.some(r => r.sample);
  const isInstalled = installed();
  const opt = (v, l, s) => `<option value="${v}" ${s === v ? 'selected' : ''}>${esc(l)}</option>`;
  $('#view').innerHTML = `<div class="wrap stack">
    <header class="top" style="padding-top:8px"><h1 class="greet">${esc(t.moreTitle)}</h1></header>
    <section class="panel"><h2>${esc(t.stats)}</h2><div class="stats"><div><b>${recipes.length}</b><span>${esc(t.statRecipes)}</span></div><div><b>${nFav}</b><span>${esc(t.statFav)}</span></div><div><b>${nCooked}</b><span>${esc(t.statCooked)}</span></div></div></section>
    ${isInstalled ? '' : `<section class="panel"><h2>${esc(t.install)}</h2><p class="muted" style="margin:0">${esc(t.installText)}</p>
      ${installEvt ? `<button class="btn primary" data-act="install">${ico('install')}${esc(t.install)}</button>` : `<p style="margin:0">${esc(isIOS ? t.installIos : t.installHow)}</p>`}</section>`}
    <section class="panel"><h2>${esc(t.settings)}</h2>
      <div class="form" style="padding:0;gap:14px">
        <div class="field"><label for="sName">${esc(t.yourName)}</label><input class="input" id="sName" list="nameList" autocomplete="given-name" value="${esc(S.name || '')}"><datalist id="nameList">${['Abe', 'Abraham', 'Papa', 'Dad', 'Avraham'].map(n => `<option value="${n}">`).join('')}</datalist></div>
        <div class="field"><label for="sLang">${esc(t.language)}</label><select id="sLang">${opt('fr', 'Français', S.lang)}${opt('en', 'English', S.lang)}</select></div>
        <div class="field"><label for="sSize">${esc(t.textSize)}</label><select id="sSize">${Object.entries(t.sizes).map(([k, v]) => opt(k, v, S.size)).join('')}</select></div>
        <div class="field"><label for="sTheme">${esc(t.theme)}</label><select id="sTheme">${Object.entries(t.themes).map(([k, v]) => opt(k, v, S.theme)).join('')}</select></div>
        <div class="field"><label for="sCity">${esc(t.city)}</label><select id="sCity">${Object.entries(CITIES).map(([k, c]) => opt(k, c[0], S.city)).join('')}${S.gps ? opt('gps', t.myPos, S.city) : ''}</select>
          <button type="button" class="btn small" data-act="gps">${ico('pin')}${esc(t.useGps)}</button></div>
      </div></section>
    <a class="panel famcard" href="#/famille"><h2>${ico('users')} ${esc(FAM.on ? FAM.name || t.family : t.family)}</h2>
      ${FAM.on ? `<div class="likers">${Object.keys(FAM.members).map(id => avatarHTML(id)).join('')}</div>` : `<p class="muted" style="margin:0">${esc(t.famCardText)}</p>`}</a>
    <a class="btn block" href="#/inbox">${ico('mail')}${esc(t.inbox)}${inbox.length ? ` (${inbox.length})` : ''}</a>
    <section class="panel"><h2>${esc(t.occasions)}</h2><p class="muted" style="margin:0">${esc(t.occText)}</p>
      <div class="occ-list">
        ${customOcc().map(c => `<div class="occ-row"><span>${esc(c.label)}</span><input class="input" type="date" data-occdate="${c.key}" aria-label="${esc(c.label)}" value="${c.date ? new Date().getFullYear() + '-' + c.date : ''}">
          <button class="icon-btn" data-act="delocc" data-k="${c.key}" aria-label="${esc(t.del)}">${ico('x')}</button></div>`).join('')}
      </div>
      <button class="btn" data-act="addocc">${ico('plus')}${esc(t.occAdd)}</button></section>
    <section class="panel" id="claudePanel"><h2>${ico('spark')} ${esc(t.claudePanel)}</h2><p class="muted" style="margin:0">${esc(t.claudeText)}</p>
      ${(() => { const own = ls.get('claudeKey', ''), shared = FAM.on && own && ls.get('famClaudeKey', '') === own;
        if (own) return `<p style="margin:0;font-weight:700;color:var(--parve)">${esc(t.claudeKeyOn)}</p>
          ${FAM.on ? `<p class="muted" style="margin:0">${esc(shared ? t.claudeShared : t.claudeNotShared)}</p><button class="btn" data-act="${shared ? 'claudeunshare' : 'claudeshare'}">${ico('users')}${esc(shared ? t.claudeUnshare : t.claudeShare)}</button>` : ''}
          <button class="btn" data-act="tagall">${ico('spark')}${esc(t.tagAll)}</button><button class="btn danger" data-act="claudekeyrm">${esc(t.claudeKeyRemove)}</button>`;
        if (hasClaude()) return `<p style="margin:0;font-weight:700;color:var(--parve)">${esc(t.claudeKeyFam)}</p><button class="btn" data-act="tagall">${ico('spark')}${esc(t.tagAll)}</button>`;
        return `<div class="field"><label for="claudeKeyIn">${esc(t.claudeKey)}</label><input class="input" id="claudeKeyIn" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-…"></div>
          ${FAM.on ? `<label class="tried-toggle"><input type="checkbox" id="claudeShareIn" checked><span>${esc(t.claudeShareToo)}</span></label>` : ''}
          <button class="btn primary" data-act="claudekeysave">${esc(t.save)}</button>`; })()}</section>
    <section class="panel"><h2>${esc(t.lockTitle)}</h2><p class="muted" style="margin:0">${esc(lockData() ? t.lockOnText : t.lockOffText)}</p>
      ${lockData() ? `<div class="row2"><button class="btn" data-act="lockchange">${esc(t.lockChange)}</button><button class="btn danger" data-act="lockremove">${esc(t.lockRemove)}</button></div>
        <button class="btn" data-act="locknow">${esc(t.lockNow)}</button>` : `<button class="btn primary" data-act="lockchange">${esc(t.lockAdd)}</button>`}</section>
    <section class="panel"><h2>${esc(t.backup)}</h2><p class="muted" style="margin:0">${esc(t.backupText)}</p>
      <p style="margin:0;font-weight:700">${esc(t.lastBackup(ls.get('lastBackup', 0) && fmtDate(ls.get('lastBackup', 0))))}</p>
      ${navigator.canShare ? `<button class="btn primary" data-act="backupshare">${ico('share')}${esc(t.shareB)}</button>` : ''}
      <button class="btn" data-act="backup">${ico('download')}${esc(t.exportB)}</button>
      <button class="btn" data-act="restore">${ico('upload')}${esc(t.importB)}</button></section>
    <section class="panel" id="conv"><h2>${esc(t.tools)}</h2>
      <div class="row2"><div class="field"><label for="cAmt">${esc(t.convFrom)}</label><input class="input" id="cAmt" type="text" inputmode="decimal" value="1"></div>
        <div class="field"><label for="cUnit">&nbsp;</label><select class="input" id="cUnit">${Object.entries(UNITS).map(([k, v]) => opt(k, v, 'cup')).join('')}</select></div></div>
      <div class="field"><label for="cIng">${esc(t.convIngr)}</label><select class="input" id="cIng">${Object.entries(CUP_G).map(([k, v]) => opt(k, S.lang === 'fr' ? v[1] : v[2], 'flour')).join('')}</select></div>
      <div class="conv-out" id="cOut" aria-live="polite"></div>
      <h3 style="font-size:1rem">${esc(t.ovenTitle)}</h3>
      <div style="overflow-x:auto"><table class="ref"><tr><th>°F</th><th>°C</th><th>Thermostat</th></tr>
        ${[[250, 120, 4], [300, 150, 5], [350, 180, 6], [375, 190, '6–7'], [400, 200, 7], [425, 220, '7–8'], [450, 230, 8], [475, 240, 8]].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table></div>
    </section>
    <section class="panel"><h2>${esc(t.samples)}</h2>
      ${hasSamples ? `<button class="btn" data-act="rmsamples">${esc(t.samplesDel)}</button>` : `<button class="btn" data-act="samples">${esc(t.samplesAdd)}</button>`}
      ${FAM.on ? '' : `<button class="btn danger" data-act="erase">${ico('trash')}${esc(t.eraseAll)}</button>`}</section>
    <p class="love">${esc(t.madeFor)} <b>${esc(S.name === 'Abe' || S.name === 'Abraham' || S.name === 'Avraham' ? S.name : t.withLove)}</b>${ico('heart')}</p>
  </div>`;
  const upd = () => { const a = parseNum($('#cAmt').value.replace(',', '.')) || parseFloat($('#cAmt').value.replace(',', '.')); $('#cOut').textContent = isFinite(a) ? convert(a, $('#cUnit').value, $('#cIng').value) : '—'; $('#cIng').closest('.field').hidden = !['cup', 'tbsp', 'tsp'].includes($('#cUnit').value); };
  ['cAmt', 'cUnit', 'cIng'].forEach(id => $('#' + id).addEventListener('input', upd)); upd();
  const bind = (id, key, after) => $('#' + id).addEventListener('change', e => { S[key] = e.target.value; saveSettings(); applyLook(); after?.(); });
  $('#sName').addEventListener('change', e => { S.name = e.target.value.trim() || 'Abe'; saveSettings(); toast(T().saved); }); bind('sLang', 'lang', renderMore); bind('sSize', 'size'); bind('sTheme', 'theme'); bind('sCity', 'city', () => { wx = null; refreshWeather(); });
}
async function exportBackup(share) {
  const t = T();
  const data = JSON.stringify({ app: 'la-cuisine-d-abe', version: 1, exported: new Date().toISOString(), recipes, shop, events: [...PS.events.values()], guests: [...PS.guests.values()], wines: [...PS.wines.values()], cooks: FAM.on ? [] : [...PS.cooks.values()] }, null, 1);
  const name = `recettes-abe-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([data], name, { type: 'application/json' });
  if (share && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); ls.set('lastBackup', Date.now()); renderMore(); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  ls.set('lastBackup', Date.now()); if (current === 'more') renderMore(); else toast(t.saved);
}
async function importBackup(file) {
  const t = T();
  try {
    const d = JSON.parse(await file.text());
    const list = Array.isArray(d) ? d : d.recipes;
    if (!Array.isArray(list)) throw 0;
    let n = 0;
    for (const r of list) {
      if (!r || !r.id || !r.title) continue;
      const old = byId(r.id);
      if (old && (old.updatedAt || 0) > (r.updatedAt || 0)) continue;
      await saveRecipe(r); n++;
    }
    if (Array.isArray(d.shop) && !shop.length) { shop = d.shop; saveShop(); }
    for (const k of PS_KINDS) if (Array.isArray(d[k]) && !(k === 'cooks' && FAM.on)) for (const o of d[k]) if (o && o.id && !PS[k].has(o.id)) psPut(k, o);
    toast(t.importedN(n)); renderMore();
  } catch { toast(t.badFile); }
}

// ---------- Example recipes ----------
function samples() {
  const fr = S.lang === 'fr', now = Date.now();
  const R = (o, i) => ({ id: 'sample-' + i, sample: true, audience: FAM.on ? [FAM.uid] : undefined, createdAt: now - i * 1000, updatedAt: now - i * 1000, cookCount: 0, rating: 0, favorite: false, tags: [], ...o });
  return [
    R({ title: fr ? '’Halla du vendredi' : 'Friday Challah', category: 'breads', kashrut: 'parve', holidays: ['shabbat', 'roshhashana'], servings: 2, prep: 30, cook: 30, source: fr ? 'Exemple' : 'Example', rating: 5, favorite: true,
      ingredients: fr ? '1 kg de farine\n2 sachets de levure boulangère (16 g)\n120 g de sucre\n2 c. à café de sel\n3 œufs (+ 1 jaune pour dorer)\n150 ml d’huile\n400 ml d’eau tiède\nGraines de sésame ou de pavot' : '1 kg flour\n2 packets dried yeast (16 g)\n120 g sugar\n2 tsp salt\n3 eggs (+ 1 yolk to glaze)\n150 ml oil\n400 ml warm water\nSesame or poppy seeds',
      steps: fr ? 'Délayer la levure dans l’eau tiède avec une cuillère de sucre, laisser mousser 10 min.\nMélanger farine, sucre et sel. Ajouter les œufs, l’huile puis la levure.\nPétrir 10 minutes jusqu’à obtenir une pâte souple.\nCouvrir et laisser lever 1 h 30 dans un endroit tiède.\nPrélever un peu de pâte pour la bénédiction (hafracha). Diviser en deux, tresser chaque ’halla à 3 ou 6 brins.\nLaisser lever encore 45 min, dorer au jaune d’œuf et parsemer de graines.\nCuire 30 min à 180 °C jusqu’à ce que le dessous sonne creux.' : 'Dissolve the yeast in the warm water with a spoon of sugar; let it foam 10 min.\nMix flour, sugar and salt. Add eggs, oil, then the yeast.\nKnead for 10 minutes until smooth.\nCover and let rise 1 hour 30 in a warm place.\nSeparate a small piece of dough for the blessing (hafrashat challah). Divide in two and braid each loaf with 3 or 6 strands.\nLet rise another 45 min, brush with yolk and sprinkle with seeds.\nBake 30 min at 180 °C until the bottom sounds hollow.',
      notes: fr ? 'Pour Roch Hachana : ajouter des raisins secs et former une couronne ronde.' : 'For Rosh Hashanah: add raisins and shape into a round crown.' }, 1),
    R({ title: fr ? 'Poulet rôti au citron et au thym' : 'Roast Chicken with Lemon & Thyme', category: 'poultry', kashrut: 'meat', holidays: ['shabbat', 'family', 'friends', 'coldday', 'winter'], servings: 4, prep: 15, cook: 75, source: fr ? 'Exemple' : 'Example', rating: 5,
      ingredients: fr ? '1 poulet fermier (1,6 kg)\n2 citrons\n1 tête d’ail\n6 branches de thym\n800 g de petites pommes de terre\n4 c. à soupe d’huile d’olive\nSel, poivre' : '1 free-range chicken (1.6 kg)\n2 lemons\n1 head of garlic\n6 sprigs thyme\n800 g small potatoes\n4 tbsp olive oil\nSalt, pepper',
      steps: fr ? 'Préchauffer le four à 200 °C. Sortir le poulet du réfrigérateur 30 min avant.\nCouper un citron en quatre et le glisser dans le poulet avec la moitié du thym et 4 gousses d’ail.\nDisposer les pommes de terre coupées en deux autour, arroser d’huile, saler, poivrer.\nEnfourner 1 h 15 en arrosant le poulet de son jus toutes les 20 minutes.\nLaisser reposer 10 min sous une feuille d’aluminium, presser le second citron sur le jus et servir.' : 'Preheat the oven to 200 °C. Take the chicken out of the fridge 30 min before.\nQuarter one lemon and put it inside the chicken with half the thyme and 4 garlic cloves.\nArrange the halved potatoes around it, drizzle with oil, season.\nRoast 1 hour 15, basting with the juices every 20 minutes.\nRest 10 min under foil, squeeze the second lemon over the juices and serve.' }, 2),
    R({ title: fr ? 'Chakchouka' : 'Shakshuka', category: 'vegetarian', kashrut: 'parve', holidays: ['brunch', 'garden', 'summer'], servings: 4, prep: 10, cook: 25, source: fr ? 'Exemple' : 'Example', tags: [fr ? 'facile' : 'easy', fr ? 'tunisien' : 'Tunisian'], rating: 4,
      ingredients: fr ? '3 c. à soupe d’huile d’olive\n1 oignon émincé\n2 poivrons rouges en lanières\n3 gousses d’ail\n1 c. à café de cumin\n1 c. à café de paprika\n½ c. à café de harissa\n800 g de tomates concassées\n6 œufs\nCoriandre fraîche' : '3 tbsp olive oil\n1 onion, sliced\n2 red peppers, in strips\n3 garlic cloves\n1 tsp cumin\n1 tsp paprika\n½ tsp harissa\n800 g crushed tomatoes\n6 eggs\nFresh coriander',
      steps: fr ? 'Faire revenir l’oignon et les poivrons dans l’huile 10 min.\nAjouter l’ail, le cumin, le paprika et la harissa, cuire 1 min.\nVerser les tomates, saler, laisser mijoter 10 min.\nCreuser 6 puits et y casser les œufs. Couvrir et cuire 6 à 8 min.\nParsemer de coriandre et servir avec du pain.' : 'Sauté the onion and peppers in the oil for 10 min.\nAdd garlic, cumin, paprika and harissa; cook 1 min.\nPour in the tomatoes, salt, and simmer 10 min.\nMake 6 wells and crack in the eggs. Cover and cook 6 to 8 min.\nSprinkle with coriander and serve with bread.' }, 3),
    R({ title: 'Ratatouille', category: 'vegetarian', kashrut: 'parve', holidays: ['pesach', 'friends', 'bbq', 'summer', 'garden'], servings: 6, prep: 30, cook: 60, source: fr ? 'Exemple' : 'Example', tags: [fr ? 'provençal' : 'Provençal'],
      ingredients: fr ? '2 aubergines\n3 courgettes\n2 poivrons (rouge et jaune)\n2 oignons\n4 gousses d’ail\n6 tomates bien mûres\n6 c. à soupe d’huile d’olive\n1 bouquet garni (thym, laurier)\nBasilic frais\nSel, poivre' : '2 aubergines\n3 courgettes\n2 peppers (red and yellow)\n2 onions\n4 garlic cloves\n6 ripe tomatoes\n6 tbsp olive oil\n1 bouquet garni (thyme, bay)\nFresh basil\nSalt, pepper',
      steps: fr ? 'Couper tous les légumes en dés d’environ 2 cm.\nFaire revenir séparément aubergines, courgettes et poivrons dans l’huile, 8 min chacun.\nDans une cocotte, faire fondre les oignons et l’ail 5 min, ajouter les tomates.\nAjouter tous les légumes et le bouquet garni, couvrir et laisser mijoter 40 min à feu doux.\nRectifier l’assaisonnement et ajouter le basilic au moment de servir. Encore meilleure le lendemain.' : 'Cut all the vegetables into 2 cm dice.\nSauté the aubergines, courgettes and peppers separately in the oil, 8 min each.\nIn a casserole, soften the onions and garlic 5 min, then add the tomatoes.\nAdd all the vegetables and the bouquet garni, cover and simmer gently 40 min.\nAdjust the seasoning and add the basil just before serving. Even better the next day.' }, 4),
    R({ title: fr ? 'Gâteau au miel et à la cannelle' : 'Honey & Cinnamon Cake', category: 'pastries', kashrut: 'parve', holidays: ['roshhashana', 'yomkippur', 'autumn', 'rainyday'], servings: 10, prep: 15, cook: 50, source: fr ? 'Exemple' : 'Example',
      ingredients: fr ? '300 g de farine\n1 sachet de levure chimique\n1 c. à café de bicarbonate\n2 c. à café de cannelle\n½ c. à café de gingembre\n3 œufs\n200 g de miel\n150 g de sucre roux\n150 ml d’huile\n200 ml de thé fort refroidi\n1 zeste d’orange' : '300 g flour\n1 packet baking powder\n1 tsp baking soda\n2 tsp cinnamon\n½ tsp ginger\n3 eggs\n200 g honey\n150 g brown sugar\n150 ml oil\n200 ml strong cooled tea\n1 orange zest',
      steps: fr ? 'Préchauffer le four à 170 °C. Huiler un moule à cake.\nMélanger farine, levure, bicarbonate et épices.\nFouetter œufs, miel, sucre, huile, thé et zeste.\nIncorporer les ingrédients secs sans trop travailler.\nCuire 50 min, jusqu’à ce qu’une lame ressorte sèche.\nAttendre un jour avant de servir : il est encore meilleur. Chana tova !' : 'Preheat the oven to 170 °C. Oil a loaf pan.\nMix flour, baking powder, soda and spices.\nWhisk eggs, honey, sugar, oil, tea and zest.\nFold in the dry ingredients without overmixing.\nBake 50 min, until a knife comes out clean.\nWait a day before serving: it gets even better. Shana tova!' }, 5),
    R({ title: 'Tarte Tatin', category: 'pastries', kashrut: 'dairy', holidays: ['friends', 'birthday', 'autumn'], servings: 8, prep: 30, cook: 45, source: fr ? 'Exemple' : 'Example', favorite: true,
      ingredients: fr ? '1 pâte feuilletée\n8 pommes (Golden ou Reinette)\n150 g de sucre\n80 g de beurre\n1 pincée de fleur de sel' : '1 sheet puff pastry\n8 apples (Golden or Reinette)\n150 g sugar\n80 g butter\n1 pinch flaky salt',
      steps: fr ? 'Préchauffer le four à 190 °C. Éplucher les pommes et les couper en quartiers.\nDans un moule allant sur le feu, faire un caramel blond avec le sucre, puis ajouter le beurre et la fleur de sel.\nRanger les pommes serrées sur le caramel, cuire 15 min à feu doux.\nCouvrir avec la pâte en rentrant les bords, piquer à la fourchette.\nEnfourner 30 min, jusqu’à ce que la pâte soit bien dorée.\nAttendre 5 min puis retourner d’un coup sur un plat. Servir tiède avec de la crème fraîche.' : 'Preheat the oven to 190 °C. Peel the apples and cut into quarters.\nIn an ovenproof pan, make a golden caramel with the sugar, then add the butter and salt.\nPack the apples tightly on the caramel and cook 15 min over low heat.\nCover with the pastry, tucking in the edges, and prick with a fork.\nBake 30 min, until the pastry is deep golden.\nWait 5 min, then turn it out in one go onto a plate. Serve warm with crème fraîche.' }, 6),
  ];
}
