/* Olfattiva · motore: affinità, analisi del gusto, consigli. Tutto calcolato in locale, senza server. */
(function () {
  'use strict';
  var OLF = window.OLF, E = OLF.engine = {};
  var W = { top: 1.0, heart: 1.2, base: 1.5 };
  var CATS = ['AGR', 'ARO', 'MUS', 'FIO', 'LEG', 'CUO', 'RES', 'SPE'];
  E.CATS = CATS;
  E.FAMCOL = { 'Agrumati': '#C9A227', 'Aromatici': '#6F8F5B', 'Fougère': '#2D6646', 'Legnosi': '#7A5A3A', 'Cuoiati': '#4A3428', 'Ambrati': '#B5651D', 'Speziati': '#9C3D2A', 'Acquatici': '#4F7C8A' };
  E.FAMS = Object.keys(E.FAMCOL);
  E.LONLAB = ['', 'svanisce presto', 'leggera', 'media', 'lunga', 'lunghissima'];

  E.all = function () { return OLF.DATA.perfumes.concat(OLF.user.custom || []); };
  E.byId = function (id) { return E.all().find(function (p) { return p.id === id; }) || null; };
  E.noteCat = function (n) { return OLF.DATA.noteCat[n] || (OLF.user.noteCat || {})[n] || 'LEG'; };
  E.knownNote = function (n) { return !!(OLF.DATA.noteCat[n] || (OLF.user.noteCat || {})[n]); };

  E.weights = function (p) {
    if (p._w) return p._w;
    var w = {};
    ['top', 'heart', 'base'].forEach(function (l) { (p[l] || []).forEach(function (n) { w[n] = Math.max(w[n] || 0, W[l]); }); });
    Object.defineProperty(p, '_w', { value: w, enumerable: false, configurable: true });
    return w;
  };
  E.touch = function (p) { delete p._w; delete p._ax; delete p._cv; };
  E.catvec = function (p) {
    if (p._cv) return p._cv;
    var w = E.weights(p), tot = 0, v = {}, n;
    CATS.forEach(function (c) { v[c] = 0; });
    for (n in w) tot += w[n];
    for (n in w) v[E.noteCat(n)] += w[n] / (tot || 1);
    Object.defineProperty(p, '_cv', { value: v, enumerable: false, configurable: true });
    return v;
  };
  E.axes = function (p) {
    if (p._ax) return p._ax;
    var w = E.weights(p), v = E.catvec(p), tot = 0, sw = 0, dr = 0, n, S = OLF.DATA.sweet, D = OLF.DATA.dry;
    for (n in w) { tot += w[n]; if (S.indexOf(n) >= 0) sw += w[n]; if (D.indexOf(n) >= 0) dr += w[n]; }
    var ax = { warm: (v.RES + v.SPE + v.CUO + 0.3 * v.LEG) - (v.AGR + v.ARO + 0.6 * v.MUS + 0.3 * v.FIO), sweet: (sw - dr) / (tot || 1) };
    Object.defineProperty(p, '_ax', { value: ax, enumerable: false, configurable: true });
    return ax;
  };
  function cosine(a, b) {
    var d = 0, na = 0, nb = 0;
    CATS.forEach(function (c) { d += a[c] * b[c]; na += a[c] * a[c]; nb += b[c] * b[c]; });
    return d / ((Math.sqrt(na) * Math.sqrt(nb)) || 1);
  }
  /* Affinità = 50% note condivise (pesate per livello della piramide) + 50% somiglianza del profilo per categorie */
  E.affinity = function (a, b) {
    var wa = E.weights(a), wb = E.weights(b), inter = 0, sa = 0, sb = 0, n;
    for (n in wa) { sa += wa[n]; if (wb[n]) inter += Math.min(wa[n], wb[n]); }
    for (n in wb) sb += wb[n];
    return 0.5 * (inter / (Math.min(sa, sb) || 1)) + 0.5 * cosine(E.catvec(a), E.catvec(b));
  };
  E.shared = function (a, b) {
    var wa = E.weights(a), wb = E.weights(b);
    return Object.keys(wa).filter(function (n) { return wb[n]; }).sort(function (x, y) { return (wb[y] + wa[y]) - (wb[x] + wa[x]); });
  };

  /* ---------- guardaroba */
  E.items = function (status) {
    return (OLF.user.wardrobe || []).filter(function (w) { return !status || w.status === status; })
      .map(function (w) { return { w: w, p: E.byId(w.pid) }; }).filter(function (x) { return x.p; });
  };
  E.item = function (pid) { return (OLF.user.wardrobe || []).find(function (w) { return w.pid === pid; }) || null; };
  E.liked = function () {           // su cosa si basa il gusto: presenti (peso pieno), passati non bocciati (mezzo peso)
    return E.items().filter(function (x) { return x.w.status !== 'future' && !(x.w.rating && x.w.rating <= 2); })
      .map(function (x) { var base = x.w.status === 'present' ? 1 : 0.5; return { p: x.p, w: x.w, k: base * (x.w.rating ? x.w.rating / 4 : 1) }; });
  };
  E.fit = function (q) {
    var L = E.liked().filter(function (l) { return l.p.id !== q.id; }); if (!L.length) return 0;
    var s = L.map(function (l) { return { a: E.affinity(q, l.p), k: l.k }; }).sort(function (x, y) { return y.a * y.k - x.a * x.k; }).slice(0, 3);
    var num = 0, den = 0; s.forEach(function (x) { num += x.a * x.k; den += x.k; });
    return num / (den || 1);
  };
  E.lonOk = function (p) { var pr = OLF.user.prefs; return !pr.avoidLowLon || (p.lon || 3) >= (pr.minLon || 3); };
  E.recommend = function (opts) {
    opts = opts || {};
    var st = {}; E.items().forEach(function (x) { st[x.p.id] = x.w.status; });
    var out = [], skipped = [];
    E.all().forEach(function (q) {
      if (st[q.id] === 'past' || st[q.id] === 'present' || (st[q.id] === 'future' && !opts.includeWishes)) return;
      var f = E.fit(q); if (!f) return;
      var row = { p: q, fit: f, score: f + 0.02 * ((q.lon || 3) - 3) };
      if (opts.filter && !opts.filter(q)) return;
      (E.lonOk(q) ? out : skipped).push(row);
    });
    out.sort(function (a, b) { return b.score - a.score; }); skipped.sort(function (a, b) { return b.score - a.score; });
    return { list: out.slice(0, opts.n || 6), skipped: skipped.slice(0, 4) };
  };
  E.neighbours = function (seed, dir, n) {
    var sa = E.axes(seed), rows = [];
    E.all().forEach(function (c) {
      if (c.id === seed.id) return;
      var a = E.affinity(seed, c), sc = a, ca = E.axes(c), d;
      if (dir && dir !== 'none') {
        d = { caldo: ca.warm - sa.warm, fresco: sa.warm - ca.warm, dolce: ca.sweet - sa.sweet, secco: sa.sweet - ca.sweet, tenace: ((c.lon || 3) - (seed.lon || 3)) / 4 }[dir];
        if (d <= (dir === 'tenace' ? 0 : 0.05)) return; sc = a + 0.5 * d;
      }
      rows.push({ p: c, aff: a, score: sc });
    });
    return rows.sort(function (x, y) { return y.score - x.score; }).slice(0, n || 5);
  };

  /* ---------- analisi del gusto */
  E.profile = function (list) {
    var v = {}, tot = 0; CATS.forEach(function (c) { v[c] = 0; });
    (list || E.liked()).forEach(function (l) { var cv = E.catvec(l.p), k = l.k || 1; CATS.forEach(function (c) { v[c] += cv[c] * k; }); tot += k; });
    CATS.forEach(function (c) { v[c] = v[c] / (tot || 1); });
    return v;
  };
  E.centroid = function (list) {
    var x = 0, y = 0, t = 0; list.forEach(function (l) { var a = E.axes(l.p), k = l.k || 1; x += a.warm * k; y += a.sweet * k; t += k; });
    return t ? { warm: x / t, sweet: y / t } : null;
  };
  E.topNotes = function (n) {
    var c = {}, L = E.liked(); L.forEach(function (l) { Object.keys(E.weights(l.p)).forEach(function (k) { c[k] = (c[k] || 0) + 1; }); });
    return { total: L.length, list: Object.keys(c).map(function (k) { return { note: k, n: c[k] }; }).sort(function (a, b) { return b.n - a.n || a.note.localeCompare(b.note); }).slice(0, n || 8) };
  };
  E.eras = function () {             // ere automatiche: servono gli anni di acquisto
    var L = E.liked().filter(function (l) { return l.w.acq; }).sort(function (a, b) { return a.w.acq - b.w.acq; });
    if (L.length < 4) return { ready: false, dated: L.length, need: 4 };
    var k = L.length >= 6 ? 3 : 2, size = Math.ceil(L.length / k), eras = [], i;
    for (i = 0; i < k; i++) { var part = L.slice(i * size, (i + 1) * size); if (part.length) eras.push({ items: part, from: part[0].w.acq, to: part[part.length - 1].w.acq, profile: E.profile(part), centroid: E.centroid(part) }); }
    eras.forEach(function (e) {
      var best = CATS.slice().sort(function (a, b) { return e.profile[b] - e.profile[a]; })[0];
      e.name = { AGR: 'Era degli agrumi', ARO: 'Era verde', MUS: 'Era blu', FIO: 'Era dei fiori', LEG: 'Era della radice', CUO: 'Era del cuoio', RES: 'Era del fumo', SPE: 'Era delle spezie' }[best]; e.cat = best;
    });
    return { ready: true, eras: eras };
  };
  E.unexplored = function () {
    var pr = E.profile(), fams = {}; E.liked().forEach(function (l) { fams[l.p.fam] = 1; });
    return { cats: CATS.filter(function (c) { return pr[c] < 0.05; }), fams: E.FAMS.filter(function (f) { return !fams[f]; }) };
  };
  E.dupes = function () {
    var P = E.items('present'), out = [], i, j;
    for (i = 0; i < P.length; i++) for (j = i + 1; j < P.length; j++) { var a = E.affinity(P[i].p, P[j].p); if (a >= 0.6) out.push({ a: P[i].p, b: P[j].p, aff: a }); }
    return out.sort(function (x, y) { return y.aff - x.aff; }).slice(0, 3);
  };
  E.SEAS = [['P', 'Primavera'], ['E', 'Estate'], ['A', 'Autunno'], ['I', 'Inverno']];
  E.OCC = [['U', 'Ufficio'], ['S', 'Sera'], ['L', 'Tempo libero']];
  E.seasonsOf = function (x) {       // stagioni dichiarate, altrimenti dedotte dalla posizione sulla mappa
    if (x.w.seasons && x.w.seasons.length) return x.w.seasons;
    var a = E.axes(x.p); return a.warm > 0.25 ? ['A', 'I'] : (a.warm < -0.15 ? ['P', 'E'] : ['P', 'E', 'A', 'I']);
  };
  E.matrix = function () {
    var P = E.items('present'), tagged = P.filter(function (x) { return x.w.occ && x.w.occ.length; });
    var cells = {}; E.OCC.forEach(function (o) { E.SEAS.forEach(function (s) { cells[o[0] + s[0]] = tagged.filter(function (x) { return x.w.occ.indexOf(o[0]) >= 0 && E.seasonsOf(x).indexOf(s[0]) >= 0; }).map(function (x) { return x.p.name; }); }); });
    return { cells: cells, tagged: tagged.length, total: P.length };
  };
  E.seasonNow = function (temp) {
    if (temp != null) { if (temp >= 24) return 'E'; if (temp <= 9) return 'I'; }
    var m = new Date().getMonth(); return m <= 1 || m === 11 ? 'I' : (m <= 4 ? 'P' : (m <= 7 ? 'E' : 'A'));
  };
  E.lastWorn = function (w) { return (w.wears && w.wears.length) ? w.wears[w.wears.length - 1] : null; };
  E.pickToday = function (temp, skip) {
    var s = E.seasonNow(temp), P = E.items('present').filter(function (x) { return !skip || skip.indexOf(x.p.id) < 0; });
    if (!P.length) return null;
    var scored = P.map(function (x) {
      var last = E.lastWorn(x.w), days = last ? Math.min(30, Math.round((Date.now() - new Date(last).getTime()) / 864e5)) : 30;
      return { x: x, s: (E.seasonsOf(x).indexOf(s) >= 0 ? 2 : 0) + days / 30 + (x.w.rating || 3) / 10 };
    }).sort(function (a, b) { return b.s - a.s; });
    var top = scored[0].x, last = E.lastWorn(top.w);
    return { p: top.p, w: top.w, season: s, inSeason: E.seasonsOf(top).indexOf(s) >= 0, days: last ? Math.round((Date.now() - new Date(last).getTime()) / 864e5) : null };
  };
  E.wearsLastYear = function (w) { var lim = Date.now() - 365 * 864e5; return (w.wears || []).filter(function (d) { return new Date(d).getTime() >= lim; }).length; };

  /* ---------- note, nasi, marche */
  E.noteIndex = function () {
    var idx = {}; E.all().forEach(function (p) { ['top', 'heart', 'base'].forEach(function (l) { (p[l] || []).forEach(function (n) { (idx[n] = idx[n] || []).push({ p: p, lvl: l }); }); }); });
    return idx;
  };
  E.LVL = { top: 'Testa', heart: 'Cuore', base: 'Fondo' };
  E.sameNose = function (p) { return p.nose ? E.all().filter(function (q) { return q.id !== p.id && q.nose === p.nose; }) : []; };
  E.statusOf = function (pid) { var w = E.item(pid); return w ? w.status : null; };
  E.STLAB = { present: 'nel guardaroba', past: 'nel tuo passato', future: 'nei desideri' };
})();
