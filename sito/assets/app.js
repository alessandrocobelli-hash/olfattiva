/* Olfattiva · app: router, azioni, moduli, avvio */
(function () {
  'use strict';
  var OLF = window.OLF, E = OLF.engine, V = OLF.views, UI = OLF.ui, A = OLF.actions, F = OLF.forms, CH = {};
  var root = document.getElementById('app');
  var TITLES = { oggi: 'Oggi', guardaroba: 'Guardaroba', gusto: 'Gusto', affinita: 'Affinità', sommelier: 'Sommelier', note: 'Note', catalogo: 'Catalogo', profumo: 'Scheda', molecole: 'Molecole', maison: 'Maison', profumerie: 'Profumerie', quaderni: 'Quaderni', atlante: 'Atlante', banco: 'Modalità banco', palestra: 'Palestra del naso', layering: 'Layering', impostazioni: 'Impostazioni' };

  function parse() { var p = (location.hash || '#/oggi').replace(/^#\/?/, '').split('/'); return { route: p[0] || 'oggi', param: p[1] ? decodeURIComponent(p.slice(1).join('/')) : null }; }
  function render(keepId) {
    var r = parse(); if (!V[r.route] || r.route === 'login' || r.route === 'shell') r = { route: 'oggi', param: null };
    var pos = null, el = keepId && document.getElementById(keepId); if (el && el.selectionStart != null) pos = el.selectionStart;
    var html; try { html = V[r.route](r.param); } catch (e) { console.error(e); html = '<div class="empty">Qualcosa non ha funzionato in questa pagina: ' + OLF.esc(e.message) + '. <a class="link acc" href="#/oggi">Torna a Oggi</a></div>'; }
    root.innerHTML = V.shell(r.route, html);
    document.title = (TITLES[r.route] || 'Olfattiva') + ' · Olfattiva';
    if (keepId) { el = document.getElementById(keepId); if (el) { el.focus(); if (pos != null && el.setSelectionRange) { try { el.setSelectionRange(pos, pos); } catch (e) { } } } }
    if (r.route === 'sommelier') { var c = document.getElementById('chat'); if (c) c.scrollTop = c.scrollHeight; }
  }
  OLF.render = render;
  function save() { OLF.store.save(); }
  function applyOverrides() { var o = OLF.user.lon || {}; Object.keys(o).forEach(function (id) { var p = E.byId(id); if (p) p.lon = o[id]; }); }
  function notesFrom(s) { return String(s || '').split(/[,;\n]/).map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean); }
  function newItem(pid, status) { return { pid: pid, status: status, acq: null, until: null, level: status === 'present' ? 100 : null, rating: null, seasons: [], occ: [], note: '', gift: '', uncertain: false, wears: [] }; }

  /* ---------- azioni */
  A.dismissWelcome = function () { OLF.user.welcome = false; save(); render(); };
  A.wearToday = function (el) { var w = E.item(el.dataset.pid); if (!w) return; var t = OLF.today(); if (w.wears.indexOf(t) < 0) w.wears.push(t); if (w.status !== 'present') w.status = 'present'; save(); OLF.toast('Segnato nel diario di oggi'); render(); };
  A.skipToday = function (el) { UI.skip.push(el.dataset.pid); if (UI.skip.length >= E.items('present').length) UI.skip = []; render(); };
  A.tab = function (el) { UI.tab = el.dataset.tab; render(); };
  A.addItem = function (el) {
    var pid = el.dataset.pid, st = el.dataset.status; if (E.item(pid)) { OLF.toast('È già nel guardaroba'); return; }
    OLF.user.wardrobe.push(newItem(pid, st)); save(); OLF.toast({ present: 'Aggiunto al presente', past: 'Aggiunto al passato', future: 'Aggiunto ai desideri' }[st]);
    if (el.dataset.stay) render(); else { UI.tab = st; location.hash = '#/guardaroba/' + pid; }
  };
  A.removeItem = function (el) { if (!confirm('Togliere questo profumo dal guardaroba?')) return; OLF.user.wardrobe = OLF.user.wardrobe.filter(function (w) { return w.pid !== el.dataset.pid; }); save(); OLF.toast('Tolto dal guardaroba'); location.hash = '#/guardaroba'; };
  A.deleteCustom = function (el) { if (!confirm('Eliminare la scheda creata da te?')) return; var pid = el.dataset.pid; OLF.user.custom = OLF.user.custom.filter(function (p) { return p.id !== pid; }); OLF.user.wardrobe = OLF.user.wardrobe.filter(function (w) { return w.pid !== pid; }); save(); location.hash = '#/catalogo'; };
  A.seed = function (el) { UI.seed = el.dataset.pid; if (parse().route === 'affinita') { if (parse().param) history.replaceState(null, '', '#/affinita'); render(); } else location.hash = '#/affinita'; };
  A.dir = function (el) { UI.dir = el.dataset.dir; render(); };
  A.area = function (el) { UI.area = el.dataset.area; UI.shopBrand = ''; render(); };
  A.clearChat = function () { OLF.user.chat = []; save(); render(); };
  A.ask = function (el) { ask(el.dataset.q); };
  A.exportAll = function () { OLF.store.exportAll(); OLF.toast('Copia scaricata'); };
  A.logout = function () { OLF.auth.logout(); };
  A.apiClear = function () { OLF.store.apiKey(''); OLF.toast('Claude scollegato'); render(); };
  A.apiTest = async function () { try { OLF.toast('Provo il collegamento…'); await OLF.claude('Rispondi solo: ok', [{ role: 'user', content: 'ok?' }], 16); OLF.toast('Collegamento riuscito'); } catch (e) { alert('Collegamento non riuscito: ' + e.message); } };
  A.geo = function () {
    if (!navigator.geolocation) { alert('Questo dispositivo non fornisce la posizione.'); return; }
    navigator.geolocation.getCurrentPosition(function (pos) { var p = OLF.user.prefs; p.weather = true; p.lat = +pos.coords.latitude.toFixed(3); p.lon = +pos.coords.longitude.toFixed(3); save(); OLF.toast('Meteo attivato'); OLF.weather().then(function (w) { UI.weather = w; render(); }); }, function () { alert('Posizione non concessa: il consiglio seguirà solo la stagione.'); });
  };
  A.geoOff = function () { OLF.user.prefs.weather = false; UI.weather = null; save(); render(); };
  A.closeSession = function () { var s = OLF.user.sessions.filter(function (x) { return !x.closed; })[0]; if (s) { s.closed = true; save(); OLF.toast('Sessione salvata nel diario'); } render(); };
  function openSession() { return OLF.user.sessions.filter(function (x) { return !x.closed; })[0]; }
  A.verdict = function (el) { var s = openSession(); s.strips[+el.dataset.i].verdict = el.dataset.v; save(); render(); };
  A.quickStrip = function (el) { var p = E.byId(el.dataset.pid), s = openSession(); s.strips.push({ pid: p.id, name: p.name, where: 'solo carta', t0: Date.now(), verdict: null, note: '' }); save(); render(); };
  A.quizPick = function (el) {
    var z = UI.quiz; if (z.picked) return; z.picked = el.dataset.o; var s = OLF.user.quiz, c = E.noteCat(z.right), ok = z.picked === z.right;
    s.played++; if (ok) s.right++; s.byCat[c] = s.byCat[c] || { n: 0, r: 0 }; s.byCat[c].n++; if (ok) s.byCat[c].r++; save(); render();
  };
  A.quizNext = function () { OLF.newQuiz(); render(); };

  /* ---------- campi che aggiornano la vista */
  var INPUTS = { addQuery: 'addq', noteQuery: 'nq', catQuery: 'cq', shopBrand: 'sb' };
  function onInput(el) { var k = el.dataset.input; if (k === 'catQuery') (UI.cat = UI.cat || { q: '', fam: '', lon: false, sort: 'fit' }).q = el.value; else UI[k] = el.value; render(INPUTS[k]); }
  CH.catFam = function (el) { UI.cat.fam = el.value; render(); };
  CH.catSort = function (el) { UI.cat.sort = el.value; render(); };
  CH.catLon = function (el) { UI.cat.lon = el.checked; render(); };
  CH.layA = function (el) { UI.layA = el.value; render(); };
  CH.layB = function (el) { UI.layB = el.value; render(); };
  CH.lonOverride = function (el) { var pid = el.dataset.pid, n = +el.value, p = E.byId(pid); OLF.user.lon = OLF.user.lon || {}; OLF.user.lon[pid] = n; if (p) p.lon = n; save(); OLF.toast('Persistenza aggiornata'); render(); };
  CH.stripNote = function (el) { var s = openSession(); if (s) { s.strips[+el.dataset.i].note = el.value; save(); } };
  CH.importAll = function (el) { var f = el.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { try { OLF.store.importAll(r.result); applyOverrides(); OLF.toast('Dati ripristinati'); render(); } catch (e) { alert('Ripristino non riuscito: ' + e.message); } }; r.readAsText(f); };

  /* ---------- moduli */
  F.login = async function (fd, form) {
    var btn = form.querySelector('button'); btn.disabled = true; btn.textContent = 'Apro l’archivio…';
    try { await OLF.auth.login(fd.get('pw'), !!fd.get('remember')); start(); }
    catch (e) { root.innerHTML = V.login(/Archivio/.test(e.message) ? 'Archivio dei contenuti non raggiungibile. Riprova con la rete attiva.' : 'Password non corretta.'); }
  };
  F.editItem = function (fd, form) {
    var w = E.item(form.dataset.pid), num = function (k) { var v = fd.get(k); return v === '' || v == null ? null : +v; };
    w.status = fd.get('status'); w.acq = num('acq'); w.until = num('until'); w.level = num('level'); w.rating = num('rating'); w.seasons = fd.getAll('seasons'); w.occ = fd.getAll('occ'); w.gift = fd.get('gift').trim(); w.note = fd.get('note').trim(); w.uncertain = false;
    save(); UI.tab = w.status; OLF.toast('Salvato'); location.hash = '#/guardaroba';
  };
  F.customPerfume = function (fd) {
    var name = fd.get('name').trim(), brand = fd.get('brand').trim(), id = 'u-' + OLF.slug(brand + '-' + name); if (E.byId(id)) { alert('Esiste già una scheda con questo nome.'); return; }
    var p = { id: id, custom: true, name: name, brand: brand, year: fd.get('year') ? +fd.get('year') : null, fam: fd.get('fam'), top: notesFrom(fd.get('top')), heart: notesFrom(fd.get('heart')), base: notesFrom(fd.get('base')), lon: +fd.get('lon'), nose: null, conc: null };
    OLF.user.custom.push(p); OLF.user.wardrobe.push(newItem(id, 'present')); save(); OLF.toast('Scheda creata'); location.hash = '#/guardaroba/' + id;
  };
  F.aiPerfume = async function (fd, form) {
    var btn = form.querySelector('button'); btn.disabled = true; btn.textContent = 'Claude sta compilando…';
    try {
      var known = Object.keys(OLF.DATA.noteCat).join(', ');
      var sys = 'Sei un archivista di profumeria. Restituisci SOLO un oggetto JSON valido, senza testo attorno e senza markdown, con i campi: name, brand, year (numero o null), nose (stringa o null), fam (una tra: ' + E.FAMS.join(', ') + '), conc (stringa o null), lon (persistenza da 1 a 5), top, heart, base (array di note in italiano minuscolo), cats (oggetto nota→categoria per le note NON comprese nell’elenco noto; categorie ammesse: ' + E.CATS.join(', ') + ' = ' + E.CATS.map(function (c) { return c + ' ' + OLF.DATA.cats[c]; }).join('; ') + '). Se non conosci il profumo con ragionevole certezza restituisci {"error":"sconosciuto"}. Quando possibile usa i nomi di nota di questo elenco noto: ' + known;
      var txt = await OLF.claude(sys, [{ role: 'user', content: 'Profumo: ' + fd.get('q') }], 900), o = JSON.parse(txt.replace(/```json|```/g, '').trim());
      if (o.error || !o.name) throw new Error('Claude non conosce questo profumo con sufficiente certezza: inseriscilo a mano.');
      var id = 'u-' + OLF.slug(o.brand + '-' + o.name); if (E.byId(id)) throw new Error('Esiste già una scheda con questo nome.');
      var cl = function (a) { return (Array.isArray(a) ? a : []).map(function (n) { return String(n).toLowerCase().trim(); }).filter(Boolean).slice(0, 10); };
      var p = { id: id, custom: true, ai: true, name: String(o.name), brand: String(o.brand || ''), year: +o.year || null, nose: o.nose || null, fam: E.FAMS.indexOf(o.fam) >= 0 ? o.fam : 'Legnosi', conc: o.conc || null, lon: Math.min(5, Math.max(1, +o.lon || 3)), top: cl(o.top), heart: cl(o.heart), base: cl(o.base) };
      Object.keys(o.cats || {}).forEach(function (n) { var k = n.toLowerCase().trim(); if (!OLF.DATA.noteCat[k] && E.CATS.indexOf(o.cats[n]) >= 0) OLF.user.noteCat[k] = o.cats[n]; });
      OLF.user.custom.push(p); save(); OLF.toast('Scheda pronta: controllala'); location.hash = '#/profumo/' + id;
    } catch (e) { alert(e.message); render(); }
  };
  function ask(q) {
    q = String(q || '').trim(); if (!q || UI.asking) return;
    var chat = OLF.user.chat; chat.push({ role: 'user', text: q });
    var done = function (ans, src) { ans.role = 'assistant'; ans.src = src; chat.push(ans); if (chat.length > 24) chat.splice(0, chat.length - 24); UI.asking = false; save(); if (parse().route === 'sommelier') render(); };
    if (!OLF.store.apiKey()) { done(OLF.sommelierLocal(q), 'local'); return; }
    UI.asking = true; render();
    var hist = chat.slice(-9).map(function (m) { return { role: m.role === 'user' ? 'user' : 'assistant', content: m.role === 'user' ? m.text : m.paras.join('\n\n') }; });
    while (hist.length && hist[0].role !== 'user') hist.shift();
    OLF.claude(OLF.sommelierContext(), hist, 1000).then(function (txt) {
      var m = txt.match(/SCHEDE:\s*(.*)\s*$/i), ids = m ? m[1].split(',').map(function (s) { return s.trim(); }).filter(function (id) { return E.byId(id); }) : [];
      var body = txt.replace(/SCHEDE:.*$/i, '').trim();
      done({ paras: body.split(/\n{2,}/).map(function (s) { return s.trim(); }).filter(Boolean), cards: ids.slice(0, 3).map(function (id) { return { pid: id, pct: Math.round(E.fit(E.byId(id)) * 100) || null, why: '' }; }) }, 'claude');
    }).catch(function (e) { var a = OLF.sommelierLocal(q); a.paras.unshift('Claude non ha risposto (' + e.message + '). Ti risponde il motore interno.'); done(a, 'local'); });
  }
  F.ask = function (fd) { ask(fd.get('q')); };
  F.startSession = function (fd) { OLF.user.sessions.push({ date: OLF.today(), shop: fd.get('shop').trim(), strips: [], closed: false }); save(); render(); };
  F.addStrip = function (fd) { var name = fd.get('name').trim(), p = E.all().filter(function (x) { return x.name.toLowerCase() === name.toLowerCase(); })[0]; openSession().strips.push({ pid: p ? p.id : null, name: p ? p.name : name, where: fd.get('where'), t0: Date.now(), verdict: null, note: '' }); save(); render(); };
  F.prefs = function (fd) { OLF.user.prefs.avoidLowLon = !!fd.get('avoid'); OLF.user.prefs.minLon = +fd.get('minLon'); save(); OLF.toast('Preferenze salvate'); render(); };
  F.apiKey = function (fd) { OLF.store.apiKey(fd.get('key').trim()); OLF.user.prefs.model = fd.get('model').trim() || 'claude-sonnet-5'; save(); OLF.toast('Salvato'); render(); };
  F.changePw = async function (fd, form) {
    var btn = form.querySelector('button'); btn.disabled = true; btn.textContent = 'Ricifro…';
    try { var sealed = await OLF.crypto.seal(OLF.DATA, fd.get('pw')); OLF.download('olfattiva.enc', JSON.stringify(sealed)); alert('File scaricato. Caricalo sull’hosting al posto di data/olfattiva.enc: da quel momento vale la nuova password. Fino ad allora resta valida quella attuale.'); }
    catch (e) { alert('Ricifratura non riuscita: ' + e.message); }
    render();
  };

  /* ---------- eventi */
  document.addEventListener('click', function (ev) { var el = ev.target.closest && ev.target.closest('[data-act]'); if (!el || el.disabled) return; var fn = A[el.dataset.act]; if (fn) { ev.preventDefault(); fn(el, ev); } });
  document.addEventListener('keydown', function (ev) { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches && ev.target.matches('g[data-act]')) { ev.preventDefault(); A[ev.target.dataset.act](ev.target, ev); } });
  document.addEventListener('submit', function (ev) { var f = ev.target.closest('form[data-form]'); if (!f) return; ev.preventDefault(); var fn = F[f.dataset.form]; if (fn) fn(new FormData(f), f); });
  document.addEventListener('input', function (ev) { if (ev.target.dataset && ev.target.dataset.input) onInput(ev.target); });
  document.addEventListener('change', function (ev) { var k = ev.target.dataset && ev.target.dataset.change; if (k && CH[k]) CH[k](ev.target); });
  window.addEventListener('hashchange', function () { if (OLF.DATA) { render(); window.scrollTo(0, 0); } });
  setInterval(function () { if (OLF.DATA && parse().route === 'banco' && !(document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))) render(); }, 30000);

  /* ---------- avvio */
  function start() {
    OLF.store.load(); applyOverrides();
    if (!location.hash || location.hash === '#') history.replaceState(null, '', '#/oggi');
    render();
    OLF.weather().then(function (w) { if (w) { UI.weather = w; if (parse().route === 'oggi') render(); } });
  }
  (async function boot() {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(function () { });
    var ok = false; try { ok = await OLF.auth.resume(); } catch (e) { ok = false; }
    if (ok) start(); else root.innerHTML = V.login();
  })();
})();
