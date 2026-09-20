/* Olfattiva · core: utilità, cifratura, archivio locale, collegamento opzionale a Claude */
(function () {
  'use strict';
  var OLF = window.OLF = { DATA: null, user: null, views: {}, actions: {}, forms: {} };
  var LS_USER = 'olf.user.v1', LS_KEY = 'olf.key.v1', LS_API = 'olf.apikey.v1';
  var ITER = 310000;

  OLF.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  OLF.cap = function (s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
  OLF.today = function () { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  OLF.slug = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
  OLF.toast = function (msg) {
    var old = document.querySelector('.toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'toast fade'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  };
  OLF.download = function (name, text, type) {
    var blob = new Blob([text], { type: type || 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  /* ---------- cifratura: PBKDF2-SHA256 + AES-GCM, tutto nel browser */
  function b64(buf) { var b = new Uint8Array(buf), s = '', i; for (i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
  function ub64(s) { var bin = atob(s), a = new Uint8Array(bin.length), i; for (i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
  var subtle = function () { return (window.crypto || {}).subtle; };
  OLF.crypto = {
    available: function () { return !!subtle(); },
    deriveKey: async function (password, saltB64, iter) {
      var km = await subtle().importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
      return subtle().deriveKey({ name: 'PBKDF2', salt: ub64(saltB64), iterations: iter, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    },
    open: async function (bundle, key) {
      var pt = await subtle().decrypt({ name: 'AES-GCM', iv: ub64(bundle.iv) }, key, ub64(bundle.ct));
      return JSON.parse(new TextDecoder().decode(pt));
    },
    seal: async function (obj, password) {
      var salt = b64(window.crypto.getRandomValues(new Uint8Array(16))), iv = window.crypto.getRandomValues(new Uint8Array(12));
      var key = await OLF.crypto.deriveKey(password, salt, ITER);
      var ct = await subtle().encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
      return { v: 1, kdf: 'PBKDF2-SHA256', iter: ITER, salt: salt, iv: b64(iv), ct: b64(ct) };
    },
    exportKey: async function (key) { return b64(await subtle().exportKey('raw', key)); },
    importKey: function (raw) { return subtle().importKey('raw', ub64(raw), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']); }
  };

  /* ---------- accesso */
  OLF.auth = {
    bundle: null,
    fetchBundle: async function () {
      if (OLF.auth.bundle) return OLF.auth.bundle;
      var r = await fetch('data/olfattiva.enc', { cache: 'no-cache' });
      if (!r.ok) throw new Error('Archivio non trovato');
      return (OLF.auth.bundle = await r.json());
    },
    resume: async function () {
      var saved = localStorage.getItem(LS_KEY); if (!saved) return false;
      try {
        var s = JSON.parse(saved), bundle = await OLF.auth.fetchBundle();
        if (s.salt !== bundle.salt) { localStorage.removeItem(LS_KEY); return false; }
        OLF.DATA = await OLF.crypto.open(bundle, await OLF.crypto.importKey(s.key)); return true;
      } catch (e) { localStorage.removeItem(LS_KEY); return false; }
    },
    login: async function (password, remember) {
      var bundle = await OLF.auth.fetchBundle();
      var key = await OLF.crypto.deriveKey(password, bundle.salt, bundle.iter);
      OLF.DATA = await OLF.crypto.open(bundle, key);           // lancia un errore se la password è sbagliata
      if (remember) localStorage.setItem(LS_KEY, JSON.stringify({ salt: bundle.salt, key: await OLF.crypto.exportKey(key) }));
    },
    logout: function () { localStorage.removeItem(LS_KEY); OLF.DATA = null; location.hash = ''; location.reload(); }
  };

  /* ---------- archivio personale: resta solo su questo dispositivo */
  OLF.store = {
    load: function () {
      var raw = localStorage.getItem(LS_USER), u = null;
      try { u = raw ? JSON.parse(raw) : null; } catch (e) { u = null; }
      if (!u) { u = JSON.parse(JSON.stringify(OLF.DATA.seed)); u.createdAt = OLF.today(); u.welcome = true; }
      u.prefs = Object.assign({ avoidLowLon: true, minLon: 3, weather: false, model: 'claude-sonnet-5' }, u.prefs || {});
      ['wardrobe', 'custom', 'sessions', 'chat'].forEach(function (k) { if (!Array.isArray(u[k])) u[k] = []; });
      u.noteCat = u.noteCat || {}; u.quiz = u.quiz || { played: 0, right: 0, byCat: {} };
      OLF.user = u; return u;
    },
    save: function () { localStorage.setItem(LS_USER, JSON.stringify(OLF.user)); },
    exportAll: function () { OLF.download('olfattiva-backup-' + OLF.today() + '.json', JSON.stringify({ app: 'olfattiva', v: 1, user: OLF.user }, null, 2)); },
    importAll: function (text) {
      var o = JSON.parse(text); if (!o || o.app !== 'olfattiva' || !o.user) throw new Error('File non riconosciuto');
      localStorage.setItem(LS_USER, JSON.stringify(o.user)); OLF.store.load();
    },
    apiKey: function (v) { if (v === undefined) return localStorage.getItem(LS_API) || ''; if (v) localStorage.setItem(LS_API, v); else localStorage.removeItem(LS_API); }
  };

  /* ---------- Claude: opzionale, chiamato direttamente dal browser con la chiave di Rea */
  OLF.claude = async function (system, messages, maxTokens) {
    var key = OLF.store.apiKey(); if (!key) throw new Error('Nessuna chiave API impostata');
    var r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: OLF.user.prefs.model || 'claude-sonnet-5', max_tokens: maxTokens || 1200, system: system, messages: messages })
    });
    var data = await r.json();
    if (!r.ok) throw new Error((data && data.error && data.error.message) || ('Errore ' + r.status));
    return (data.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('\n');
  };

  /* ---------- meteo: Open-Meteo, gratuito e senza chiave; solo se Rea lo attiva */
  OLF.weather = async function () {
    var p = OLF.user.prefs; if (!p.weather || p.lat == null) return null;
    try {
      var r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + p.lat + '&longitude=' + p.lon + '&current=temperature_2m,relative_humidity_2m,precipitation');
      var d = await r.json(); return { temp: Math.round(d.current.temperature_2m), hum: d.current.relative_humidity_2m, rain: d.current.precipitation > 0 };
    } catch (e) { return null; }
  };
})();
