/* Olfattiva · viste B: Affinità, Sommelier, Atlante (note, catalogo, scheda, molecole, maison, profumerie, quaderni) */
(function () {
  'use strict';
  var OLF = window.OLF, E = OLF.engine, V = OLF.views, C = OLF.c, UI = OLF.ui, h = OLF.esc;

  /* ---------- mappa dell'affinità */
  function layout(Wd, Hd) {
    var pts = {}, ids = [], it, i, j;
    E.all().forEach(function (p) {
      var a = E.axes(p), wx = Math.min(Math.max(a.warm, -0.7), 0.9), sy = Math.min(Math.max(a.sweet, -0.85), 0.65);
      pts[p.id] = { x: 30 + (wx + 0.7) / 1.6 * (Wd - 60), y: 34 + (sy + 0.85) / 1.5 * (Hd - 68) }; ids.push(p.id);
    });
    for (it = 0; it < 60; it++) for (i = 0; i < ids.length; i++) for (j = i + 1; j < ids.length; j++) {
      var a = pts[ids[i]], b = pts[ids[j]], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      if (d < 18) { var k = (18 - d) / 2; if (d < 0.1) { dx = 1; dy = (i % 2 ? 1 : -1); d = 1.4; } a.x -= dx / d * k; a.y -= dy / d * k; b.x += dx / d * k; b.y += dy / d * k; }
    }
    ids.forEach(function (id) { pts[id].x = Math.min(Math.max(pts[id].x, 12), Wd - 12); pts[id].y = Math.min(Math.max(pts[id].y, 16), Hd - 12); });
    pts._xy = function (warm, sweet) { return { x: 30 + (Math.min(Math.max(warm, -0.7), 0.9) + 0.7) / 1.6 * (Wd - 60), y: 34 + (Math.min(Math.max(sweet, -0.85), 0.65) + 0.85) / 1.5 * (Hd - 68) }; };
    return pts;
  }
  V.affinita = function (seedId) {
    var small = window.innerWidth < 700, Wd = small ? 400 : 860, Hd = small ? 520 : 560, fs = small ? 11 : 12;
    var liked = E.liked(), seed = E.byId(seedId || UI.seed) || (liked[0] && liked[0].p) || E.all()[0];
    UI.seed = seed.id;
    var nb = E.neighbours(seed, UI.dir, 5), near = {}; nb.forEach(function (n) { near[n.p.id] = 1; });
    var pts = layout(Wd, Hd), st = {}; E.items().forEach(function (x) { st[x.p.id] = x.w.status; });
    var svg = ['<svg viewBox="0 0 ' + Wd + ' ' + Hd + '" role="img" aria-label="Mappa dei profumi: fresco a sinistra, caldo a destra, secco in alto, dolce in basso">'];
    var o = pts._xy(0, 0), g = 'font-family:var(--mono);font-size:10px;letter-spacing:.16em;fill:#8C968F';
    svg.push('<line x1="' + o.x + '" y1="20" x2="' + o.x + '" y2="' + (Hd - 20) + '" style="stroke:#2E3832"/><line x1="16" y1="' + o.y + '" x2="' + (Wd - 16) + '" y2="' + o.y + '" style="stroke:#2E3832"/>');
    svg.push('<text x="16" y="' + (o.y - 8) + '" style="' + g + '">FRESCO</text><text x="' + (Wd - 16) + '" y="' + (o.y - 8) + '" style="' + g + ';text-anchor:end">CALDO</text><text x="' + (o.x + 8) + '" y="18" style="' + g + '">SECCO</text><text x="' + (o.x + 8) + '" y="' + (Hd - 10) + '" style="' + g + '">DOLCE</text>');
    var er = E.eras();
    if (er.ready) {
      var cs = er.eras.map(function (e) { return pts._xy(e.centroid.warm, e.centroid.sweet); });
      svg.push('<polyline points="' + cs.map(function (c) { return c.x.toFixed(1) + ',' + c.y.toFixed(1); }).join(' ') + '" style="fill:none;stroke:#D9A273;stroke-width:2"/>');
      cs.forEach(function (c, i) { svg.push('<circle cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="8" style="fill:#161D19;stroke:#D9A273;stroke-width:2"/><text x="' + c.x.toFixed(1) + '" y="' + (c.y - 14).toFixed(1) + '" style="font-family:var(--mono);font-size:10px;fill:#D9A273;text-anchor:middle">' + er.eras[i].from + '</text>'); });
    } else if (liked.length) {
      var cen = E.centroid(liked), cc = pts._xy(cen.warm, cen.sweet);
      svg.push('<circle cx="' + cc.x.toFixed(1) + '" cy="' + cc.y.toFixed(1) + '" r="22" style="fill:none;stroke:#D9A273;stroke-width:1.5;stroke-dasharray:3 5"/><text x="' + cc.x.toFixed(1) + '" y="' + (cc.y - 28).toFixed(1) + '" style="font-family:var(--mono);font-size:10px;letter-spacing:.08em;fill:#D9A273;text-anchor:middle">IL TUO BARICENTRO</text>');
    }
    var sp = pts[seed.id];
    nb.forEach(function (n) { var t = pts[n.p.id]; svg.push('<line x1="' + sp.x.toFixed(1) + '" y1="' + sp.y.toFixed(1) + '" x2="' + t.x.toFixed(1) + '" y2="' + t.y.toFixed(1) + '" style="stroke:#EFEBE0;stroke-opacity:.5"/>'); });
    var labels = [];
    E.all().forEach(function (p) {
      var pt = pts[p.id], s = st[p.id], isSeed = p.id === seed.id, low = !E.lonOk(p);
      var style = s === 'present' ? 'fill:#EFEBE0' : (s === 'past' ? 'fill:#6E7972' : (s === 'future' ? 'fill:#161D19;stroke:#D9A273;stroke-width:2' : 'fill:#161D19;stroke:#A9B3AC;stroke-width:1.4' + (low ? ';stroke-dasharray:2 2;stroke-opacity:.5' : '')));
      if (isSeed) style = 'fill:var(--accent);stroke:#EFEBE0;stroke-width:2';
      svg.push('<g class="pt" data-act="seed" data-pid="' + h(p.id) + '" tabindex="0" role="button" aria-label="' + h(p.name + ', ' + C.st(p.id)) + '"><title>' + h(p.name + ' · ' + p.brand) + '</title><circle cx="' + pt.x.toFixed(1) + '" cy="' + pt.y.toFixed(1) + '" r="15" style="fill:transparent"/><circle cx="' + pt.x.toFixed(1) + '" cy="' + pt.y.toFixed(1) + '" r="' + (isSeed ? 8 : 5.5) + '" style="' + style + '"/></g>');
      if (isSeed || near[p.id] || s === 'present' || s === 'past') labels.push({ p: p, x: pt.x, y: pt.y, strong: isSeed || near[p.id], seed: isSeed });
    });
    var placed = [];
    labels.sort(function (a, b) { return (b.seed - a.seed) || (b.strong - a.strong) || (a.y - b.y); }).forEach(function (l) {
      var w = l.p.name.length * fs * 0.56, right = l.x + 12 + w < Wd - 4, x0 = right ? l.x + 12 : l.x - 12 - w, y = l.y + 4, tries = 0;
      while (tries < 8 && placed.some(function (b) { return x0 < b.x1 && x0 + w > b.x0 && Math.abs(y - b.y) < fs + 2; })) { y += (tries % 2 ? -1 : 1) * (fs + 2) * (tries + 1); tries++; }
      placed.push({ x0: x0, x1: x0 + w, y: y });
      svg.push('<text x="' + (right ? l.x + 12 : l.x - 12).toFixed(1) + '" y="' + y.toFixed(1) + '" style="font-size:' + fs + 'px;font-weight:' + (l.strong ? 600 : 400) + ';fill:' + (l.seed ? '#FFFFFF' : (l.strong ? '#EFEBE0' : '#A9B3AC')) + ';text-anchor:' + (right ? 'start' : 'end') + ';pointer-events:none">' + h(l.p.name) + '</text>');
    });
    svg.push('</svg>');
    var dirs = [['none', 'il più vicino'], ['tenace', 'più tenace'], ['fresco', 'più fresco'], ['caldo', 'più caldo'], ['secco', 'più secco'], ['dolce', 'più dolce']];
    var out = C.head('Motore di affinità · ' + E.all().length + ' profumi', 'La mappa del tuo <em>naso</em>', 'Ogni profumo è un punto: a sinistra il fresco, a destra il caldo, in alto il secco, in basso il dolce. Tocca un punto per usarlo come seme, poi salta di affine in affine.');
    out += '<div class="cols"><div class="grow stack" style="gap:12px"><div class="map">' + svg.join('') + '</div><div class="row cap" style="gap:16px"><span class="row" style="gap:6px"><span style="width:11px;height:11px;border-radius:9px;background:var(--ink)"></span>presente</span><span class="row" style="gap:6px"><span style="width:11px;height:11px;border-radius:9px;background:#8C968F"></span>passato</span>' +
      '<span class="row" style="gap:6px"><span style="width:11px;height:11px;border-radius:9px;border:2px solid var(--amber)"></span>desiderio</span><span class="row" style="gap:6px"><span style="width:11px;height:11px;border-radius:9px;border:1.5px solid var(--cap)"></span>da scoprire</span><span class="row" style="gap:6px"><span style="width:11px;height:11px;border-radius:9px;border:1.5px dashed var(--line2)"></span>sotto la tua soglia di persistenza</span></div>' +
      '<p class="cap mono" style="font-size:11.5px">Affinità = 50% note condivise, pesate per livello della piramide · 50% somiglianza del profilo per categorie di note</p></div>';
    out += '<aside class="side stack"><div class="stack-sm" style="padding-bottom:14px;border-bottom:1px solid var(--ink)"><div class="eyebrow">Seme · ' + C.st(seed.id) + '</div><div class="serif" style="font-size:34px;line-height:1.05">' + h(seed.name) + '</div><div class="cap">' + C.meta(seed) + ' · persistenza ' + E.LONLAB[seed.lon || 3] + '</div>' +
      '<div class="row" style="padding-top:6px"><a class="btn sm" href="#/profumo/' + seed.id + '">Apri la scheda</a>' + (st[seed.id] ? '' : '<button class="btn sm" data-act="addItem" data-pid="' + seed.id + '" data-status="future" data-stay="1">Aggiungi ai desideri</button>') + '</div></div>' +
      '<div class="stack-sm"><span class="label">Simile, ma…</span><div class="row" style="gap:6px">' + dirs.map(function (d) { return '<button class="chip' + (UI.dir === d[0] ? ' on' : '') + '" data-act="dir" data-dir="' + d[0] + '">' + d[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="list">' + (nb.map(function (n) { return '<button data-act="seed" data-pid="' + n.p.id + '"><span class="stack-sm"><span class="t">' + h(n.p.name) + '</span><span class="s">' + C.meta(n.p) + ' · ' + C.st(n.p.id) + '</span><span class="x">in comune: ' + h(E.shared(seed, n.p).slice(0, 4).join(', ') || 'profilo simile, note diverse') + '</span></span><span class="pct">' + Math.round(n.aff * 100) + '%</span></button>'; }).join('') ||
        '<p class="muted" style="padding:16px 0">In questa direzione non c’è niente di più estremo nel catalogo: sei al bordo della mappa.</p>') + '</div></aside></div>';
    var rec = E.recommend({ n: 6, includeWishes: true });
    out += '<section class="section cols"><div class="grow stack-sm"><h2 class="h2 rule">Per te, adesso</h2><p class="muted" style="padding:6px 0 10px">Calcolato su tutto il guardaroba, non sul seme. ' + (OLF.user.prefs.avoidLowLon ? 'Solo profumi con persistenza da «' + E.LONLAB[OLF.user.prefs.minLon] + '» in su.' : '') + '</p><div class="list">' +
      rec.list.map(function (r) { var best = liked.slice().sort(function (a, b) { return E.affinity(r.p, b.p) - E.affinity(r.p, a.p); })[0]; return C.prow(r.p, '<span class="row" style="gap:16px;flex-wrap:nowrap">' + C.lon(r.p.lon) + '<span class="pct">' + Math.round(r.fit * 100) + '%</span></span>', best ? 'vicino a ' + h(best.p.name) + ': ' + h(E.shared(r.p, best.p).slice(0, 3).join(', ') || 'stesso profilo') : ''); }).join('') + '</div></div>' +
      '<div class="stack-sm" style="width:min(420px,100%);flex-shrink:0"><h2 class="h3 rule">Scartati per persistenza</h2><p class="cap" style="padding:6px 0">Ti somigliano, ma svaniscono presto. Li vedi per trasparenza.</p><div class="list">' + (rec.skipped.map(function (r) { return C.prow(r.p, '<span class="row" style="gap:12px;flex-wrap:nowrap">' + C.lon(r.p.lon) + '<span class="pct" style="font-size:22px">' + Math.round(r.fit * 100) + '%</span></span>'); }).join('') || '<p class="cap" style="padding:12px 0">Nessuno.</p>') + '</div><a class="link" href="#/layering">Apri il laboratorio di layering</a></div></section>';
    return out;
  };

  /* ---------- Sommelier */
  var SEASW = [['E', /estate|estiv|caldo|afa|spiaggia/], ['I', /invern|freddo|neve|natale/], ['P', /primaver/], ['A', /autunn/]];
  var OCCW = [['U', /ufficio|lavoro|riunion|colloquio|cliente/], ['S', /sera|cena|appuntament|matrimonio|festa|notte|teatro/], ['L', /weekend|tempo libero|casual|passeggiat|viaggio/]];
  function why(p) { var L = E.liked().slice().sort(function (a, b) { return E.affinity(p, b.p) - E.affinity(p, a.p); })[0]; return L ? 'Vicino a ' + L.p.name + ': ' + (E.shared(p, L.p).slice(0, 3).join(', ') || 'stesso profilo') + '. Persistenza ' + E.LONLAB[p.lon || 3] + '.' : 'Persistenza ' + E.LONLAB[p.lon || 3] + '.'; }
  OLF.sommelierLocal = function (q) {
    var t = q.toLowerCase(), seas = null, occ = null, paras = [], cards = [], S = { P: 'primavera', E: 'estate', A: 'autunno', I: 'inverno' };
    SEASW.forEach(function (s) { if (s[1].test(t)) seas = s[0]; }); OCCW.forEach(function (s) { if (s[1].test(t)) occ = s[0]; });
    var named = E.all().filter(function (p) { return t.indexOf(p.name.toLowerCase()) >= 0; })[0];
    var ctxFilter = function (p) { var a = E.axes(p); if (seas === 'E' && a.warm > 0.2) return false; if (seas === 'I' && a.warm < 0.05) return false; if (occ === 'U' && (a.sweet > 0.3 || (p.lon || 3) === 5 && a.warm > 0.5)) return false; return true; };
    if (named && /perch|spiega|cosa c|com.?è fatto|raccont/.test(t)) {
      var cv = E.catvec(named), top = E.CATS.slice().sort(function (a, b) { return cv[b] - cv[a]; }).slice(0, 2).map(function (c) { return OLF.DATA.cats[c].toLowerCase(); }), ax = E.axes(named);
      paras.push(named.name + ' è costruito soprattutto su ' + top.join(' e ') + '. Sulla mappa sta nella zona ' + (ax.warm > 0.2 ? 'calda' : (ax.warm < -0.15 ? 'fresca' : 'di mezzo')) + ' e ' + (ax.sweet > 0.1 ? 'dolce' : (ax.sweet < -0.15 ? 'secca' : 'né secca né dolce')) + ', con una persistenza ' + E.LONLAB[named.lon || 3] + '.');
      paras.push('Nel fondo, che è la parte che resta per ore, trovi ' + (named.base || []).join(', ') + '. Se ti piace, è probabile che il tuo naso cerchi proprio questo: qui sotto i tre più vicini per struttura.');
      cards = E.neighbours(named, 'none', 3).map(function (n) { return { p: n.p, pct: Math.round(n.aff * 100), why: 'In comune: ' + (E.shared(named, n.p).slice(0, 4).join(', ') || 'il profilo') + '.' }; });
    } else if (/nuov|scopr|consigli|compr|regal|prov|simil|come /.test(t) || named) {
      if (named) { paras.push('Parto da ' + named.name + ' e cerco cosa gli somiglia' + (seas || occ ? ', adatto al contesto che mi dici' : '') + ', sopra la tua soglia di persistenza.'); cards = E.neighbours(named, 'none', 12).filter(function (n) { return ctxFilter(n.p) && E.lonOk(n.p) && !E.statusOf(n.p.id); }).slice(0, 3).map(function (n) { return { p: n.p, pct: Math.round(n.aff * 100), why: 'In comune con ' + named.name + ': ' + (E.shared(named, n.p).slice(0, 3).join(', ') || 'il profilo') + '.' }; }); }
      else { paras.push('Ho cercato fuori dal tuo guardaroba i profumi più vicini al tuo gusto' + (seas ? ', adatti alla ' + S[seas].replace('estate', 'stagione calda').replace('inverno', 'stagione fredda') : '') + (occ === 'U' ? ', portabili in ufficio' : '') + '. Tutti sopra la tua soglia di persistenza.'); cards = E.recommend({ n: 3, filter: ctxFilter }).list.map(function (r) { return { p: r.p, pct: Math.round(r.fit * 100), why: why(r.p) }; }); }
      if (!cards.length) paras.push('Con questi vincoli il catalogo non ha niente di convincente: prova ad allargare, o collega Claude per una ricerca più ampia.');
    } else {
      var P = E.items('present').filter(function (x) { return (!seas || E.seasonsOf(x).indexOf(seas) >= 0) && (!occ || !(x.w.occ || []).length || x.w.occ.indexOf(occ) >= 0); });
      if (P.length) { var x = P.sort(function (a, b) { return (b.w.rating || 3) - (a.w.rating || 3); })[0]; paras.push('Dal tuo guardaroba' + (seas ? ', per ' + S[seas] : '') + (occ ? ', per ' + { U: 'l’ufficio', S: 'la sera', L: 'il tempo libero' }[occ] : '') + ', metterei ' + x.p.name + '. ' + ((x.p.lon || 3) >= 4 ? 'Ha una persistenza ' + E.LONLAB[x.p.lon] + ': uno o due spruzzi bastano, soprattutto al chiuso.' : '')); cards.push({ p: x.p, pct: null, why: 'Nel tuo guardaroba. Fondo: ' + (x.p.base || []).join(', ') + '.' }); }
      else paras.push('Nel guardaroba non hai niente che copra bene questa situazione' + (seas ? ' (' + S[seas] + ')' : '') + '. È un buco da colmare.');
      paras.push('Da provare in profumeria per lo stesso contesto:');
      E.recommend({ n: 2, filter: ctxFilter }).list.forEach(function (r) { cards.push({ p: r.p, pct: Math.round(r.fit * 100), why: why(r.p) }); });
    }
    return { paras: paras, cards: cards.map(function (c) { return { pid: c.p.id, pct: c.pct, why: c.why }; }) };
  };
  OLF.sommelierContext = function () {
    var ward = E.items().map(function (x) { return { nome: x.p.name, marca: x.p.brand, stato: x.w.status, voto: x.w.rating || null, persistenza: x.p.lon, fondo: x.p.base, nota_personale: x.w.note || x.w.gift || '' }; });
    var cand = E.recommend({ n: 14, includeWishes: true }).list.map(function (r) { return { id: r.p.id, nome: r.p.name, marca: r.p.brand, affinita: Math.round(r.fit * 100), persistenza: r.p.lon, famiglia: r.p.fam, note: Object.keys(E.weights(r.p)).slice(0, 8) }; });
    return 'Sei il Sommelier di Olfattiva, un atlante privato di profumeria maschile con un solo utente: Andrea, detto Rea. Rispondi in italiano, con tono competente e asciutto, in 2-4 paragrafi brevi, senza elenchi puntati e senza markdown.\n' +
      'Regole: consiglia SOLO profumi presenti in GUARDAROBA o CANDIDATI; non inventare note o dati; Rea non ama i profumi poco persistenti (scala 1-5, soglia ' + OLF.user.prefs.minLon + '); quando usi un dato dì da dove viene (guardaroba, motore di affinità, scheda).\n' +
      'Chiudi SEMPRE con una riga finale nel formato esatto: SCHEDE: id1, id2, id3 (usa gli id dei CANDIDATI citati, massimo 3; se non citi candidati scrivi SCHEDE: nessuna).\n' +
      'GUARDAROBA: ' + JSON.stringify(ward) + '\nCANDIDATI (ordinati per affinità calcolata): ' + JSON.stringify(cand);
  };
  V.sommelier = function () {
    var chat = OLF.user.chat || [], hasKey = !!OLF.store.apiKey();
    var prompts = ['Qualcosa di scuro come Black Afgano, ma portabile in ufficio.', 'Perché mi piace Dark Lord? Spiegami com’è fatto.', 'Voglio qualcosa di nuovo che mi somigli, per l’inverno.', 'Cosa metto per una cena d’estate all’aperto?'];
    var out = '<div class="cols"><aside class="side-sm stack-lg"><div class="stack" style="gap:10px"><div class="eyebrow">Sommelier · ' + (hasKey ? 'collegato a Claude' : 'modalità locale') + '</div><h1 class="h1" style="font-size:52px">Chiedi al <em>naso</em></h1></div>' +
      '<div class="card"><span class="label">Cosa sa di te</span><span class="muted" style="font-size:13.5px">' + E.items('present').length + ' profumi presenti, ' + E.items('past').length + ' passati, ' + E.items('future').length + ' desideri, la tua soglia di persistenza, ' + OLF.DATA.shops.length + ' profumerie mappate.</span>' +
      '<span class="muted" style="font-size:13.5px">' + (hasKey ? 'Le risposte arrivano da Claude, che legge solo il tuo guardaroba e i candidati calcolati dal motore.' : 'Senza collegamenti risponde il motore interno: gratis e offline. Per conversazioni libere collega Claude dalle impostazioni.') + '</span>' + (hasKey ? '' : '<a class="link acc" href="#/impostazioni">Collega Claude</a>') + '</div>' +
      '<div class="stack-sm"><span class="label">Prova una domanda</span>' + prompts.map(function (p) { return '<button class="btn sm" style="justify-content:flex-start;text-align:left;padding:10px 14px;font-weight:500;line-height:1.35" data-act="ask" data-q="' + h(p) + '">' + h(p) + '</button>'; }).join('') + '</div></aside>';
    out += '<div class="grow stack"><div class="chat" id="chat" aria-live="polite">' + (chat.length ? chat.map(function (m) {
      if (m.role === 'user') return '<div class="msg-u">' + h(m.text) + '</div>';
      return '<div class="msg-a"><div class="eyebrow">Sommelier' + (m.src === 'claude' ? ' · Claude' : '') + '</div>' + m.paras.map(function (p) { return '<p>' + h(p) + '</p>'; }).join('') + ((m.cards || []).length ? '<div class="grid g3" style="margin-top:6px">' + m.cards.map(function (c) { var p = E.byId(c.pid); return p ? '<a class="card" href="#/profumo/' + p.id + '" style="padding:16px;gap:6px"><span class="row between" style="flex-wrap:nowrap;align-items:baseline"><span class="serif" style="font-size:20px;line-height:1.15">' + h(p.name) + '</span>' + (c.pct ? '<span class="pct" style="font-size:24px;color:var(--accent)">' + c.pct + '%</span>' : '') + '</span><span class="cap">' + C.meta(p) + ' · ' + C.st(p.id) + '</span>' + (c.why ? '<span style="font-size:13.5px">' + h(c.why) + '</span>' : '') + '</a>' : ''; }).join('') + '</div>' : '') + '</div>';
    }).join('') : '<p class="muted">Fai una domanda qui sotto, o tocca uno degli esempi. ' + (UI.asking ? '' : '') + '</p>') + (UI.asking ? '<p class="cap">Il Sommelier sta annusando…</p>' : '') + '</div>' +
      '<form class="row end" data-form="ask" style="flex-wrap:nowrap"><div class="field grow"><label for="askq">Scrivi al Sommelier</label><input class="input" id="askq" name="q" placeholder="es. domani ho un matrimonio in giardino, cosa metto?" required autocomplete="off"></div><button class="btn dark" type="submit"' + (UI.asking ? ' disabled' : '') + '>Invia</button></form>' +
      (chat.length ? '<button class="link" style="align-self:flex-start;background:none;border:none" data-act="clearChat">Svuota la conversazione</button>' : '') + '</div></div>';
    return out;
  };

  /* ---------- Note */
  V.note = function (name) {
    var idx = E.noteIndex();
    if (!name) {
      var q = (UI.noteQuery || '').toLowerCase(), byCat = {}; Object.keys(idx).forEach(function (n) { if (q && n.indexOf(q) < 0) return; (byCat[E.noteCat(n)] = byCat[E.noteCat(n)] || []).push(n); });
      var mine = {}; E.liked().forEach(function (l) { Object.keys(E.weights(l.p)).forEach(function (n) { mine[n] = 1; }); });
      return C.head('Note e materie prime', 'Da una <em>nota</em> a tutto il resto', 'Ogni nota apre tre strade: la materia prima, i profumi che la contengono, le marche che la usano. Quelle piene sono già passate sulla tua pelle.') +
        '<div class="field" style="max-width:480px;margin-bottom:28px"><label for="nq">Cerca una nota</label><input class="input" id="nq" type="search" value="' + h(UI.noteQuery || '') + '" data-input="noteQuery" placeholder="es. vetiver, cuoio, rum"></div><div class="stack-lg" id="notelist">' +
        E.CATS.filter(function (c) { return byCat[c]; }).map(function (c) { return '<section class="stack" style="gap:12px"><h2 class="h3 rule">' + h(OLF.DATA.cats[c]) + '</h2><div class="row" style="gap:6px">' + byCat[c].sort().map(function (n) { return '<a class="chip' + (mine[n] ? ' on' : '') + '" href="#/note/' + encodeURIComponent(n) + '">' + h(OLF.cap(n)) + ' <span class="mono" style="font-size:11px;padding-left:6px;opacity:.7">' + idx[n].length + '</span></a>'; }).join('') + '</div></section>'; }).join('') + '</div>';
    }
    var rows = idx[name] || [], pr = OLF.DATA.noteProfiles[name], cat = E.noteCat(name), lv = { top: 0, heart: 0, base: 0 }, brands = {};
    rows.forEach(function (r) { lv[r.lvl]++; brands[r.p.brand] = (brands[r.p.brand] || 0) + 1; });
    var tier = pr ? pr.tier : ['top', 'heart', 'base'].sort(function (a, b) { return lv[b] - lv[a]; })[0];
    rows.sort(function (a, b) { return (E.statusOf(b.p.id) ? 1 : 0) - (E.statusOf(a.p.id) ? 1 : 0) || E.fit(b.p) - E.fit(a.p); });
    var out = '<div class="cols"><div class="grow stack" style="gap:24px"><div class="stack-sm"><div class="eyebrow"><a href="#/note">Note</a> / ' + h(OLF.DATA.cats[cat]) + '</div><h1 class="h1" style="font-style:italic">' + h(OLF.cap(name)) + '</h1>' + (pr ? '<div class="mono muted" style="font-size:14px">' + h(pr.latin) + '</div>' : '') + '</div>' +
      (pr ? '<p class="lede" style="color:var(--ink)">' + h(pr.desc) + '</p><div class="facts"><div><span class="k">Parte usata</span><span class="v">' + h(pr.part) + '</span></div><div><span class="k">Estrazione</span><span class="v">' + h(pr.extraction) + '</span></div><div><span class="k">Origini</span><span class="v">' + h(pr.origins) + '</span></div><div><span class="k">Al naso</span><span class="v">' + h(pr.descriptors) + '</span></div></div>'
        : '<p class="lede">Nel catalogo compare in ' + rows.length + ' profumi, quasi sempre ' + { top: 'in testa', heart: 'nel cuore', base: 'nel fondo' }[tier] + '. La scheda della materia prima non è ancora scritta.</p>') +
      '<div class="stack" style="gap:12px"><span class="label">Dove vive di solito nella piramide</span><div class="tiers"><div class="tier' + (tier === 'top' ? ' on' : '') + '" style="width:40%">Testa</div><div class="tier' + (tier === 'heart' ? ' on' : '') + '" style="width:70%">Cuore</div><div class="tier' + (tier === 'base' ? ' on' : '') + '" style="width:100%">Fondo</div></div>' +
      '<span class="cap">' + (tier === 'top' ? 'Le note di testa evaporano in minuti: da sole non danno persistenza.' : (tier === 'base' ? 'Le note di fondo sono quelle che restano per ore.' : '')) + '</span></div>' + (pr ? '<div class="stack-sm"><span class="label">Si sposa con</span><span class="muted">' + h(pr.pairs) + '</span></div>' : '') + '</div>';
    out += '<aside class="stack" style="width:min(460px,100%);flex-shrink:0"><div class="row between rule" style="align-items:baseline"><h2 class="h3">Profumi con ' + h(name) + '</h2><span class="mono cap">' + rows.length + '</span></div><div class="list">' + rows.map(function (r) { return C.prow(r.p, '<span class="tag">' + E.LVL[r.lvl] + '</span>'); }).join('') + '</div>' +
      '<div class="card"><span class="label">Marche che la usano</span><span class="muted">' + Object.keys(brands).sort(function (a, b) { return brands[b] - brands[a]; }).map(h).join(' · ') + '</span><a class="link acc" href="#/maison">Vai alle maison</a></div></aside></div>';
    return out;
  };

  /* ---------- Catalogo e scheda */
  V.catalogo = function () {
    var f = UI.cat = UI.cat || { q: '', fam: '', lon: false, sort: 'fit' }, q = f.q.toLowerCase();
    var list = E.all().filter(function (p) { return (!q || (p.name + ' ' + p.brand + ' ' + (p.nose || '')).toLowerCase().indexOf(q) >= 0) && (!f.fam || p.fam === f.fam) && (!f.lon || E.lonOk(p)); });
    list.sort(f.sort === 'year' ? function (a, b) { return (b.year || 0) - (a.year || 0); } : (f.sort === 'name' ? function (a, b) { return a.name.localeCompare(b.name); } : function (a, b) { return E.fit(b) - E.fit(a); }));
    return C.head('Catalogo · ' + E.all().length + ' schede', 'Tutti i <em>profumi</em>', 'Piramidi da fonti pubbliche, persistenza come stima editoriale. Ogni scheda si può correggere; nuove schede si aggiungono a mano o con il motore di aggiornamento.', '<a class="btn" href="#/guardaroba/nuovo">Aggiungi una scheda</a>') +
      '<div class="row end" style="margin-bottom:20px"><div class="field grow" style="min-width:220px"><label for="cq">Cerca per nome, marca o naso</label><input class="input" id="cq" type="search" value="' + h(f.q) + '" data-input="catQuery"></div><div class="field"><label for="cfam">Famiglia</label><select class="input" id="cfam" data-change="catFam"><option value="">Tutte</option>' + E.FAMS.map(function (x) { return '<option' + (f.fam === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="csort">Ordina per</label><select class="input" id="csort" data-change="catSort"><option value="fit"' + (f.sort === 'fit' ? ' selected' : '') + '>Affinità con me</option><option value="year"' + (f.sort === 'year' ? ' selected' : '') + '>Anno</option><option value="name"' + (f.sort === 'name' ? ' selected' : '') + '>Nome</option></select></div><label class="check"><input type="checkbox" data-change="catLon"' + (f.lon ? ' checked' : '') + '> Solo sopra la mia soglia di persistenza</label></div>' +
      '<div class="list" id="catlist">' + V.catRows(list) + '</div>';
  };
  V.catRows = function (list) { return list.map(function (p) { var ft = E.fit(p); return C.prow(p, '<span class="row" style="gap:16px;flex-wrap:nowrap"><span class="cap" style="min-width:70px;text-align:right">' + h(p.fam) + '</span>' + C.lon(p.lon) + '<span class="pct" style="min-width:64px;text-align:right">' + (ft ? Math.round(ft * 100) + '%' : '') + '</span></span>', p.nose ? 'naso: ' + h(p.nose) : ''); }).join('') || '<p class="muted" style="padding:20px 0">Nessuna scheda con questi filtri.</p>'; };

  V.profumo = function (id) {
    var p = E.byId(id); if (!p) return '<div class="empty">Scheda non trovata. <a class="link acc" href="#/catalogo">Torna al catalogo</a></div>';
    var w = E.item(id), ft = E.fit(p), mz = OLF.DATA.brandMaison[p.brand], same = E.sameNose(p), nb = E.neighbours(p, 'none', 4), mols = OLF.DATA.molecules.filter(function (m) { return m.perfumes.indexOf(p.id) >= 0; });
    var art = OLF.DATA.articles.filter(function (a) { return a.links.some(function (l) { return l[0] === 'profumo' && l[1] === p.id; }); })[0];
    var out = '<section class="cols" style="margin-bottom:40px"><div class="card" style="width:min(320px,100%);flex-shrink:0;align-items:center;justify-content:center;min-height:320px;gap:18px"><span style="transform:scale(2.2);margin:50px 0">' + C.bottle(p, w && w.level != null ? w.level : 60, w && w.status === 'future') + '</span><span class="cap mono">' + h(p.conc || 'concentrazione non indicata') + '</span></div>' +
      '<div class="grow stack" style="gap:20px"><div class="eyebrow"><a href="#/catalogo">Catalogo</a> / ' + (mz ? '<a href="#/maison/' + mz + '">' + h(p.brand) + '</a>' : h(p.brand)) + ' / ' + h(p.fam) + '</div><h1 class="h1">' + h(p.name) + '</h1>' +
      '<div class="facts"><div><span class="k">Anno</span><span class="v">' + h(p.year || 'non indicato') + '</span></div><div><span class="k">Naso</span><span class="v">' + h(p.nose || 'non dichiarato') + '</span></div><div><span class="k">Famiglia</span><span class="v">' + h(p.fam) + '</span></div><div><span class="k">Persistenza</span><span class="v">' + OLF.cap(E.LONLAB[p.lon || 3]) + ' ' + C.lon(p.lon) + '</span></div>' + (ft && !w ? '<div><span class="k">Affinità con il tuo gusto</span><span class="v serif" style="color:var(--accent)">' + Math.round(ft * 100) + '%</span></div>' : '') + '</div>' +
      (E.lonOk(p) ? '' : '<div class="error">Sotto la tua soglia di persistenza: il motore non te lo proporrà, ma la scheda resta consultabile.</div>') + (p.ai ? '<div class="error">Scheda compilata da Claude e non ancora verificata: controlla note e anno.</div>' : '') +
      '<div class="row">' + (w ? '<a class="btn primary" href="#/guardaroba/' + p.id + '">' + OLF.cap(E.STLAB[w.status]) + ': aggiorna</a><button class="btn" data-act="wearToday" data-pid="' + p.id + '">Indossato oggi</button>' : '<button class="btn primary" data-act="addItem" data-pid="' + p.id + '" data-status="present">Ce l’ho</button><button class="btn" data-act="addItem" data-pid="' + p.id + '" data-status="past">L’ho avuto</button><button class="btn" data-act="addItem" data-pid="' + p.id + '" data-status="future">Lo voglio</button>') +
      '<a class="btn" href="#/affinita/' + p.id + '">Vedi sulla mappa</a><a class="link" href="#/profumerie">Dove annusarlo</a></div>' +
      '<div class="row end"><div class="field"><label for="plon">Sulla mia pelle dura</label><select class="input" id="plon" data-change="lonOverride" data-pid="' + p.id + '" style="min-height:44px">' + [1, 2, 3, 4, 5].map(function (n) { return '<option value="' + n + '"' + ((p.lon || 3) === n ? ' selected' : '') + '>' + n + ' · ' + E.LONLAB[n] + '</option>'; }).join('') + '</select></div>' + (p.custom ? '<button class="btn sm danger" data-act="deleteCustom" data-pid="' + p.id + '">Elimina la scheda</button>' : '') + '</div>' +
      (art ? '<a class="link acc" href="#/quaderni/' + art.id + '">Leggi nei Quaderni: ' + h(art.title) + '</a>' : '') + '</div></section>';
    out += '<section class="band night" style="margin-top:0"><div class="row between" style="margin-bottom:24px;align-items:baseline"><h2 class="h2">Piramide olfattiva</h2><span class="muted" style="font-size:13.5px">Tocca una nota per vedere tutti i profumi che la contengono</span></div>' + C.pyramid(p) + '<p class="cap" style="margin-top:14px">Tempi indicativi: cambiano con pelle, clima e concentrazione.' + (p.brand === 'Nasomatto' ? ' Nasomatto non dichiara le formule: queste note sono quelle riconosciute dalla comunità.' : '') + '</p></section>';
    out += '<section class="section grid g3" style="gap:40px"><div class="stack-sm"><h2 class="h3 rule">Affini per struttura</h2><div class="list">' + nb.map(function (n) { return C.prow(n.p, '<span class="pct" style="font-size:22px">' + Math.round(n.aff * 100) + '%</span>', 'in comune: ' + h(E.shared(p, n.p).slice(0, 3).join(', ') || 'il profilo')); }).join('') + '</div></div>' +
      '<div class="stack-sm"><h2 class="h3 rule">Della stessa mano</h2>' + (same.length ? '<div class="list">' + same.map(function (q) { return C.prow(q, '<span class="mono cap">' + (q.year || '') + '</span>'); }).join('') + '</div>' : '<p class="cap" style="padding:12px 0">' + (p.nose ? 'Nessun altro profumo di ' + h(p.nose) + ' nel catalogo, per ora.' : 'Naso non dichiarato.') + '</p>') + '</div>' +
      '<div class="stack-sm"><h2 class="h3 rule">Molecole chiave</h2>' + (mols.length ? '<div class="list">' + mols.map(function (m) { return '<a href="#/molecole/' + m.id + '"><span class="stack-sm"><span class="t">' + h(m.name) + '</span><span class="s">' + h(m.smell) + '</span></span></a>'; }).join('') + '</div><p class="cap">Secondo le analisi e le fonti più citate: le formule non sono pubbliche.</p>' : '<p class="cap" style="padding:12px 0">Nessuna molecola collegata a questa scheda.</p>') + '</div></section>';
    return out;
  };

  /* ---------- Molecole */
  V.molecole = function (id) {
    var M = OLF.DATA.molecules, cur = M.filter(function (m) { return m.id === id; })[0] || M[0], mine = cur.perfumes.map(E.byId).filter(function (p) { return p && E.statusOf(p.id); });
    return '<div class="cols"><aside class="side-sm stack"><div class="eyebrow">Livello molecolare</div><div class="stack" style="gap:8px">' + M.map(function (m) { return '<a class="btn' + (m.id === cur.id ? ' dark' : '') + '" style="flex-direction:column;align-items:flex-start;gap:2px;padding:10px 16px;min-height:60px" href="#/molecole/' + m.id + '"><span class="serif" style="font-size:20px;font-weight:400">' + h(m.name) + '</span><span style="font-size:12.5px;font-weight:400;opacity:.8">da: ' + h(m.src) + '</span></a>'; }).join('') + '</div><p class="cap" style="border-top:1px solid var(--line);padding-top:14px">Una nota in piramide è un’impressione. Qui sotto c’è ciò che il naso ha messo davvero nella formula.</p></aside>' +
      '<div class="grow stack" style="gap:24px"><div class="stack-sm"><div class="eyebrow">Dalla nota alla molecola / ' + h(cur.src) + '</div><h1 class="h1" style="font-style:italic">' + h(cur.name) + '</h1><div class="mono muted" style="font-size:14px">' + h(cur.formula) + ' · CAS ' + h(cur.cas) + '</div></div><p class="lede" style="color:var(--ink)">' + h(cur.desc) + '</p>' +
      '<div class="facts"><div><span class="k">Origine</span><span class="v">' + h(cur.origin) + '</span></div><div><span class="k">Al naso</span><span class="v">' + h(cur.smell) + '</span></div><div><span class="k">Sostituisce o amplifica</span><span class="v">' + h(cur.replaces) + '</span></div></div>' +
      '<div class="stack" style="gap:12px"><span class="label">Quanto dura sulla pelle</span><div class="row" style="gap:6px;max-width:580px;flex-wrap:nowrap">' + [[1, 'Minuti'], [2, 'Ore'], [3, 'Giorni sui tessuti']].map(function (t) { return '<div class="tier grow' + (cur.tier === t[0] ? ' on' : '') + '">' + t[1] + '</div>'; }).join('') + '</div></div>' +
      '<div class="card night"><div class="eyebrow">Nel guardaroba di Rea</div><div class="serif" style="font-size:22px;line-height:1.3">' + (mine.length ? mine.map(function (p) { return h(p.name); }).join(' · ') : 'Nessuno dei tuoi profumi, per ora') + '</div><div class="cap">Le formule non sono pubbliche: presenza secondo le analisi e le fonti più citate.</div></div>' +
      '<div class="card"><span class="label">Esperimento per il tuo naso</span><span class="muted">' + h(cur.test) + '</span></div></div>' +
      '<aside class="stack-sm" style="width:min(380px,100%);flex-shrink:0"><h2 class="h3 rule">Dove è protagonista</h2><div class="list">' + cur.perfumes.map(E.byId).filter(Boolean).map(function (p) { return C.prow(p, '<span class="mono cap">' + p.year + '</span>'); }).join('') + cur.extra.map(function (x) { return '<div><span class="stack-sm"><span class="t">' + h(x[0]) + '</span><span class="s">' + h(x[1]) + '</span></span><span class="mono cap">' + x[2] + '</span></div>'; }).join('') + '</div></aside></div>';
  };

  /* ---------- Maison */
  V.maison = function (id) {
    var M = OLF.DATA.maisons, cur = M.filter(function (m) { return m.id === id; })[0] || M[0];
    var brands = Object.keys(OLF.DATA.brandMaison).filter(function (b) { return OLF.DATA.brandMaison[b] === cur.id; }), perf = E.all().filter(function (p) { return brands.indexOf(p.brand) >= 0; }).sort(function (a, b) { return (a.year || 0) - (b.year || 0); });
    return '<div class="cols"><aside class="side-sm stack-lg"><div class="stack-sm"><div class="eyebrow" style="padding-bottom:8px">Maison</div>' + M.map(function (m) { return '<a class="btn' + (m.id === cur.id ? ' dark' : ' ghost') + '" style="justify-content:flex-start;padding:0 12px" href="#/maison/' + m.id + '">' + h(m.name) + '</a>'; }).join('') + '</div>' +
      '<div class="stack-sm"><div class="eyebrow" style="padding-bottom:8px">Case essenziere</div><p class="cap">Dove lavorano quasi tutti i nasi, e dove nascono le molecole:</p><p class="muted" style="font-size:14.5px">' + OLF.DATA.essenziere.map(h).join(' · ') + '</p></div></aside>' +
      '<div class="grow stack-lg"><header class="stack"><div class="eyebrow">Maison · ' + h(cur.place) + ' · dal ' + cur.since + '</div><h1 class="h1" style="font-size:clamp(56px,10vw,128px)">' + h(cur.name) + '</h1><p class="lede" style="color:var(--ink)">' + h(cur.lede) + '</p></header>' +
      '<div class="facts"><div><span class="k">Fondatore</span><span class="v">' + h(cur.founder) + '</span></div><div><span class="k">Proprietà</span><span class="v">' + h(cur.owner) + '</span></div><div><span class="k">Nel catalogo</span><span class="v">' + perf.length + ' profumi</span></div></div>' +
      '<section class="stack"><h2 class="h2">Cronologia</h2><div class="grid g2" style="column-gap:40px;row-gap:0">' + cur.timeline.map(function (t) { return '<div class="row" style="gap:20px;padding:16px 0;border-top:1px solid var(--line);align-items:flex-start;flex-wrap:nowrap"><div class="serif" style="width:84px;flex-shrink:0;font-size:32px;line-height:1">' + t[0] + '</div><div class="stack-sm"><div style="font-weight:600">' + h(t[1]) + '</div><div class="muted" style="font-size:14px">' + h(t[2]) + '</div></div></div>'; }).join('') + '</div></section>' +
      '<section class="stack-sm"><h2 class="h3 rule">Nel catalogo</h2><div class="list">' + perf.map(function (p) { return C.prow(p, '<span class="row" style="gap:14px;flex-wrap:nowrap">' + C.lon(p.lon) + '<span class="mono cap">' + p.year + '</span></span>'); }).join('') + '</div></section></div></div>';
  };

  /* ---------- Profumerie */
  V.profumerie = function () {
    var S = OLF.DATA.shops, areas = [], q = (UI.shopBrand || '').toLowerCase(); S.forEach(function (s) { if (areas.indexOf(s.area) < 0) areas.push(s.area); });
    var area = UI.area = UI.area || areas[0], wishBrands = {}; E.items('future').forEach(function (x) { wishBrands[x.p.brand] = 1; });
    var list = q ? S.filter(function (s) { return s.brands.join(' ').toLowerCase().indexOf(q) >= 0; }) : S.filter(function (s) { return s.area === area; });
    var pins = {}; S.forEach(function (s) { var k = s.city; pins[k] = pins[k] || { x: s.x, y: s.y, n: 0, area: s.area, city: s.city }; pins[k].n++; });
    var svg = '<svg viewBox="0 0 860 620" role="img" aria-label="Mappa schematica del Nord Italia con le città mappate" style="display:block;width:100%;height:auto;background:var(--surface);border:1px solid var(--line)">' +
      '<path d="M79 620 L118 602 L168 582 L221 498 L274 478 L330 506 L379 540 L430 586 L440 620 Z" style="fill:var(--track);stroke:var(--line2)"/><path d="M760 620 L742 580 L703 548 L669 476 L701 370 L671 316 L677 274 L713 260 L770 224 L816 200 L845 230 L840 250 L815 274 L829 344 L852 386 L860 400 L860 620 Z" style="fill:var(--track);stroke:var(--line2)"/>' +
      '<path d="M127 346 C 200 372, 290 330, 365 350 S 480 346, 589 380 S 670 384, 701 370" style="fill:none;stroke:var(--line2);stroke-width:1.2;stroke-dasharray:5 4"/><ellipse cx="483" cy="228" rx="8" ry="26" transform="rotate(12 483 228)" style="fill:var(--track);stroke:var(--line2)"/>' +
      OLF.DATA.todoCities.map(function (c) { return '<circle cx="' + c[1] + '" cy="' + c[2] + '" r="5" style="fill:var(--surface);stroke:var(--cap);stroke-width:1.4"/><text x="' + (c[1] + 10) + '" y="' + (c[2] + 4) + '" style="font-size:12px;fill:var(--ink2)">' + h(c[0]) + '</text>'; }).join('') +
      Object.keys(pins).map(function (k) { var p = pins[k], on = !q && p.area === area; return '<g class="pt" data-act="area" data-area="' + h(p.area) + '" tabindex="0" role="button" aria-label="' + h(p.city + ', ' + p.n + ' profumerie') + '" style="cursor:pointer"><circle cx="' + p.x + '" cy="' + p.y + '" r="22" style="fill:transparent"/><circle cx="' + p.x + '" cy="' + p.y + '" r="14" style="fill:' + (on ? 'var(--accent)' : 'var(--ink)') + ';stroke:var(--surface);stroke-width:2"/><text x="' + p.x + '" y="' + (p.y + 4) + '" style="font-family:var(--mono);font-size:12px;fill:' + (on ? 'var(--on-accent)' : 'var(--paper)') + ';text-anchor:middle;pointer-events:none">' + p.n + '</text><text x="' + p.x + '" y="' + (p.y + 34) + '" style="font-size:13px;font-weight:600;fill:var(--ink);text-anchor:middle;pointer-events:none">' + h(p.city) + '</text></g>'; }).join('') + '</svg>';
    return C.head('Profumerie d’Italia · focus Nord', 'Dove annusare <em>davvero</em>', null, '<div class="field" style="width:min(380px,100%)"><label for="sb">Trova chi tratta una marca</label><input class="input" id="sb" type="search" value="' + h(UI.shopBrand || '') + '" data-input="shopBrand" placeholder="es. Orto Parisi, Creed"></div>') +
      '<div class="row" style="gap:8px;margin-bottom:24px">' + areas.map(function (a) { return '<button class="pill' + (!q && a === area ? ' on' : '') + '" data-act="area" data-area="' + h(a) + '">' + h(a) + ' <span class="mono">' + S.filter(function (s) { return s.area === a; }).length + '</span></button>'; }).join('') + '</div>' +
      '<div class="cols"><div class="grow stack" style="gap:12px">' + svg + '<div class="row cap between"><span class="row" style="gap:16px"><span class="row" style="gap:6px"><span style="width:11px;height:11px;border-radius:9px;background:var(--ink)"></span>negozi mappati</span><span class="row" style="gap:6px"><span style="width:10px;height:10px;border-radius:9px;border:1.4px solid var(--cap)"></span>città da mappare</span></span><span class="mono" style="font-size:11.5px">Mappa schematica, funziona anche offline</span></div></div>' +
      '<aside class="stack" style="width:min(440px,100%);flex-shrink:0"><div class="row between rule" style="align-items:baseline"><h2 class="h3">' + h(q ? 'Trattano «' + UI.shopBrand + '»' : area) + '</h2><span class="mono cap">' + list.length + ' in elenco</span></div><div class="list" id="shoplist">' + (list.map(function (s) {
        var wish = s.brands.filter(function (b) { return wishBrands[b]; });
        return '<div style="align-items:flex-start"><span class="stack-sm"><span class="t">' + h(s.name) + '</span><span class="s">' + h(s.city) + (s.addr ? ' · ' + h(s.addr) : ' · indirizzo da verificare') + '</span><span class="x">Marche: ' + (s.brands.length ? h(s.brands.join(', ')) : 'da verificare con il negozio') + '</span>' + (wish.length ? '<span class="x" style="color:var(--accent);font-weight:600">Tratta una marca dei tuoi desideri: ' + h(wish.join(', ')) + '</span>' : '') + '</span>' +
          '<a class="link" style="flex-shrink:0" target="_blank" rel="noopener" href="https://www.openstreetmap.org/search?query=' + encodeURIComponent(s.name + ' ' + s.city) + '">Mappa</a></div>';
      }).join('') || '<p class="muted" style="padding:16px 0">Nessun negozio mappato con questa marca: le marche trattate sono ancora in gran parte da verificare.</p>') + '</div><a class="btn" href="#/banco">Sei in negozio? Apri la modalità banco</a></aside></div>';
  };

  /* ---------- Quaderni */
  V.quaderni = function (id) {
    var A = OLF.DATA.articles, a = A.filter(function (x) { return x.id === id; })[0];
    if (a) {
      var lk = { nota: '#/note/', profumo: '#/profumo/', molecola: '#/molecole/', maison: '#/maison/' };
      return '<article class="stack-lg"><header class="stack" style="max-width:860px"><div class="eyebrow"><a href="#/quaderni">Quaderni</a> / ' + h(a.kind) + '</div><h1 class="h1">' + h(a.title) + '</h1><p class="lede">' + h(a.lede) + '</p></header><div class="prose">' + a.body.map(function (p) { return '<p>' + h(p) + '</p>'; }).join('') + '</div>' +
        '<div class="stack-sm"><span class="label">Collegato nell’atlante</span><div class="row" style="gap:6px">' + a.links.map(function (l) { var label = l[0] === 'profumo' ? (E.byId(l[1]) || {}).name : (l[0] === 'molecola' ? (OLF.DATA.molecules.filter(function (m) { return m.id === l[1]; })[0] || {}).name : (l[0] === 'maison' ? (OLF.DATA.maisons.filter(function (m) { return m.id === l[1]; })[0] || {}).name : OLF.cap(l[1]))); return '<a class="chip" href="' + lk[l[0]] + encodeURIComponent(l[1]) + '">' + h(label || l[1]) + '</a>'; }).join('') + '</div></div></article>';
    }
    return C.head('Quaderni · contenuti originali', 'Quaderni', 'Niente comunicati stampa riscritti: pezzi scritti per questo atlante, collegati a note, profumi, molecole e maison. I primi partono dai tuoi profumi.') +
      '<div class="grid g2">' + A.map(function (x, i) { return '<a class="card' + (i === 0 ? ' night' : '') + '" href="#/quaderni/' + x.id + '" style="min-height:220px"><span class="eyebrow">' + h(x.kind) + '</span><span class="h2">' + h(x.title) + '</span><span class="muted">' + h(x.lede) + '</span><span class="link" style="margin-top:auto">Leggi</span></a>'; }).join('') + '</div>' +
      '<section class="band night"><div class="row between" style="margin-bottom:24px;align-items:baseline"><h2 class="h2">Pellegrinaggi</h2><span class="cap">Luoghi dove un appassionato dovrebbe andare almeno una volta</span></div><div class="grid g4" style="gap:28px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">' + OLF.DATA.pilgrimages.map(function (p) { return '<div class="stack-sm" style="border-top:1px solid var(--night-line);padding-top:16px"><div class="eyebrow">' + h(p[0]) + '</div><div class="serif" style="font-size:20px;line-height:1.2">' + h(p[1]) + '</div></div>'; }).join('') + '</div></section>';
  };
})();
