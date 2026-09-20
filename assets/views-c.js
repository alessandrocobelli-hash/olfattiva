/* Olfattiva · viste C: indice dell'Atlante, modalità banco, palestra del naso, layering, impostazioni */
(function () {
  'use strict';
  var OLF = window.OLF, E = OLF.engine, V = OLF.views, C = OLF.c, UI = OLF.ui, h = OLF.esc;

  V.atlante = function () {
    var secs = [['gusto', 'Evoluzione del gusto', 'Ere, impronta, note di sempre, territori inesplorati.'], ['note', 'Note e materie prime', 'Da un ingrediente ai profumi e alle marche.'], ['catalogo', 'Catalogo e nasi', E.all().length + ' schede con persistenza e affinità.'], ['molecole', 'Livello molecolare', 'Cosa c’è davvero dentro una nota.'],
      ['maison', 'Maison e case essenziere', 'Le storie dietro i flaconi.'], ['profumerie', 'Profumerie d’Italia', 'Dove annusare, con attenzione al Nord.'], ['quaderni', 'Quaderni', 'Contenuti originali.']];
    var tools = [['banco', 'In profumeria', 'Modalità banco', 'Mouillette numerate, polso destro e sinistro, controlli a 15 minuti, 2 ore e 6 ore: la persistenza la misuri tu.'], ['layering', 'A casa', 'Laboratorio di layering', 'Sovrapponi due profumi e guarda la piramide che ne esce, prima di sprecare uno spruzzo.'],
      ['palestra', 'Allenamento', 'Palestra del naso', 'Domande sulle piramidi dei tuoi profumi e del catalogo, con il punteggio per categoria di note.'], ['impostazioni', 'Il tuo sito', 'Impostazioni e backup', 'Soglia di persistenza, meteo, collegamento a Claude, copia di sicurezza, password.']];
    return C.head('L’Atlante', 'Tutte le <em>sezioni</em>', null) + '<div class="grid g3">' + secs.map(function (s) { return '<a class="card" href="#/' + s[0] + '" style="min-height:140px"><span class="h3">' + s[1] + '</span><span class="muted" style="font-size:14.5px">' + s[2] + '</span></a>'; }).join('') + '</div>' +
      '<section class="band night"><h2 class="h2" style="margin-bottom:28px">Strumenti da naso</h2><div class="grid g4" style="gap:32px">' + tools.map(function (t) { return '<a href="#/' + t[0] + '" class="stack" style="gap:10px;border-top:1px solid var(--night-line);padding-top:20px;color:var(--night-ink)"><span class="eyebrow">' + t[1] + '</span><span class="h3">' + t[2] + '</span><span class="muted" style="font-size:14px">' + t[3] + '</span><span class="link" style="text-decoration:underline;text-underline-offset:4px">Apri</span></a>'; }).join('') + '</div></section>';
  };

  /* ---------- modalità banco */
  var CHECKS = [[15, '15 minuti'], [120, '2 ore'], [360, '6 ore']];
  V.banco = function () {
    var ses = (OLF.user.sessions || []).filter(function (s) { return !s.closed; })[0], out;
    if (!ses) {
      var old = (OLF.user.sessions || []).filter(function (s) { return s.closed; }).slice(-5).reverse();
      return C.head('Modalità banco', 'Sei in <em>profumeria</em>?', 'Apri una sessione di prova: segni cosa spruzzi e dove, e il sito ti ricorda di riannusare a 15 minuti, 2 ore e 6 ore. La persistenza vera si misura così, sulla tua pelle.') +
        '<form class="card" data-form="startSession" style="max-width:560px"><div class="field"><label for="shop">Dove sei</label><input class="input" id="shop" name="shop" list="shops" placeholder="scegli o scrivi il negozio"><datalist id="shops">' + OLF.DATA.shops.map(function (s) { return '<option value="' + h(s.name + ', ' + s.city) + '">'; }).join('') + '</datalist></div><button class="btn primary" type="submit">Inizia la sessione</button></form>' +
        (old.length ? '<section class="section stack-sm" style="max-width:720px"><h2 class="h3 rule">Sessioni passate</h2><div class="list">' + old.map(function (s) { return '<div><span class="stack-sm"><span style="font-weight:600">' + h(s.shop || 'Negozio non indicato') + '</span><span class="x">' + h(s.date) + ' · ' + s.strips.map(function (t) { return h(t.name) + (t.verdict ? ' (' + { no: 'no', forse: 'forse', si: 'sì' }[t.verdict] + ')' : ''); }).join(', ') + '</span></span></div>'; }).join('') + '</div></section>' : '');
    }
    var wishes = E.items('future').map(function (x) { return x.p; }), rec = E.recommend({ n: 4 }).list.map(function (r) { return r.p; });
    out = C.head('Modalità banco · sessione del ' + h(ses.date), h(ses.shop || 'In profumeria'), null, '<button class="btn" data-act="closeSession">Chiudi la sessione</button>');
    out += '<div class="cols"><div class="grow stack">' + (ses.strips.length ? ses.strips.map(function (t, i) {
      var min = Math.floor((Date.now() - t.t0) / 60000), next = CHECKS.filter(function (c) { return c[0] > min; })[0];
      return '<div class="card" style="gap:12px"><div class="row between" style="align-items:baseline"><span class="row" style="gap:10px;align-items:baseline"><span class="mono cap">N. ' + (i + 1) + '</span><span class="serif" style="font-size:24px">' + h(t.name) + '</span></span><span class="mono cap">' + h(t.where) + '</span></div>' +
        '<div class="timer">Spruzzato ' + (min < 60 ? min + ' minuti fa' : Math.floor(min / 60) + ' h ' + (min % 60) + ' min fa') + ' · ' + (next ? 'prossimo controllo a ' + next[1] + ' (tra ' + (next[0] - min) + ' min)' : 'tutti i controlli superati: se lo senti ancora, dura') + '</div>' +
        '<div class="field"><label for="sn' + i + '">Cosa senti adesso</label><input class="input" id="sn' + i + '" value="' + h(t.note || '') + '" data-change="stripNote" data-i="' + i + '" placeholder="es. più amaro del previsto, il cuoio esce dopo"></div>' +
        '<div class="row" style="gap:6px">' + [['no', 'No'], ['forse', 'Forse'], ['si', 'Sì']].map(function (v) { return '<button class="btn sm grow' + (t.verdict === v[0] ? (v[0] === 'si' ? ' primary' : ' dark') : '') + '" data-act="verdict" data-i="' + i + '" data-v="' + v[0] + '">' + v[1] + '</button>'; }).join('') + '</div>' +
        (t.verdict === 'si' && t.pid && !E.statusOf(t.pid) ? '<button class="btn sm" data-act="addItem" data-pid="' + t.pid + '" data-status="future" data-stay="1">Aggiungi ai desideri</button>' : '') + '</div>';
    }).join('') : '<div class="empty">Nessuna mouillette ancora. Parti da un desiderio o da una proposta qui a fianco: massimo tre o quattro profumi per visita, il naso si stanca.</div>') + '</div>';
    out += '<aside class="side stack-lg"><form class="card" data-form="addStrip"><h2 class="h3">Nuova mouillette</h2><div class="field"><label for="stn">Profumo</label><input class="input" id="stn" name="name" list="allp" required><datalist id="allp">' + E.all().map(function (p) { return '<option value="' + h(p.name) + '">'; }).join('') + '</datalist></div>' +
      '<div class="field"><label for="stw">Dove</label><select class="input" id="stw" name="where"><option>solo carta</option><option>polso sinistro</option><option>polso destro</option><option>avambraccio</option></select></div><button class="btn dark" type="submit">Aggiungi</button></form>' +
      '<div class="stack-sm"><h2 class="h3 rule">Da provare qui</h2><p class="cap">I tuoi desideri e le proposte del motore, tutte sopra la tua soglia di persistenza.</p><div class="list">' + wishes.concat(rec).slice(0, 6).map(function (p) { return '<button data-act="quickStrip" data-pid="' + p.id + '"><span class="stack-sm"><span class="t">' + h(p.name) + '</span><span class="s">' + C.meta(p) + ' · ' + C.st(p.id) + '</span></span>' + C.lon(p.lon) + '</button>'; }).join('') + '</div></div>' +
      '<a class="btn" href="#/sommelier">Chiedi al Sommelier cosa provare</a></aside></div>';
    return out;
  };

  /* ---------- palestra del naso */
  OLF.newQuiz = function () {
    var pool = E.all().filter(function (p) { return (p.base || []).length && (p.heart || []).length; }), mine = E.items().map(function (x) { return x.p; });
    var src = (mine.length && Math.random() < 0.5) ? mine.filter(function (p) { return (p.base || []).length && (p.heart || []).length; }) : pool; if (!src.length) src = pool;
    var p = src[Math.floor(Math.random() * src.length)];
    var lvl = Math.random() < 0.6 ? 'base' : 'heart', right = p[lvl][Math.floor(Math.random() * p[lvl].length)], all = Object.keys(E.noteIndex()), own = E.weights(p), wrong = [];
    while (wrong.length < 3) { var n = all[Math.floor(Math.random() * all.length)]; if (!own[n] && wrong.indexOf(n) < 0) wrong.push(n); }
    var opts = wrong.concat([right]).sort(function () { return Math.random() - 0.5; });
    UI.quiz = { pid: p.id, lvl: lvl, right: right, opts: opts, picked: null };
  };
  V.palestra = function () {
    if (!UI.quiz) OLF.newQuiz();
    var z = UI.quiz, p = E.byId(z.pid), s = OLF.user.quiz, cats = Object.keys(s.byCat);
    return C.head('Palestra del naso', 'Allena la <em>memoria</em>', 'Domande sulle piramidi dei tuoi profumi e del catalogo. Meglio ancora con il flacone in mano: annusa, poi rispondi.') +
      '<div class="cols"><div class="grow card" style="gap:20px;max-width:720px"><div class="eyebrow">Domanda</div><p class="h2">Quale di queste note sta nel ' + (z.lvl === 'base' ? 'fondo' : 'cuore') + ' di ' + h(p.name) + '?</p><p class="cap">' + C.meta(p) + '</p><div class="grid g2">' +
      z.opts.map(function (o) { var cls = 'btn'; if (z.picked) { if (o === z.right) cls += ' primary'; else if (o === z.picked) cls += ' danger'; } return '<button class="' + cls + '" data-act="quizPick" data-o="' + h(o) + '"' + (z.picked ? ' disabled' : '') + '>' + h(OLF.cap(o)) + '</button>'; }).join('') + '</div>' +
      (z.picked ? '<p class="muted">' + (z.picked === z.right ? 'Giusto. ' : 'No: era ' + h(z.right) + '. ') + 'Piramide completa: ' + h(['top', 'heart', 'base'].map(function (l) { return E.LVL[l].toLowerCase() + ' ' + (p[l] || []).join(', '); }).join('; ')) + '.</p><div class="row"><button class="btn dark" data-act="quizNext">Prossima domanda</button><a class="link" href="#/profumo/' + p.id + '">Apri la scheda</a></div>' : '') + '</div>' +
      '<aside class="side stack"><div class="card"><span class="eyebrow">Il tuo punteggio</span><span class="big">' + s.right + ' <span style="font-size:20px">su ' + s.played + '</span></span></div>' + (cats.length ? '<div class="stack-sm"><h2 class="h3 rule">Per categoria di note</h2>' + cats.map(function (c) { var v = s.byCat[c]; return '<div class="row" style="flex-wrap:nowrap;min-height:36px"><span style="width:170px;font-size:14px">' + h(OLF.DATA.cats[c]) + '</span><span class="bar"><span style="width:' + Math.round(v.r / v.n * 100) + '%"></span></span><span class="mono cap" style="width:48px;text-align:right">' + v.r + '/' + v.n + '</span></div>'; }).join('') + '</div>' : '') + '</aside></div>';
  };

  /* ---------- layering */
  V.layering = function () {
    var pool = E.items().filter(function (x) { return x.w.status !== 'future'; }).map(function (x) { return x.p; }); if (pool.length < 2) pool = pool.concat(E.recommend({ n: 6 }).list.map(function (r) { return r.p; }));
    var a = E.byId(UI.layA) || pool[0], b = E.byId(UI.layB) || pool[1] || pool[0], wa = E.weights(a), wb = E.weights(b), sh = E.shared(a, b), aff = Math.round(E.affinity(a, b) * 100), aa = E.axes(a), ab = E.axes(b);
    var sel = function (id, cur, key) { return '<select class="input" id="' + id + '" data-change="' + key + '">' + E.all().slice().sort(function (x, y) { return x.name.localeCompare(y.name); }).map(function (p) { return '<option value="' + p.id + '"' + (p.id === cur.id ? ' selected' : '') + '>' + h(p.name) + ' · ' + h(p.brand) + '</option>'; }).join('') + '</select>'; };
    var read = [];
    read.push(aff >= 65 ? 'Si somigliano molto (' + aff + '%): insieme rischiano di essere ridondanti più che complementari.' : (aff <= 35 ? 'Sono lontani (' + aff + '%): l’effetto può essere sorprendente o caotico. Prova prima su carta.' : 'Distanza giusta (' + aff + '%): abbastanza vicini da legare, abbastanza diversi da aggiungersi qualcosa.'));
    if (Math.abs(aa.sweet - ab.sweet) > 0.5) read.push('Uno è molto più dolce dell’altro: spruzza prima il più secco, e il dolce con mano leggera.');
    if ((a.lon || 3) !== (b.lon || 3)) read.push('Il più tenace è ' + ((a.lon || 3) > (b.lon || 3) ? a.name : b.name) + ': dopo qualche ora resterà quasi solo lui.');
    var rows = [['top', 'Testa', 56], ['heart', 'Cuore', 78], ['base', 'Fondo', 100]].map(function (r) {
      var notes = (a[r[0]] || []).concat((b[r[0]] || []).filter(function (n) { return (a[r[0]] || []).indexOf(n) < 0; }));
      return '<div class="stack-sm" style="gap:8px"><span class="eyebrow">' + r[1] + '</span><div class="pyr-box" style="justify-content:flex-start"><div class="pyr-in" style="width:' + r[2] + '%;max-width:100%;border-color:var(--line);background:var(--surface);justify-content:flex-start">' + notes.map(function (n) { var both = wa[n] && wb[n]; return '<a class="chip' + (both ? ' on' : ((a[r[0]] || []).indexOf(n) >= 0 ? '' : ' amber')) + '" href="#/note/' + encodeURIComponent(n) + '">' + h(n) + '</a>'; }).join('') + '</div></div></div>';
    }).join('');
    return C.head('Laboratorio di layering', h(a.name) + ' × ' + h(b.name), 'La piramide che esce sovrapponendo due profumi. Pieno è ciò che hanno in comune, nero è del primo, ambra del secondo.') +
      '<div class="cols"><aside class="side stack"><div class="field"><label for="la">Primo profumo</label>' + sel('la', a, 'layA') + '</div><div class="field"><label for="lb">Secondo profumo</label>' + sel('lb', b, 'layB') + '</div><div class="card"><span class="label">Lettura</span>' + read.map(function (r) { return '<span class="muted" style="font-size:14.5px">' + h(r) + '</span>'; }).join('') + '<span class="cap">In comune: ' + h(sh.join(', ') || 'nessuna nota') + '</span></div></aside><div class="grow stack-lg" style="gap:22px">' + rows + '</div></div>';
  };

  /* ---------- impostazioni */
  V.impostazioni = function () {
    var pr = OLF.user.prefs, key = OLF.store.apiKey();
    return C.head('Il tuo sito', 'Impostazioni', 'Tutto ciò che inserisci resta su questo dispositivo. Fai una copia di sicurezza ogni tanto, e usala per portare i dati su un altro telefono o computer.') +
      '<div class="card row" style="gap:20px;align-items:center;margin-bottom:24px"><img src="assets/rea.jpg" alt="Foto di Rea" style="width:88px;height:88px;border-radius:999px;object-fit:cover;flex-shrink:0;border:1px solid var(--line)"><div class="stack-sm"><span class="t" style="font-family:var(--serif);font-size:22px">Andrea Gagliardi</span><span class="s cap">Rea · l’unico naso per cui esiste questo atlante</span></div></div>' +
      '<div class="grid g2" style="gap:24px;align-items:start">' +
      '<form class="card" data-form="prefs"><h2 class="h3">Persistenza</h2><label class="check"><input type="checkbox" name="avoid"' + (pr.avoidLowLon ? ' checked' : '') + '> Non propormi profumi che svaniscono presto</label><div class="field"><label for="minlon">Soglia minima</label><select class="input" id="minlon" name="minLon">' + [2, 3, 4, 5].map(function (n) { return '<option value="' + n + '"' + (pr.minLon === n ? ' selected' : '') + '>' + n + ' · ' + E.LONLAB[n] + '</option>'; }).join('') + '</select></div><button class="btn dark" type="submit">Salva</button></form>' +
      '<div class="card"><h2 class="h3">Meteo per il consiglio del giorno</h2><p class="muted" style="font-size:14.5px">Facoltativo e gratuito (Open-Meteo, senza account). Usa la posizione solo per leggere la temperatura: non viene salvata altrove.</p><p class="cap">' + (pr.weather && pr.lat != null ? 'Attivo · posizione ' + Number(pr.lat).toFixed(2) + ', ' + Number(pr.lon).toFixed(2) : 'Non attivo: il consiglio segue solo la stagione.') + '</p><div class="row"><button class="btn sm" data-act="geo">Usa la mia posizione</button>' + (pr.weather ? '<button class="btn sm" data-act="geoOff">Disattiva</button>' : '') + '</div></div>' +
      '<form class="card" data-form="apiKey"><h2 class="h3">Motore di aggiornamento: Claude</h2><p class="muted" style="font-size:14.5px">L’unica parte con un costo, a consumo e solo se la usi: risposte libere del Sommelier e schede nuove compilate in automatico. Serve una chiave API di Anthropic; resta salvata solo in questo browser e viene inviata solo ad api.anthropic.com.</p>' +
      '<div class="field"><label for="ak">Chiave API</label><input class="input" id="ak" name="key" type="password" autocomplete="off" value="' + h(key) + '" placeholder="sk-ant-…"></div><div class="field"><label for="am">Modello</label><input class="input" id="am" name="model" value="' + h(pr.model || 'claude-sonnet-5') + '"></div><div class="row"><button class="btn dark" type="submit">Salva</button>' + (key ? '<button class="btn" type="button" data-act="apiTest">Prova il collegamento</button><button class="btn danger" type="button" data-act="apiClear">Scollega</button>' : '') + '</div></form>' +
      '<div class="card"><h2 class="h3">Copia di sicurezza</h2><p class="muted" style="font-size:14.5px">Guardaroba, diario, sessioni, schede create da te: un solo file.</p><div class="row"><button class="btn dark" data-act="exportAll">Scarica la copia</button><label class="btn" for="imp" style="cursor:pointer">Ripristina da file</label><input id="imp" type="file" accept="application/json" data-change="importAll" style="position:absolute;width:1px;height:1px;opacity:0"></div></div>' +
      '<form class="card" data-form="changePw"><h2 class="h3">Cambia la password</h2><p class="muted" style="font-size:14.5px">Il sito ricifra i contenuti e ti fa scaricare un nuovo file olfattiva.enc. Per rendere effettiva la nuova password, quel file va caricato sull’hosting al posto di data/olfattiva.enc.</p><div class="field"><label for="npw">Nuova password (almeno 12 caratteri)</label><input class="input" id="npw" name="pw" type="password" minlength="12" autocomplete="new-password" required></div><button class="btn dark" type="submit">Ricifra e scarica</button></form>' +
      '<div class="card"><h2 class="h3">Installa e sessione</h2><p class="muted" style="font-size:14.5px">Su iPhone: Condividi, poi «Aggiungi alla schermata Home». Su Android e computer: menu del browser, «Installa app». Una volta installato funziona anche senza rete.</p><div class="row"><button class="btn" data-act="logout">Esci e dimentica questo dispositivo</button></div><p class="cap">Dati: piramidi da fonti pubbliche, persistenze come stime editoriali, tutto correggibile. Versione contenuti ' + h(OLF.DATA.v) + '.</p></div></div>';
  };
})();
