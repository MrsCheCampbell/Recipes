'use strict';
// Our Kitchen: Taps and starting the app.
// The scripts share one scope and load in order (see index.html).

// ---------- Global click handling ----------
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, t = T();
  if (fbWait()) await fbWait();
  const rid = $('#view').dataset.id, r = rid ? byId(rid) : null;
  switch (act) {
    case 'new': go('#/edit/new'); break;
    case 'fab': fabSheet(); break;
    case 'photopost': cookSheet(null); break;
    case 'cookpick': cookPick(); break;
    case 'cookthis': { const x = byId(b.dataset.id); if (x) cookSheet(x); break; }
    case 'viewcook': cookViewer(b.dataset.id); break;
    case 'likecook': heartCook(b.dataset.id); famChanged(); break;
    case 'ctab': if (b.dataset.v === 'fav') go('#/fav'); else { S.carnetTab = b.dataset.v; saveSettings(); if (current === 'carnets') route(); else go('#/carnets'); } break;
    case 'newwine': { const w = newWine(); go('#/vin/' + w.id); break; }
    case 'wcol': L.wcol = b.dataset.c; route(); break;
    case 'winecolor': if (curWine) { readWine(); curWine.color = curWine.color === b.dataset.c ? '' : b.dataset.c; psPut('wines', curWine); rerenderWine(); } break;
    case 'winerate': if (curWine) { readWine(); const v = +b.dataset.v; curWine.rating = curWine.rating === v ? 0 : v; psPut('wines', curWine); rerenderWine(); } break;
    case 'winephoto': if (curWine) { const w = curWine; const [f] = await pickFile(); if (!f) break; try { readWine(); w.photo = await compress(f, 900, 0.76); w.thumb = await compress(f, 320, 0.72); psPut('wines', w); if (curWine === w && current === 'vin') rerenderWine(); } catch { toast('Photo ?'); } break; }
    case 'winephotorm': if (curWine) { readWine(); delete curWine.photo; delete curWine.thumb; psPut('wines', curWine); rerenderWine(); } break;
    case 'wineview': if (curWine?.photo) viewImage(curWine.photo); break;
    case 'winedel': if (curWine && await confirmBox(t.delWineQ(wineLabel(curWine)), t.del)) { clearTimeout(wSaveT); wSaveT = null; const id = curWine.id; psDel('wines', id); for (const e of PS.events.values()) if ((e.wines || []).includes(id)) { e.wines = e.wines.filter(x => x !== id); psPut('events', e); } curWine = null; go('#/carnets'); } break;
    case 'winepair': if (curWine) { const w = curWine; readWine(); const got = await pickRecipes({ title: t.pairsWith, multi: true, exclude: w.pairs || [] }); if (got && got.length) { w.pairs = [...new Set([...(w.pairs || []), ...got.map(x => x.id)])]; psPut('wines', w); if (curWine === w && current === 'vin') rerenderWine(); } } break;
    case 'wineunpair': if (curWine) { readWine(); curWine.pairs = (curWine.pairs || []).filter(x => x !== b.dataset.id); psPut('wines', curWine); rerenderWine(); } break;
    case 'evwines': if (curEv) { const ev = curEv; readEvent(); psPut('events', ev); const got = await pickWines({ title: t.pickWinesT, exclude: ev.wines || [] }); if (!got) break;
      ev.wines = [...new Set([...(ev.wines || []), ...got.ids])];
      if (got.create) { const w = newWine(); ev.wines.push(w.id); psPut('events', ev); go('#/vin/' + w.id); break; }
      psPut('events', ev); if (curEv === ev && current === 'carnet') rerenderEvent(); break; }
    case 'newevent': { const e = newEvent(); go('#/carnet/' + e.id); break; }
    case 'newguest': { const g = { id: uid(), name: '', notes: '', createdAt: Date.now() }; psPut('guests', g); go('#/invites/' + g.id); break; }
    case 'planwith': { const g = PS.guests.get(b.dataset.id); if (!g) break; flushGuest(); const e = newEvent({ guests: [g.id] }); go('#/carnet/' + e.id); break; }
    case 'guestdel': { const g = PS.guests.get(b.dataset.id); if (!g || !(await confirmBox(t.delGuestQ(g.name || t.unnamedGuests), t.del))) break;
      gSaveT && clearTimeout(gSaveT); gSaveT = null; psDel('guests', g.id); for (const e of PS.events.values()) if (e.guests.includes(g.id)) { e.guests = e.guests.filter(x => x !== g.id); psPut('events', e); } go('#/carnets'); break; }
    case 'evguests': if (curEv) guestPicker(curEv); break;
    case 'evaddserved': if (curEv) { readEvent(); const x = b.dataset.rid && byId(b.dataset.rid); curEv.items.push(x ? newItem(x) : { ...newItem(null), title: b.dataset.title }); psPut('events', curEv); rerenderEvent(); } break;
    case 'evmade': if (curEv) { readEvent(); const it = curEv.items[+b.dataset.i]; if (it) { it.made = !it.made; if (!it.made) it.verdict = ''; } psPut('events', curEv); rerenderEvent(); } break;
    case 'evverdict': if (curEv) { readEvent(); const it = curEv.items[+b.dataset.i]; if (it) it.verdict = it.verdict === b.dataset.v ? '' : b.dataset.v; psPut('events', curEv); rerenderEvent(); } break;
    case 'evrm': if (curEv) { readEvent(); curEv.items.splice(+b.dataset.i, 1); psPut('events', curEv); rerenderEvent(); } break;
    case 'evaddrecipes': if (curEv) { const ev = curEv; const got = await pickRecipes({ title: t.addRecipes, multi: true, exclude: ev.items.map(i => i.rid).filter(Boolean) }); if (got && got.length) { readEvent(); ev.items.push(...got.map(x => newItem(x))); psPut('events', ev); if (curEv === ev && current === 'carnet') rerenderEvent(); } } break;
    case 'evcook': if (curEv) { readEvent(); psPut('events', curEv); const ev = curEv; const got = await pickRecipes({ title: t.pickRecipeT }); if (got && got[0]) { cookSheet(got[0]); setTimeout(() => { const s = $('#ckEv'); if (s) s.value = ev.id; }, 0); } } break;
    case 'evreuse': if (curEv) { const from = PS.events.get(b.dataset.from); if (!from) break; readEvent(); const have = new Set(curEv.items.map(itemKey)); let n = 0;
      for (const i of from.items) if (!have.has(itemKey(i))) { curEv.items.push({ ...newItem(null), rid: i.rid, title: i.title || itemTitle(i) }); n++; }
      psPut('events', curEv); rerenderEvent(); toast(t.reusedN(n)); } break;
    case 'evphoto': if (curEv) { const ev = curEv; const fs = await pickFile('image/*', true); if (!fs.length) break; readEvent();
      for (const f of fs) { if ((ev.photos || []).length >= 6) break; try { ev.photos = [...(ev.photos || []), await compress(f, 800, 0.7)]; } catch {} }
      psPut('events', ev); if (curEv === ev && current === 'carnet') rerenderEvent(); } break;
    case 'evphotorm': if (curEv) { readEvent(); curEv.photos.splice(+b.dataset.i, 1); psPut('events', curEv); rerenderEvent(); } break;
    case 'evview': if (curEv) viewImage(curEv.photos[+b.dataset.i]); break;
    case 'evdel': if (curEv && await confirmBox(t.delEventQ(evLabel(curEv)), t.del)) { clearTimeout(evSaveT); evSaveT = null; psDel('events', curEv.id); curEv = null; go('#/carnets'); } break;
    case 'back': if (history.length > 1) history.back(); else go('#/'); break;
    case 'clearq': L.q = ''; $('#q').value = ''; renderResults(); $('#q').focus(); break;
    case 'voice': voiceSearch(); break;
    case 'all': Object.assign(L, { kash: '', fav: current === 'fav', cat: '', hol: '', mood: '', quick: false, who: '' }); refreshList(); break;
    case 'who': L.who = L.who === b.dataset.id ? '' : b.dataset.id; refreshList(); break;
    case 'viewphoto': if (r?.photo) viewImage(r.photo); break;
    case 'unfilter': { const f = b.dataset.f; L[f] = ['fav', 'quick'].includes(f) ? false : ''; refreshList(); break; }
    case 'fav': if (current === 'recipe' && r) { r.favorite = !r.favorite; await saveRecipe(r); renderRecipe(r); } else { L.fav = !L.fav; refreshList(); } break;
    case 'cat': L.cat = L.cat === b.dataset.c ? '' : b.dataset.c; refreshList(); break;
    case 'filters': openFilters(); break;
    case 'reset': Object.assign(L, { q: '', kash: '', cat: '', hol: '', mood: '', quick: false, who: '', fav: current === 'fav' }); $('#q').value = ''; refreshList(); break;
    case 'moodfilter': Object.assign(L, { mood: b.dataset.m, hol: '', q: '', kash: '', cat: '' }); $('#q').value = ''; refreshList(); $('#results').scrollIntoView({ behavior: 'smooth' }); break;
    case 'moodoff': L.mood = ''; refreshList(); break;
    case 'holfilter': Object.assign(L, { hol: b.dataset.h, mood: '', q: '', kash: '', cat: '' }); $('#q').value = ''; refreshList(); $('#results').scrollIntoView({ behavior: 'smooth' }); break;
    case 'samples': for (const s of samples()) if (!byId(s.id)) await saveRecipe(s); toast(t.samplesAdded); route(); break;
    case 'rmsamples': for (const s of recipes.filter(x => x.sample)) { if (FAM.on) await cloudDelete(s); else await DB.del(s.id); } recipes = recipes.filter(x => !x.sample); toast(t.samplesRemoved); route(); break;
    case 'menu': if (r) recipeMenu(r); break;
    case 'rate': if (r) { const v = +b.dataset.v; r.rating = r.rating === v ? 0 : v; await saveRecipe(r); $$('.stars button').forEach(x => x.classList.toggle('on', +x.dataset.v <= r.rating)); } break;
    case 'scale': if (r) { const base = +r.servings || 0; const cur = scale[r.id] ?? (base || 1); const step = base ? 1 : 0.5; scale[r.id] = Math.max(step, cur + (+b.dataset.d) * step); const y = window.scrollY; renderRecipe(r); window.scrollTo(0, y); } break;
    case 'toshop': if (r) {
      const base = +r.servings || 0, cur = scale[r.id] ?? (base || 1), f = base ? cur / base : cur; let n = 0;
      for (const l of lines(r.ingredients)) { if (isHeading(l)) continue; const { q, rest } = ingLine(l, f); shop.push({ id: uid(), text: (q ? q + ' ' : '') + rest.trim(), done: false, recipe: r.title }); n++; }
      saveShop(); toast(t.addedToShop(n)); } break;
    case 'share': if (r) shareText(r.title, recipeText(r)); break;
    case 'units': if (r) { S.units = b.dataset.u; saveSettings(); const y = window.scrollY; renderRecipe(r); window.scrollTo(0, y); } break;
    case 'send': if (r) sendRecipe(r); break;
    case 'like': toggleHeart(b.dataset.id); break;
    case 'recommend': if (r) recommendSheet(r); break;
    case 'recodone': quiet(FB.updateDoc(fref('recos', b.dataset.id), { done: true })); FAM.recos = FAM.recos.filter(x => x.id !== b.dataset.id); route(); break;
    case 'recokeep': { const x = FAM.recos.find(y => y.id === b.dataset.id); if (x) { quiet(FB.updateDoc(fref('recos', x.id), { done: true })); FAM.recos = FAM.recos.filter(y => y.id !== x.id); go('#/r/' + x.rid); } break; }
    case 'postcomment': if (r) postComment(r.id); break;
    case 'delcomment': quiet(FB.deleteDoc(fref('recipes', rid, 'comments', b.dataset.c))); quiet(FB.updateDoc(fref('recipes', rid), { commentCount: FB.increment(-1) })); break;
    case 'famcreate': famCreate(); break;
    case 'famjoin': famJoin(); break;
    case 'famjoinpaste': { const m = ($('#joinIn').value.match(/#\/join\/([A-Za-z0-9_-]+)/) || [])[1]; if (m) go('#/join/' + m); else toast(t.famJoinBad); break; }
    case 'faminvite': { const url = famInviteLink(), text = t.inviteText(FAM.name || t.family);
      // The link goes in "url" too: without it Safari shares the plain address of the app instead.
      if (navigator.share) { try { await navigator.share({ title: FAM.name, text, url }); break; } catch (e) { if (e.name === 'AbortError') break; } }
      try { await navigator.clipboard.writeText(text + '\n\n' + url); } catch {} toast(t.copied); break; }
    case 'famrename': famRename(); break;
    case 'fbsend': sendFeedback(); break;
    case 'fbdone': if (FAM.createdBy === FAM.uid) { try { await FB.deleteDoc(fref('feedback', b.dataset.id)); } catch (e) { console.warn(e); } loadFeedback(); } break;
    case 'invcopy': try { await navigator.clipboard.writeText(famInviteLink()); toast(t.linkCopied); } catch { $('#invLink').select(); } break;
    case 'invcopyhere': try { await navigator.clipboard.writeText(location.href); toast(t.linkCopied); } catch {} break;
    case 'joinclip': { let v = ''; try { v = await navigator.clipboard.readText(); } catch {} const m = (v.match(/#\/join\/([A-Za-z0-9_-]+)/) || [])[1];
      if (m) go('#/join/' + m); else { toast(t.famJoinBad); $('#joinIn').focus(); } break; }
    case 'famprofile': { const st = renderFamily.st, name = $('#meNameIn').value.trim(); if (!name) break; S.name = name; saveSettings(); quiet(FB.updateDoc(fref('members', FAM.uid), { name, avatar: st.avatar, color: st.color })); FAM.members[FAM.uid] = { ...member(FAM.uid), name, avatar: st.avatar, color: st.color }; toast(t.saved); renderFamily(); break; }
    case 'feedtoggle': S.feedOff = !b.checked; saveSettings(); break;
    case 'mute': { const set = new Set(S.muted || []); if (b.checked) set.delete(b.dataset.id); else set.add(b.dataset.id); S.muted = [...set]; saveSettings(); break; }
    case 'famleave': famLeave(); break;
    case 'pantryrm': pantry.splice(+b.dataset.i, 1); savePantry(); renderFridge(); break;
    case 'pantryclear': pantry = []; savePantry(); renderFridge(); break;
    case 'pantryquick': addPantry(b.dataset.q); break;
    case 'askclaude': askClaude(); break;
    case 'saveidea': { const x = ls.get('claudeLast', {}).newIdeas?.[+b.dataset.i]; if (x) { pendingShare = { url: x.url, text: '', title: x.title }; go('#/edit/new'); } break; }
    case 'claudekeysave': { const v = $('#claudeKeyIn').value.trim(); if (!v) break; ls.set('claudeKey', v);
      if (FAM.on && $('#claudeShareIn')?.checked) shareClaudeKey(v);
      toast(t.claudeKeySaved); renderMore(); break; }
    case 'claudeshare': shareClaudeKey(ls.get('claudeKey', '')); renderMore(); break;
    case 'claudeunshare': unshareClaudeKey(); renderMore(); break;
    case 'autotag': formAutoTag(false); break;
    case 'tagall': b.disabled = true; await claudeTagAll(); b.disabled = false; break;
    case 'claudekeyrm': if (FAM.on && ls.get('famClaudeKey', '') === ls.get('claudeKey', '')) unshareClaudeKey(); ls.del('claudeKey'); renderMore(); break;
    case 'home': go('#/'); break;
    case 'keep': keepLetter(b.dataset.id); break;
    case 'toss': inbox = inbox.filter(y => y.id !== b.dataset.id); saveInbox(); toast(t.tossed); renderInbox(false); break;
    case 'copyforapp': { const url = location.origin + location.pathname + '#/recu/' + iosLandingCode; try { await navigator.clipboard.writeText(url); } catch {} toast(t.copied); break; }
    case 'pastecode': {
      let txt = ''; try { txt = await navigator.clipboard.readText(); } catch {}
      const code = codeFromText(txt);
      if (code) { const ok = await receiveCode(code); if (ok === true) { toast(t.gotOne); renderInbox(false); } break; }
      $('#pasteBox').hidden = false; $('#pasteIn').focus(); break; }
    case 'pastego': { const code = codeFromText($('#pasteIn').value); if (!code) { toast(t.pasteBad); break; } const ok = await receiveCode(code); if (ok === true) { toast(t.gotOne); renderInbox(false); } break; }
    case 'cooked': if (r) cookSheet(r); break;
    case 'cook': if (r) go('#/cook/' + r.id); break;
    case 'cookclose': history.back(); break;
    case 'cookprev': cookMove(-1); break;
    case 'cooknext': cookMove(1); break;
    case 'cooking': if (cookState) { const rr = cookState.r; sheet(`<h2>${esc(t.ingredients)}</h2><ul class="ing">${lines(rr.ingredients).map(l => isHeading(l) ? `<li class="sub">${esc(cleanHeading(l))}</li>` : `<li><label><input type="checkbox"><span>${esc(l)}</span></label></li>`).join('')}</ul>`); } break;
    case 'timer': askTimer(+b.dataset.min, b.dataset.label); break;
    case 'tstop': timers = timers.filter(x => x.id !== b.dataset.id); ls.set('timers', timers); drawTimers(); break;
    case 'save': submitForm(); break;
    case 'pickphoto': $('#photoInput').click(); break;
    case 'book': $('#bookInput').click(); break;
    case 'rmpage': formPages.splice(+b.dataset.i, 1); drawFormPages(); $('#form').dispatchEvent(new Event('input')); break;
    case 'viewpage': { const src = current === 'edit' ? formPages[+b.dataset.i] : r?.pages?.[+b.dataset.i]; if (src) viewImage(src); break; }
    case 'rmphoto': formPhoto = null; $('#fPhotoUrl').value = ''; drawPhotoBox(); break;
    case 'smartfill': smartFill(b); break;
    case 'draftyes': { const d = ls.get('draft'); if (d) fillForm(d.data); b.closest('.draft-note').remove(); break; }
    case 'draftno': ls.del('draft'); b.closest('.draft-note').remove(); break;
    case 'shoptoggle': { const it = shop.find(x => x.id === b.dataset.id); if (it) { it.done = b.checked; saveShop(); b.closest('.shop-item').classList.toggle('done', it.done); } break; }
    case 'shopdel': shop = shop.filter(x => x.id !== b.dataset.id); saveShop(); renderShop(); break;
    case 'shopclear': shop = shop.filter(x => !x.done); saveShop(); renderShop(); break;
    case 'shopall': if (await confirmBox(t.clearAllQ, t.clearAll)) { shop = []; saveShop(); renderShop(); } break;
    case 'shopshare': shareText(t.shopTitle, t.shopTitle + '\n\n' + shop.filter(x => !x.done).map(x => '– ' + x.text).join('\n')); break;
    case 'install': if (installEvt) { installEvt.prompt(); installEvt = null; } break;
    case 'gps': navigator.geolocation?.getCurrentPosition(p => { S.gps = [p.coords.latitude, p.coords.longitude]; S.city = 'gps'; saveSettings(); renderMore(); }, () => toast(t.gpsFail), { timeout: 15000 }); break;
    case 'backup': exportBackup(false); break;
    case 'backupshare': exportBackup(true); break;
    case 'iosok': ls.set('iosNudgeDone', true); b.closest('.banner').remove(); break;
    case 'snooze': ls.set('nudgeSnooze', Date.now() + 14 * 864e5); b.closest('.banner').remove(); break;
    case 'restore': $('#backupInput').click(); break;
    case 'addocc': addOccasion(key => {
      if (current === 'edit') { $('[data-act="addocc"]').insertAdjacentHTML('beforebegin', occChip(key, [key])); $('#form').dispatchEvent(new Event('input')); }
      else renderMore();
    }); break;
    case 'delocc': { const c = customOcc().find(x => x.key === b.dataset.k); if (!c || !(await confirmBox(t.occDelQ(c.label), t.del))) break;
      S.customOcc = customOcc().filter(x => x.key !== c.key); saveSettings();
      for (const r2 of recipes.filter(x => (x.holidays || []).includes(c.key))) { r2.holidays = r2.holidays.filter(h => h !== c.key); await saveRecipe(r2); }
      if (L.hol === c.key) L.hol = ''; renderMore(); break; }
    case 'erase': if (await confirmBox(t.eraseQ, t.eraseAll)) { await DB.clear(); recipes = []; toast(t.erased); renderMore(); } break;
  }
});
document.addEventListener('change', e => { if (e.target.name === 'aud') { const w = $('#fAudWho'); if (w) w.hidden = e.target.value !== 'some'; } });
document.addEventListener('click', e => {
  const pc = e.target.closest('#fAudWho .chip'); if (pc) { pc.classList.toggle('on'); return; }
  if (e.target.closest('[data-scroll="comments"]')) window._scrollTo = 'comments';
  if (e.target.closest('[data-goto="claude"]')) { try { sessionStorage.setItem('abe:goto', 'claude'); } catch {} }
  // Tap a converted quantity to peek at the original wording.
  const cv = e.target.closest('b.conv');
  if (cv) { e.preventDefault(); const o = cv.dataset.orig; cv.dataset.orig = cv.textContent; cv.textContent = o; return; }
  const c = e.target.closest('.occ-chips .chip[data-h]'); if (!c) return;
  c.classList.toggle('on'); c.classList.remove('just'); c.setAttribute('aria-pressed', c.classList.contains('on'));
  $('#form').dispatchEvent(new Event('input'));
});
document.addEventListener('input', e => {
  if (e.target.id === 'q') { L.q = e.target.value; renderResults(); }
});
document.addEventListener('change', e => {
  const od = e.target.dataset?.occdate;
  if (od) {
    const mmdd = (e.target.value || '').slice(5);
    S.customOcc = customOcc().map(c => c.key === od ? { ...c, date: mmdd } : c);
    saveSettings(); toast(T().saved);
  }
  if (e.target.id === 'sort') { L.sort = e.target.value; renderResults(); }
});
document.addEventListener('keydown', e => {
  if (!cookState) return;
  if (e.key === 'ArrowRight') cookMove(1); if (e.key === 'ArrowLeft') cookMove(-1);
});
$('#bookInput').addEventListener('change', e => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) readBookPages(fs); });
$('#photoInput').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { formPhoto = await compress(f, 1400); $('#fPhotoUrl').value = ''; drawPhotoBox(); $('#form').dispatchEvent(new Event('input')); } catch { toast('Photo ?'); }
});
$('#backupInput').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) importBackup(f); });

// ---------- Passcode lock ----------
// No passcode any more: clear one left from an older version.
ls.del('lock');

// ---------- Start ----------
// A new version was downloaded in the background: offer it now (it also applies by itself next time).
let updateOffered = false;
navigator.serviceWorker?.addEventListener('message', e => {
  if (e.data !== 'update-ready' || updateOffered) return;
  updateOffered = true; toast(T().updateReady, { label: T().reload, fn: () => location.reload() });
});
// The challah and honey cake examples were taken out; remove them from phones that already added them.
async function dropOldSamples() {
  const old = recipes.filter(r => r.sample && ['sample-1', 'sample-5'].includes(r.id));
  for (const r of old) { if (FAM.on) await cloudDelete(r); else await DB.del(r.id).catch(() => {}); }
  if (old.length && !FAM.on) { recipes = recipes.filter(r => !old.includes(r)); if (current === 'list') route(); }
}
(async function start() {
  applyLook();
  readShareParams();
  const ok = await DB.open();
  const inFamily = !!(FAM.cfg && FAM.fid);
  await psLoadLocal();
  // In a family, the shared space is the source of truth: open with the copy saved on the phone, Firebase follows.
  const cached = inFamily && await loadFamCache();
  if (!inFamily) {
    try { recipes = await DB.all(); } catch { recipes = []; }
    for (const r of recipes) if (migrate(r)) DB.put(r).catch(() => {});
    recipes.forEach(indexRecipe);
  }
  if (!ok) setTimeout(() => toast(T().offlineSave), 800);
  famBoot = inFamily ? famStart().catch(e => { console.warn(e); return false; }) : null;
  if (famBoot && !cached) await Promise.race([famBoot, new Promise(r => setTimeout(r, 4000))]);
  route();
  drawTimers();
  refreshWeather();
  Promise.resolve(famBoot).then(dropOldSamples).then(() => tagSweep()).then(() => { if (current === 'list') renderResults(); }).catch(e => console.warn(e));
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
