'use strict';
// Our Kitchen: "J'ai cuisiné" photos and the private Carnets: evenings, guests, wine.
// The scripts share one scope and load in order (see index.html).

// ---------- Personal notebooks (events, guests) and "I made it" posts ----------
// Events and guest books are private to each person: on the phone, or in members/{me}/… in the family space.
// "I made it" posts are shared with exactly the people who can see the recipe (see firestore.rules → cooks).
const PS = { events: new Map(), guests: new Map(), cooks: new Map(), wines: new Map() };
const PS_KINDS = ['events', 'guests', 'cooks', 'wines'];
const plain = o => JSON.parse(JSON.stringify(o));
async function psLoadLocal() {
  for (const k of PS_KINDS) { let arr = []; try { arr = (await DB.kvGet('ps_' + k)) || []; } catch {} PS[k] = new Map(arr.map(x => [x.id, x])); }
}
const psTimers = {};
function psPersistLocal(kind) { clearTimeout(psTimers[kind]); psTimers[kind] = setTimeout(() => DB.kvSet('ps_' + kind, [...PS[kind].values()]).catch(() => {}), 250); }
function psPut(kind, o) {
  o.updatedAt = Date.now(); PS[kind].set(o.id, o);
  const w = fbWait(); if (w && kind !== 'cooks') { w.then(() => psPut(kind, o)); return; }
  if (FAM.on && kind !== 'cooks') quiet(FB.setDoc(fref('members', FAM.uid, kind, o.id), plain(o)));
  else psPersistLocal(kind);
}
function psDel(kind, id) {
  PS[kind].delete(id);
  const w = fbWait(); if (w && kind !== 'cooks') { w.then(() => psDel(kind, id)); return; }
  if (FAM.on && kind !== 'cooks') quiet(FB.deleteDoc(fref('members', FAM.uid, kind, id))); else psPersistLocal(kind);
}
// Family mode: listen to my own notebooks, and to the "I made it" posts I'm allowed to see.
function psListen() {
  for (const kind of ['events', 'guests', 'wines']) FAM.unsub.push(FB.onSnapshot(fcol('members', FAM.uid, kind), s => {
    PS[kind] = new Map(); s.forEach(d => PS[kind].set(d.id, { ...d.data(), id: d.id })); psChanged();
  }, e => console.warn(e)));
  FAM.unsub.push(FB.onSnapshot(FB.query(fcol('cooks'), FB.where('audience', 'array-contains-any', ['all', FAM.uid])), s => {
    FAM.cooks = new Map(); s.forEach(d => FAM.cooks.set(d.id, { ...d.data(), id: d.id })); famChanged();
  }, e => console.warn(e)));
}
let psTimer = null;
function psChanged() { saveFamCache(); clearTimeout(psTimer); psTimer = setTimeout(() => { if (current === 'carnets' && !$('.scrim')) { const y = window.scrollY; route(); window.scrollTo(0, y); } }, 200); }
// The first time this phone joins a family, its notebooks and photos move to the family space.
async function psMigrate() {
  const flag = 'psMigrated_' + FAM.fid; if (ls.get(flag, false)) return;
  const local = {}; for (const k of PS_KINDS) { try { local[k] = (await DB.kvGet('ps_' + k)) || []; } catch { local[k] = []; } }
  for (const k of ['events', 'guests', 'wines']) for (const o of local[k]) { PS[k].set(o.id, o); quiet(FB.setDoc(fref('members', FAM.uid, k, o.id), plain(o))); }
  for (const c of local.cooks) {
    const src = c.rid && FAM.raw.get(c.rid);
    const nc = { ...c, uid: FAM.uid, rid: src ? c.rid : null, audience: src ? [...(src.audience || ['all'])] : [FAM.uid], hearts: {} };
    FAM.cooks.set(nc.id, nc); quiet(FB.setDoc(fref('cooks', nc.id), plain(nc)));
  }
  ls.set(flag, true);
}

// ---------- "I made it" ----------
const cooksAll = () => FAM.on ? [...FAM.cooks.values()] : [...PS.cooks.values()];
const cooksFor = rid => cooksAll().filter(c => c.rid === rid).sort((a, b) => b.at - a.at);
const cooksForEvent = eid => cooksAll().filter(c => c.eid === eid && (!FAM.on || c.uid === FAM.uid));
const cookAuthor = c => !FAM.on ? '' : c.uid === FAM.uid ? T().you : member(c.uid).name;
const canDelCook = c => !FAM.on || c.uid === FAM.uid || (c.rid && FAM.raw.get(c.rid)?.owner === FAM.uid);
function pickFile(accept = 'image/*', multiple = false) {
  return new Promise(res => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = multiple; i.hidden = true;
    i.onchange = () => { res([...i.files]); i.remove(); };
    document.body.append(i); i.click();
    setTimeout(() => window.addEventListener('focus', () => setTimeout(() => { if (i.isConnected && !i.files.length) { i.remove(); res([]); } }, 800), { once: true }), 300);
  });
}
// Who will see a post about this recipe, in words.
const visibilityText = () => FAM.on ? T().cookVisAll : T().cookLocal;
function cookSheet(r) {
  const t = T();
  const evs = eventsSorted().filter(e => evTime(e) > Date.now() - 45 * 864e5).slice(0, 12);
  const today = isoDay(new Date());
  const pre = evs.find(e => e.date === today && (!r || e.items.some(i => i.rid === r.id))) || evs.find(e => e.date === today);
  const st = { photo: null, thumb: null };
  sheet(`<h2 class="cook-h">${esc(r ? t.cookT(r.title) : t.cookPhotoOnlyT)}</h2>
    <div class="cookphoto" id="ckPhoto"></div>
    ${!r ? `<div class="field"><label for="ckPlace">${esc(t.cookPlace)}</label><input class="input" id="ckPlace" maxlength="80"></div>` : ''}
    <div class="field"><label for="ckNote">${esc(t.cookNote)}</label><textarea class="input hand-in" id="ckNote" rows="3" maxlength="1000" placeholder="${esc(t.cookNotePh)}"></textarea></div>
    ${evs.length ? `<div class="field"><label for="ckEv">${esc(t.cookEvent)}</label><select class="input" id="ckEv"><option value="">${esc(t.none)}</option>${evs.map(e => `<option value="${e.id}" ${pre && pre.id === e.id ? 'selected' : ''}>${esc(evLabel(e))} · ${esc(fmtDate(evTime(e), { day: 'numeric', month: 'short' }))}</option>`).join('')}</select></div>` : ''}
    <p class="hint" style="margin:0">${ico(FAM.on ? 'users' : 'book')} ${esc(visibilityText())}</p>
    <div class="row2"><button class="btn" data-x="no">${esc(t.cancel)}</button><button class="btn primary" data-x="ok">${ico('check')}${esc(FAM.on ? t.cookPost : t.save)}</button></div>`, (el, close) => {
    const draw = () => {
      el.querySelector('#ckPhoto').innerHTML = st.photo
        ? `<figure class="polaroid tilt"><img src="${st.photo}" alt=""><button class="rm" data-x="rm" aria-label="${esc(t.del)}">${ico('x')}</button></figure>`
        : `<button class="addphoto" data-x="pick">${ico('camera')}<span>${esc(t.cookPhotoBtn)}</span><small>${esc(t.optional)}</small></button>`;
    };
    draw();
    el.addEventListener('click', async e => {
      const x = e.target.closest('[data-x]')?.dataset.x; if (!x) return;
      if (x === 'no') close();
      if (x === 'rm') { st.photo = st.thumb = null; draw(); }
      if (x === 'pick') {
        const [f] = await pickFile(); if (!f) return;
        try { st.photo = await compress(f, 1200, 0.78); st.thumb = await compress(f, 320, 0.72); draw(); } catch { toast('Photo ?'); }
      }
      if (x === 'ok') {
        const note = el.querySelector('#ckNote').value.trim();
        if (!r && !st.photo && !note) { el.querySelector('#ckNote').focus(); return; }
        const eid = el.querySelector('#ckEv')?.value || '', place = el.querySelector('#ckPlace')?.value.trim() || '';
        close();
        await saveCook(r, { ...st, note, eid, place });
      }
    });
  });
}
async function saveCook(r, { photo, thumb, note, eid, place }) {
  const t = T(), id = uid();
  const c = { id, uid: FAM.on ? FAM.uid : 'me', rid: r ? r.id : null, rtitle: r ? r.title : '', note: (note || '').slice(0, 1000), at: Date.now(), hearts: {} };
  if (photo) { c.photo = photo; c.thumb = thumb; }
  if (eid) c.eid = eid;
  if (place) c.place = place.slice(0, 80);
  if (FAM.on) {
    c.audience = r && FAM.raw.get(r.id) ? [...(FAM.raw.get(r.id).audience || ['all'])] : ['all'];
    FAM.cooks.set(id, c); quiet(FB.setDoc(fref('cooks', id), plain(c)));
  } else { c.audience = ['me']; PS.cooks.set(id, c); psPersistLocal('cooks'); }
  if (r) { r.cookCount = (r.cookCount || 0) + 1; r.lastCooked = Date.now(); await saveRecipe(r); }
  const ev = eid && PS.events.get(eid);
  if (ev && r) {
    const it = ev.items.find(i => i.rid === r.id);
    if (it) it.made = true; else ev.items.push(newItem(r, true));
    psPut('events', ev);
  }
  toast(FAM.on ? t.cookPosted : t.bravo);
  try { navigator.vibrate?.(15); } catch {}
  route();
}
function heartCook(id) {
  const c = FAM.cooks.get(id); if (!c) return;
  const on = !(c.hearts || {})[FAM.uid];
  c.hearts = { ...(c.hearts || {}) }; if (on) c.hearts[FAM.uid] = true; else delete c.hearts[FAM.uid];
  quiet(FB.updateDoc(fref('cooks', id), { ['hearts.' + FAM.uid]: on ? true : FB.deleteField() }));
  try { if (on) navigator.vibrate?.(15); } catch {}
}
async function deleteCook(id) {
  const t = T();
  if (!(await confirmBox(t.delCookQ, t.del))) return false;
  if (FAM.on) { FAM.cooks.delete(id); quiet(FB.deleteDoc(fref('cooks', id))); } else { PS.cooks.delete(id); psPersistLocal('cooks'); }
  return true;
}
// Keep posts in step with their recipe: same audience, and gone when the recipe goes.
function syncCooksAudience(rid, audience) {
  for (const c of FAM.cooks.values()) if (c.rid === rid && JSON.stringify(c.audience) !== JSON.stringify(audience)) {
    c.audience = [...audience]; quiet(FB.updateDoc(fref('cooks', c.id), { audience: [...audience] }));
  }
}
function deleteCooksOf(rid) {
  for (const c of [...FAM.cooks.values()]) if (c.rid === rid) { FAM.cooks.delete(c.id); quiet(FB.deleteDoc(fref('cooks', c.id))); }
}
function cookViewer(id) {
  const t = T();
  const draw = (el, close) => {
    const c = cooksAll().find(x => x.id === id); if (!c) { close(); return; }
    const r = c.rid && byId(c.rid), hearts = Object.keys(c.hearts || {}), liked = FAM.on && !!(c.hearts || {})[FAM.uid];
    el.innerHTML = `<div class="grab"></div>
      ${FAM.on ? `<header class="cv-h">${avatarHTML(c.uid, 'sm')}<div class="min"><b>${esc(cookAuthor(c))}</b><span class="muted">${esc(ago(c.at))}</span></div></header>` : `<p class="eyebrow" style="margin:0">${esc(fmtDate(c.at))}</p>`}
      ${c.photo ? `<button class="polaroid big" data-x="zoom"><img src="${esc(c.photo)}" alt=""></button>` : ''}
      ${c.note ? `<p class="hand">${esc(c.note)}</p>` : ''}
      ${r && current !== 'recipe' ? `<a class="cooktag" href="#/r/${encodeURIComponent(r.id)}">${thumbHTML(r)}<span class="min"><span class="eyebrow">${esc(t.theRecipe)}</span><b>${esc(r.title)}</b></span>${ico('arrow')}</a>` : ''}
      <div class="post-acts">
        ${FAM.on ? `<button class="pa ${liked ? 'on' : ''}" data-x="heart" aria-pressed="${liked}" aria-label="${esc(t.like)}">${ico(liked ? 'heart' : 'heartO')}<span>${hearts.length || ''}</span></button><span class="likers">${hearts.slice(0, 6).map(h => avatarHTML(h, 'xs')).join('')}</span>` : ''}
        <span style="flex:1"></span>
        ${canDelCook(c) ? `<button class="pa" data-x="del" aria-label="${esc(t.del)}">${ico('trash')}</button>` : ''}
      </div>`;
  };
  sheet('', (el, close) => {
    el.classList.add('cookview'); draw(el, close);
    el.addEventListener('click', async e => {
      const x = e.target.closest('[data-x]')?.dataset.x; if (!x) return;
      const c = cooksAll().find(y => y.id === id); if (!c) return;
      if (x === 'zoom') viewImage(c.photo);
      if (x === 'heart') { heartCook(id); draw(el, close); }
      if (x === 'del') { close(); if (await deleteCook(id)) route(); }
    });
    el.addEventListener('click', e => { if (e.target.closest('a[href]')) close(); });
  });
}
function madeSectionHTML(r) {
  const t = T(), list = cooksFor(r.id); if (!list.length) return '';
  const pics = list.filter(c => c.thumb || c.photo), notes = list.filter(c => c.note);
  return `<section class="section" id="madeSec"><div class="section-h"><h2>${esc(FAM.on ? t.madeByFam : t.madeByMe)}</h2><span class="eyebrow">${esc(t.nTimes(list.length))}</span></div>
    ${pics.length ? `<div class="madegrid">${pics.map((c, i) => `<button class="madeth" data-act="viewcook" data-id="${c.id}" style="--r:${(i % 2 ? 1 : -1) * (1 + (i % 3) * .6)}deg"><img src="${esc(c.thumb || c.photo)}" alt="" loading="lazy">${FAM.on ? avatarHTML(c.uid, 'xs') : ''}</button>`).join('')}</div>` : ''}
    ${notes.length ? `<div class="madenotes">${notes.map(c => `<button class="madenote" data-act="viewcook" data-id="${c.id}">${FAM.on ? avatarHTML(c.uid, 'sm') : ''}<span class="min"><span class="meta"><b>${esc(FAM.on ? cookAuthor(c) : fmtDate(c.at))}</b>${FAM.on ? `<span>${esc(ago(c.at))}</span>` : ''}</span><span class="hand">${esc(c.note)}</span></span></button>`).join('')}</div>` : ''}
  </section>`;
}
function cookPostHTML(c) {
  const t = T(), r = c.rid && byId(c.rid), hearts = Object.keys(c.hearts || {}), liked = !!(c.hearts || {})[FAM.uid];
  const fresh = c.uid !== FAM.uid && (c.at || 0) > feedPrevSeen;
  return `<article class="post cookpost ${fresh ? 'fresh' : ''}">
    <header>${avatarHTML(c.uid)}<div class="min"><b>${esc(cookAuthor(c))}</b><span class="muted">${esc((c.rid ? t.cookedVerb : t.photoVerb) + (c.place ? ' · ' + c.place : '') + ' · ' + ago(c.at))}</span></div>${c.rid ? `<span class="stamp">${esc(t.madeItStamp)}</span>` : ''}</header>
    ${c.photo || c.thumb ? `<button class="post-photo" data-act="viewcook" data-id="${c.id}"><img src="${esc(c.photo || c.thumb)}" alt="" loading="lazy"></button>` : ''}
    ${c.note ? `<p class="hand">${esc(c.note)}</p>` : ''}
    ${r ? `<a class="cooktag" href="#/r/${encodeURIComponent(r.id)}">${thumbHTML(r)}<span class="min"><span class="eyebrow">${esc(t.theRecipe)}</span><b>${esc(r.title)}</b></span>${ico('arrow')}</a>` : ''}
    <div class="post-acts">
      <button class="pa ${liked ? 'on' : ''}" data-act="likecook" data-id="${c.id}" aria-pressed="${liked}" aria-label="${esc(t.like)}">${ico(liked ? 'heart' : 'heartO')}<span>${hearts.length || ''}</span></button>
      <span class="likers">${hearts.slice(0, 5).map(h => avatarHTML(h, 'xs')).join('')}</span>
      <span style="flex:1"></span>
      ${r && r.id ? `<button class="pa" data-act="cookthis" data-id="${r.id}">${ico('camera')}<span>${esc(t.madeItToo)}</span></button>` : ''}
    </div>
  </article>`;
}
async function cookPick() { const t = T(), pick = await pickRecipes({ title: t.pickRecipeT, allowNone: FAM.on }); if (pick) cookSheet(pick[0] || null); }
// The + button: a new recipe, "I made something", or just a photo.
function fabSheet() {
  const t = T();
  sheet(`<h2>${esc(t.fabQ)}</h2><div class="choice">
    <button data-x="cook"><span class="chico">${ico('fire')}</span><span class="min"><b>${esc(t.madeItQ)}</b><small>${esc(t.madeItSub)}</small></span></button>
    ${FAM.on ? `<button data-x="photo"><span class="chico">${ico('camera')}</span><span class="min"><b>${esc(t.photoPost)}</b><small>${esc(t.photoPostSub)}</small></span></button>` : ''}
    <button data-x="new"><span class="chico">${ico('edit')}</span><span class="min"><b>${esc(t.newRecipeChoice)}</b><small>${esc(t.newRecipeSub)}</small></span></button>
  </div>`, (el, close) => el.addEventListener('click', async e => {
    const x = e.target.closest('[data-x]')?.dataset.x; if (!x) return; close();
    if (x === 'new') go('#/edit/new');
    if (x === 'photo') cookSheet(null);
    if (x === 'cook') cookPick();
  }));
}
// Choose one or several recipes (my book first; in a family, everything I can see).
function pickRecipes({ title, multi = false, allowNone = false, exclude = [] }) {
  const t = T(), pool = (FAM.on ? FAM.all : recipes).filter(r => !exclude.includes(r.id));
  const c = collator(); pool.sort((a, b) => c.compare(sortKey(a.title), sortKey(b.title)));
  const sel = new Set();
  return new Promise(res => {
    let done = false;
    const close = sheet(`<h2>${esc(title)}</h2>
      <div class="search" style="margin:0">${ico('search', 'lead')}<input id="pkQ" type="search" autocomplete="off" placeholder="${esc(t.pickSearchPh)}"></div>
      <div class="picklist" id="pkList"></div>
      ${allowNone ? `<button class="btn" data-x="none">${ico('camera')}${esc(t.cookNoRecipe)}</button>` : ''}
      ${multi ? `<button class="btn primary" data-x="ok" id="pkOk" disabled>${esc(t.pickDone(0))}</button>` : ''}`, (el, cl) => {
      const draw = () => {
        const q = norm(el.querySelector('#pkQ').value).trim();
        const list = q ? pool.filter(r => norm(r.title).includes(q) || norm(r.tags?.join(' ')).includes(q)) : pool;
        el.querySelector('#pkList').innerHTML = list.slice(0, 200).map(r => `<button class="pickrow ${sel.has(r.id) ? 'on' : ''}" data-id="${r.id}" aria-pressed="${sel.has(r.id)}">${thumbHTML(r)}<span class="min"><b>${esc(r.title)}</b><small>${esc([r.category && t.cat[r.category], FAM.on && r.owner && r.owner !== FAM.uid ? member(r.owner).name : ''].filter(Boolean).join(' · '))}</small></span>${multi ? `<span class="tick">${ico('check')}</span>` : ico('arrow')}</button>`).join('') || `<p class="muted">${esc(t.noResults)}</p>`;
        const ok = el.querySelector('#pkOk'); if (ok) { ok.disabled = !sel.size; ok.textContent = t.pickDone(sel.size); }
      };
      draw();
      el.querySelector('#pkQ').addEventListener('input', draw);
      el.addEventListener('click', e => {
        const row = e.target.closest('.pickrow');
        if (row) { const r = pool.find(x => x.id === row.dataset.id); if (!multi) { done = true; cl(); res([r]); return; } sel.has(r.id) ? sel.delete(r.id) : sel.add(r.id); draw(); return; }
        const x = e.target.closest('[data-x]')?.dataset.x;
        if (x === 'none') { done = true; cl(); res([]); }
        if (x === 'ok') { done = true; cl(); res(pool.filter(r => sel.has(r.id))); }
      });
    });
    const obs = new MutationObserver(() => { if (!done && !$('#pkList')) { obs.disconnect(); res(null); } else if (done) obs.disconnect(); });
    obs.observe(document.body, { childList: true });
    void close;
  });
}

// ---------- Carnets: events ----------
const isoDay = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const evTime = e => e.date ? new Date(e.date + 'T12:00').getTime() : (e.createdAt || 0);
const evLabel = e => {
  if (e.title) return e.title;
  const k = e.occ === 'momsbday' ? 'birthday' : e.occ, occ = k && (T().occOne[k] || occLabel(k)), who = (e.guests || []).map(guestName).filter(Boolean).join(', ');
  return occ && who ? `${occ} · ${who}` : occ || (who && T().dinnerWith(who)) || T().untitled;
};
const eventsSorted = () => [...PS.events.values()].sort((a, b) => evTime(b) - evTime(a));
const guestName = id => PS.guests.get(id)?.name || '';
const itemKey = i => i.rid || 'x:' + norm(i.title);
const newItem = (r, made = false) => ({ id: uid(), rid: r ? r.id : null, title: r ? r.title : '', made, verdict: '', note: '' });
const itemTitle = i => (i.rid && byId(i.rid)?.title) || i.title || '…';
function newEvent(preset = {}) {
  const e = { id: uid(), title: '', date: isoDay(new Date()), occ: '', guests: [], items: [], notes: '', photos: [], createdAt: Date.now(), ...preset };
  psPut('events', e); return e;
}
// Everything already served to any of these guests (optionally leaving one evening out).
function servedTo(gids, exceptId) {
  const out = new Map();
  for (const e of eventsSorted()) {
    if (e.id === exceptId || !e.guests.some(g => gids.includes(g))) continue;
    for (const i of e.items) {
      if (!i.made) continue;
      const k = itemKey(i), o = out.get(k) || { rid: i.rid, title: itemTitle(i), count: 0, last: 0, lastEvent: null, verdicts: [] };
      o.count++; if (evTime(e) > o.last) { o.last = evTime(e); o.lastEvent = e; }
      if (i.verdict) o.verdicts.push(i.verdict);
      out.set(k, o);
    }
  }
  return [...out.values()].sort((a, b) => b.last - a.last);
}
const VERD = { loved: 'heart', ok: 'check', meh: 'x' };
const bestVerdict = vs => vs.includes('loved') ? 'loved' : vs.includes('ok') ? 'ok' : vs.includes('meh') ? 'meh' : '';
function verdictBadge(v) { return v ? `<span class="verdict v-${v}">${ico(VERD[v])}${esc(T().verdicts[v])}</span>` : ''; }
function stampHTML(e) {
  const d = new Date(evTime(e));
  return `<span class="datestamp"><span>${esc(d.toLocaleDateString(locale(), { weekday: 'short' }))}</span><b>${d.getDate()}</b><span>${esc(d.toLocaleDateString(locale(), { month: 'short' }))} ${String(d.getFullYear()).slice(2)}</span></span>`;
}
function evCardHTML(e) {
  const t = T(), made = e.items.filter(i => i.made).length;
  const pics = [...(e.photos || []), ...cooksForEvent(e.id).map(c => c.thumb).filter(Boolean)].slice(0, 5);
  return `<a class="evcard" href="#/carnet/${encodeURIComponent(e.id)}">${stampHTML(e)}<span class="min">
    <span class="meta">${[e.occ && occLabel(e.occ), e.guests.map(guestName).filter(Boolean).join(', ')].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join('')}</span>
    <h3>${esc(evLabel(e))}</h3>
    <span class="meta"><span>${esc(t.nDishes(e.items.length))}</span>${made ? `<span>${esc(t.nMade(made))}</span>` : ''}</span>
    ${pics.length ? `<span class="evstrip">${pics.map(p => `<img src="${esc(p)}" alt="" loading="lazy">`).join('')}</span>` : ''}</span></a>`;
}
const monoColor = id => AV_COLORS[[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];
const monogram = g => `<span class="monogram" style="--c:${monoColor(g.id)}" aria-hidden="true">${esc((g.name || '?').replace(/^(les|the)\s+/i, '').split(/[\s&,]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?')}</span>`;
function guestEvents(gid) { return eventsSorted().filter(e => e.guests.includes(gid)); }
function guestCardHTML(g) {
  const t = T(), evs = guestEvents(g.id);
  return `<a class="evcard guest" href="#/invites/${encodeURIComponent(g.id)}">${monogram(g)}<span class="min">
    <h3>${esc(g.name || t.unnamedGuests)}</h3>
    <span class="meta"><span>${esc(t.nEvenings(evs.length))}</span>${evs[0] ? `<span>${esc(t.lastOn(fmtDate(evTime(evs[0]), { day: 'numeric', month: 'short', year: 'numeric' })))}</span>` : ''}</span>
    ${g.notes ? `<span class="hand small">${esc(g.notes.split('\n')[0])}</span>` : ''}</span></a>`;
}
const carnetTabs = v => { const t = T(); return `<div class="hometabs four" role="tablist">${[['events', t.tabEvents], ['guests', t.tabGuests], ['wines', t.tabWines], ['fav', t.favorites]].map(([k, l]) => `<button role="tab" data-act="ctab" data-v="${k}" aria-selected="${v === k}">${esc(l)}</button>`).join('')}</div>`; };
function renderCarnets() {
  current = 'carnets'; navHTML('carnets');
  const t = T(), tab = ['guests', 'wines'].includes(S.carnetTab) ? S.carnetTab : 'events';
  const evs = eventsSorted(), today = isoDay(new Date());
  const up = evs.filter(e => (e.date || '') >= today).reverse(), past = evs.filter(e => (e.date || '') < today);
  const gs = [...PS.guests.values()].sort((a, b) => (evTime(guestEvents(b.id)[0] || {}) - evTime(guestEvents(a.id)[0] || {})) || collator().compare(a.name, b.name));
  const body = tab === 'wines' ? winesBodyHTML() : tab === 'events'
    ? (evs.length ? `${up.length ? `<h2 class="eyebrow list-h">${esc(t.upcoming)}</h2><div class="evlist">${up.map(evCardHTML).join('')}</div>` : ''}
        ${past.length ? `<h2 class="eyebrow list-h">${esc(t.memories)}</h2><div class="evlist">${past.map(evCardHTML).join('')}</div>` : ''}`
      : `<div class="empty"><h2>${esc(t.eventsEmptyT)}</h2><p>${esc(t.eventsEmpty)}</p><button class="btn primary" data-act="newevent">${ico('plus')}${esc(t.newEvent)}</button></div>`)
    : (gs.length ? `<div class="evlist" style="margin-top:16px">${gs.map(guestCardHTML).join('')}</div>`
      : `<div class="empty"><h2>${esc(t.guestsEmptyT)}</h2><p>${esc(t.guestsEmpty)}</p><button class="btn primary" data-act="newguest">${ico('plus')}${esc(t.newGuest)}</button></div>`);
  $('#view').innerHTML = `<div class="wrap">
    <header class="top"><div class="mast"><span>${esc(t.appName)}</span><span>${esc(t.nEvents(evs.length))}</span></div>
      <h1 class="greet">${esc(t.carnets)}</h1><p class="muted" style="margin:0">${esc(t.carnetsSub)}</p></header>
    ${carnetTabs(tab)}
    ${body}
  </div>
  ${(tab === 'events' ? evs.length : tab === 'wines' ? PS.wines.size : gs.length) ? `<button class="fab" data-act="${{ events: 'newevent', guests: 'newguest', wines: 'newwine' }[tab]}">${ico(tab === 'wines' ? 'camera' : 'plus')}${esc({ events: t.newEvent, guests: t.newGuest, wines: t.newWine }[tab])}</button>` : ''}`;
}

let curEv = null, evSaveT = null;
function renderEvent(id) {
  const e = PS.events.get(id); if (!e) return go('#/carnets');
  curEv = e; current = 'carnet'; navHTML('carnets');
  const t = T();
  const occs = generalOcc();
  const served = e.guests.length ? servedTo(e.guests, e.id) : [];
  const inMenu = new Set(e.items.map(itemKey));
  const prev = e.occ ? eventsSorted().find(x => x.id !== e.id && x.occ === e.occ && x.items.length && evTime(x) <= evTime(e)) : null;
  const myCooks = cooksForEvent(e.id).filter(c => c.thumb || c.photo);
  $('#view').innerHTML = `<div class="page-h wrap"><button class="icon-btn" data-act="back" aria-label="${esc(t.close)}">${ico('back')}</button><h1>${esc(t.carnet)}</h1>
      <button class="icon-btn" data-act="evdel" aria-label="${esc(t.delEvent)}">${ico('trash')}</button></div>
    <div class="wrap stack evpage" id="evPage">
      <div class="evhead">${stampHTML(e)}<textarea class="evtitle" id="evTitle" rows="1" placeholder="${esc(t.evTitlePh)}" aria-label="${esc(t.evTitlePh)}">${esc(e.title)}</textarea></div>
      <div class="row2">
        <div class="field"><label for="evDate">${esc(t.evDate)}</label><input class="input" type="date" id="evDate" value="${esc(e.date || '')}"></div>
        <div class="field"><label for="evOcc">${esc(t.evOcc)}</label><select class="input" id="evOcc"><option value="">${esc(t.none)}</option>${occs.map(k => `<option value="${k}" ${e.occ === k ? 'selected' : ''}>${esc(occLabel(k))}</option>`).join('')}</select></div>
      </div>

      <section class="panel"><h2>${ico('users')} ${esc(t.evGuests)}</h2>
        <div class="wrapchips">${e.guests.map(g => PS.guests.get(g)).filter(Boolean).map(g => `<a class="chip person" href="#/invites/${encodeURIComponent(g.id)}">${monogram(g)}${esc(g.name)}</a>`).join('')}
          <button class="chip" data-act="evguests">${ico('plus')}${esc(e.guests.length ? t.edit : t.addGuests)}</button></div>
        ${e.guests.length ? `<div class="served"><h3 class="eyebrow">${esc(t.servedBefore)}</h3>
          ${served.length ? served.map(s => `<div class="srow">${s.rid && byId(s.rid) ? thumbHTML(byId(s.rid)) : `<span class="thumb blank"></span>`}<span class="min"><b>${s.rid && byId(s.rid) ? `<a href="#/r/${encodeURIComponent(s.rid)}">${esc(s.title)}</a>` : esc(s.title)}</b>
              <small>${esc(t.servedTimes(s.count, fmtDate(s.last, { day: 'numeric', month: 'short', year: 'numeric' })))}</small>${verdictBadge(bestVerdict(s.verdicts))}</span>
              ${inMenu.has(s.rid || 'x:' + norm(s.title)) ? `<span class="muted small">${esc(t.inMenu)}</span>` : `<button class="icon-btn" data-act="evaddserved" data-rid="${esc(s.rid || '')}" data-title="${esc(s.title)}" aria-label="${esc(t.addToMenu)}">${ico('plus')}</button>`}</div>`).join('')
            : `<p class="muted" style="margin:0">${esc(t.servedNone)}</p>`}</div>` : ''}
      </section>

      <section class="panel"><h2>${ico('book')} ${esc(t.menu)}</h2>
        ${e.items.length ? `<div class="mitems">${e.items.map((i, n) => `<div class="mitem ${i.made ? 'made' : ''}">
          <button class="mcheck" data-act="evmade" data-i="${n}" aria-pressed="${i.made}" aria-label="${esc(t.made)}">${ico('check')}</button>
          <div class="min">
            <div class="mt">${i.rid && byId(i.rid) ? `<a href="#/r/${encodeURIComponent(i.rid)}">${esc(itemTitle(i))}</a>` : `<span>${esc(itemTitle(i))}</span>`}</div>
            ${i.made ? `<div class="verdicts">${Object.keys(VERD).map(v => `<button data-act="evverdict" data-i="${n}" data-v="${v}" class="v-${v}" aria-pressed="${i.verdict === v}">${ico(VERD[v])}${esc(t.verdicts[v])}</button>`).join('')}</div>` : ''}
            <input class="mnote" data-i="${n}" value="${esc(i.note || '')}" placeholder="${esc(t.itemNotePh)}" aria-label="${esc(t.itemNotePh)}">
          </div>
          <button class="icon-btn" data-act="evrm" data-i="${n}" aria-label="${esc(t.del)}">${ico('x')}</button></div>`).join('')}</div>`
          : `<p class="muted" style="margin:0">${esc(t.menuEmpty)}</p>`}
        <div class="btnrow"><button class="btn small" data-act="evaddrecipes">${ico('plus')}${esc(t.addRecipes)}</button><button class="btn small" data-act="evcook">${ico('camera')}${esc(t.madeIt)}</button></div>
        <form class="shop-add" id="evOther"><input class="input" id="evOtherIn" placeholder="${esc(t.otherDishPh)}" enterkeyhint="done"><button class="btn" aria-label="${esc(t.add)}">${ico('plus')}</button></form>
        ${prev ? `<button class="btn small ghost" data-act="evreuse" data-from="${prev.id}">${ico('copy')}${esc(t.reuseMenu(evLabel(prev), new Date(evTime(prev)).getFullYear()))}</button>` : ''}
      </section>

      <section class="panel"><h2>${ico('glass')} ${esc(t.wines)}</h2>
        <div class="wrapchips">${winesRowHTML(e.wines || [])}<button class="chip" data-act="evwines">${ico('plus')}${esc(t.aWine)}</button></div></section>

      <section class="panel evening"><h2>${ico('chat')} ${esc(t.evening)}</h2>
        <textarea class="ruled hand-in" id="evNotes" rows="5" placeholder="${esc(t.eveningPh)}">${esc(e.notes || '')}</textarea>
        <div class="evphotos">${(e.photos || []).map((p, n) => `<span class="page-th"><img src="${esc(p)}" alt="" data-act="evview" data-i="${n}"><button class="rm" data-act="evphotorm" data-i="${n}" aria-label="${esc(t.del)}">${ico('x')}</button></span>`).join('')}
          ${myCooks.map(c => `<button class="page-th" data-act="viewcook" data-id="${c.id}"><img src="${esc(c.thumb || c.photo)}" alt=""></button>`).join('')}
          ${(e.photos || []).length < 6 ? `<button class="page-th add" data-act="evphoto" aria-label="${esc(t.addPhoto)}">${ico('camera')}</button>` : ''}</div>
      </section>
      <p class="muted center small">${esc(t.privateNote)}</p>
    </div>`;
  const ta = $('#evTitle'); const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }; fit();
  ta.addEventListener('input', fit);
  $('#evOther').onsubmit = ev => { ev.preventDefault(); const v = $('#evOtherIn').value.trim(); if (!v) return; e.items.push({ ...newItem(null), title: v }); psPut('events', e); rerenderEvent(); };
  if (!e.title && !e.items.length) setTimeout(() => ta.focus(), 250);
}
function rerenderEvent() { const y = window.scrollY; renderEvent(curEv.id); window.scrollTo(0, y); }
function readEvent() {
  const e = curEv; if (!e || !$('#evPage')) return;
  e.title = $('#evTitle').value.trim().slice(0, 120); e.date = $('#evDate').value; e.occ = $('#evOcc').value; e.notes = $('#evNotes').value;
  $$('.mnote').forEach(i => { const it = e.items[+i.dataset.i]; if (it) it.note = i.value.slice(0, 300); });
}
function saveEventSoon() { clearTimeout(evSaveT); evSaveT = setTimeout(() => { readEvent(); if (curEv) psPut('events', curEv); }, 500); }
function flushEvent() { if (evSaveT && current === 'carnet') { clearTimeout(evSaveT); evSaveT = null; readEvent(); if (curEv) psPut('events', curEv); } }
document.addEventListener('input', e => { if (e.target.closest('#evPage')) saveEventSoon(); });
document.addEventListener('change', e => {
  if (!e.target.closest('#evPage')) return;
  if (['evDate', 'evOcc'].includes(e.target.id)) { readEvent(); psPut('events', curEv); rerenderEvent(); }
});
function guestPicker(e) {
  const t = T(), sel = new Set(e.guests);
  sheet(`<h2>${esc(t.guestPickT)}</h2><div class="wrapchips" id="gpList"></div>
    <form class="shop-add" id="gpNew"><input class="input" id="gpIn" placeholder="${esc(t.guestNewPh)}" enterkeyhint="done"><button class="btn" aria-label="${esc(t.add)}">${ico('plus')}</button></form>
    <button class="btn primary" data-x="ok">${esc(t.done)}</button>`, (el, close) => {
    const draw = () => { el.querySelector('#gpList').innerHTML = [...PS.guests.values()].sort((a, b) => collator().compare(a.name, b.name)).map(g => `<button type="button" class="chip person ${sel.has(g.id) ? 'on' : ''}" data-g="${g.id}" aria-pressed="${sel.has(g.id)}">${monogram(g)}${esc(g.name)}</button>`).join('') || `<p class="muted" style="margin:0">${esc(t.guestsEmpty)}</p>`; };
    draw();
    el.querySelector('#gpNew').onsubmit = ev => { ev.preventDefault(); const v = el.querySelector('#gpIn').value.trim(); if (!v) return; const g = { id: uid(), name: v.slice(0, 80), notes: '', createdAt: Date.now() }; psPut('guests', g); sel.add(g.id); el.querySelector('#gpIn').value = ''; draw(); };
    el.addEventListener('click', ev => {
      const c = ev.target.closest('[data-g]'); if (c) { sel.has(c.dataset.g) ? sel.delete(c.dataset.g) : sel.add(c.dataset.g); draw(); return; }
      if (ev.target.closest('[data-x="ok"]')) {
        const v = el.querySelector('#gpIn').value.trim(); if (v) { const g = { id: uid(), name: v.slice(0, 80), notes: '', createdAt: Date.now() }; psPut('guests', g); sel.add(g.id); }
        close(); readEvent(); e.guests = [...sel]; psPut('events', e); rerenderEvent();
      }
    });
  });
}
function addToEventSheet(r) {
  const t = T(), evs = eventsSorted().slice(0, 15);
  sheet(`<h2>${esc(t.addToEvent)}</h2><div class="menu">
    <button data-e="new">${ico('plus')}${esc(t.newEvent)}</button>
    ${evs.map(e => `<button data-e="${e.id}">${ico('book')}<span class="min" style="display:grid"><span>${esc(evLabel(e))}</span><small class="muted">${esc(fmtDate(evTime(e)))}${e.items.some(i => i.rid === r.id) ? ' · ' + esc(t.inMenu) : ''}</small></span></button>`).join('')}</div>`, (el, close) => el.addEventListener('click', ev => {
    const id = ev.target.closest('[data-e]')?.dataset.e; if (!id) return; close();
    const e = id === 'new' ? newEvent() : PS.events.get(id); if (!e) return;
    if (!e.items.some(i => i.rid === r.id)) e.items.push(newItem(r));
    psPut('events', e);
    if (id === 'new') go('#/carnet/' + e.id); else toast(t.addedToEvent(evLabel(e)), { label: t.open, fn: () => go('#/carnet/' + e.id) });
  }));
}
const eventsWith = rid => eventsSorted().filter(e => e.items.some(i => i.rid === rid));

// ---------- Carnets: guest books ----------
function renderGuest(id) {
  const g = PS.guests.get(id); if (!g) return go('#/carnets');
  current = 'invites'; navHTML('carnets');
  const t = T(), evs = guestEvents(id), served = servedTo([id]);
  $('#view').innerHTML = `<div class="page-h wrap"><button class="icon-btn" data-act="back" aria-label="${esc(t.close)}">${ico('back')}</button><h1>${esc(t.tabGuests)}</h1>
      <button class="icon-btn" data-act="guestdel" data-id="${g.id}" aria-label="${esc(t.delGuest)}">${ico('trash')}</button></div>
    <div class="wrap stack" id="guestPage" data-id="${g.id}">
      <div class="evhead">${monogram(g)}<textarea class="evtitle" id="gName" rows="1" placeholder="${esc(t.guestNamePh)}">${esc(g.name)}</textarea></div>
      <div class="field"><label for="gNotes">${esc(t.guestNotes)}</label><textarea class="ruled hand-in" id="gNotes" rows="3" placeholder="${esc(t.guestNotesPh)}">${esc(g.notes || '')}</textarea></div>
      <button class="btn primary" data-act="planwith" data-id="${g.id}">${ico('plus')}${esc(t.planWith)}</button>
      <section class="panel"><h2>${ico('book')} ${esc(t.servedToThem)}</h2>
        ${served.length ? `<div class="served">${served.map(s => `<div class="srow">${s.rid && byId(s.rid) ? thumbHTML(byId(s.rid)) : `<span class="thumb blank"></span>`}<span class="min"><b>${s.rid && byId(s.rid) ? `<a href="#/r/${encodeURIComponent(s.rid)}">${esc(s.title)}</a>` : esc(s.title)}</b>
          <small>${esc(t.servedTimes(s.count, fmtDate(s.last, { day: 'numeric', month: 'short', year: 'numeric' })))}</small>${verdictBadge(bestVerdict(s.verdicts))}</span></div>`).join('')}</div>`
          : `<p class="muted" style="margin:0">${esc(t.servedNone)}</p>`}
      </section>
      ${winesServedTo(id).length ? `<section class="panel"><h2>${ico('glass')} ${esc(t.winesServed)}</h2><div class="served">${winesServedTo(id).map(o => `<div class="srow">${wineThumb(o.w)}<span class="min"><b><a href="#/vin/${encodeURIComponent(o.w.id)}">${esc(wineLabel(o.w))}</a></b><small>${esc(t.servedTimes(o.count, fmtDate(o.last, { day: 'numeric', month: 'short', year: 'numeric' })))}</small></span></div>`).join('')}</div></section>` : ''}
      <section><h2 class="eyebrow list-h">${esc(t.theirEvenings)}</h2>
        ${evs.length ? `<div class="evlist">${evs.map(evCardHTML).join('')}</div>` : `<p class="muted">${esc(t.noEveningsYet)}</p>`}</section>
    </div>`;
  const ta = $('#gName'); const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }; fit(); ta.addEventListener('input', fit);
  if (!g.name) setTimeout(() => ta.focus(), 250);
}
let gSaveT = null, gSaveFn = null;
function flushGuest() { if (gSaveT) { clearTimeout(gSaveT); gSaveT = null; gSaveFn?.(); } }
document.addEventListener('input', e => {
  const p = e.target.closest('#guestPage'); if (!p) return;
  gSaveFn = () => { const g = PS.guests.get(p.dataset.id); if (!g || !$('#gName')) return; g.name = $('#gName').value.trim().slice(0, 80); g.notes = $('#gNotes').value.slice(0, 3000); psPut('guests', g); };
  clearTimeout(gSaveT); gSaveT = setTimeout(() => { gSaveT = null; gSaveFn(); }, 500);
});

// ---------- Cave: wine notes (private, like the other notebooks) ----------
const WCOLS = ['red', 'white', 'rose', 'sparkling', 'sweet'];
const WCOL_C = { red: '#7A1F2B', white: '#D9B44A', rose: '#E58C8A', sparkling: '#C9B98A', sweet: '#C27A1F' };
const winesSorted = () => [...PS.wines.values()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
const wineLabel = w => [w.name || T().unnamedWine, w.vintage].filter(Boolean).join(' ');
const winesFor = rid => winesSorted().filter(w => (w.pairs || []).includes(rid));
const eventsWithWine = wid => eventsSorted().filter(e => (e.wines || []).includes(wid));
const wineThumb = (w, cls = 'thumb') => w.thumb || w.photo
  ? `<img class="${cls}" src="${esc(w.thumb || w.photo)}" alt="" loading="lazy">`
  : `<span class="${cls} art" style="--c:${WCOL_C[w.color] || '#7A1F2B'}"><span class="ini" aria-hidden="true">${esc(initial(w.name || '?'))}</span></span>`;
const wstars = n => n ? `<span class="stars-mini" aria-label="${n}/5">${ico('star').repeat(n)}</span>` : '';
function newWine() { const w = { id: uid(), name: '', producer: '', appellation: '', vintage: '', color: '', rating: 0, notes: '', pairs: [], createdAt: Date.now() }; psPut('wines', w); return w; }
function winesBodyHTML() {
  const t = T(), all = winesSorted(), col = L.wcol || '', q = norm(L.wq || '').trim();
  if (!all.length) return `<div class="empty"><h2>${esc(t.winesEmptyT)}</h2><p>${esc(t.winesEmpty)}</p><button class="btn primary" data-act="newwine">${ico('camera')}${esc(t.newWine)}</button></div>`;
  const list = all.filter(w => (!col || w.color === col) && (!q || norm([w.name, w.producer, w.appellation, w.vintage, w.notes].join(' ')).includes(q)));
  return `<div class="search wsearch" role="search">${ico('search', 'lead')}<input id="wq" type="search" autocomplete="off" value="${esc(L.wq || '')}" placeholder="${esc(t.searchPh)}" aria-label="${esc(t.searchPh)}"></div>
    <div class="chips">${['', ...WCOLS].map(c => `<button class="chip ${col === c ? 'on' : ''}" data-act="wcol" data-c="${c}" aria-pressed="${col === c}">${c ? `<i class="wdot" style="--c:${WCOL_C[c]}"></i>` : ''}${esc(c ? t.wcol[c] : t.allWines)}</button>`).join('')}</div>
    <div class="winegrid">${list.map(w => `<a class="winecard" href="#/vin/${encodeURIComponent(w.id)}">${wineThumb(w, 'wlabel')}
      <span class="min"><b>${esc(w.name || t.unnamedWine)}</b><span class="meta">${w.color ? `<i class="wdot" style="--c:${WCOL_C[w.color]}"></i>` : ''}${esc([w.vintage, w.appellation].filter(Boolean).join(' · '))}</span>${wstars(w.rating)}</span></a>`).join('') || `<p class="muted">${esc(t.noResults)}</p>`}</div>`;
}
document.addEventListener('input', e => {
  if (e.target.id !== 'wq') return;
  L.wq = e.target.value; const pos = e.target.selectionStart; route(); const i = $('#wq'); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch {} }
});
let curWine = null, wSaveT = null;
function renderWine(id) {
  const w = PS.wines.get(id); if (!w) return go('#/carnets');
  curWine = w; current = 'vin'; navHTML('carnets');
  const t = T(), evs = eventsWithWine(w.id);
  $('#view').innerHTML = `<div class="page-h wrap"><button class="icon-btn" data-act="back" aria-label="${esc(t.close)}">${ico('back')}</button><h1>${esc(t.tabWines)}</h1>
      <button class="icon-btn" data-act="winedel" aria-label="${esc(t.del)}">${ico('trash')}</button></div>
    <div class="wrap stack" id="winePage">
      <div class="wine-hero">${w.photo
        ? `<figure class="polaroid tilt wlabelbig"><img src="${esc(w.photo)}" alt="" data-act="wineview"><button class="rm" data-act="winephotorm" aria-label="${esc(t.removePhoto)}">${ico('x')}</button></figure>`
        : `<button class="addphoto" data-act="winephoto">${ico('camera')}<span>${esc(t.snapLabel)}</span></button>`}</div>
      <textarea class="evtitle" id="wName" rows="1" placeholder="${esc(t.wineNamePh)}" aria-label="${esc(t.wineNamePh)}">${esc(w.name)}</textarea>
      <div class="seg wcols" role="radiogroup" aria-label="${esc(t.wineColor)}">${WCOLS.map(c => `<button type="button" role="radio" data-act="winecolor" data-c="${c}" aria-checked="${w.color === c}"><i class="wdot" style="--c:${WCOL_C[c]}"></i>${esc(t.wcol[c])}</button>`).join('')}</div>
      <div class="row2">
        <div class="field"><label for="wVintage">${esc(t.vintage)}</label><input class="input" id="wVintage" inputmode="numeric" maxlength="4" value="${esc(w.vintage || '')}"></div>
        <div class="field"><label for="wApp">${esc(t.appellation)}</label><input class="input" id="wApp" value="${esc(w.appellation || '')}"></div>
      </div>
      <div class="field"><label for="wProd">${esc(t.producer)}</label><input class="input" id="wProd" value="${esc(w.producer || '')}"></div>
      <div class="stars" role="group" aria-label="${esc(t.wineRating)}">${[1, 2, 3, 4, 5].map(i => `<button data-act="winerate" data-v="${i}" class="${(w.rating || 0) >= i ? 'on' : ''}" aria-label="${i}/5">${ico('star')}</button>`).join('')}</div>
      <div class="field"><label for="wNotes">${esc(t.wineNotes)}</label><textarea class="ruled hand-in" id="wNotes" rows="4">${esc(w.notes || '')}</textarea></div>
      <section class="panel"><h2>${ico('book')} ${esc(t.pairsWith)}</h2>
        <div class="wrapchips">${(w.pairs || []).map(byId).filter(Boolean).map(r => `<span class="chip pchip"><a href="#/r/${encodeURIComponent(r.id)}">${esc(r.title)}</a><button data-act="wineunpair" data-id="${r.id}" aria-label="${esc(t.del)}">${ico('x')}</button></span>`).join('')}
          <button class="chip" data-act="winepair">${ico('plus')}${esc(t.aRecipe)}</button></div></section>
      ${evs.length ? `<section><h2 class="eyebrow list-h">${esc(t.drunkAt)}</h2><div class="evlist">${evs.map(evCardHTML).join('')}</div></section>` : ''}
    </div>`;
  const ta = $('#wName'); const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }; fit(); ta.addEventListener('input', fit);
}
function rerenderWine() { const y = window.scrollY; renderWine(curWine.id); window.scrollTo(0, y); }
function readWine() {
  const w = curWine; if (!w || !$('#winePage')) return;
  w.name = $('#wName').value.trim().slice(0, 120); w.vintage = $('#wVintage').value.replace(/\D/g, '').slice(0, 4);
  w.appellation = $('#wApp').value.trim().slice(0, 80); w.producer = $('#wProd').value.trim().slice(0, 80); w.notes = $('#wNotes').value.slice(0, 3000);
}
function flushWine() { if (wSaveT) { clearTimeout(wSaveT); wSaveT = null; readWine(); if (curWine) psPut('wines', curWine); } }
document.addEventListener('input', e => { if (!e.target.closest('#winePage')) return; clearTimeout(wSaveT); wSaveT = setTimeout(() => { wSaveT = null; readWine(); if (curWine) psPut('wines', curWine); }, 500); });
// Choose wines from the cave (for an evening or a recipe), or start a new one.
function pickWines({ title, exclude = [] }) {
  const t = T(), pool = winesSorted().filter(w => !exclude.includes(w.id)), sel = new Set();
  return new Promise(res => {
    let done = false;
    sheet(`<h2>${esc(title)}</h2><div class="picklist" id="pwList">${pool.map(w => `<button class="pickrow" data-id="${w.id}" aria-pressed="false">${wineThumb(w)}<span class="min"><b>${esc(wineLabel(w))}</b><small>${esc([w.color && t.wcol[w.color], w.appellation].filter(Boolean).join(' · '))}</small></span><span class="tick">${ico('check')}</span></button>`).join('') || `<p class="muted" style="margin:0">${esc(t.winesEmptyT)}</p>`}</div>
      <div class="btnrow"><button class="btn" data-x="new">${ico('camera')}${esc(t.newWine)}</button>${pool.length ? `<button class="btn primary" data-x="ok">${esc(t.pickDone(0))}</button>` : ''}</div>`, (el, cl) => {
      el.addEventListener('click', e => {
        const row = e.target.closest('.pickrow');
        if (row) { const id = row.dataset.id; sel.has(id) ? sel.delete(id) : sel.add(id); row.classList.toggle('on', sel.has(id)); row.setAttribute('aria-pressed', sel.has(id)); const ok = el.querySelector('[data-x="ok"]'); if (ok) ok.textContent = t.pickDone(sel.size); return; }
        const x = e.target.closest('[data-x]')?.dataset.x;
        if (x === 'ok') { done = true; cl(); res({ ids: [...sel] }); }
        if (x === 'new') { done = true; cl(); res({ ids: [...sel], create: true }); }
      });
    });
    const obs = new MutationObserver(() => { if (!done && !$('#pwList')) { obs.disconnect(); res(null); } else if (done) obs.disconnect(); });
    obs.observe(document.body, { childList: true });
  });
}
function winesRowHTML(ids) {
  return ids.map(id => PS.wines.get(id)).filter(Boolean).map(w => `<a class="chip person" href="#/vin/${encodeURIComponent(w.id)}"><i class="wdot" style="--c:${WCOL_C[w.color] || '#7A1F2B'}"></i>${esc(wineLabel(w))}</a>`).join('');
}
// Wines poured for these guests before (from the evenings they came to).
function winesServedTo(gid) {
  const out = new Map();
  for (const e of eventsSorted()) if (e.guests.includes(gid)) for (const wid of e.wines || []) {
    const w = PS.wines.get(wid); if (!w) continue;
    const o = out.get(wid) || { w, count: 0, last: 0 }; o.count++; o.last = Math.max(o.last, evTime(e)); out.set(wid, o);
  }
  return [...out.values()].sort((a, b) => b.last - a.last);
}
