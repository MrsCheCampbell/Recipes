'use strict';
// Our Kitchen: The family: Firebase sync, hearts, comments, recommendations, the feed, creating and joining.
// The scripts share one scope and load in order (see index.html).

// ---------- Family: shared recipes, feed, hearts, comments, recommendations ----------
// Backend: the family's own Firebase project (Firestore + anonymous sign-in).
// Data lives in /families/{fid}; firestore.rules decides who sees what, on the server.
const FAM = {
  cfg: ls.get('fbConfig', null), fid: ls.get('famId', null), name: ls.get('famName', ''), code: ls.get('famCode', ''), on: false, ready: false,
  uid: null, members: {}, raw: new Map(), saved: new Map(), recos: [], cooks: new Map(), all: [], unsub: [], fb: null, db: null, auth: null,
};
let FB = null;
const AV_KEYS = ['whisk', 'teapot', 'mitt', 'apron', 'pan', 'pot', 'kettle', 'rollingpin', 'grater', 'spoon', 'desserts', 'cocktails', 'breads', 'salads', 'vegetarian'];
const AV_COLORS = ['#C2452D', '#3D6C97', '#4C7E59', '#B98316', '#8A4F9E', '#2F7F86', '#B5576F', '#6B5A4C'];
const CONTENT = ['autoTagged', 'aiTagged', 'title', 'category', 'kashrut', 'servings', 'prep', 'cook', 'ingredients', 'steps', 'notes', 'source', 'link', 'tags', 'holidays', 'photo', 'thumb', 'note', 'audience', 'createdAt', 'updatedAt', 'sample', 'pageCount'];
const member = id => FAM.members[id] || { name: T().someone, avatar: 'other', color: '#8C7A6B' };
const avatarHTML = (id, cls = '') => { const m = member(id); return `<span class="av ${cls}" style="--c:${esc(m.color || '#8C7A6B')}" title="${esc(m.name)}" aria-hidden="true">${illus(m.avatar || 'other')}</span>`; };
const isMine = r => !FAM.on || !r.owner || r.owner === FAM.uid;
const randCode = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map(x => 'abcdefghjkmnpqrstuvwxyz23456789'[x % 31]).join(''); };
function ago(ts) {
  const t = T(), s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return t.agoNow; if (s < 3600) return t.agoMin(Math.round(s / 60)); if (s < 86400) return t.agoH(Math.round(s / 3600));
  if (s < 172800) return t.agoYesterday; if (s < 7 * 86400) return t.agoD(Math.round(s / 86400));
  return fmtDate(ts, { day: 'numeric', month: 'short' });
}
// Accepts the snippet copied from the Firebase console ("const firebaseConfig = { apiKey: ... }") or plain JSON.
function parseFirebaseConfig(txt) {
  const get = k => (String(txt).match(new RegExp(k + '["\']?\\s*:\\s*["\']([^"\']+)["\']')) || [])[1];
  const c = { apiKey: get('apiKey'), authDomain: get('authDomain'), projectId: get('projectId'), appId: get('appId') };
  return c.apiKey && c.projectId && c.appId ? c : null;
}
async function fbInit(cfg) {
  if (FAM.db) return;
  FB = await import(new URL('vendor/firebase/firebase.mjs', document.baseURI).href);
  const app = FB.getApps()[0] || FB.initializeApp(cfg);
  FAM.auth = FB.initializeAuth(app, { persistence: [FB.indexedDBLocalPersistence, FB.browserLocalPersistence] });
  let cache; try { cache = FB.persistentLocalCache({ tabManager: FB.persistentMultipleTabManager() }); } catch {}
  FAM.db = FB.initializeFirestore(app, cache ? { localCache: cache } : {});
  if (ls.get('fbEmu', false)) { // local test servers only
    FB.connectAuthEmulator(FAM.auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    FB.connectFirestoreEmulator(FAM.db, '127.0.0.1', 8080);
  }
}
const waitUser = () => new Promise(res => { const off = FB.onAuthStateChanged(FAM.auth, u => { off(); res(u); }); });
const fref = (...p) => FB.doc(FAM.db, 'families', FAM.fid, ...p);
const fcol = (...p) => FB.collection(FAM.db, 'families', FAM.fid, ...p);
const quiet = p => p && p.catch && p.catch(e => console.warn('sync', e && e.code));

// Start syncing (called at launch when this phone is in a family).
async function famStart() {
  await fbInit(FAM.cfg);
  const u = FAM.auth.currentUser || await waitUser();
  if (!u) { FAM.on = false; return false; }
  FAM.uid = u.uid; FAM.on = true;
  if (!ls.get('feedSeen', 0)) ls.set('feedSeen', Date.now());
  FAM.unsub.forEach(f => f()); FAM.unsub = [];
  let first = true, gotRecipes;
  const ready = new Promise(r => { gotRecipes = r; setTimeout(r, 2500); });
  FAM.unsub.push(FB.onSnapshot(fcol('members'), s => { FAM.members = {}; s.forEach(d => { FAM.members[d.id] = d.data(); }); famChanged(); }, e => console.warn(e)));
  FAM.unsub.push(FB.onSnapshot(FB.query(fcol('recipes'), FB.where('audience', 'array-contains-any', ['all', FAM.uid])), s => {
    FAM.raw = new Map(); s.forEach(d => FAM.raw.set(d.id, { ...d.data(), id: d.id }));
    rebuild(); if (first) { first = false; gotRecipes(); }
  }, e => { console.warn(e); gotRecipes(); }));
  FAM.unsub.push(FB.onSnapshot(fcol('members', FAM.uid, 'saved'), s => { FAM.saved = new Map(); s.forEach(d => FAM.saved.set(d.id, d.data())); rebuild(); }, e => console.warn(e)));
  FAM.unsub.push(FB.onSnapshot(FB.query(fcol('recos'), FB.where('to', '==', FAM.uid)), s => { FAM.recos = []; s.forEach(d => FAM.recos.push({ ...d.data(), id: d.id })); FAM.recos.sort((a, b) => b.at - a.at); famChanged(); }, e => console.warn(e)));
  psListen();
  FB.getDoc(fref('secrets', 'claude')).then(d => { const k = d.exists() ? d.data().key : ''; if (k) ls.set('famClaudeKey', k); else ls.del('famClaudeKey'); }).catch(() => {});
  await ready;
  FAM.ready = true;
  for (const r of FAM.raw.values()) if (r.owner === FAM.uid && !r.sample && !(r.audience || []).includes('all')) {
    r.audience = ['all']; quiet(FB.updateDoc(fref('recipes', r.id), { audience: ['all'] })); syncCooksAudience(r.id, ['all']);
  }
  psMigrate().catch(e => console.warn(e));
  return true;
}
function famRecipe(d) {
  const o = FAM.saved.get(d.id) || {}, ratings = d.ratings || {}, vals = Object.values(ratings);
  if ((d.holidays || []).includes('momsbday')) d = { ...d, holidays: [...new Set(d.holidays.map(h => h === 'momsbday' ? 'birthday' : h))] };
  return { ...d, favorite: !!o.favorite, cookCount: o.cookCount || 0, lastCooked: o.lastCooked || 0, rating: ratings[FAM.uid] || 0,
    famRating: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0, famCount: vals.length,
    hearts: d.hearts || {}, mine: d.owner === FAM.uid };
}
function rebuild() {
  if (!FAM.on) return;
  FAM.all = [...FAM.raw.values()].map(famRecipe);
  FAM.all.forEach(indexRecipe);
  recipes = FAM.all;
  famChanged();
}
// A copy of the family's data on the phone, so the app opens at once; Firebase brings it up to date moments later.
let famBoot = null, famCacheT = null;
function saveFamCache() {
  if (!FAM.on || !FB) return;
  clearTimeout(famCacheT);
  famCacheT = setTimeout(() => DB.kvSet('famCache', {
    fid: FAM.fid, uid: FAM.uid, raw: [...FAM.raw.values()], members: FAM.members, saved: [...FAM.saved], recos: FAM.recos,
    cooks: [...FAM.cooks.values()], events: [...PS.events.values()], guests: [...PS.guests.values()], wines: [...PS.wines.values()],
  }).catch(() => {}), 1500);
}
async function loadFamCache() {
  let c = null; try { c = await DB.kvGet('famCache'); } catch {}
  if (!c || c.fid !== FAM.fid || !c.uid) return false;
  Object.assign(FAM, { uid: c.uid, on: true, raw: new Map(c.raw.map(r => [r.id, r])), members: c.members || {}, saved: new Map(c.saved || []), recos: c.recos || [], cooks: new Map((c.cooks || []).map(x => [x.id, x])) });
  for (const k of ['events', 'guests', 'wines']) PS[k] = new Map((c[k] || []).map(x => [x.id, x]));
  rebuild();
  return true;
}
// Until Firebase has loaded, anything that writes waits for it.
const fbWait = () => FAM.on && !FB && famBoot ? famBoot : null;

// Live updates: redraw the screen unless the person is typing.
let famTimer = null;
function famChanged() {
  saveFamCache();
  clearTimeout(famTimer);
  famTimer = setTimeout(() => {
    const a = document.activeElement;
    if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.closest('#view')) return;
    if ($('.scrim') || lockState || cookState) return;
    if (!['list', 'fav', 'recipe', 'feed', 'famille', 'carnets'].includes(current)) { updateNavCount(); return; }
    const y = window.scrollY; route(); window.scrollTo(0, y);
  }, 200);
}

// Writes go to the local cache at once (they sync when online), so they're never awaited.
async function cloudSave(r) {
  const prev = FAM.raw.get(r.id), own = !prev || prev.owner === FAM.uid;
  if (own) {
    const c = {}; for (const k of CONTENT) if (r[k] !== undefined && r[k] !== null) c[k] = r[k];
    c.owner = FAM.uid;
    c.audience = r.sample ? [FAM.uid] : ['all'];  // one family cookbook: every recipe is shared (examples stay on your own phone)
    if (c.photo && c.photo.length > 450000) c.photo = await recompressDataUrl(c.photo, 1100, 0.72);
    if (r.pages && r.pages.length) {
      c.pageCount = r.pages.length;
      r.pages.forEach(async (p, i) => quiet(FB.setDoc(fref('recipes', r.id, 'pages', String(i)), { data: p.length > 800000 ? await recompressDataUrl(p, 1600, 0.7) : p })));
    }
    if (!prev) Object.assign(c, { hearts: {}, ratings: {}, commentCount: 0 });
    FAM.raw.set(r.id, { ...(prev || {}), ...c, id: r.id });
    quiet(FB.setDoc(fref('recipes', r.id), c, { merge: !!prev }));
    if (prev) syncCooksAudience(r.id, c.audience);
  }
  const myPrev = prev?.ratings?.[FAM.uid] || 0;
  if ((r.rating || 0) !== myPrev && FAM.raw.has(r.id)) {
    const cur = FAM.raw.get(r.id); cur.ratings = { ...(cur.ratings || {}) };
    if (r.rating) cur.ratings[FAM.uid] = r.rating; else delete cur.ratings[FAM.uid];
    quiet(FB.updateDoc(fref('recipes', r.id), { ['ratings.' + FAM.uid]: r.rating ? r.rating : FB.deleteField() }));
  }
  const o = { favorite: !!r.favorite, cookCount: r.cookCount || 0, lastCooked: r.lastCooked || 0 };
  const po = FAM.saved.get(r.id) || {};
  if (po.favorite !== o.favorite || (po.cookCount || 0) !== o.cookCount || (po.lastCooked || 0) !== o.lastCooked) {
    FAM.saved.set(r.id, { ...po, ...o, at: po.at || Date.now() });
    quiet(FB.setDoc(fref('members', FAM.uid, 'saved', r.id), { ...o, at: po.at || Date.now() }, { merge: true }));
  }
  rebuild();
}
async function cloudDelete(r) {
  if (FAM.raw.get(r.id)?.owner !== FAM.uid) return;
  deleteCooksOf(r.id); FAM.raw.delete(r.id); quiet(FB.deleteDoc(fref('recipes', r.id)));
  FAM.saved.delete(r.id); quiet(FB.deleteDoc(fref('members', FAM.uid, 'saved', r.id)));
  rebuild();
}
async function recompressDataUrl(d, max, q) { try { return await compress(await (await fetch(d)).blob(), max, q); } catch { return d; } }
function toggleHeart(id) {
  const r = FAM.raw.get(id); if (!r) return;
  const on = !(r.hearts || {})[FAM.uid];
  r.hearts = { ...(r.hearts || {}) }; if (on) r.hearts[FAM.uid] = true; else delete r.hearts[FAM.uid];
  quiet(FB.updateDoc(fref('recipes', id), { ['hearts.' + FAM.uid]: on ? true : FB.deleteField() }));
  try { if (on) navigator.vibrate?.(15); } catch {}
  rebuild();
}
async function loadPages(r) {
  if (!FAM.on || !r.pageCount || r.pages) return;
  if (!FB) { await famBoot; if (!FB) return; }
  try {
    const s = await FB.getDocs(fcol('recipes', r.id, 'pages'));
    const pages = []; s.forEach(d => { pages[+d.id] = d.data().data; });
    const raw = FAM.raw.get(r.id); if (raw) raw.pages = pages.filter(Boolean);
    rebuild();
  } catch {}
}

// One Claude key for the whole family: stored where only family members can read it (firestore.rules → secrets).
// Only says "shared" once Firebase has accepted it (old rules refuse it).
async function shareClaudeKey(k) {
  if (!k) return; const w = fbWait(); if (w) await w;
  try { await FB.setDoc(fref('secrets', 'claude'), { key: k, by: FAM.uid, at: Date.now() }); ls.set('famClaudeKey', k); toast(T().claudeSharedToast); }
  catch (e) { console.warn('share key', e && e.code); toast(e && e.code === 'permission-denied' ? T().claudeShareRules : T().claudeShareFail); }
  if (current === 'more') renderMore();
}
function unshareClaudeKey() { ls.del('famClaudeKey'); quiet(FB.deleteDoc(fref('secrets', 'claude'))); }

// Comments on the open recipe (live).
let commentUnsub = null, openComments = [];
function watchComments(id) {
  commentUnsub?.(); commentUnsub = null; openComments = [];
  if (!FAM.on || !FAM.raw.has(id)) return;
  if (!FB) { famBoot?.then(() => { if ($('#view').dataset.id === id) watchComments(id); }); return; }
  commentUnsub = FB.onSnapshot(fcol('recipes', id, 'comments'), s => {
    openComments = []; s.forEach(d => openComments.push({ ...d.data(), id: d.id })); openComments.sort((a, b) => a.at - b.at);
    const box = $('#comments'); if (box) box.innerHTML = commentsListHTML();
  }, () => {});
}
function commentsListHTML() {
  const t = T();
  return openComments.length ? openComments.map(c => `<div class="comment">${avatarHTML(c.uid, 'sm')}<div class="min"><div class="meta"><b>${esc(member(c.uid).name)}</b><span>${esc(ago(c.at))}</span>${c.tried ? `<span class="tried">${esc(t.triedIt)}</span>` : ''}</div>
    <p>${esc(c.text)}</p></div>${c.uid === FAM.uid || FAM.raw.get($('#view').dataset.id)?.owner === FAM.uid ? `<button class="icon-btn" data-act="delcomment" data-c="${c.id}" aria-label="${esc(t.del)}">${ico('x')}</button>` : ''}</div>`).join('')
    : `<p class="muted" style="margin:0">${esc(t.noComments)}</p>`;
}
function postComment(id) {
  const txt = $('#commentIn').value.trim(); if (!txt) return;
  const tried = $('#commentTried').checked;
  const cid = uid();
  quiet(FB.setDoc(fref('recipes', id, 'comments', cid), { uid: FAM.uid, text: txt.slice(0, 2000), tried, at: Date.now() }));
  quiet(FB.updateDoc(fref('recipes', id), { commentCount: FB.increment(1) }));
  const r = FAM.raw.get(id); if (r) r.commentCount = (r.commentCount || 0) + 1;
  $('#commentIn').value = ''; $('#commentTried').checked = false; $('#commentIn').blur();
  toast(T().commentSent);
}

// Recommend a recipe to someone: it shows up at the top of their feed.
function recommendSheet(r) {
  const t = T();
  const others = Object.keys(FAM.members).filter(id => id !== FAM.uid);
  sheet(`<h2>${esc(t.recommendTo)}</h2>
    <div class="wrapchips" id="recoWho">${others.map(id => `<button type="button" class="chip person" data-id="${id}">${avatarHTML(id, 'sm')}${esc(member(id).name)}</button>`).join('') || `<p class="muted">${esc(t.nobodyYet)}</p>`}</div>
    <div class="field"><label for="recoNote">${esc(t.recoNote)}</label><textarea class="input" id="recoNote" rows="2" placeholder="${esc(t.recoNotePh)}"></textarea></div>
    <div class="row2"><button class="btn" data-x="no">${esc(t.cancel)}</button><button class="btn primary" data-x="ok">${ico('reco')}${esc(t.recommend)}</button></div>`, (el, close) => {
    el.addEventListener('click', e => { const c = e.target.closest('#recoWho .chip:not([disabled])'); if (c) c.classList.toggle('on'); });
    el.querySelector('[data-x="no"]').onclick = close;
    el.querySelector('[data-x="ok"]').onclick = () => {
      const to = $$('#recoWho .chip.on').map(c => c.dataset.id); if (!to.length) return;
      const note = $('#recoNote').value.trim().slice(0, 500);
      for (const id of to) quiet(FB.setDoc(fref('recos', uid()), { from: FAM.uid, to: id, rid: r.id, note, at: Date.now(), done: false }));
      close(); toast(t.recoSent(to.map(id => member(id).name).join(', ')));
    };
  });
}

// ---------- Feed ----------
function feedHTML() {
  const t = T(), muted = new Set(S.muted || []);
  const recos = FAM.recos.filter(x => !x.done && FAM.raw.has(x.rid));
  const posts = FAM.all.filter(r => !r.sample && (r.owner === FAM.uid || !muted.has(r.owner)));
  const cooks = [...FAM.cooks.values()].filter(c => c.uid === FAM.uid || !muted.has(c.uid));
  // New recipes are already in the cookbook: here they're one line per person per day.
  const adds = new Map();
  for (const r of posts) { const k = r.owner + '|' + new Date(r.createdAt || 0).toDateString(), g = adds.get(k) || { owner: r.owner, at: 0, list: [] }; g.list.push(r); g.at = Math.max(g.at, r.createdAt || 0); adds.set(k, g); }
  const items = [...[...adds.values()].map(g => ({ at: g.at, g })), ...cooks.map(c => ({ at: c.at || 0, c }))].sort((a, b) => b.at - a.at).slice(0, 80);
  const recoHTML = recos.map(x => { const r = famRecipe(FAM.raw.get(x.rid)); return `<article class="reco">
      <div class="reco-h">${avatarHTML(x.from)}<div class="min"><span class="eyebrow">${esc(t.recoFor(member(x.from).name))}</span>${x.note ? `<p class="hand">${esc(x.note)}</p>` : ''}</div></div>
      <a class="card" href="#/r/${encodeURIComponent(r.id)}">${thumbHTML(r)}<div class="min"><h3>${esc(r.title)}</h3><div class="meta">${[r.category && t.cat[r.category], totalTime(r) && fmtDur(totalTime(r))].filter(Boolean).map(m => `<span>${esc(m)}</span>`).join('')}</div></div><div class="side"></div></a>
      <div class="row2"><button class="btn small" data-act="recodone" data-id="${x.id}">${esc(t.recoLater)}</button><button class="btn small primary" data-act="recokeep" data-id="${x.id}">${esc(t.open)}</button></div>
    </article>`; }).join('');
  const postHTML = items.map(({ g, c }) => {
    if (c) return cookPostHTML(c);
    const fresh = g.owner !== FAM.uid && g.at > feedPrevSeen, shown = g.list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 4);
    return `<div class="addline ${fresh ? 'fresh' : ''}">${avatarHTML(g.owner, 'sm')}<div class="min">
      <span class="addwho">${esc(t.addedLine(g.owner === FAM.uid ? '' : member(g.owner).name, g.list.length))} · ${esc(ago(g.at))}</span>
      <span class="addlist">${shown.map(r => `<a href="#/r/${encodeURIComponent(r.id)}">${esc(r.title)}</a>`).join('')}${g.list.length > shown.length ? `<span class="muted">+${g.list.length - shown.length}</span>` : ''}</span></div></div>`;
  }).join('');
  return `<div class="feed">${recoHTML}${postHTML || `<div class="empty"><h2>${esc(t.feedEmptyT)}</h2><p>${esc(t.feedEmpty)}</p></div>`}</div>`;
}

// ---------- Family page: create, join, members, settings ----------
function famInviteLink() {
  const c = FAM.cfg, payload = { v: 1, f: FAM.fid, k: FAM.code || '', n: FAM.name, c: { apiKey: c.apiKey, authDomain: c.authDomain, projectId: c.projectId, appId: c.appId } };
  return location.origin + location.pathname + '#/join/' + b64url(new TextEncoder().encode(JSON.stringify(payload)));
}
function avatarPicker(sel, color) {
  return `<div class="avpick" id="avPick">${AV_KEYS.map(k => `<button type="button" class="${k === sel ? 'on' : ''}" data-av="${k}" aria-label="${k}"><span class="av" style="--c:${color}">${illus(k)}</span></button>`).join('')}</div>
    <div class="colpick" id="colPick">${AV_COLORS.map(c => `<button type="button" class="${c === color ? 'on' : ''}" data-col="${c}" style="--c:${c}" aria-label="${c}"></button>`).join('')}</div>`;
}
function wireAvatarPicker(state) {
  $('#avPick')?.addEventListener('click', e => { const b = e.target.closest('[data-av]'); if (!b) return; state.avatar = b.dataset.av; $$('#avPick button').forEach(x => x.classList.toggle('on', x === b)); });
  $('#colPick')?.addEventListener('click', e => { const b = e.target.closest('[data-col]'); if (!b) return; state.color = b.dataset.col; $$('#colPick button').forEach(x => x.classList.toggle('on', x === b)); $$('#avPick .av').forEach(a => a.style.setProperty('--c', state.color)); });
}
function renderFamily() {
  current = 'famille'; navHTML('more');
  const t = T();
  if (!FAM.on) {
    const st = { avatar: 'whisk', color: AV_COLORS[0] };
    $('#view').innerHTML = `<div class="page-h wrap"><button class="icon-btn" data-act="back" aria-label="${esc(t.close)}">${ico('back')}</button><h1>${esc(t.family)}</h1></div>
      <div class="wrap stack">
        <section class="panel"><h2>${esc(t.famIntroT)}</h2><p style="margin:0">${esc(t.famIntro)}</p></section>
        <section class="panel"><h2>${esc(t.famJoinT)}</h2><p class="muted" style="margin:0">${esc(t.famJoinText)}</p>
          <textarea class="input" id="joinIn" rows="2" placeholder="${esc(t.famJoinPh)}"></textarea><button class="btn primary" data-act="famjoinpaste">${esc(t.famJoinBtn)}</button></section>
        <section class="panel"><h2>${esc(t.famCreateT)}</h2>
          <ol class="howto">${t.famSteps.map(s => `<li>${s}</li>`).join('')}</ol>
          <div class="field"><label for="cfgIn">${esc(t.famCfg)}</label><textarea class="input" id="cfgIn" rows="5" spellcheck="false" placeholder="const firebaseConfig = { apiKey: &quot;…&quot;, … }"></textarea></div>
          <div class="field"><label for="famNameIn">${esc(t.famName)}</label><input class="input" id="famNameIn"></div>
          <div class="field"><label for="meNameIn">${esc(t.yourName)}</label><input class="input" id="meNameIn" value="${esc(S.name || '')}"></div>
          <div class="field"><span class="lbl">${esc(t.yourAvatar)}</span>${avatarPicker(st.avatar, st.color)}</div>
          <button class="btn primary" data-act="famcreate">${esc(t.famCreateBtn)}</button></section>
      </div>`;
    wireAvatarPicker(st); renderFamily.st = st; return;
  }
  const me = member(FAM.uid), st = { avatar: me.avatar || 'desserts', color: me.color || AV_COLORS[0] };
  const muted = new Set(S.muted || []);
  const ids = Object.keys(FAM.members).sort((a, b) => (FAM.members[a].joinedAt || 0) - (FAM.members[b].joinedAt || 0));
  $('#view').innerHTML = `<div class="page-h wrap"><button class="icon-btn" data-act="back" aria-label="${esc(t.close)}">${ico('back')}</button><h1>${esc(FAM.name || t.family)}</h1></div>
    <div class="wrap stack">
      <section class="panel"><h2>${esc(t.famMembers)}</h2>
        <div class="members">${ids.map(id => `<div class="mrow">${avatarHTML(id)}<div class="min"><b>${esc(member(id).name)}${id === FAM.uid ? ` <span class="muted">(${esc(t.you)})</span>` : ''}</b>
          <span class="muted">${esc(t.nRecipesBy(FAM.all.filter(r => r.owner === id).length))}</span></div>
          ${id === FAM.uid ? '' : `<label class="mute"><input type="checkbox" data-act="mute" data-id="${id}" ${muted.has(id) ? '' : 'checked'}><span>${esc(t.inMyFeed)}</span></label>`}</div>`).join('')}</div>
        <button class="btn primary" data-act="faminvite">${ico('reco')}${esc(t.famInvite)}</button>
        <p class="hint" style="margin:0">${esc(t.famInviteHint)}</p></section>
      <section class="panel"><h2>${esc(t.yourProfile)}</h2>
        <div class="field"><label for="meNameIn">${esc(t.yourName)}</label><input class="input" id="meNameIn" value="${esc(me.name || '')}"></div>
        <div class="field"><span class="lbl">${esc(t.yourAvatar)}</span>${avatarPicker(st.avatar, st.color)}</div>
        <button class="btn" data-act="famprofile">${esc(t.save)}</button></section>
      <section class="panel"><h2>${esc(t.feedT)}</h2>
        <label class="toggle">${esc(t.feedShow)}<input type="checkbox" data-act="feedtoggle" ${S.feedOff ? '' : 'checked'}></label></section>
      <section class="panel"><h2>${esc(t.famLeaveT)}</h2><p class="muted" style="margin:0">${esc(t.famLeaveText)}</p><button class="btn danger" data-act="famleave">${esc(t.famLeave)}</button></section>
    </div>`;
  wireAvatarPicker(st); renderFamily.st = st;
}
async function famCreate() {
  const t = T(), cfg = parseFirebaseConfig($('#cfgIn').value);
  if (!cfg) { toast(t.famCfgBad); $('#cfgIn').focus(); return; }
  const name = $('#meNameIn').value.trim() || S.name || 'Abe', st = renderFamily.st;
  try {
    await fbInit(cfg);
    const u = FAM.auth.currentUser || (await FB.signInAnonymously(FAM.auth)).user;
    const fid = 'f' + randCode(10), code = randCode(20), famName = $('#famNameIn').value.trim() || t.famNameDefault;
    await FB.setDoc(FB.doc(FAM.db, 'families', fid), { name: famName, code, createdBy: u.uid, createdAt: Date.now() });
    await FB.setDoc(FB.doc(FAM.db, 'families', fid, 'members', u.uid), { name, avatar: st.avatar, color: st.color, code, joinedAt: Date.now() });
    famSaveLocal(cfg, fid, famName, code); S.name = name; saveSettings();
    await famStart(); await offerMigration();
    go('#/famille');
  } catch (e) { console.warn(e); toast(t.famErr); }
}
function famSaveLocal(cfg, fid, name, code) {
  FAM.cfg = cfg; FAM.fid = fid; FAM.name = name; FAM.code = code;
  ls.set('fbConfig', cfg); ls.set('famId', fid); ls.set('famName', name); ls.set('famCode', code);
}
function decodeInvite(code) { try { const d = JSON.parse(new TextDecoder().decode(unb64url(code))); return d && d.f && d.k && d.c ? d : null; } catch { return null; } }
function renderJoin(code) {
  current = 'join'; navHTML('');
  const t = T(), inv = decodeInvite(code);
  if (!inv) { toast(t.famJoinBad); go('#/famille'); return; }
  if (FAM.on && FAM.fid === inv.f) { go('#/'); return; }
  const st = { avatar: 'teapot', color: AV_COLORS[1] };
  $('#view').innerHTML = `<div class="wrap stack">
    <header class="top"><div class="mast"><span>${esc(t.appName)}</span><span>${esc(t.invitation)}</span></div><h1 class="greet" style="font-style:italic">${esc(t.joinTitle(inv.n || t.family))}</h1></header>
    <section class="panel"><div class="field"><label for="meNameIn">${esc(t.yourName)}</label><input class="input" id="meNameIn" value="${esc(S.name && S.name !== 'Abe' ? S.name : '')}" placeholder="${esc(t.yourNamePh)}"></div>
      <div class="field"><span class="lbl">${esc(t.yourAvatar)}</span>${avatarPicker(st.avatar, st.color)}</div>
      <button class="btn primary block" data-act="famjoin">${esc(t.famJoinBtn)}</button></section>
  </div>`;
  wireAvatarPicker(st); renderJoin.st = st; renderJoin.inv = inv;
}
async function famJoin() {
  const t = T(), inv = renderJoin.inv, st = renderJoin.st;
  const name = $('#meNameIn').value.trim(); if (!name) { toast(t.needName); $('#meNameIn').focus(); return; }
  try {
    await fbInit(inv.c);
    const u = FAM.auth.currentUser || (await FB.signInAnonymously(FAM.auth)).user;
    FAM.fid = inv.f;
    await FB.setDoc(fref('members', u.uid), { name, avatar: st.avatar, color: st.color, code: inv.k, joinedAt: Date.now() });
    famSaveLocal(inv.c, inv.f, inv.n || t.family, inv.k); S.name = name; saveSettings();
    await famStart(); await offerMigration();
    history.replaceState(null, '', location.pathname + '#/fil');
    route(); toast(t.welcomeFam(inv.n || t.family));
  } catch (e) { console.warn(e); toast(t.famJoinErr); }
}
// Bring this phone's existing recipes into the family space, once.
async function offerMigration() {
  const t = T();
  if (!DB.db && !DB.mem) await DB.open();
  let local = []; try { local = (await DB.all()).filter(r => !r.sample); } catch {}
  if (!local.length || ls.get('famMigrated_' + FAM.fid, false)) return;
  await new Promise(res => {
    sheet(`<h2>${esc(t.migrateT(local.length))}</h2><p style="margin:0">${esc(t.migrateText)}</p>
      <div class="menu"><button data-m="all">${ico('users')}${esc(t.migrateAll)}</button><button data-m="later">${ico('clock')}${esc(t.later)}</button></div>`, (el, close) => {
      el.addEventListener('click', async e => {
        const m = e.target.closest('[data-m]')?.dataset.m; if (!m) return;
        close();
        if (m === 'later') { res(); return; }
        for (const r of local) await cloudSave({ ...r, note: '' });
        ls.set('famMigrated_' + FAM.fid, true); toast(t.migrated(local.length)); res();
      });
    });
    setTimeout(() => { if (!$('.scrim')) res(); }, 120000);
  });
}
async function famLeave() {
  const t = T();
  if (!(await confirmBox(t.famLeaveQ, t.famLeave))) return;
  FAM.unsub.forEach(f => f()); FAM.unsub = [];
  try { await FB.signOut(FAM.auth); } catch {}
  for (const k of ['fbConfig', 'famId', 'famName', 'famCode']) ls.del(k);
  location.hash = '#/'; location.reload();
}
