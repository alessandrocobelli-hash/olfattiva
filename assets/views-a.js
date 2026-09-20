/* Olfattiva · viste A: componenti, accesso, Oggi, Guardaroba, Gusto */
(function () {
  'use strict';
  var OLF = window.OLF, E = OLF.engine, V = OLF.views, h = OLF.esc;
  var UI = OLF.ui = { tab: 'present', dir: 'none', seed: null, skip: [], weather: null, city: 'Milano' };

  /* ---------- componenti */
  var C = OLF.c = {};
  C.lon = function (n) { var s = '<span class="lon" role="img" title="Persistenza ' + (n || 3) + ' su 5" aria-label="Persistenza ' + (n || 3) + ' su 5">', i; for (i = 1; i <= 5; i++) s += '<i class="' + (i <= (n || 3) ? 'on' : '') + '"></i>'; return s + '</span>'; };
  C.bottle = function (p, level, wish) { return '<span class="bottle' + (wish ? ' wish' : '') + '" aria-hidden="true"><i></i><b><span style="height:' + (level == null ? 0 : level) + '%;background:' + (E.FAMCOL[p.fam] || '#7A5A3A') + '"></span></b></span>'; };
  C.meta = function (p) { return h(p.brand) + ', ' + h(p.year || 's.d.'); };
  C.st = function (pid) { var s = E.statusOf(pid); return s ? E.STLAB[s] : 'da scoprire'; };
  C.prow = function (p, right, sub) {
    return '<a href="#/profumo/' + h(p.id) + '"><span class="stack-sm"><span class="t">' + h(p.name) + '</span><span class="s">' + C.meta(p) + ' · ' + C.st(p.id) + '</span>' + (sub ? '<span class="x">' + sub + '</span>' : '') + '</span>' + (right || '') + '</a>';
  };
  C.head = function (eyebrow, title, lede, actions) {
    return '<header class="row between end" style="gap:32px;margin-bottom:32px"><div class="stack" style="gap:12px;max-width:820px"><div class="eyebrow">' + eyebrow + '</div><h1 class="h1">' + title + '</h1>' +
      (lede ? '<p class="lede">' + lede + '</p>' : '') + '</div>' + (actions ? '<div class="row">' + actions + '</div>' : '') + '</header>';
  };
  C.radar = function (polys, size) {
    size = size || 340; var R = size * 0.30, cx = size / 2, cy = size / 2, out = [], i, k;
    var ang = function (i) { return -Math.PI / 2 + i * 2 * Math.PI / 8; };
    var vmax = 0.05; polys.forEach(function (pl) { E.CATS.forEach(function (c) { vmax = Math.max(vmax, pl.v[c]); }); });
    out.push('<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" role="img" aria-label="Impronta olfattiva per categorie di note">');
    [1 / 3, 2 / 3, 1].forEach(function (k) { out.push('<polygon points="' + E.CATS.map(function (c, i) { return (cx + R * k * Math.cos(ang(i))).toFixed(1) + ',' + (cy + R * k * Math.sin(ang(i))).toFixed(1); }).join(' ') + '" style="fill:none;stroke:var(--line2);stroke-width:1"/>'); });
    E.CATS.forEach(function (c, i) {
      var a = ang(i), lx = cx + (R + 14) * Math.cos(a), ly = cy + (R + 14) * Math.sin(a), anchor = Math.abs(Math.cos(a)) < 0.3 ? 'middle' : (Math.cos(a) > 0 ? 'start' : 'end');
      out.push('<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + R * Math.cos(a)).toFixed(1) + '" y2="' + (cy + R * Math.sin(a)).toFixed(1) + '" style="stroke:var(--line2);stroke-width:1"/>');
      out.push('<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" style="font-size:11px;text-anchor:' + anchor + ';dominant-baseline:middle;fill:var(--ink2)">' + h(OLF.DATA.cats[c].split(',')[0].split(' e ')[0]) + '</text>');
    });
    polys.forEach(function (pl) { out.push('<polygon points="' + E.CATS.map(function (c, i) { var r = R * Math.min(1, pl.v[c] / vmax); return (cx + r * Math.cos(ang(i))).toFixed(1) + ',' + (cy + r * Math.sin(ang(i))).toFixed(1); }).join(' ') + '" style="fill:' + pl.color + ';fill-opacity:.2;stroke:' + pl.color + ';stroke-width:2"/>'); });
    return out.join('') + '</svg>';
  };
  C.pyramid = function (p) {
    var rows = [['top', 'Testa', 'primi 15 minuti', 52], ['heart', 'Cuore', 'da 15 minuti a 3–4 ore', 76], ['base', 'Fondo', 'oltre le 4 ore', 100]];
    var sig = Object.keys(E.weights(p)).filter(function (n) { return (p.base || []).indexOf(n) >= 0; })[0];
    return '<div class="pyr">' + rows.map(function (r) {
      return '<div class="pyr-row"><div class="pyr-lab stack-sm"><span class="eyebrow" style="color:var(--night-ink)">' + r[1] + '</span><span class="cap">' + r[2] + '</span></div><div class="pyr-box"><div class="pyr-in pyr-' + r[0] + '" style="width:' + r[3] + '%">' +
        ((p[r[0]] || []).map(function (n) { return '<a class="chip' + (n === sig && r[0] === 'base' ? ' sig' : '') + '" href="#/note/' + encodeURIComponent(n) + '">' + h(OLF.cap(n)) + '</a>'; }).join('') || '<span class="cap">non dichiarate</span>') + '</div></div></div>';
    }).join('') + '</div>';
  };

  /* ---------- accesso */
  V.login = function (err) {
    return '<main class="login"><form data-form="login" autocomplete="on"><div class="logo">Olfattiva</div><p class="cap" style="font-size:15px">L’atlante dei profumi da uomo di Rea. Entra con la tua password.</p>' +
      (OLF.crypto.available() ? '' : '<div class="error">Questo browser non permette la cifratura qui. Apri il sito in HTTPS.</div>') +
      (err ? '<div class="error" role="alert">' + h(err) + '</div>' : '') +
      '<div class="field"><label for="pw">Password</label><input class="input" id="pw" name="pw" type="password" autocomplete="current-password" required autofocus></div>' +
      '<label class="check"><input type="checkbox" name="remember" checked> Ricordami su questo dispositivo</label>' +
      '<button class="btn" type="submit">Entra</button><p class="cap">I contenuti restano cifrati finché non inserisci la password. Nessun dato esce dal dispositivo.</p></form></main>';
  };

  /* ---------- guscio */
  var NAV = [['oggi', 'Oggi'], ['guardaroba', 'Guardaroba'], ['gusto', 'Gusto'], ['affinita', 'Affinità'], ['sommelier', 'Sommelier'], null, ['note', 'Note'], ['catalogo', 'Catalogo'], ['molecole', 'Molecole'], ['maison', 'Maison'], ['profumerie', 'Profumerie'], ['quaderni', 'Quaderni']];
  var ALIAS = { profumo: 'catalogo', banco: 'atlante', palestra: 'atlante', layering: 'atlante', impostazioni: 'atlante' };
  var ICON = {
    oggi: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
    guardaroba: '<rect x="8" y="8" width="8" height="13"/><rect x="10" y="3" width="4" height="5"/>',
    affinita: '<circle cx="6" cy="7" r="2"/><circle cx="17" cy="6" r="2"/><circle cx="12" cy="17" r="2"/><path d="M8 7.5 15 6.5M7 9l4 6M16 8l-3 7"/>',
    sommelier: '<path d="M4 5h16v11H9l-5 4z"/>',
    atlante: '<circle cx="12" cy="12" r="9"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18M3 12h18"/>'
  };
  V.shell = function (route, inner) {
    var cur = ALIAS[route] || route;
    var links = NAV.map(function (n) { return n ? '<a href="#/' + n[0] + '" class="' + (cur === n[0] ? 'on' : '') + '">' + n[1] + '</a>' : '<span class="nav-sep"></span>'; }).join('');
    var menuLinks = NAV.map(function (n) { return n ? '<a href="#/' + n[0] + '" class="' + (cur === n[0] ? 'on' : '') + '">' + n[1] + '</a>' : '<span class="menu-sep"></span>'; }).join('');
    var tabs = [['oggi', 'Oggi'], ['guardaroba', 'Guardaroba'], ['affinita', 'Affinità'], ['sommelier', 'Sommelier'], ['atlante', 'Atlante']];
    var atl = ['note', 'catalogo', 'molecole', 'maison', 'profumerie', 'quaderni', 'atlante', 'gusto'];
    var menuOpen = !!UI.menuOpen;
    return '<div class="shell"><nav class="nav" aria-label="Principale"><button class="menu-btn" data-act="toggleMenu" aria-label="Apri il menu" aria-expanded="' + menuOpen + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button><a class="logo" href="#/oggi">Olfattiva</a><div class="nav-links">' + links + '</div>' +
      '<a class="nav-user" href="#/impostazioni" aria-label="Impostazioni di Rea"><span class="avatar">AG</span>Rea</a></nav>' +
      '<button class="totop" id="toTop" type="button" aria-label="Torna in cima alla pagina" data-act="toTop">↑</button>' +
      '<div class="mobile-menu' + (menuOpen ? ' open' : '') + '" id="mobileMenu"><div class="mobile-menu-links">' + menuLinks + '<a href="#/impostazioni" class="' + (cur === 'impostazioni' ? 'on' : '') + '">Impostazioni</a></div></div>' +
      (menuOpen ? '<div class="menu-backdrop" data-act="toggleMenu"></div>' : '') +
      '<main class="page fade" id="main">' + inner + '</main>' +
      '<nav class="tabbar" aria-label="Sezioni">' + tabs.map(function (t) {
        var on = cur === t[0] || (t[0] === 'atlante' && atl.indexOf(cur) >= 0);
        return '<a href="#/' + t[0] + '" class="' + (on ? 'on' : '') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[t[0]] + '</svg>' + t[1] + '</a>';
      }).join('') + '</nav></div>';
  };

  /* ---------- Oggi */
  V.oggi = function () {
    var u = OLF.user, wx = UI.weather, pick = E.pickToday(wx ? wx.temp : null, UI.skip), rec = E.recommend({ n: 3 }), S = { P: 'primavera', E: 'estate', A: 'autunno', I: 'inverno' };
    var nP = E.items('present').length, nPa = E.items('past').length, nF = E.items('future').length, out = '';
    if (u.welcome) out += '<section class="card night" style="margin-bottom:32px"><div class="eyebrow">Benvenuto, Rea</div><p class="h3">Questo atlante è un regalo di Alessandro, costruito intorno a un solo naso: il tuo.</p>' +
      '<p class="muted">Ha inserito i tre profumi che ricordava: Black Afgano, Dark Lord e, forse, Kenzo pour Homme. Correggili, aggiungi gli altri con gli anni in cui li hai presi, e le analisi si accendono da sole. Sa già che non ami i profumi che svaniscono: il motore scarta tutto ciò che ha poca persistenza.</p>' +
      '<div class="row"><a class="btn sm" style="border-color:var(--night-ink);color:var(--night-ink)" href="#/guardaroba">Apri il guardaroba</a><button class="btn sm ghost" style="color:var(--night-ink)" data-act="dismissWelcome">Ho capito</button></div></section>';
    var title, lede, side = '';
    if (pick) {
      var sigNote = (pick.p.base || [])[0] || (pick.p.heart || [])[0] || 'profumo';
      title = 'Oggi è giornata da <em>' + h(sigNote) + '</em>.';
      lede = (wx ? wx.temp + '°C' + (wx.rain ? ', pioggia' : '') + '. ' : '') + 'È ' + S[pick.season] + ': nel tuo guardaroba oggi vince ' + h(pick.p.name) + (pick.inSeason ? '' : ', anche se non è la sua stagione ideale') + '. ' +
        (pick.days == null ? 'Non l’hai ancora mai segnato come indossato.' : (pick.days === 0 ? 'Lo hai già indossato oggi.' : 'Non lo indossi da ' + pick.days + ' giorni.'));
      side = '<a class="card" href="#/profumo/' + h(pick.p.id) + '" style="width:min(420px,100%);flex-shrink:0;gap:18px"><span class="eyebrow">Il consiglio di oggi</span><span class="row end" style="gap:20px;flex-wrap:nowrap">' + C.bottle(pick.p, pick.w.level == null ? 60 : pick.w.level) +
        '<span class="stack-sm"><span class="serif" style="font-size:34px;line-height:1.05">' + h(pick.p.name) + '</span><span class="cap">' + C.meta(pick.p) + (pick.w.gift ? ' · ' + h(pick.w.gift) : '') + '</span></span></span>' +
        '<span class="row" style="gap:6px">' + (pick.p.base || []).slice(0, 4).map(function (n) { return '<span class="chip">' + h(n) + '</span>'; }).join('') + '</span><span class="row between"><span class="cap">Persistenza ' + E.LONLAB[pick.p.lon || 3] + '</span>' + C.lon(pick.p.lon) + '</span></a>';
    } else { title = 'Il guardaroba è <em>vuoto</em>.'; lede = 'Aggiungi i profumi che hai: da lì partono il consiglio del giorno, le analisi e le scoperte.'; }
    out += '<section class="row between" style="gap:48px;align-items:stretch;margin-bottom:40px"><div class="stack" style="gap:24px;flex:1;min-width:280px"><div class="eyebrow">Buongiorno, Rea</div><h1 class="h1">' + title + '</h1><p class="lede">' + lede + '</p><div class="row">' +
      (pick ? '<button class="btn primary" data-act="wearToday" data-pid="' + h(pick.p.id) + '">Lo indosso oggi</button><button class="btn" data-act="skipToday" data-pid="' + h(pick.p.id) + '">Proponimi altro</button>' : '<a class="btn primary" href="#/guardaroba/nuovo">Aggiungi un profumo</a>') +
      '<a class="link" href="#/sommelier">Chiedi al Sommelier</a></div></div>' + side + '</section>';

    out += '<section class="grid g4"><a class="card" href="#/guardaroba" style="min-height:240px"><span class="eyebrow">Guardaroba</span><span class="row" style="gap:20px"><span class="stack-sm"><span class="big">' + nPa + '</span><span class="cap">passato</span></span><span class="stack-sm"><span class="big" style="color:var(--accent)">' + nP + '</span><span class="cap">presente</span></span><span class="stack-sm"><span class="big">' + nF + '</span><span class="cap">futuro</span></span></span>' +
      '<span class="muted" style="font-size:14px">' + (nP + nPa < 5 ? 'Più profumi e anni inserisci, più le analisi diventano precise.' : 'Livelli, indossi, doppioni e momenti scoperti.') + '</span><span class="link" style="margin-top:auto">Apri il guardaroba</span></a>' +
      '<a class="card" href="#/gusto" style="min-height:240px"><span class="eyebrow">Evoluzione del gusto</span>' + (E.liked().length ? '<span style="align-self:center">' + C.radar([{ v: E.profile(), color: 'var(--accent)' }], 200) + '</span>' : '<span class="muted">Si accende con il primo profumo.</span>') + '<span class="link" style="margin-top:auto">Leggi l’analisi</span></a>' +
      '<div class="card" style="min-height:240px"><span class="eyebrow">Tre scoperte per te</span><div class="list">' + (rec.list.map(function (r) { return C.prow(r.p, '<span class="pct">' + Math.round(r.fit * 100) + '%</span>'); }).join('') || '<span class="muted">Aggiungi almeno un profumo.</span>') + '</div><a class="link" style="margin-top:auto" href="#/affinita">Apri il motore di affinità</a></div>' +
      '<a class="card night" href="#/sommelier" style="min-height:240px"><span class="eyebrow">Sommelier</span><span class="serif" style="font-style:italic;font-size:23px;line-height:1.2">«Qualcosa di scuro come Black Afgano, ma da ufficio.»</span><span class="muted" style="font-size:14px">Risponde sui tuoi profumi. ' + (OLF.store.apiKey() ? 'Collegato a Claude.' : 'Funziona anche senza collegamenti.') + '</span><span class="link" style="margin-top:auto">Fai una domanda</span></a></section>';

    out += '<section class="section"><div class="row between rule"><h2 class="h2">L’Atlante</h2><a class="link" href="#/atlante">Tutte le sezioni e gli strumenti</a></div><div class="grid g3" style="margin-top:20px">' +
      [['note', 'Note e materie prime', 'Da un ingrediente a tutti i profumi che lo contengono, fino alle marche.'], ['catalogo', 'Catalogo e nasi', E.all().length + ' schede con piramide navigabile, persistenza, stessa mano, affini.'], ['molecole', 'Livello molecolare', 'Cosa c’è davvero dentro una nota, e in quali tuoi profumi.'],
        ['maison', 'Maison e case essenziere', 'Le storie dietro i flaconi: Nasomatto, Kilian, Kenzo, Guerlain.'], ['profumerie', 'Profumerie d’Italia', 'I negozi più forniti sulle marche di ricerca, con attenzione al Nord.'], ['quaderni', 'Quaderni', 'Contenuti originali: a partire da perché un profumo dura.']]
        .map(function (t) { return '<a class="card" href="#/' + t[0] + '"><span class="h3">' + t[1] + '</span><span class="muted" style="font-size:14.5px">' + t[2] + '</span></a>'; }).join('') + '</div></section>';

    var mine = {}; E.items().forEach(function (x) { mine[x.p.id] = 1; });
    out += '<section class="section"><div class="row between"><h2 class="h2">Linea del tempo del maschile</h2></div><div class="scroll-x"><div style="display:grid;grid-template-columns:repeat(' + OLF.DATA.timeline.length + ',minmax(112px,1fr));margin-top:24px;min-width:' + (OLF.DATA.timeline.length * 112) + 'px">' +
      OLF.DATA.timeline.map(function (t) {
        var on = t[3] && mine[t[3]], col = on ? 'var(--accent)' : 'var(--ink)';
        return '<div class="stack" style="gap:10px;padding-right:12px"><div class="serif" style="font-size:28px;color:' + col + '">' + t[0] + '</div><div style="height:9px;border-top:1px solid var(--ink)"><div style="width:9px;height:9px;margin-top:-5px;background:' + col + '"></div></div>' +
          (t[3] ? '<a href="#/profumo/' + t[3] + '" style="font-size:13.5px;font-weight:600;line-height:1.3">' + h(t[1]) + '</a>' : '<div style="font-size:13.5px;font-weight:600;line-height:1.3">' + h(t[1]) + '</div>') + '<div class="cap">' + h(t[2]) + '</div>' + (on ? '<div class="mono" style="font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)">sulla tua pelle</div>' : '') + '</div>';
      }).join('') + '</div></div></section>';
    return out;
  };

  /* ---------- Guardaroba */
  V.guardaroba = function (sub) {
    if (sub === 'nuovo') return V.wardrobeAdd();
    if (sub) return V.wardrobeEdit(sub);
    var tabs = [['past', 'Passato'], ['present', 'Presente'], ['future', 'Futuro']], tab = UI.tab, items = E.items(tab), liked = E.liked(), tn = E.topNotes(1);
    if (tab === 'future') items.sort(function (a, b) { return E.fit(b.p) - E.fit(a.p); });
    var hints = { past: 'Quelli che hai finito, venduto o regalato, e perché.', present: 'Tocca un flacone per aggiornare livello, stagioni, occasioni e voto.', future: 'I desideri, ordinati per affinità con il tuo gusto di oggi.' };
    var out = C.head('Guardaroba personale', 'Il guardaroba di <em>Rea</em>', null, '<a class="btn primary" href="#/guardaroba/nuovo">Aggiungi un profumo</a>');
    var notes = {}; liked.forEach(function (l) { Object.keys(E.weights(l.p)).forEach(function (n) { notes[n] = 1; }); });
    out += '<div class="facts"><div><span class="k">Profumi vissuti</span><span class="v serif">' + liked.length + '</span></div><div><span class="k">Note diverse sulla pelle</span><span class="v serif">' + Object.keys(notes).length + '</span></div>' +
      '<div><span class="k">Nota più presente</span><span class="v serif" style="font-style:italic">' + (tn.list[0] ? h(tn.list[0].note) : '…') + '</span></div><div><span class="k">Soglia di persistenza</span><span class="v">' + (OLF.user.prefs.avoidLowLon ? 'da ' + E.LONLAB[OLF.user.prefs.minLon] + ' in su ' + C.lon(OLF.user.prefs.minLon) : 'nessuna') + '</span></div></div>';
    out += '<div class="cols" style="margin-top:32px"><div class="grow stack" style="gap:20px"><div class="row between"><div class="row" role="tablist">' + tabs.map(function (t) { return '<button class="pill' + (t[0] === tab ? ' on' : '') + '" role="tab" aria-selected="' + (t[0] === tab) + '" data-act="tab" data-tab="' + t[0] + '">' + t[1] + ' <span class="mono">' + E.items(t[0]).length + '</span></button>'; }).join('') + '</div><span class="cap">' + hints[tab] + '</span></div>';
    out += items.length ? '<div class="grid g3">' + items.map(function (x) {
      var w = x.w, l2, l3;
      if (tab === 'present') { l2 = (w.acq ? 'Dal ' + w.acq : 'Anno da inserire') + (w.level != null ? ' · livello ' + w.level + '%' : ''); l3 = E.wearsLastYear(w) + ' indossi in 12 mesi' + (w.gift ? ' · ' + h(w.gift) : ''); }
      else if (tab === 'past') { l2 = (w.acq || '?') + ' → ' + (w.until || '?') + (w.uncertain ? ' · da confermare' : ''); l3 = h(w.note || (w.uncertain ? 'Alessandro crede di ricordarlo: confermalo tu.' : 'Aggiungi perché l’hai lasciato.')); }
      else { l2 = 'Affinità con il tuo gusto ' + Math.round(E.fit(x.p) * 100) + '%'; l3 = h(w.note || '') + (E.lonOk(x.p) ? '' : ' Persistenza sotto la tua soglia.'); }
      return '<a class="witem" href="#/guardaroba/' + h(x.p.id) + '">' + C.bottle(x.p, tab === 'present' ? (w.level == null ? 60 : w.level) : 0, tab === 'future') + '<span class="stack-sm" style="min-width:0"><span class="t">' + h(x.p.name) + '</span><span class="cap">' + C.meta(x.p) + ' · ' + h(x.p.fam) + '</span><span style="font-size:13px;font-weight:600;padding-top:4px">' + l2 + '</span><span class="cap" style="line-height:1.4">' + l3 + '</span></span></a>';
    }).join('') + '</div>' : '<div class="empty">' + { past: 'Nessun profumo passato. Quelli che hai finito o lasciato raccontano il tuo gusto quanto quelli che hai: aggiungili con gli anni.', present: 'Nessun flacone presente.', future: 'Nessun desiderio. Dal motore di affinità puoi aggiungerli con un tocco.' }[tab] + '</div>';
    out += '</div><aside class="side stack-lg"><div class="stack"><h2 class="h3 rule">La tua impronta, oggi</h2>' + (liked.length ? '<div style="align-self:center">' + C.radar([{ v: E.profile(), color: 'var(--accent)' }], 320) + '</div><a class="link acc" href="#/gusto">Guarda l’analisi completa</a>' : '<p class="muted">Si disegna con il primo profumo.</p>') + '</div>';
    var low = E.items('present').filter(function (x) { return x.w.level != null && x.w.level <= 20; });
    out += '<div class="stack-sm"><h2 class="h3 rule">In esaurimento</h2>' + (low.length ? '<div class="list">' + low.map(function (x) { return '<a href="#/guardaroba/' + x.p.id + '"><span style="font-weight:500">' + h(x.p.name) + '</span><span class="mono">' + x.w.level + '%</span></a>'; }).join('') + '</div>' : '<p class="cap">Niente sotto il 20%. Aggiorna i livelli ogni tanto.</p>') + '</div>';
    var du = E.dupes();
    out += '<div class="stack-sm"><h2 class="h3 rule">Quasi doppioni</h2>' + (du.length ? '<div class="list">' + du.map(function (d) { return '<div><span class="stack-sm"><span style="font-weight:600">' + h(d.a.name) + ' × ' + h(d.b.name) + '</span><span class="x">in comune: ' + h(E.shared(d.a, d.b).slice(0, 4).join(', ')) + '</span></span><span class="pct">' + Math.round(d.aff * 100) + '%</span></div>'; }).join('') + '</div>' : '<p class="cap">Nessuna coppia troppo simile tra i flaconi presenti.</p>') + '</div></aside></div>';
    var m = E.matrix();
    out += '<section class="band night"><div class="row between end" style="gap:32px;margin-bottom:24px;flex-wrap:wrap"><div class="stack-sm" style="max-width:480px"><div class="eyebrow">Copertura del guardaroba</div><h2 class="h2">Quando sei vestito, e quando no</h2></div><div class="stack-sm" style="max-width:420px;gap:14px"><p class="muted" style="font-size:15px;margin:0">' +
      (m.tagged < m.total ? 'Questa matrice nasce da quello che dichiari su ogni flacone che possiedi, non da quando lo indossi davvero. Apri un profumo presente dal guardaroba qui sopra, scorri fino a "Stagioni" e "Occasioni" e seleziona quelle giuste: ogni casella qui sotto si riempie da sola. Per ora hai etichettato ' + m.tagged + ' flaconi su ' + m.total + '.' : 'Tutti i flaconi presenti sono etichettati. Le caselle ambra sono i momenti in cui oggi non hai niente di tuo da mettere: cliccale per vedere proposte.') + '</p>' +
      (m.tagged < m.total ? '<a class="btn sm" style="align-self:flex-start" href="#/guardaroba">Vai a etichettare</a>' : '') + '</div></div><div class="matrix"><div></div>' + E.SEAS.map(function (s) { return '<div class="hd">' + s[1] + '</div>'; }).join('') +
      E.OCC.map(function (o) { return '<div class="rw">' + o[1] + '</div>' + E.SEAS.map(function (s) { var n = m.cells[o[0] + s[0]]; return n.length ? '<div class="cell"><span class="serif" style="font-size:24px;line-height:1;color:var(--night-ink)">' + n.length + '</span>' + h(n.join(', ')) + '</div>' : (m.tagged ? '<a class="cell gap" href="#/affinita"><span class="mono" style="font-size:10.5px;letter-spacing:.1em;text-transform:uppercase">scoperto</span><span style="font-weight:600">Vedi proposte</span></a>' : '<div class="cell"></div>'); }).join(''); }).join('') + '</div></section>';
    return out;
  };

  V.wardrobeAdd = function () {
    var q = (UI.addQuery || '').toLowerCase(), st = {}; E.items().forEach(function (x) { st[x.p.id] = 1; });
    var res = q.length >= 2 ? E.all().filter(function (p) { return !st[p.id] && (p.name + ' ' + p.brand).toLowerCase().indexOf(q) >= 0; }).slice(0, 8) : [];
    var out = C.head('Guardaroba', 'Aggiungi un <em>profumo</em>', 'Cercalo nel catalogo, scrivilo a mano, oppure fallo compilare a Claude se hai collegato il motore di aggiornamento.');
    out += '<div class="cols"><div class="grow stack"><div class="field"><label for="addq">Cerca nel catalogo</label><input class="input" id="addq" type="search" value="' + h(UI.addQuery || '') + '" placeholder="es. Interlude, Tom Ford, Kilian" data-input="addQuery"></div><div class="list" id="addres">' +
      res.map(function (p) { return '<div class="search-row"><span class="stack-sm"><span class="t">' + h(p.name) + '</span><span class="s">' + C.meta(p) + '</span></span><span class="search-row-actions"><button class="btn sm" data-act="addItem" data-pid="' + p.id + '" data-status="present">Ce l’ho</button><button class="btn sm" data-act="addItem" data-pid="' + p.id + '" data-status="past">L’ho avuto</button><button class="btn sm" data-act="addItem" data-pid="' + p.id + '" data-status="future">Lo voglio</button></span></div>'; }).join('') +
      (q.length >= 2 && !res.length ? '<p class="muted" style="padding:16px 0">Non c’è nel catalogo: aggiungilo qui a fianco.</p>' : '') + '</div></div>';
    out += '<aside class="side stack-lg"><form class="card" data-form="customPerfume"><h2 class="h3">Non c’è? Scrivilo tu</h2><div class="field"><label for="cn">Nome</label><input class="input" id="cn" name="name" required></div><div class="field"><label for="cb">Marca</label><input class="input" id="cb" name="brand" required></div>' +
      '<div class="row"><div class="field grow"><label for="cy">Anno</label><input class="input" id="cy" name="year" type="number" min="1700" max="2100"></div><div class="field grow"><label for="cf">Famiglia</label><select class="input" id="cf" name="fam">' + E.FAMS.map(function (f) { return '<option>' + f + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="field"><label for="ct">Note di testa</label><input class="input" id="ct" name="top" placeholder="separate da virgola"></div><div class="field"><label for="ch">Note di cuore</label><input class="input" id="ch" name="heart"></div><div class="field"><label for="cba">Note di fondo</label><input class="input" id="cba" name="base"></div>' +
      '<div class="field"><label for="cl">Persistenza</label><select class="input" id="cl" name="lon">' + [1, 2, 3, 4, 5].map(function (n) { return '<option value="' + n + '"' + (n === 4 ? ' selected' : '') + '>' + n + ' · ' + E.LONLAB[n] + '</option>'; }).join('') + '</select></div>' +
      '<p class="help">Le note che il sito non conosce finiscono tra i legni: puoi correggerle dopo dalla scheda.</p><button class="btn dark" type="submit">Crea la scheda e aggiungila</button></form>' +
      '<form class="card night" data-form="aiPerfume"><div class="eyebrow">Motore di aggiornamento</div><h2 class="h3">Compila con Claude</h2><p class="muted" style="font-size:14.5px">' + (OLF.store.apiKey() ? 'Scrivi nome e marca: Claude prepara la scheda, tu la controlli.' : 'Collega una chiave API nelle impostazioni per attivarlo. È l’unica parte del sito che ha un costo, a consumo.') + '</p>' +
      '<div class="field"><label for="ain">Profumo e marca</label><input class="input" id="ain" name="q" style="background:transparent;border-color:var(--night-ink);color:var(--night-ink)" placeholder="es. Memoir Man, Amouage" ' + (OLF.store.apiKey() ? 'required' : 'disabled') + '></div>' +
      (OLF.store.apiKey() ? '<button class="btn" style="border-color:var(--night-ink);color:var(--night-ink)" type="submit">Prepara la scheda</button>' : '<a class="btn" style="border-color:var(--night-ink);color:var(--night-ink)" href="#/impostazioni">Vai alle impostazioni</a>') + '</form></aside></div>';
    return out;
  };

  V.wardrobeEdit = function (pid) {
    var w = E.item(pid), p = E.byId(pid); if (!w || !p) return '<div class="empty">Questo profumo non è nel guardaroba. <a class="link acc" href="#/guardaroba">Torna al guardaroba</a></div>';
    var chk = function (name, arr, list) { return list.map(function (s) { return '<label class="check"><input type="checkbox" name="' + name + '" value="' + s[0] + '"' + ((arr || []).indexOf(s[0]) >= 0 ? ' checked' : '') + '> ' + s[1] + '</label>'; }).join(''); };
    return C.head('Guardaroba', h(p.name), C.meta(p) + ' · ' + h(p.fam), '<a class="btn" href="#/profumo/' + p.id + '">Apri la scheda</a>') +
      '<form class="cols" data-form="editItem" data-pid="' + p.id + '"><div class="grow stack" style="max-width:640px"><div class="field"><label for="est">Dove sta</label><select class="input" id="est" name="status">' + [['present', 'Presente: ce l’ho'], ['past', 'Passato: l’ho avuto'], ['future', 'Futuro: lo desidero']].map(function (s) { return '<option value="' + s[0] + '"' + (w.status === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="row"><div class="field grow"><label for="eacq">Anno in cui l’hai preso</label><input class="input" id="eacq" name="acq" type="number" min="1950" max="2100" value="' + h(w.acq || '') + '"></div><div class="field grow"><label for="eun">Anno in cui l’hai lasciato</label><input class="input" id="eun" name="until" type="number" min="1950" max="2100" value="' + h(w.until || '') + '"></div></div>' +
      '<div class="row"><div class="field grow"><label for="elv">Livello del flacone (%)</label><input class="input" id="elv" name="level" type="number" min="0" max="100" step="5" value="' + h(w.level == null ? '' : w.level) + '"></div><div class="field grow"><label for="ert">Il tuo voto</label><select class="input" id="ert" name="rating"><option value="">Non ancora</option>' + [1, 2, 3, 4, 5].map(function (n) { return '<option value="' + n + '"' + (w.rating === n ? ' selected' : '') + '>' + n + ' su 5</option>'; }).join('') + '</select></div></div>' +
      '<div class="stack-sm"><span class="label">Stagioni</span><div class="row">' + chk('seasons', w.seasons, E.SEAS) + '</div></div><div class="stack-sm"><span class="label">Occasioni</span><div class="row">' + chk('occ', w.occ, E.OCC) + '</div></div>' +
      '<div class="field"><label for="egf">Da dove arriva</label><input class="input" id="egf" name="gift" value="' + h(w.gift || '') + '" placeholder="es. regalo, viaggio, negozio"></div><div class="field"><label for="ent">Note personali, o perché l’hai lasciato</label><textarea class="input" id="ent" name="note">' + h(w.note || '') + '</textarea></div>' +
      '<div class="row"><button class="btn primary" type="submit">Salva</button><button class="btn danger" type="button" data-act="removeItem" data-pid="' + p.id + '">Togli dal guardaroba</button></div></div>' +
      '<aside class="side stack"><div class="card"><span class="eyebrow">Diario degli indossi</span><span class="big">' + (w.wears || []).length + '</span><span class="cap">' + (E.lastWorn(w) ? 'Ultima volta segnata: ' + E.lastWorn(w) : 'Non hai ancora segnato quando lo indossi.') + '</span>' +
      '<p class="cap muted" style="font-size:13px;line-height:1.5">Uno storico personale di quando lo hai messo, per costruire nel tempo statistiche vere su questo flacone. È diverso dalle stagioni/occasioni qui sotto: quelle dicono a cosa si presta, questo diario dice cosa hai fatto davvero.</p>' +
      '<div class="row" style="gap:8px;align-items:flex-end"><div class="field grow" style="margin:0"><label for="weardt" class="cap">Data dell’indosso</label><input class="input" id="weardt" type="date" max="' + OLF.today() + '" value="' + OLF.today() + '"></div><button class="btn sm" type="button" data-act="addWear" data-pid="' + p.id + '">Aggiungi</button></div>' +
      ((w.wears || []).length ? '<div class="stack-sm" style="margin-top:4px">' + w.wears.slice().sort().reverse().slice(0, 6).map(function (d) { return '<span class="row between" style="font-size:13.5px"><span>' + d + '</span><button class="btn ghost sm" type="button" data-act="removeWear" data-pid="' + p.id + '" data-date="' + d + '" aria-label="Togli questa data">✕</button></span>'; }).join('') + (w.wears.length > 6 ? '<span class="cap">+' + (w.wears.length - 6) + ' altre</span>' : '') + '</div>' : '') + '</div>' +
      '<div class="card"><span class="eyebrow">Persistenza</span><span class="row between"><span>' + OLF.cap(E.LONLAB[p.lon || 3]) + '</span>' + C.lon(p.lon) + '</span><span class="cap">Stima editoriale: correggila dalla scheda se sulla tua pelle va diversamente.</span></div></aside></form>';
  };

  /* ---------- Gusto */
  V.gusto = function () {
    var L = E.liked(), out = C.head('Evoluzione del gusto', 'Come cambia il <em>naso</em> di Rea', 'Tutto quello che vedi è calcolato sulle piramidi dei profumi del tuo guardaroba. Più ne inserisci, con gli anni, più il ritratto si fa nitido.');
    if (!L.length) return out + '<div class="empty">Serve almeno un profumo nel guardaroba. <a class="link acc" href="#/guardaroba/nuovo">Aggiungine uno</a></div>';
    var er = E.eras(), pr = E.profile(), tn = E.topNotes(8), un = E.unexplored(), cen = E.centroid(L);
    var ERACOL = ['#4F7C8A', '#7A5A3A', '#B5651D'];
    out += '<section class="stack"><div class="row between rule"><h2 class="h2">Le tue ere</h2></div>';
    if (er.ready) {
      out += '<div class="grid g' + er.eras.length + '">' + er.eras.map(function (e, i) { return '<div class="card" style="border-top:4px solid ' + ERACOL[i] + '"><span class="eyebrow">' + e.from + (e.to !== e.from ? '–' + e.to : '') + '</span><span class="h3" style="font-style:italic">' + e.name + '</span><span class="muted" style="font-size:14.5px">' + e.items.map(function (l) { return h(l.p.name); }).join(', ') + '</span></div>'; }).join('') + '</div>';
    } else out += '<div class="empty">Hai ' + er.dated + ' profumi con l’anno di acquisto: ne servono almeno ' + er.need + ' perché il sito riconosca da solo le ere del tuo gusto e disegni la traiettoria sulla mappa. <a class="link acc" href="#/guardaroba">Aggiungi gli anni</a></div>';
    out += '</section>';
    var polys = er.ready ? er.eras.map(function (e, i) { return { v: e.profile, color: ERACOL[i] }; }) : [{ v: pr, color: 'var(--accent)' }];
    var ranked = E.CATS.slice().sort(function (a, b) { return pr[b] - pr[a]; });
    out += '<section class="section cols"><div class="stack" style="width:min(480px,100%);flex-shrink:0"><h2 class="h3 rule">' + (er.ready ? 'L’impronta che si sposta' : 'La tua impronta') + '</h2><div style="align-self:center">' + C.radar(polys, 420) + '</div>' +
      (er.ready ? '<div class="row" style="justify-content:center">' + er.eras.map(function (e, i) { return '<span class="row cap" style="gap:8px"><span style="width:18px;height:3px;background:' + ERACOL[i] + '"></span>' + e.name + '</span>'; }).join('') + '</div>' : '') + '</div>' +
      '<div class="grow stack"><h2 class="h3 rule">Di cosa è fatto il tuo gusto</h2><div class="stack-sm">' + ranked.map(function (c) { return '<div class="row" style="flex-wrap:nowrap;min-height:36px"><span style="width:190px;flex-shrink:0;font-size:14px">' + h(OLF.DATA.cats[c]) + '</span><span class="bar"><span style="width:' + Math.round(pr[c] / pr[ranked[0]] * 100) + '%"></span></span><span class="mono cap" style="width:44px;text-align:right">' + Math.round(pr[c] * 100) + '%</span></div>'; }).join('') + '</div></div></section>';
    var warmW = cen.warm > 0.25 ? 'caldo' : (cen.warm < -0.15 ? 'fresco' : 'a metà tra fresco e caldo'), sweetW = cen.sweet > 0.1 ? 'dolce' : (cen.sweet < -0.15 ? 'secco' : 'né secco né dolce');
    var avgLon = L.reduce(function (s, l) { return s + (l.p.lon || 3); }, 0) / L.length;
    out += '<section class="band night"><div class="row between" style="margin-bottom:28px"><h2 class="h2">Cosa dicono di te i numeri</h2><span class="cap">Calcolato su ' + L.length + ' profumi</span></div><div class="grid g3" style="gap:40px">' +
      '<div class="stack" style="border-top:1px solid var(--night-line);padding-top:20px"><div class="eyebrow">Dove stai sulla mappa</div><div class="serif" style="font-size:40px;line-height:1.05;font-style:italic">' + warmW + ', ' + sweetW + '</div><p class="muted" style="font-size:15px">È il baricentro dei tuoi profumi tra fresco e caldo, secco e dolce. Sulla mappa dell’affinità è il punto da cui partono le proposte.</p></div>' +
      '<div class="stack" style="border-top:1px solid var(--night-line);padding-top:20px"><div class="eyebrow">Persistenza media</div><div class="serif" style="font-size:64px;line-height:1">' + avgLon.toFixed(1).replace('.', ',') + ' <span style="font-size:24px">su 5</span></div><p class="muted" style="font-size:15px">' + (avgLon >= 3.8 ? 'Scegli profumi che restano. Le acque di Colonia stanno a 1: il motore le tiene fuori dalle proposte.' : 'Un guardaroba di media tenuta.') + '</p></div>' +
      '<div class="stack" style="border-top:1px solid var(--night-line);padding-top:20px"><div class="eyebrow">Territori mai esplorati</div><div class="serif" style="font-size:32px;line-height:1.1;font-style:italic;padding:6px 0">' + (un.fams.slice(0, 3).join(', ').toLowerCase() || 'nessuno') + '</div><p class="muted" style="font-size:15px">Famiglie che non hai mai avuto. Non è detto che ti piacciano: ma una prova sulla pelle costa poco.</p></div></div></section>';
    var rec = E.recommend({ n: 3 });
    out += '<section class="section cols"><div class="grow stack-sm"><h2 class="h3 rule">Le tue note di sempre</h2><div class="list">' + tn.list.map(function (t) { return '<a href="#/note/' + encodeURIComponent(t.note) + '" style="min-height:48px"><span style="width:150px;font-weight:600">' + h(OLF.cap(t.note)) + '</span><span class="bar"><span style="width:' + Math.round(t.n / tn.total * 100) + '%"></span></span><span class="mono cap" style="width:64px;text-align:right">' + t.n + ' su ' + tn.total + '</span></a>'; }).join('') + '</div></div>' +
      '<div class="stack-sm" style="width:min(480px,100%);flex-shrink:0"><h2 class="h3 rule">Da qui, dove andare</h2><p class="muted" style="font-size:14.5px;padding:8px 0">I profumi fuori dal guardaroba più vicini al tuo gusto, sopra la tua soglia di persistenza.</p><div class="list">' + rec.list.map(function (r) { return C.prow(r.p, '<span class="pct">' + Math.round(r.fit * 100) + '%</span>', 'persistenza ' + E.LONLAB[r.p.lon || 3]); }).join('') + '</div><a class="btn primary" style="align-self:flex-start;margin-top:12px" href="#/affinita">Apri la mappa</a></div></section>';
    return out;
  };
})();
