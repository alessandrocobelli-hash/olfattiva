/* Cifra dati.json con la stessa procedura dell'app: PBKDF2-SHA256 (310.000 iterazioni) + AES-GCM 256 */
(function () {
  'use strict';
  function b64(buf) { var b = new Uint8Array(buf), s = '', i; for (i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
  document.getElementById('f').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var out = document.getElementById('out'), file = document.getElementById('file').files[0], pw = document.getElementById('pw').value;
    try {
      var text = await file.text(); JSON.parse(text);
      var salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), iter = 310000;
      var km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
      var key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
      var ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(text));
      var blob = new Blob([JSON.stringify({ v: 1, kdf: 'PBKDF2-SHA256', iter: iter, salt: b64(salt), iv: b64(iv), ct: b64(ct) })], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'olfattiva.enc'; document.body.appendChild(a); a.click(); a.remove();
      out.textContent = 'Fatto. Carica olfattiva.enc nella cartella data/ del sito.';
    } catch (e) { out.textContent = 'Non riuscito: ' + e.message; }
  });
})();
